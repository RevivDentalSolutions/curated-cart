import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, categoryId, amazonLink, affiliateLink, price, source, viralTrendNotes, contentIdea, image } = body;

    if (!name || !categoryId) {
      return NextResponse.json({ error: 'Name and Category are required' }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug: slugify(name),
        categoryId,
        image,
        amazonLink,
        affiliateLink,
        price: price ? parseFloat(price) : null,
        source,
        viralTrendNotes,
        contentIdea,
        blogPostStatus: 'Needs Content',
      },
    });

    return NextResponse.json({ success: true, data: product });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
