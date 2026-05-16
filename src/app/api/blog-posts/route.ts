import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { isAdminRequest, unauthorizedAdminResponse } from '@/lib/admin-auth';
import { generateCollectionBlogDraft } from '@/lib/ai';
import {
  DEFAULT_AFFILIATE_DISCLOSURE,
  createDefaultEditorSections,
  normalizeEditorSections,
  sectionsToPlainContent,
} from '@/lib/blog-editor';

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'blog-post';
}

async function uniqueSlug(value: string) {
  const baseSlug = slugify(value);
  let slug = baseSlug;
  let suffix = 2;

  while (await prisma.blogPost.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

function cleanString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function nullableString(value: unknown) {
  const cleaned = cleanString(value);
  return cleaned.length > 0 ? cleaned : null;
}

function buildCollectionContent(
  intro: string,
  products: Array<{ name: string; viralTrendNotes: string | null }>,
  conclusion: string,
  productSections?: string | null
) {
  const sections = productSections || products.map((product, index) => {
    const note = product.viralTrendNotes || 'A polished, practical find selected for its elevated look and everyday usefulness.';
    return `Pick ${index + 1}: ${product.name}\n${note}`;
  }).join('\n\n');

  return [intro, sections, conclusion].filter(Boolean).join('\n\n');
}

function revalidateBlogPages(slug?: string) {
  revalidatePath('/');
  revalidatePath('/blog');
  if (slug) {
    revalidatePath(`/blog/${slug}`);
  }
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return unauthorizedAdminResponse();
  }

  try {
    const body = await req.json();
    const postType = body?.postType === 'manual' ? 'manual' : 'collection';
    const title = cleanString(body?.title);
    const categoryId = cleanString(body?.categoryId);
    const isPublished = typeof body?.isPublished === 'boolean' ? body.isPublished : false;

    if (!title || !categoryId) {
      return NextResponse.json({ error: 'Title and category are required.' }, { status: 400 });
    }

    const category = await prisma.category.findUnique({ where: { id: categoryId }, select: { id: true, name: true } });
    if (!category) {
      return NextResponse.json({ error: 'Choose a valid category before saving this post.' }, { status: 400 });
    }

    if (body?.action === 'generate-draft') {
      const productIds: string[] = Array.isArray(body?.productIds)
        ? body.productIds.filter((id: unknown): id is string => typeof id === 'string' && id.trim().length > 0)
        : [];

      if (productIds.length < 2) {
        return NextResponse.json({ error: 'Choose at least two products before generating a collection draft.' }, { status: 400 });
      }

      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true,
          name: true,
          viralTrendNotes: true,
          imageUrl: true,
          contentIdea: true,
          source: true,
          category: { select: { name: true } },
        },
      });

      if (products.length !== productIds.length) {
        return NextResponse.json({ error: 'One or more selected products could not be found.' }, { status: 400 });
      }

      const orderedProducts = productIds
        .map((id) => products.find((product) => product.id === id))
        .filter((product): product is (typeof products)[number] => Boolean(product));

      const draft = await generateCollectionBlogDraft({
        title,
        categoryName: category.name,
        products: orderedProducts,
        aestheticVibe: cleanString(body?.aestheticVibe) || 'soft luxury, feminine, practical everyday finds, Pinterest-friendly',
      });

      if (body?.saveDraft === true) {
        const requestedSlug = nullableString(body?.slug);
        const slug = await uniqueSlug(requestedSlug || draft.suggestedSlug || draft.title || title);
        const featuredImage = nullableString(body?.featuredImage) || orderedProducts.find((product) => product.imageUrl)?.imageUrl || null;
        const editorSections = createDefaultEditorSections({
          intro: draft.intro,
          productSections: draft.productSections,
          conclusion: draft.conclusion,
          products: orderedProducts,
          featuredImage,
        });

        const blogPost = await prisma.blogPost.create({
          data: {
            title: draft.title || title,
            subtitle: nullableString(body?.subtitle),
            slug,
            categoryId,
            authorName: nullableString(body?.authorName) || 'Jessica',
            affiliateDisclosure: DEFAULT_AFFILIATE_DISCLOSURE,
            ctaText: 'Shop the Find',
            labelFavoritePick: 'Favorite Pick',
            labelVanityTray: 'The Vanity Tray',
            labelWorthIt: 'Worth It?',
            featuredImage,
            excerpt: nullableString(body?.excerpt) || draft.metaDescription || draft.intro,
            content: sectionsToPlainContent(editorSections),
            metaTitle: draft.seoTitle || draft.title || title,
            metaDescription: draft.metaDescription,
            editorSections,
            imageLibrary: orderedProducts
              .map((product) => product.imageUrl ? ({ id: product.id, url: product.imageUrl, alt: product.name, role: 'inline', objectPosition: 'center' }) : null)
              .filter(Boolean),
            isPublished: false,
            products: { connect: orderedProducts.map((product) => ({ id: product.id })) },
          },
        });

        await prisma.product.updateMany({
          where: { id: { in: productIds } },
          data: { blogPostStatus: 'Ready to Promote' },
        });

        revalidateBlogPages(blogPost.slug);
        return NextResponse.json({ success: true, data: { ...draft, blogPostId: blogPost.id, slug: blogPost.slug } });
      }

      return NextResponse.json({ success: true, data: draft });
    }

    const requestedSlug = nullableString(body?.slug);
    const slug = await uniqueSlug(requestedSlug || title);
    const metaTitle = nullableString(body?.metaTitle) || title;
    const metaDescription = nullableString(body?.metaDescription);
    const featuredImage = nullableString(body?.featuredImage);
    const excerpt = nullableString(body?.excerpt) || nullableString(body?.intro) || metaDescription;

    if (postType === 'manual') {
      const content = cleanString(body?.content);
      if (!content) {
        return NextResponse.json({ error: 'Manual posts need body content.' }, { status: 400 });
      }

      const editorSections = normalizeEditorSections(body?.editorSections);
      const blogPost = await prisma.blogPost.create({
        data: {
          title,
          subtitle: nullableString(body?.subtitle),
          slug,
          categoryId,
          authorName: nullableString(body?.authorName) || 'Jessica',
          affiliateDisclosure: nullableString(body?.affiliateDisclosure) || DEFAULT_AFFILIATE_DISCLOSURE,
          ctaText: nullableString(body?.ctaText) || 'Shop the Find',
          labelFavoritePick: nullableString(body?.labelFavoritePick) || 'Favorite Pick',
          labelVanityTray: nullableString(body?.labelVanityTray) || 'The Vanity Tray',
          labelWorthIt: nullableString(body?.labelWorthIt) || 'Worth It?',
          featuredImage,
          excerpt,
          content: editorSections.length > 0 ? sectionsToPlainContent(editorSections) : content,
          metaTitle,
          metaDescription,
          editorSections: editorSections.length > 0 ? editorSections : undefined,
          isPublished,
        },
      });

      revalidateBlogPages(blogPost.slug);
      return NextResponse.json({ success: true, data: blogPost });
    }

    const productIds: string[] = Array.isArray(body?.productIds)
      ? body.productIds.filter((id: unknown): id is string => typeof id === 'string' && id.trim().length > 0)
      : [];

    if (productIds.length < 2) {
      return NextResponse.json({ error: 'Choose at least two products for a collection post.' }, { status: 400 });
    }

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, imageUrl: true, viralTrendNotes: true },
    });

    if (products.length !== productIds.length) {
      return NextResponse.json({ error: 'One or more selected products could not be found.' }, { status: 400 });
    }

    const intro = cleanString(body?.intro);
    const productSections = nullableString(body?.productSections);
    const conclusion = cleanString(body?.conclusion);
    if (!intro || !conclusion) {
      return NextResponse.json({ error: 'Collection posts need an intro and conclusion.' }, { status: 400 });
    }

    const orderedProducts = productIds
      .map((id) => products.find((product) => product.id === id))
      .filter((product): product is (typeof products)[number] => Boolean(product));

    const resolvedFeaturedImage = featuredImage || orderedProducts.find((product) => product.imageUrl)?.imageUrl || null;
    const editorSections = createDefaultEditorSections({
      intro,
      productSections,
      conclusion,
      products: orderedProducts,
      featuredImage: resolvedFeaturedImage,
    });

    const blogPost = await prisma.blogPost.create({
      data: {
        title,
        subtitle: nullableString(body?.subtitle),
        slug,
        categoryId,
        authorName: nullableString(body?.authorName) || 'Jessica',
        affiliateDisclosure: nullableString(body?.affiliateDisclosure) || DEFAULT_AFFILIATE_DISCLOSURE,
        ctaText: nullableString(body?.ctaText) || 'Shop the Find',
        labelFavoritePick: nullableString(body?.labelFavoritePick) || 'Favorite Pick',
        labelVanityTray: nullableString(body?.labelVanityTray) || 'The Vanity Tray',
        labelWorthIt: nullableString(body?.labelWorthIt) || 'Worth It?',
        featuredImage: resolvedFeaturedImage,
        excerpt,
        content: sectionsToPlainContent(editorSections) || buildCollectionContent(intro, orderedProducts, conclusion, productSections),
        metaTitle,
        metaDescription,
        editorSections,
        imageLibrary: orderedProducts
          .map((product) => product.imageUrl ? ({ id: product.id, url: product.imageUrl, alt: product.name, role: 'inline', objectPosition: 'center' }) : null)
          .filter(Boolean),
        isPublished,
        products: {
          connect: orderedProducts.map((product) => ({ id: product.id })),
        },
      },
    });

    await prisma.product.updateMany({
      where: { id: { in: productIds } },
      data: { blogPostStatus: isPublished ? 'Published' : 'Ready to Promote' },
    });

    revalidateBlogPages(blogPost.slug);
    return NextResponse.json({ success: true, data: blogPost });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create blog post';
    console.error('Blog post creation error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
