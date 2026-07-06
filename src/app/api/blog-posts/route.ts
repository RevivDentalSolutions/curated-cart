import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { isAdminRequest, unauthorizedAdminResponse } from '@/lib/admin-auth';
import { generateCollectionBlogDraft } from '@/lib/ai';

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'blog-post';
}

async function uniqueSlug(value: string, currentPostId?: string) {
  const baseSlug = slugify(value);
  let slug = baseSlug;
  let suffix = 2;

  while (true) {
    const existingPost = await prisma.blogPost.findUnique({ where: { slug }, select: { id: true } });
    if (!existingPost || existingPost.id === currentPostId) return slug;
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
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


export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return unauthorizedAdminResponse();
  }

  try {
    const posts = await prisma.blogPost.findMany({
      include: {
        category: true,
        products: { select: { id: true, name: true, imageUrl: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });
    return NextResponse.json({ success: true, data: posts });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load blog posts';
    return NextResponse.json({ error: message }, { status: 500 });
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

      const blogPost = await prisma.blogPost.create({
        data: {
          title,
          slug,
          categoryId,
          featuredImage,
          excerpt,
          content,
          metaTitle,
          metaDescription,
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

    const blogPost = await prisma.blogPost.create({
      data: {
        title,
        slug,
        categoryId,
        featuredImage: featuredImage || orderedProducts.find((product) => product.imageUrl)?.imageUrl || null,
        excerpt,
        content: buildCollectionContent(intro, orderedProducts, conclusion, productSections),
        metaTitle,
        metaDescription,
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


export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return unauthorizedAdminResponse();
  }

  try {
    const body = await req.json();
    const id = cleanString(body?.id);
    if (!id) return NextResponse.json({ error: 'Blog post id is required.' }, { status: 400 });

    const title = cleanString(body?.title);
    const categoryId = cleanString(body?.categoryId);
    const productIds: string[] | undefined = Array.isArray(body?.productIds)
      ? body.productIds.filter((productId: unknown): productId is string => typeof productId === 'string' && productId.trim().length > 0)
      : undefined;

    const data: Record<string, unknown> = {
      title: title || undefined,
      slug: body?.slug !== undefined ? await uniqueSlug(cleanString(body.slug) || title || 'blog-post', id) : undefined,
      categoryId: categoryId || undefined,
      featuredImage: body?.featuredImage !== undefined ? nullableString(body.featuredImage) : undefined,
      excerpt: body?.excerpt !== undefined ? nullableString(body.excerpt) : undefined,
      content: body?.content !== undefined ? cleanString(body.content) : undefined,
      metaTitle: body?.metaTitle !== undefined ? nullableString(body.metaTitle) || title || undefined : undefined,
      metaDescription: body?.metaDescription !== undefined ? nullableString(body.metaDescription) : undefined,
      isPublished: typeof body?.isPublished === 'boolean' ? body.isPublished : undefined,
      products: productIds ? { set: productIds.map((productId) => ({ id: productId })) } : undefined,
    };

    const post = await prisma.blogPost.update({
      where: { id },
      data,
      include: { products: { select: { id: true } } },
    });
    revalidateBlogPages(post.slug);
    return NextResponse.json({ success: true, data: post });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update blog post';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return unauthorizedAdminResponse();
  }

  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Blog post id is required.' }, { status: 400 });
    const post = await prisma.blogPost.delete({ where: { id }, select: { slug: true } });
    revalidateBlogPages(post.slug);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete blog post';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
