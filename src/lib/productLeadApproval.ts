import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { generateContentBundle } from '@/lib/ai';

function revalidateProductPages(categoryId?: string) {
  revalidatePath('/');
  revalidatePath('/top-picks');
  revalidatePath('/categories');
  if (categoryId) {
    revalidatePath(`/categories/${categoryId}`);
  }
}

export async function createProductDraftFromLead(leadId: string, generateBundle = false) {
  const result = await prisma.$transaction(async (tx) => {
    const lead = await tx.productLead.findUnique({ where: { id: leadId } });

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
    const existingProduct = lead.asin
      ? await tx.product.findFirst({ where: { amazonAsin: lead.asin }, include: { category: true } })
      : null;
    const product = existingProduct
      ? await tx.product.update({
          where: { id: existingProduct.id },
          data: {
            categoryId: existingProduct.categoryId || category.id,
            published: true,
          },
          include: { category: true },
        })
      : await tx.product.create({
          data: {
            name: lead.title,
            categoryId: category.id,
            amazonLink: isAmazonUrl ? lead.sourceUrl : null,
            affiliateLink: lead.affiliatePlaceholderUrl || (!isAmazonUrl ? lead.sourceUrl : null),
            affiliatePlaceholderUrl: lead.affiliatePlaceholderUrl,
            imageUrl: lead.imageUrl,
            amazonAsin: lead.asin,
            rating: lead.rating,
            reviewCount: lead.reviewCount,
            price: lead.estimatedPrice,
            source: lead.source,
            viralTrendNotes: `${lead.trendKeyword ? `Trend keyword: ${lead.trendKeyword}. ` : ''}${lead.reasonItMightSell}`,
            contentIdea: `Draft created from Product Scout with virality score ${lead.viralityScore}/100. Review sourcing, affiliate link, images, and compliance before publishing.${lead.imageUrl ? ` Suggested image source: ${lead.imageUrl}` : ''}${lead.asin ? ` Amazon ASIN: ${lead.asin}.` : ''}${lead.rating ? ` Rating: ${lead.rating}/5.` : ''}${lead.reviewCount ? ` Reviews: ${lead.reviewCount}.` : ''}`,
            blogPostStatus: 'Needs Content',
            published: true,
          },
          include: { category: true },
        });

    const updatedLead = await tx.productLead.update({
      where: { id: lead.id },
      data: { status: 'Approved' },
    });

    return { product, lead: updatedLead };
  });

  revalidateProductPages(result.product.categoryId);

  if (generateBundle) {
    const bundle = await generateContentBundle(result.product);
    await prisma.contentBundle.create({
      data: {
        productId: result.product.id,
        ...bundle,
      },
    });
  }

  return result;
}
