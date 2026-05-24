import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

export async function GET() {
  const posts = await prisma.blogPost.findMany({
    include: { category: true, products: { select: { id: true, name: true, image: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ success: true, data: posts });
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, data } = await req.json();
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    const updated = await prisma.blogPost.update({
      where: { id },
      data: {
        title: data.title,
        slug: data.slug ? slugify(data.slug) : undefined,
        content: data.content,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        categoryId: data.categoryId,
        featuredImage: data.featuredImage,
        isPublished: data.isPublished,
        products: data.productIds ? { set: data.productIds.map((pid: string) => ({ id: pid })) } : undefined,
      },
      include: { products: true, category: true },
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
