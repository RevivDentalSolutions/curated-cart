import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isAdminRequest, unauthorizedAdminResponse } from '@/lib/admin-auth';
import { generateContentBundle } from '@/lib/ai';
import { createPinterestPinDrafts } from '@/lib/pinterest';
import { prisma } from '@/lib/prisma';

const manualProductSchema = z.object({
  title: z.string().trim().min(2),
  link: z.string().trim().url(),
  imageUrl: z.string().trim().url().optional().or(z.literal('')),
  price: z.coerce.number().positive().optional().or(z.literal('')),
  asin: z.string().trim().optional().or(z.literal('')),
  category: z.string().trim().optional().or(z.literal('')),
});

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorizedAdminResponse();

  try {
    const body = await req.json();
    const parsed = manualProductSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const input = parsed.data;
    const category = await prisma.category.upsert({
      where: { name: input.category || 'Worth the Splurge' },
      update: {},
      create: { name: input.category || 'Worth the Splurge' },
    });

    const product = await prisma.product.create({
      data: {
        name: input.title,
        categoryId: category.id,
        amazonLink: input.link,
        affiliatePlaceholderUrl: appendAffiliatePlaceholder(input.link),
        imageUrl: input.imageUrl || null,
        amazonAsin: input.asin || null,
        price: typeof input.price === 'number' ? input.price : null,
        source: 'Manual Amazon Scout conversion',
        viralTrendNotes: 'Manual Amazon details pasted in Scout while Rainforest debugging was active.',
        contentIdea: 'Manual Product draft created from Scout. Review Amazon title, affiliate link, image rights, and compliance before publishing.',
        blogPostStatus: 'Needs Content',
        pinStatus: 'Drafted',
        published: false,
      },
      include: { category: true },
    });

    const bundle = await generateContentBundle(product);
    const contentBundle = await prisma.contentBundle.create({
      data: {
        productId: product.id,
        ...bundle,
      },
    });
    const pins = await createPinterestPinDrafts({ productId: product.id });

    return NextResponse.json({
      success: true,
      data: {
        product,
        contentBundle,
        pins,
      },
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to convert manual Amazon details to a Product draft';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function appendAffiliatePlaceholder(productUrl: string) {
  try {
    const url = new URL(productUrl);
    url.searchParams.set('tag', 'AFFILIATE_TAG_PLACEHOLDER');
    return url.toString();
  } catch {
    return null;
  }
}
