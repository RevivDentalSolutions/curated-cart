import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { isAdminRequest, unauthorizedAdminResponse } from '@/lib/admin-auth';

function revalidateProductPages(categoryId?: string) {
  revalidatePath('/');
  revalidatePath('/top-picks');
  revalidatePath('/categories');
  if (categoryId) {
    revalidatePath(`/categories/${categoryId}`);
  }
}

export const dynamic = 'force-dynamic';

const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return unauthorizedAdminResponse();
  }

  try {
    const body = await req.json();
    const { name, categoryId, amazonLink, affiliateLink, affiliatePlaceholderUrl, imageUrl, amazonAsin, rating, reviewCount, price, source, viralTrendNotes, contentIdea, published } = body;

    if (!name || !categoryId) {
      return NextResponse.json({ error: 'Name and Category are required' }, { status: 400 });
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });

    if (!category) {
      return NextResponse.json({ error: 'Choose a valid category before saving this product.' }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name,
        categoryId: category.id,
        amazonLink,
        affiliateLink,
        affiliatePlaceholderUrl,
        imageUrl,
        amazonAsin,
        rating: rating ? parseFloat(rating) : null,
        reviewCount: reviewCount ? parseInt(reviewCount, 10) : null,
        price: price ? parseFloat(price) : null,
        source,
        viralTrendNotes,
        contentIdea,
        blogPostStatus: 'Needs Content',
        published: typeof published === 'boolean' ? published : true,
      },
    });

    revalidateProductPages(product.categoryId);

    return NextResponse.json({ success: true, data: product });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create product';
    console.error('API Error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return unauthorizedAdminResponse();
  }

  try {
    const body = await req.json();
    const { id, published } = body;

    if (!id || typeof published !== 'boolean') {
      return NextResponse.json({ error: 'Product id and published boolean are required' }, { status: 400 });
    }

    const product = await prisma.product.update({
      where: { id },
      data: { published },
      include: { category: true },
    });

    revalidateProductPages(product.categoryId);

    return NextResponse.json({ success: true, data: product });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update product';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return unauthorizedAdminResponse();
  }

  try {
    const body = await req.json();
    const { id, ids, action, data } = body;

    if (Array.isArray(ids) && ids.length && action) {
      const patch: any = {};
      if (action === 'publish') patch.isPublished = true;
      if (action === 'unpublish') patch.isPublished = false;
      if (action === 'archive') patch.isArchived = true;
      if (action === 'unarchive') patch.isArchived = false;
      if (action === 'editorialStatus' && data?.editorialStatus) patch.editorialStatus = data.editorialStatus;
      const res = await prisma.product.updateMany({ where: { id: { in: ids } }, data: patch });
      return NextResponse.json({ success: true, data: res });
    }

    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...data,
        slug: data?.slug ? slugify(data.slug) : undefined,
      },
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const products = await prisma.product.findMany({ include: { category: true }, orderBy: { dateAdded: 'desc' } });
    return NextResponse.json({ success: true, data: products });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load products';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
