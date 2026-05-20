import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, categoryId, amazonLink, price, source, viralTrendNotes, contentIdea, image } = body;

    if (!name || !categoryId) {
      return NextResponse.json({ error: 'Name and Category are required' }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name,
        categoryId,
        image,
        amazonLink,
        price: price ? parseFloat(price) : null,
        source,
        viralTrendNotes,
        contentIdea,
        blogPostStatus: 'Needs Content',
      },
    });

    return NextResponse.json({ success: true, data: product });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: { category: true },
      orderBy: { dateAdded: 'desc' },
    });
    return NextResponse.json({ success: true, data: products });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
