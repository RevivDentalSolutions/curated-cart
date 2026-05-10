import { NextResponse } from 'next/server';
import { createProductDraftFromLead } from '@/lib/productLeadApproval';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const result = await createProductDraftFromLead(id, Boolean(body.generateContentBundle));

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to approve product lead';
    const status = message === 'Product lead not found' ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
