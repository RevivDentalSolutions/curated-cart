import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminRequest, unauthorizedAdminResponse } from '@/lib/admin-auth';
import { createPinterestPinDrafts, pinterestCredentialsConfigured } from '@/lib/pinterest';

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorizedAdminResponse();

  try {
    const pins = await prisma.pinterestPin.findMany({
      include: {
        product: { select: { id: true, name: true, imageUrl: true } },
        blogPost: { select: { id: true, title: true, slug: true } },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      take: 200,
    });

    return NextResponse.json({
      success: true,
      data: pins,
      meta: {
        canPublish: pinterestCredentialsConfigured(),
        defaultBoardId: process.env.PINTEREST_DEFAULT_BOARD_ID || null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load Pinterest pins';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorizedAdminResponse();

  try {
    const body = await req.json();
    const { productId, blogPostId, leadId } = body;

    const selectedSources = [productId, blogPostId, leadId].filter(Boolean);
    if (selectedSources.length !== 1) {
      return NextResponse.json({ error: 'Choose exactly one source: productId, blogPostId, or approved leadId' }, { status: 400 });
    }

    const data = await createPinterestPinDrafts(productId ? { productId } : blogPostId ? { blogPostId } : { leadId });
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create Pinterest pin drafts';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorizedAdminResponse();

  try {
    const body = await req.json();
    const { id, title, description, destinationUrl, imageUrl, imagePrompt, altText, boardName, boardId, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'Pinterest pin id is required' }, { status: 400 });
    }

    const data: Record<string, string | null> = {};
    for (const [key, value] of Object.entries({ title, description, destinationUrl, imageUrl, imagePrompt, altText, boardName, boardId, status })) {
      if (typeof value === 'string') data[key] = value;
      if (value === null && ['imageUrl', 'imagePrompt', 'boardId'].includes(key)) data[key] = null;
    }

    if (status && !['Draft', 'Ready', 'Published', 'Failed'].includes(status)) {
      return NextResponse.json({ error: 'Invalid pin status' }, { status: 400 });
    }

    const pin = await prisma.pinterestPin.update({ where: { id }, data });
    return NextResponse.json({ success: true, data: pin });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update Pinterest pin';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
