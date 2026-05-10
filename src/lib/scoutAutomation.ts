import { prisma } from '@/lib/prisma';
import { createProductDraftFromLead } from '@/lib/productLeadApproval';
import { normalizeLead, ProductLeadInput } from '@/lib/productScout';
import { rainforestProductToLead, searchRainforestProducts } from '@/lib/rainforest';

type ScoutSource = 'RSS' | 'Amazon' | 'TikTok' | 'Pinterest' | 'URL';

type AutomationConfigInput = {
  autoImportEnabled: boolean;
  autoApproveHighScoringLeads: boolean;
  autoGenerateContentBundles: boolean;
  highScoreThreshold: number;
  rssFeeds: string[];
  amazonMoversUrls: string[];
  tiktokKeywords: string[];
  pinterestKeywords: string[];
  productUrls: string[];
};

type DiscoveredLead = ProductLeadInput & {
  sourceBadge: ScoutSource;
};

const DEFAULT_CONFIG_ID = 'default';
const DISALLOWED_METADATA_HOSTS = ['amazon.', 'amzn.to', 'tiktok.com', 'pinterest.com'];

export async function getScoutAutomationConfig() {
  return prisma.scoutAutomationConfig.upsert({
    where: { id: DEFAULT_CONFIG_ID },
    update: {},
    create: { id: DEFAULT_CONFIG_ID },
  });
}

export async function updateScoutAutomationConfig(input: Partial<AutomationConfigInput>) {
  return prisma.scoutAutomationConfig.upsert({
    where: { id: DEFAULT_CONFIG_ID },
    update: sanitizeAutomationConfig(input),
    create: {
      id: DEFAULT_CONFIG_ID,
      ...sanitizeAutomationConfig(input),
    },
  });
}

export async function runScoutAutomation(options: { force?: boolean } = {}) {
  const config = await getScoutAutomationConfig();

  if (!options.force && !config.autoImportEnabled) {
    return {
      skipped: true,
      reason: 'Auto-import is disabled.',
      discovered: 0,
      created: 0,
      deduped: 0,
      approved: 0,
    };
  }

  const discovered = await discoverLeads({
    rssFeeds: config.rssFeeds,
    amazonMoversUrls: config.amazonMoversUrls,
    tiktokKeywords: config.tiktokKeywords,
    pinterestKeywords: config.pinterestKeywords,
    productUrls: config.productUrls,
  });

  const normalized = discovered.map((lead) => normalizeLead(lead));
  const deduped = await filterExistingLeads(normalized);

  const created = await prisma.$transaction(
    deduped.map((lead) => prisma.productLead.create({ data: lead }))
  );

  let approved = 0;
  if (config.autoApproveHighScoringLeads) {
    for (const lead of created) {
      if (lead.viralityScore >= config.highScoreThreshold) {
        await createProductDraftFromLead(lead.id, config.autoGenerateContentBundles);
        approved += 1;
      }
    }
  }

  await prisma.scoutAutomationConfig.update({
    where: { id: DEFAULT_CONFIG_ID },
    data: { lastRunAt: new Date() },
  });

  return {
    skipped: false,
    discovered: discovered.length,
    created: created.length,
    deduped: normalized.length - deduped.length,
    approved,
  };
}

async function discoverLeads(config: Pick<AutomationConfigInput, 'rssFeeds' | 'amazonMoversUrls' | 'tiktokKeywords' | 'pinterestKeywords' | 'productUrls'>) {
  const leads: DiscoveredLead[] = [];

  for (const feedUrl of config.rssFeeds) {
    leads.push(...await fetchRssLeads(feedUrl));
  }

  leads.push(...config.amazonMoversUrls.map(createAmazonMoversLead));
  for (const keyword of config.tiktokKeywords) {
    leads.push(...await createKeywordLeads(keyword, 'TikTok'));
  }

  for (const keyword of config.pinterestKeywords) {
    leads.push(...await createKeywordLeads(keyword, 'Pinterest'));
  }

  for (const productUrl of config.productUrls) {
    leads.push(await createUrlLead(productUrl));
  }

  return leads;
}

async function filterExistingLeads(leads: ReturnType<typeof normalizeLead>[]) {
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

async function fetchRssLeads(feedUrl: string): Promise<DiscoveredLead[]> {
  const response = await fetch(feedUrl, {
    headers: { 'User-Agent': 'The Curated Cart Product Scout/1.0' },
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) return [];

  const xml = await response.text();
  const items = Array.from(xml.matchAll(/<item[\s\S]*?<\/item>|<entry[\s\S]*?<\/entry>/gi)).slice(0, 20);

  return items.map((match) => {
    const item = match[0];
    const title = cleanXml(extractXmlValue(item, 'title')) || 'RSS trend item';
    const link = cleanXml(extractXmlValue(item, 'link')) || extractLinkHref(item);
    const imageUrl = extractRssImage(item);

    return {
      title: normalizeTitle(title),
      source: 'RSS',
      sourceUrl: link,
      imageUrl,
      trendKeyword: 'RSS trend feed',
      reasonItMightSell: 'Imported from an allowed RSS feed for admin review.',
      sourceBadge: 'RSS',
    };
  });
}

function createAmazonMoversLead(url: string): DiscoveredLead {
  const title = titleFromUrl(url) || 'Amazon Movers & Shakers product idea';

  return {
    title,
    source: 'Amazon Movers & Shakers',
    sourceUrl: url,
    trendKeyword: 'Amazon Movers & Shakers',
    reasonItMightSell: 'Imported from an affiliate-safe Amazon Movers & Shakers URL; no page scraping performed.',
    sourceBadge: 'Amazon',
  };
}

async function createKeywordLeads(keyword: string, source: 'TikTok' | 'Pinterest'): Promise<DiscoveredLead[]> {
  const products = await searchRainforestProducts(keyword);

  if (products.length) {
    return products.map((product) => ({
      ...rainforestProductToLead(product, keyword),
      source: `Rainforest API Amazon Search (${source} trend)`,
      sourceBadge: 'Amazon',
    }));
  }

  return [{
    title: normalizeTitle(keyword),
    source: `${source} trend keyword list`,
    trendKeyword: keyword,
    reasonItMightSell: `Imported from a pasted ${source} trend keyword list for compliant review.`,
    sourceBadge: source,
  }];
}

async function createUrlLead(url: string): Promise<DiscoveredLead> {
  const metadata = await fetchSafeMetadata(url);

  return {
    title: metadata.title || titleFromUrl(url) || 'Imported product URL',
    source: 'Manual product URL',
    sourceUrl: url,
    imageUrl: metadata.imageUrl,
    trendKeyword: 'manual URL import',
    reasonItMightSell: metadata.description || 'Imported from a manually pasted product URL for admin review.',
    sourceBadge: 'URL',
  };
}

async function fetchSafeMetadata(url: string) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (DISALLOWED_METADATA_HOSTS.some((blockedHost) => host.includes(blockedHost))) {
      return { title: titleFromUrl(url) };
    }

    const response = await fetch(url, {
      headers: { 'User-Agent': 'The Curated Cart Product Scout/1.0' },
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) return { title: titleFromUrl(url) };

    const html = await response.text();
    return {
      title: extractMeta(html, 'og:title') || extractTitle(html) || titleFromUrl(url),
      description: extractMeta(html, 'og:description') || extractMeta(html, 'description'),
      imageUrl: absolutizeUrl(extractMeta(html, 'og:image'), url),
    };
  } catch {
    return { title: titleFromUrl(url) };
  }
}

function sanitizeAutomationConfig(input: Partial<AutomationConfigInput>) {
  return {
    ...(typeof input.autoImportEnabled === 'boolean' ? { autoImportEnabled: input.autoImportEnabled } : {}),
    ...(typeof input.autoApproveHighScoringLeads === 'boolean' ? { autoApproveHighScoringLeads: input.autoApproveHighScoringLeads } : {}),
    ...(typeof input.autoGenerateContentBundles === 'boolean' ? { autoGenerateContentBundles: input.autoGenerateContentBundles } : {}),
    ...(typeof input.highScoreThreshold === 'number' ? { highScoreThreshold: Math.min(100, Math.max(1, Math.round(input.highScoreThreshold))) } : {}),
    ...(Array.isArray(input.rssFeeds) ? { rssFeeds: cleanList(input.rssFeeds).filter(isUrl) } : {}),
    ...(Array.isArray(input.amazonMoversUrls) ? { amazonMoversUrls: cleanList(input.amazonMoversUrls).filter(isUrl) } : {}),
    ...(Array.isArray(input.tiktokKeywords) ? { tiktokKeywords: cleanList(input.tiktokKeywords) } : {}),
    ...(Array.isArray(input.pinterestKeywords) ? { pinterestKeywords: cleanList(input.pinterestKeywords) } : {}),
    ...(Array.isArray(input.productUrls) ? { productUrls: cleanList(input.productUrls).filter(isUrl) } : {}),
  };
}

function cleanList(values: string[]) {
  return values.map((value) => value.trim()).filter(Boolean).slice(0, 50);
}

function isUrl(value: string) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function normalizeTitle(title: string) {
  return title.replace(/\s+/g, ' ').replace(/[•|–—-]\s*Amazon.*$/i, '').trim();
}

function titleFromUrl(url: string) {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/').filter(Boolean);
    const candidate = parts.find((part) => !['dp', 'gp', 'product', 'bestsellers', 'movers-and-shakers'].includes(part.toLowerCase())) || parsed.hostname;
    return normalizeTitle(decodeURIComponent(candidate).replace(/[-_]+/g, ' '));
  } catch {
    return '';
  }
}

function cleanXml(value?: string) {
  return value?.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, '').trim();
}

function extractXmlValue(xml: string, tag: string) {
  return xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))?.[1];
}

function extractLinkHref(xml: string) {
  return xml.match(/<link[^>]+href=["']([^"']+)["'][^>]*>/i)?.[1];
}

function extractRssImage(xml: string) {
  return xml.match(/<media:content[^>]+url=["']([^"']+)["'][^>]*>/i)?.[1]
    || xml.match(/<media:thumbnail[^>]+url=["']([^"']+)["'][^>]*>/i)?.[1]
    || xml.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]*type=["']image\//i)?.[1];
}

function extractMeta(html: string, key: string) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const propertyMatch = html.match(new RegExp(`<meta[^>]+property=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i'));
  const nameMatch = html.match(new RegExp(`<meta[^>]+name=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i'));
  return decodeHtml(propertyMatch?.[1] || nameMatch?.[1] || '');
}

function extractTitle(html: string) {
  return decodeHtml(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '').trim();
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

function absolutizeUrl(url: string | undefined, base: string) {
  if (!url) return undefined;
  try {
    return new URL(url, base).toString();
  } catch {
    return undefined;
  }
}
