import { ProductLeadInput, scoreProductLead } from '@/lib/productScout';

export type RainforestProduct = {
  title: string;
  imageUrl?: string;
  price?: number;
  rating?: number;
  reviewCount?: number;
  asin?: string;
  productUrl?: string;
  affiliatePlaceholderUrl?: string;
  score: number;
  reason: string;
};

type RainforestSearchResult = Record<string, unknown>;

const RAINFOREST_ENDPOINT = 'https://api.rainforestapi.com/request';
const AMAZON_DOMAIN = 'amazon.com';
const AESTHETIC_TERMS = ['aesthetic', 'pretty', 'minimal', 'neutral', 'stylish', 'decor', 'ceramic', 'gold', 'glass', 'linen', 'bow', 'vanity', 'cozy', 'ribbed', 'woven'];

export async function searchRainforestProducts(keyword: string) {
  const apiKey = process.env.RAINFOREST_API_KEY;

  if (!apiKey) {
    throw new Error('RAINFOREST_API_KEY is not configured. Add it to Vercel environment variables before generating Amazon product drafts.');
  }

  const params = new URLSearchParams({
    api_key: apiKey,
    type: 'search',
    amazon_domain: AMAZON_DOMAIN,
    search_term: keyword,
    number_of_results: '10',
    exclude_sponsored: 'true',
    fields: [
      'search_results.title',
      'search_results.image',
      'search_results.price',
      'search_results.rating',
      'search_results.ratings_total',
      'search_results.reviews_total',
      'search_results.asin',
      'search_results.link',
    ].join(','),
  });

  const response = await fetch(`${RAINFOREST_ENDPOINT}?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Rainforest API search failed with status ${response.status}`);
  }

  const payload = await response.json() as { search_results?: RainforestSearchResult[]; request_info?: { success?: boolean; message?: string }; error?: string };

  if (payload.request_info?.success === false || payload.error) {
    throw new Error(payload.error || payload.request_info?.message || 'Rainforest API search failed');
  }

  const products = (payload.search_results ?? [])
    .map((result) => normalizeRainforestResult(result, keyword))
    .filter((product): product is RainforestProduct => Boolean(product))
    .sort((a, b) => b.score - a.score);

  return products.slice(0, 5);
}

export function rainforestProductToLead(product: RainforestProduct, trendKeyword: string): ProductLeadInput {
  return {
    title: product.title,
    source: 'Rainforest API Amazon Search',
    sourceUrl: product.productUrl,
    imageUrl: product.imageUrl,
    trendKeyword,
    estimatedPrice: product.price,
    rating: product.rating,
    reviewCount: product.reviewCount,
    asin: product.asin,
    affiliatePlaceholderUrl: product.affiliatePlaceholderUrl,
    reasonItMightSell: product.reason,
  };
}

function normalizeRainforestResult(result: RainforestSearchResult, keyword: string): RainforestProduct | null {
  const title = readString(result.title);
  const asin = readString(result.asin);

  if (!title || !asin) return null;

  const price = readPrice(result.price);
  const rating = readNumber(result.rating);
  const reviewCount = readNumber(result.ratings_total) ?? readNumber(result.reviews_total);
  const imageUrl = readString(result.image);
  const productUrl = readString(result.link) || `https://www.amazon.com/dp/${asin}`;
  const affiliatePlaceholderUrl = productUrl ? appendAffiliatePlaceholder(productUrl) : undefined;
  const scoreInput: ProductLeadInput = {
    title,
    source: 'Rainforest API Amazon Search',
    sourceUrl: productUrl,
    imageUrl,
    trendKeyword: keyword,
    estimatedPrice: price,
    rating,
    reviewCount,
    asin,
    affiliatePlaceholderUrl,
  };
  const score = scoreProductLead(scoreInput).viralityScore;
  const aestheticHits = AESTHETIC_TERMS.filter((term) => title.toLowerCase().includes(term));
  const reason = [
    `Rainforest API match for “${keyword}”`,
    rating ? `${rating.toFixed(1)} star rating` : undefined,
    reviewCount ? `${reviewCount.toLocaleString()} reviews` : undefined,
    price ? `$${price.toFixed(2)} price${price <= 75 ? ' under $75' : ''}` : undefined,
    aestheticHits.length ? `visual keywords: ${aestheticHits.slice(0, 3).join(', ')}` : undefined,
  ].filter(Boolean).join('; ');

  return {
    title,
    imageUrl,
    price,
    rating,
    reviewCount,
    asin,
    productUrl,
    affiliatePlaceholderUrl,
    score,
    reason,
  };
}

function readString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function readNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^0-9.]/g, ''));
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function readPrice(value: unknown): number | undefined {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return readNumber(value);
  if (value && typeof value === 'object') {
    const price = value as Record<string, unknown>;
    return readNumber(price.value) ?? readNumber(price.raw) ?? readNumber(price.symbol);
  }
  return undefined;
}

function appendAffiliatePlaceholder(productUrl: string) {
  try {
    const url = new URL(productUrl);
    url.searchParams.set('tag', 'AFFILIATE_TAG_PLACEHOLDER');
    return url.toString();
  } catch {
    return `https://www.amazon.com/dp/${productUrl}?tag=AFFILIATE_TAG_PLACEHOLDER`;
  }
}
