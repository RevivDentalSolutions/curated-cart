import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { isAdminRequest, unauthorizedAdminResponse } from '@/lib/admin-auth';
import {
  cleanEditorHtml,
  DEFAULT_AFFILIATE_DISCLOSURE,
  normalizeEditorSections,
  normalizeImageLibrary,
  sectionsToPlainContent,
} from '@/lib/blog-editor';

function cleanString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function nullableString(value: unknown) {
  const cleaned = cleanString(value);
  return cleaned.length > 0 ? cleaned : null;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'blog-post';
}

async function uniqueSlugForPost(value: string, postId: string) {
  const baseSlug = slugify(value);
  let slug = baseSlug;
  let suffix = 2;

  while (await prisma.blogPost.findFirst({ where: { slug, NOT: { id: postId } }, select: { id: true } })) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

function revalidateBlogPages(slug?: string | null, previousSlug?: string | null) {
  revalidatePath('/');
  revalidatePath('/blog');
  if (slug) revalidatePath(`/blog/${slug}`);
  if (previousSlug && previousSlug !== slug) revalidatePath(`/blog/${previousSlug}`);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) {
    return unauthorizedAdminResponse();
  }

  const { id } = await params;
  const [post, categories] = await Promise.all([
    prisma.blogPost.findUnique({
      where: { id },
      include: {
        category: true,
        products: { include: { category: true } },
      },
    }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
  ]);

  if (!post) {
    return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    data: {
      post: {
        ...post,
        editorSections: normalizeEditorSections(post.editorSections),
        imageLibrary: normalizeImageLibrary(post.imageLibrary),
      },
      categories,
    },
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) {
    return unauthorizedAdminResponse();
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const existingPost = await prisma.blogPost.findUnique({
      where: { id },
      select: { id: true, slug: true, title: true },
    });

    if (!existingPost) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    }

    const title = cleanString(body?.title) || existingPost.title;
    const requestedSlug = cleanString(body?.slug) || title;
    const slug = await uniqueSlugForPost(requestedSlug, id);
    const sections = normalizeEditorSections(body?.editorSections).map((section) => ({
      ...section,
      body: cleanEditorHtml(section.body),
    }));
    const imageLibrary = normalizeImageLibrary(body?.imageLibrary);
    const content = sections.length > 0 ? sectionsToPlainContent(sections) : nullableString(body?.content);
    const shouldPublish = body?.publish === true || body?.isPublished === true;
    const shouldUnpublish = body?.isPublished === false && body?.publish !== true;

    const data: Prisma.BlogPostUpdateInput = {
      title,
      subtitle: nullableString(body?.subtitle),
      slug,
      category: cleanString(body?.categoryId)
        ? { connect: { id: cleanString(body?.categoryId) } }
        : undefined,
      authorName: nullableString(body?.authorName) || 'Jessica',
      affiliateDisclosure: nullableString(body?.affiliateDisclosure) || DEFAULT_AFFILIATE_DISCLOSURE,
      ctaText: nullableString(body?.ctaText) || 'Shop the Find',
      labelFavoritePick: nullableString(body?.labelFavoritePick) || 'Favorite Pick',
      labelVanityTray: nullableString(body?.labelVanityTray) || 'The Vanity Tray',
      labelWorthIt: nullableString(body?.labelWorthIt) || 'Worth It?',
      featuredImage: nullableString(body?.featuredImage),
      excerpt: nullableString(body?.excerpt),
      metaTitle: nullableString(body?.metaTitle) || title,
      metaDescription: nullableString(body?.metaDescription),
      content,
      editorSections: sections.length > 0 ? (sections as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
      imageLibrary: imageLibrary.length > 0 ? (imageLibrary as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
      scheduledAt: nullableString(body?.scheduledAt) ? new Date(cleanString(body?.scheduledAt)) : null,
      isPublished: shouldPublish ? true : shouldUnpublish ? false : undefined,
    };

    const blogPost = await prisma.blogPost.update({
      where: { id },
      data,
      include: { products: { select: { id: true } } },
    });

    if (blogPost.products.length > 0) {
      await prisma.product.updateMany({
        where: { id: { in: blogPost.products.map((product) => product.id) } },
        data: { blogPostStatus: blogPost.isPublished ? 'Published' : 'Ready to Promote' },
      });
    }

    revalidateBlogPages(blogPost.slug, existingPost.slug);

    return NextResponse.json({ success: true, data: blogPost });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update blog post';
    console.error('Blog post update error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
