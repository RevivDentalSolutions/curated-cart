import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest, unauthorizedAdminResponse } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { createProductDraftFromLead } from '@/lib/productLeadApproval';
import { normalizeLead, ProductLeadInput, scoutRequestSchema } from '@/lib/productScout';
import { rainforestProductToLead, searchRainforestProducts } from '@/lib/rainforest';

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorizedAdminResponse();
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
  if (!isAdminRequest(req)) return unauthorizedAdminResponse();
  try {
    const body = await req.json();
    const parsed = scoutRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const importedLeads = parsed.data.leads ?? [];
    const { leads: rainforestLeads, errors: rainforestErrors, attempted: rainforestAttempted } = await findRainforestProductLeads(importedLeads, parsed.data.sourceType);
    const usingKeywordFallback = rainforestAttempted && !rainforestLeads.length && importedLeads.length > 0;
    const leads = rainforestLeads.length ? rainforestLeads : importedLeads;

    console.info('[Scout API] Lead import prepared', {
      sourceType: parsed.data.sourceType,
      imported: importedLeads.length,
      rainforest: rainforestLeads.length,
      usingKeywordFallback,
      rainforestAttempted,
      rainforestErrors: rainforestErrors.length,
    });
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
    const deduped = await filterExistingLeads(data);

    const created = await prisma.$transaction(
      deduped.map((lead) => prisma.productLead.create({ data: lead }))
    );

    let drafted = 0;
    if (parsed.data.createProductDrafts) {
      for (const lead of created) {
        if (lead.asin || lead.source.includes('Rainforest')) {
          await createProductDraftFromLead(lead.id, false);
          drafted += 1;
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: created,
      meta: {
        discovered: data.length,
        deduped: data.length - deduped.length,
        drafted,
        fallbackCreated: usingKeywordFallback ? created.length : 0,
        rainforestErrors,
      },
    }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save product lead';
    console.error('[Scout API] Lead import failed', { message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function shouldTryRainforest(sourceType: string) {
  return !['rss', 'url', 'amazon'].includes(sourceType);
}

async function findRainforestProductLeads(leads: ProductLeadInput[], sourceType: string) {
  if (!shouldTryRainforest(sourceType)) return { leads: [], errors: [] as string[], attempted: false };

  const keywordCandidates = leads
    .map((lead) => (lead.trendKeyword && lead.trendKeyword !== 'manual trend import' ? lead.trendKeyword : sourceType === 'manual' ? '' : lead.title).trim())
    .filter(Boolean);
  const keywords = Array.from(new Set(keywordCandidates)).slice(0, 10);

  const attempted = keywords.length > 0;
  const products: ProductLeadInput[] = [];
  const errors: string[] = [];
  for (const keyword of keywords) {
    try {
      const rainforestProducts = await searchRainforestProducts(keyword);
      if (!rainforestProducts.length) {
        console.info('[Scout API] Rainforest returned no products; keyword-only fallback remains enabled', { keyword });
      }
      products.push(...rainforestProducts.map((product) => rainforestProductToLead(product, keyword)));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Rainforest API error';
      errors.push(`${keyword}: ${message}`);
      console.warn('[Scout API] Rainforest search failed; keyword-only fallback remains enabled', { keyword, message });
    }
  }

  return { leads: products, errors, attempted };
}

type NormalizedLead = ReturnType<typeof normalizeLead>;

async function filterExistingLeads(leads: NormalizedLead[]) {
  if (!leads.length) return [];

  const seen = new Set<string>();
  const unique = leads.filter((lead) => {
    const key = lead.asin ? `asin:${lead.asin}` : lead.sourceUrl ? `url:${lead.sourceUrl}` : `title:${normalizeTitle(lead.title)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const asins = unique.map((lead) => lead.asin).filter((asin): asin is string => Boolean(asin));
  const sourceUrls = unique.map((lead) => lead.sourceUrl).filter((url): url is string => Boolean(url));
  const titles = unique.map((lead) => lead.title);
  const existing = await prisma.productLead.findMany({
    where: {
      OR: [
        ...(asins.length ? [{ asin: { in: asins } }] : []),
        ...(sourceUrls.length ? [{ sourceUrl: { in: sourceUrls } }] : []),
        { title: { in: titles } },
      ],
    },
    select: { asin: true, sourceUrl: true, title: true },
  });

  const existingKeys = new Set(
    existing.flatMap((lead) => [
      lead.asin ? `asin:${lead.asin}` : '',
      lead.sourceUrl ? `url:${lead.sourceUrl}` : '',
      `title:${normalizeTitle(lead.title)}`,
    ]).filter(Boolean)
  );

  return unique.filter((lead) => {
    const asinKey = lead.asin ? `asin:${lead.asin}` : undefined;
    const urlKey = lead.sourceUrl ? `url:${lead.sourceUrl}` : undefined;
    const titleKey = `title:${normalizeTitle(lead.title)}`;
    return !(asinKey && existingKeys.has(asinKey)) && !(urlKey && existingKeys.has(urlKey)) && !existingKeys.has(titleKey);
  });
}

function normalizeTitle(title: string) {
  return title.replace(/\s+/g, ' ').replace(/[•|–—-]\s*Amazon.*$/i, '').trim();
}
