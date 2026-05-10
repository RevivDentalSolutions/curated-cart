import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await prisma.$transaction(async (tx) => {
      const lead = await tx.productLead.findUnique({ where: { id } });

      if (!lead) {
        throw new Error('Product lead not found');
      }

      const categoryName = lead.suggestedCategory || 'Worth the Splurge';
      const category = await tx.category.upsert({
        where: { name: categoryName },
        update: {},
        create: { name: categoryName },
      });

      const isAmazonUrl = lead.sourceUrl?.includes('amazon.') || lead.sourceUrl?.includes('amzn.to');
      const product = await tx.product.create({
        data: {
          name: lead.title,
          categoryId: category.id,
          amazonLink: isAmazonUrl ? lead.sourceUrl : null,
          affiliateLink: !isAmazonUrl ? lead.sourceUrl : null,
          price: lead.estimatedPrice,
          source: lead.source,
          viralTrendNotes: `${lead.trendKeyword ? `Trend keyword: ${lead.trendKeyword}. ` : ''}${lead.reasonItMightSell}`,
          contentIdea: `Draft created from Product Scout with virality score ${lead.viralityScore}/100. Review sourcing, affiliate link, images, and compliance before publishing.`,
          blogPostStatus: 'Needs Content',
        },
        include: { category: true },
      });

      const updatedLead = await tx.productLead.update({
        where: { id: lead.id },
        data: { status: 'Approved' },
      });

      return { product, lead: updatedLead };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to approve product lead';
    const status = message === 'Product lead not found' ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
