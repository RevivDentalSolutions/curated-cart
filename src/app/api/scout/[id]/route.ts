import { NextRequest, NextResponse } from 'next/server';
import { ProductLeadStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const status = body.status as ProductLeadStatus | undefined;

    if (!status || !['New', 'Approved', 'Rejected'].includes(status)) {
      return NextResponse.json({ error: 'Status must be New, Approved, or Rejected' }, { status: 400 });
    }

    const lead = await prisma.productLead.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ success: true, data: lead });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update product lead';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
