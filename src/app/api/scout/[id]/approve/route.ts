import { NextResponse } from 'next/server';
import { createProductDraftFromLead } from '@/lib/productLeadApproval';

async function shouldGenerateContentBundle(request: Request) {
  const body: unknown = await request.json().catch(() => ({}));

  return Boolean(
    body &&
      typeof body === 'object' &&
      'generateContentBundle' in body &&
      body.generateContentBundle
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const generateContentBundle = await shouldGenerateContentBundle(request);
    const result = await createProductDraftFromLead(id, generateContentBundle);

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to approve product lead';
    const status = message === 'Product lead not found' ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
