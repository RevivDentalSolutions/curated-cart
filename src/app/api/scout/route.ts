import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizeLead, scoutRequestSchema } from '@/lib/productScout';

export async function GET() {
  try {
    const leads = await prisma.productLead.findMany({
      orderBy: [{ status: 'asc' }, { viralityScore: 'desc' }, { createdAt: 'desc' }],
      take: 100,
    });

    return NextResponse.json({ success: true, data: leads });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load product leads';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = scoutRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const leads = parsed.data.leads ?? [];
    const data = leads.map((lead) => {
      const normalized = normalizeLead({
        ...lead,
        source: parsed.data.sourceType === 'rss' && parsed.data.rssFeedUrl
          ? `${lead.source} RSS`
          : lead.source,
      });

      return {
        ...normalized,
        sourceUrl: normalized.sourceUrl || parsed.data.rssFeedUrl,
      };
    });

    const created = await prisma.$transaction(
      data.map((lead) => prisma.productLead.create({ data: lead }))
    );

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save product lead';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
