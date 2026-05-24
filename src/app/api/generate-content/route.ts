import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateContentBundle } from '@/lib/ai';
import { isAdminRequest, unauthorizedAdminResponse } from '@/lib/admin-auth';

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return unauthorizedAdminResponse();
  }

  try {
    const { productId } = await req.json();

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { category: true },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const content = await generateContentBundle(product);

    const contentBundle = await prisma.contentBundle.upsert({
      where: { productId },
      update: {
        ...content,
      },
      create: {
        productId,
        ...content,
      },
    });

    // Update product status
    await prisma.product.update({
      where: { id: productId },
      data: {
        blogPostStatus: 'Ready to Promote',
      },
    });

    return NextResponse.json({ success: true, data: contentBundle });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected API error' }, { status: 500 });
  }
}
