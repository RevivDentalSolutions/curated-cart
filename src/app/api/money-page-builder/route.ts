import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminRequest, unauthorizedAdminResponse } from '@/lib/admin-auth';

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return unauthorizedAdminResponse();
  }

  try {
    const { title, productIds, categoryId } = await req.json();

    if (!title || !productIds || !productIds.length || !categoryId) {
      return NextResponse.json({ error: 'Title, category, and products are required' }, { status: 400 });
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const blogPost = await prisma.blogPost.create({
      data: {
        title,
        slug,
        categoryId,
        isPublished: false,
        products: {
          connect: productIds.map((id: string) => ({ id })),
        },
      },
      include: {
        products: true,
      },
    });

    return NextResponse.json({ success: true, data: blogPost });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unexpected API error' }, { status: 500 });
  }
}
