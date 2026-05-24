import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest, unauthorizedAdminResponse } from '@/lib/admin-auth';
import { publishPinterestPin } from '@/lib/pinterest';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) return unauthorizedAdminResponse();

  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const pin = await publishPinterestPin(id, typeof body.boardId === 'string' ? body.boardId : undefined);
    return NextResponse.json({ success: true, data: pin });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to publish Pinterest pin';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
