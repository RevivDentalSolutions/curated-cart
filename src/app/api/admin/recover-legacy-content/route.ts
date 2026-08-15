import { PrismaClient } from '@/generated/client';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const CONFIRMATION = 'RECOVER_LEGACY_CONTENT';

type LegacyRow = Record<string, unknown>;
type LegacyProduct = LegacyRow & { id: string; name: string; category_name: string | null };
type LegacyBlogPost = LegacyRow & { id: string; title: string; slug: string; category_name: string | null };

function hasRecoveryToken(request: NextRequest) {
  const configuredToken = process.env.DATABASE_RECOVERY_TOKEN;
  const suppliedToken = request.headers.get('x-recovery-token') || request.nextUrl.searchParams.get('token');
  return Boolean(configuredToken && suppliedToken && suppliedToken === configuredToken);
}

function asString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : null;
}

function asBoolean(value: unknown, fallback = false) {
  return typeof value === 'boolean' ? value : fallback;
}

function asDate(value: unknown) {
  if (typeof value !== 'string' && !(value instanceof Date)) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? undefined : date;
}

function legacyClient() {
  const databaseUrl = process.env.LEGACY_DATABASE_URL;
  if (!databaseUrl) throw new Error('LEGACY_DATABASE_URL is not configured.');
  return new PrismaClient({ datasources: { db: { url: databaseUrl } } });
}

async function readLegacyData(legacy: PrismaClient) {
  // to_jsonb makes this compatible with older project schemas that did not yet
  // have newer optional Product columns (for example, description).
  const [categories, products, blogPosts, relationRows] = await Promise.all([
    legacy.$queryRawUnsafe<Array<{ id: string; name: string }>>('SELECT id, name FROM "Category" ORDER BY name'),
    legacy.$queryRawUnsafe<Array<{ data: LegacyRow; category_name: string | null }>>(
      'SELECT to_jsonb(p) AS data, c.name AS category_name FROM "Product" p LEFT JOIN "Category" c ON c.id = p."categoryId" ORDER BY p.name',
    ),
    legacy.$queryRawUnsafe<Array<{ data: LegacyRow; category_name: string | null }>>(
      'SELECT to_jsonb(b) AS data, c.name AS category_name FROM "BlogPost" b LEFT JOIN "Category" c ON c.id = b."categoryId" ORDER BY b."createdAt"',
    ),
    legacy.$queryRawUnsafe<Array<{ A: string; B: string }>>('SELECT "A", "B" FROM "_ProductBlogPosts"').catch(() => []),
  ]);

  const productRows = products
    .map(({ data, category_name }): LegacyRow & { category_name: string | null } => ({ ...(data as LegacyRow), category_name }))
    .filter((row): row is LegacyProduct => typeof row.id === 'string' && typeof row.name === 'string');
  const blogRows = blogPosts
    .map(({ data, category_name }): LegacyRow & { category_name: string | null } => ({ ...(data as LegacyRow), category_name }))
    .filter((row): row is LegacyBlogPost => typeof row.id === 'string' && typeof row.slug === 'string' && typeof row.title === 'string');

  const productIds = new Set(productRows.map((product) => product.id));
  const blogIds = new Set(blogRows.map((post) => post.id));
  const productIdsByLegacyBlogId = new Map<string, string[]>();

  for (const relation of relationRows) {
    const blogId = blogIds.has(relation.A) ? relation.A : blogIds.has(relation.B) ? relation.B : null;
    const productId = productIds.has(relation.A) ? relation.A : productIds.has(relation.B) ? relation.B : null;
    if (!blogId || !productId) continue;
    productIdsByLegacyBlogId.set(blogId, [...(productIdsByLegacyBlogId.get(blogId) || []), productId]);
  }

  return { categories, productRows, blogRows, productIdsByLegacyBlogId };
}

async function inventory() {
  const legacy = legacyClient();
  try {
    const source = await readLegacyData(legacy);
    const [targetProducts, targetPosts] = await Promise.all([prisma.product.count(), prisma.blogPost.count()]);
    return {
      source: {
        categories: source.categories.length,
        products: source.productRows.length,
        blogPosts: source.blogRows.length,
        productBlogLinks: [...source.productIdsByLegacyBlogId.values()].reduce((total, ids) => total + ids.length, 0),
        productSamples: source.productRows.slice(0, 8).map((product) => ({ name: product.name, category: product.category_name, asin: asString(product.amazonAsin), hasAffiliateLink: Boolean(asString(product.affiliateLink)) })),
        blogSamples: source.blogRows.slice(0, 8).map((post) => ({ title: post.title, slug: post.slug, category: post.category_name, isPublished: asBoolean(post.isPublished) })),
      },
      target: { products: targetProducts, blogPosts: targetPosts },
      safety: 'Inventory is read-only. No products, affiliate links, categories, or posts were changed.',
    };
  } finally {
    await legacy.$disconnect();
  }
}

async function findOrCreateProduct(product: LegacyProduct, categoryId: string) {
  const asin = asString(product.amazonAsin);
  const affiliateLink = asString(product.affiliateLink);
  const amazonLink = asString(product.amazonLink);
  const linkMatches: Array<Record<string, string>> = [
    ...(asin ? [{ amazonAsin: asin }] : []),
    ...(affiliateLink ? [{ affiliateLink }] : []),
    ...(amazonLink ? [{ amazonLink }] : []),
  ];

  // Product has no compound unique key; the final name/category lookup is an
  // intentional conservative fallback and never overwrites an existing record.
  const existing = linkMatches.length
    ? await prisma.product.findFirst({ where: { OR: linkMatches } }).catch(() => null)
    : null;
  const byNameAndCategory = existing || await prisma.product.findFirst({ where: { name: product.name, categoryId } });
  if (byNameAndCategory) return { id: byNameAndCategory.id, created: false };

  const created = await prisma.product.create({
    data: {
      name: product.name,
      categoryId,
      description: asString(product.description),
      amazonLink,
      affiliateLink,
      affiliatePlaceholderUrl: asString(product.affiliatePlaceholderUrl),
      imageUrl: asString(product.imageUrl),
      amazonAsin: asin,
      rating: typeof product.rating === 'number' ? product.rating : null,
      reviewCount: typeof product.reviewCount === 'number' ? product.reviewCount : null,
      price: typeof product.price === 'number' ? product.price : null,
      source: asString(product.source),
      viralTrendNotes: asString(product.viralTrendNotes),
      contentIdea: asString(product.contentIdea),
      blogPostStatus: asString(product.blogPostStatus) || 'Needs Content',
      published: asBoolean(product.published, true),
      pinStatus: asString(product.pinStatus) || 'Pending',
      tiktokStatus: asString(product.tiktokStatus) || 'Pending',
      commissionPotential: asString(product.commissionPotential),
      dateAdded: asDate(product.dateAdded),
    },
  });
  return { id: created.id, created: true };
}

async function recover() {
  const legacy = legacyClient();
  try {
    const source = await readLegacyData(legacy);
    const categoryIds = new Map<string, string>();
    for (const category of source.categories) {
      const targetCategory = await prisma.category.upsert({ where: { name: category.name }, update: {}, create: { name: category.name } });
      categoryIds.set(category.name, targetCategory.id);
    }

    const legacyToTargetProductId = new Map<string, string>();
    let productsCreated = 0;
    let productsReused = 0;
    for (const product of source.productRows) {
      const categoryName = product.category_name || 'Amazon Favorites';
      let categoryId = categoryIds.get(categoryName);
      if (!categoryId) {
        const category = await prisma.category.upsert({ where: { name: categoryName }, update: {}, create: { name: categoryName } });
        categoryId = category.id;
        categoryIds.set(categoryName, categoryId);
      }
      const result = await findOrCreateProduct(product, categoryId);
      legacyToTargetProductId.set(product.id, result.id);
      if (result.created) productsCreated += 1; else productsReused += 1;
    }

    let postsCreated = 0;
    let postsReused = 0;
    let productLinksRestored = 0;
    for (const post of source.blogRows) {
      const categoryName = post.category_name || 'Amazon Favorites';
      const categoryId = categoryIds.get(categoryName) || (await prisma.category.upsert({ where: { name: categoryName }, update: {}, create: { name: categoryName } })).id;
      const legacyProductIds = source.productIdsByLegacyBlogId.get(post.id) || [];
      const targetProductIds = [...new Set(legacyProductIds.map((id) => legacyToTargetProductId.get(id)).filter((id): id is string => Boolean(id)))];
      const existing = await prisma.blogPost.findUnique({ where: { slug: post.slug }, include: { products: { select: { id: true } } } });
      if (existing) {
        postsReused += 1;
        const existingProductIds = new Set(existing.products.map((product) => product.id));
        const missingProductIds = targetProductIds.filter((id) => !existingProductIds.has(id));
        if (missingProductIds.length) {
          await prisma.blogPost.update({ where: { id: existing.id }, data: { products: { connect: missingProductIds.map((id) => ({ id })) } } });
          productLinksRestored += missingProductIds.length;
        }
        continue;
      }
      await prisma.blogPost.create({
        data: {
          title: post.title,
          slug: post.slug,
          categoryId,
          content: asString(post.content),
          excerpt: asString(post.excerpt),
          metaTitle: asString(post.metaTitle),
          metaDescription: asString(post.metaDescription),
          featuredImage: asString(post.featuredImage),
          isPublished: asBoolean(post.isPublished),
          createdAt: asDate(post.createdAt),
          updatedAt: asDate(post.updatedAt),
          products: targetProductIds.length ? { connect: targetProductIds.map((id) => ({ id })) } : undefined,
        },
      });
      postsCreated += 1;
      productLinksRestored += targetProductIds.length;
    }

    return { categoriesAvailable: categoryIds.size, productsCreated, productsReused, postsCreated, postsReused, productLinksRestored, destructiveCommandsUsed: false };
  } finally {
    await legacy.$disconnect();
  }
}

export async function GET(request: NextRequest) {
  if (!hasRecoveryToken(request)) return NextResponse.json({ success: false, error: 'Valid DATABASE_RECOVERY_TOKEN required.' }, { status: 401 });
  try {
    return NextResponse.json({ success: true, mode: 'inventory', ...(await inventory()) });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unable to inventory legacy content.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!hasRecoveryToken(request)) return NextResponse.json({ success: false, error: 'Valid DATABASE_RECOVERY_TOKEN required.' }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (body?.confirm !== CONFIRMATION) {
    return NextResponse.json({ success: false, error: `Send { confirm: '${CONFIRMATION}' } to run the idempotent, additive recovery.` }, { status: 400 });
  }
  try {
    return NextResponse.json({ success: true, mode: 'recovery', recovery: await recover() });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unable to recover legacy content.' }, { status: 500 });
  }
}
