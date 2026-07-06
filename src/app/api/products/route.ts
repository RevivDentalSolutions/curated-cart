import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { isAdminRequest, unauthorizedAdminResponse } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

function revalidateProductPages(categoryId?: string) {
  revalidatePath('/');
  revalidatePath('/top-picks');
  revalidatePath('/categories');
  if (categoryId) revalidatePath(`/categories/${categoryId}`);
}

function clean(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorizedAdminResponse();

  try {
    const products = await prisma.product.findMany({
      include: { category: true, contentBundle: true, blogPosts: { orderBy: { createdAt: 'desc' }, take: 1, include: { products: { select: { id: true, name: true } } } } },
      orderBy: { dateAdded: 'desc' },
    });
    return NextResponse.json({ success: true, data: products });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load products';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorizedAdminResponse();

  try {
    const body = await req.json();
    const { name, description, categoryId, imageUrl, affiliateLink, amazonLink, affiliatePlaceholderUrl, amazonAsin, source, viralTrendNotes, contentIdea, blogPostStatus, pinStatus, tiktokStatus, published } = body;

    if (!clean(name) || !clean(categoryId) || !clean(imageUrl) || !clean(affiliateLink || amazonLink)) {
      return NextResponse.json({ error: 'Title, category, image URL, and affiliate URL are required.' }, { status: 400 });
    }

    const category = await prisma.category.findUnique({ where: { id: categoryId }, select: { id: true } });
    if (!category) return NextResponse.json({ error: 'Choose a valid category.' }, { status: 400 });

    const link = clean(affiliateLink) || clean(amazonLink);
    const product = await prisma.product.create({
      data: {
        name: clean(name)!,
        description: clean(description),
        categoryId: category.id,
        imageUrl: clean(imageUrl),
        affiliateLink: link,
        amazonLink: link,
        affiliatePlaceholderUrl: clean(affiliatePlaceholderUrl),
        amazonAsin: clean(amazonAsin),
        source: clean(source),
        viralTrendNotes: clean(viralTrendNotes),
        contentIdea: clean(contentIdea),
        blogPostStatus: clean(blogPostStatus) || 'Needs Content',
        pinStatus: clean(pinStatus) || 'Needs Pin',
        tiktokStatus: clean(tiktokStatus) || 'Pending',
        published: typeof published === 'boolean' ? published : true,
      },
    });

    revalidateProductPages(product.categoryId);
    return NextResponse.json({ success: true, data: product });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create product';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorizedAdminResponse();

  try {
    const body = await req.json();
    const { id, name, description, categoryId, imageUrl, affiliateLink, amazonLink, affiliatePlaceholderUrl, amazonAsin, source, viralTrendNotes, contentIdea, blogPostStatus, pinStatus, tiktokStatus, published } = body;
    if (!clean(id)) return NextResponse.json({ error: 'Product id is required.' }, { status: 400 });

    const link = affiliateLink !== undefined || amazonLink !== undefined ? clean(affiliateLink) || clean(amazonLink) : undefined;
    const product = await prisma.product.update({
      where: { id },
      data: {
        name: name !== undefined ? clean(name) || undefined : undefined,
        description: description !== undefined ? clean(description) : undefined,
        categoryId: categoryId !== undefined ? clean(categoryId) || undefined : undefined,
        imageUrl: imageUrl !== undefined ? clean(imageUrl) : undefined,
        affiliateLink: link,
        amazonLink: link,
        affiliatePlaceholderUrl: affiliatePlaceholderUrl !== undefined ? clean(affiliatePlaceholderUrl) : undefined,
        amazonAsin: amazonAsin !== undefined ? clean(amazonAsin) : undefined,
        source: source !== undefined ? clean(source) : undefined,
        viralTrendNotes: viralTrendNotes !== undefined ? clean(viralTrendNotes) : undefined,
        contentIdea: contentIdea !== undefined ? clean(contentIdea) : undefined,
        blogPostStatus: blogPostStatus !== undefined ? clean(blogPostStatus) || undefined : undefined,
        pinStatus: pinStatus !== undefined ? clean(pinStatus) || undefined : undefined,
        tiktokStatus: tiktokStatus !== undefined ? clean(tiktokStatus) || undefined : undefined,
        published: typeof published === 'boolean' ? published : undefined,
      },
      include: { category: true },
    });

    revalidateProductPages(product.categoryId);
    return NextResponse.json({ success: true, data: product });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update product';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorizedAdminResponse();

  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Product id is required.' }, { status: 400 });

    const product = await prisma.product.delete({ where: { id }, select: { categoryId: true } });
    revalidateProductPages(product.categoryId);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete product';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
