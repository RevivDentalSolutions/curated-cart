import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminRequest, unauthorizedAdminResponse } from '@/lib/admin-auth';

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return unauthorizedAdminResponse();
  }

  try {
    const body = await req.json();
    const { name, categoryId, amazonLink, affiliateLink, affiliatePlaceholderUrl, imageUrl, amazonAsin, rating, reviewCount, price, source, viralTrendNotes, contentIdea } = body;

    if (!name || !categoryId) {
      return NextResponse.json({ error: 'Name and Category are required' }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name,
        categoryId,
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
      },
    });

    return NextResponse.json({ success: true, data: product });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create product';
    console.error('API Error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return unauthorizedAdminResponse();
  }

  try {
    const products = await prisma.product.findMany({
      include: { category: true },
      orderBy: { dateAdded: 'desc' },
    });
    return NextResponse.json({ success: true, data: products });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load products';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
