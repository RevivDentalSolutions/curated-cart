import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createProductDraftFromLead } from '@/lib/productLeadApproval';
import { isAdminRequest, unauthorizedAdminResponse } from '@/lib/admin-auth';

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorizedAdminResponse();

  try {
    const leads = await prisma.productLead.findMany({
      where: {
        status: 'New',
        OR: [
          { asin: { not: null } },
          { source: { contains: 'Rainforest' } },
        ],
      },
      orderBy: [{ viralityScore: 'desc' }, { createdAt: 'desc' }],
      take: 100,
    });

    let created = 0;
    const errors: string[] = [];

    for (const lead of leads) {
      try {
        await createProductDraftFromLead(lead.id, false);
        created += 1;
      } catch (error) {
        errors.push(error instanceof Error ? error.message : `Unable to draft ${lead.title}`);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        scanned: leads.length,
        created,
        errors,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate product drafts';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
