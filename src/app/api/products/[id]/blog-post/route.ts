import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { generateContentBundle } from '@/lib/ai';
import { isAdminRequest, unauthorizedAdminResponse } from '@/lib/admin-auth';

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'blog-post';
}

async function uniqueSlug(title: string, currentPostId?: string) {
  const baseSlug = slugify(title);
  let slug = baseSlug;
  let suffix = 2;

  while (true) {
    const existingPost = await prisma.blogPost.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existingPost || existingPost.id === currentPostId) {
      return slug;
    }

    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

function buildBlogPostContent(product: Awaited<ReturnType<typeof loadProduct>>, content: Awaited<ReturnType<typeof generateContentBundle>>) {
  if (!product) {
    return '';
  }

  return [
    content.shortDescription,
    '',
    content.blogPostOutline,
    '',
    `Why we love it: ${product.viralTrendNotes || `${product.name} is a curated ${product.category.name} find selected for The Curated Cart.`}`,
    '',
    'Price and availability: check the retailer page for current details before purchasing.',
    '',
    `Shop the find: ${product.amazonLink || product.affiliateLink || product.affiliatePlaceholderUrl || 'Add your affiliate link before promoting.'}`,
  ].join('\n');
}

async function loadProduct(productId: string) {
  return prisma.product.findUnique({
    where: { id: productId },
    include: {
      category: true,
      contentBundle: true,
      blogPosts: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });
}

function revalidateBlogPostPages(slug?: string) {
  revalidatePath('/blog');
  revalidatePath('/');
  if (slug) {
    revalidatePath(`/blog/${slug}`);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminRequest(req)) {
    return unauthorizedAdminResponse();
  }

  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const isPublished = typeof body?.isPublished === 'boolean' ? body.isPublished : false;
    const product = await loadProduct(id);

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const generatedContent = await generateContentBundle(product);
    await prisma.contentBundle.upsert({
      where: { productId: product.id },
      update: generatedContent,
      create: {
        productId: product.id,
        ...generatedContent,
      },
    });

    const existingPost = product.blogPosts[0];
    const slug = await uniqueSlug(generatedContent.blogPostTitle, existingPost?.id);
    const postContent = buildBlogPostContent(product, generatedContent);

    const blogPost = existingPost
      ? await prisma.blogPost.update({
          where: { id: existingPost.id },
          data: {
            title: generatedContent.blogPostTitle,
            content: postContent,
            excerpt: generatedContent.shortDescription,
            slug,
            categoryId: product.categoryId,
            metaTitle: generatedContent.blogPostTitle,
            metaDescription: generatedContent.shortDescription,
            featuredImage: product.imageUrl,
            isPublished,
            products: {
              connect: { id: product.id },
            },
          },
        })
      : await prisma.blogPost.create({
          data: {
            title: generatedContent.blogPostTitle,
            content: postContent,
            excerpt: generatedContent.shortDescription,
            slug,
            categoryId: product.categoryId,
            metaTitle: generatedContent.blogPostTitle,
            metaDescription: generatedContent.shortDescription,
            featuredImage: product.imageUrl,
            isPublished,
            products: {
              connect: { id: product.id },
            },
          },
        });

    await prisma.product.update({
      where: { id: product.id },
      data: { blogPostStatus: isPublished ? 'Published' : 'Ready to Promote' },
    });

    revalidateBlogPostPages(blogPost.slug);

    return NextResponse.json({ success: true, data: blogPost });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create blog post';
    console.error('Blog post creation error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminRequest(req)) {
    return unauthorizedAdminResponse();
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { postId, isPublished } = body;

    if (!postId || typeof isPublished !== 'boolean') {
      return NextResponse.json({ error: 'Blog post id and publish status are required' }, { status: 400 });
    }

    const existingPost = await prisma.blogPost.findFirst({
      where: {
        id: postId,
        products: {
          some: { id },
        },
      },
      select: { id: true },
    });

    if (!existingPost) {
      return NextResponse.json({ error: 'Blog post is not associated with this product' }, { status: 400 });
    }

    const blogPost = await prisma.blogPost.update({
      where: { id: postId },
      data: { isPublished },
      include: { products: { select: { id: true } } },
    });

    // The recovered production catalog predates Product.description. Prisma's
    // default update return selects every column, so explicitly select only the
    // status field needed here.
    await prisma.product.update({
      where: { id },
      data: { blogPostStatus: isPublished ? 'Published' : 'Ready to Promote' },
      select: { id: true, blogPostStatus: true },
    });

    revalidateBlogPostPages(blogPost.slug);

    return NextResponse.json({ success: true, data: blogPost });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update blog post';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
