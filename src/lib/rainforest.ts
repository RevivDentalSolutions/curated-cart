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
type RainforestPayload = {
  search_results?: RainforestSearchResult[];
  request_info?: { success?: boolean; message?: string; credits_used?: number; credits_remaining?: number };
  error?: string;
  message?: string;
};

export type RainforestErrorKind = 'missing_key' | 'invalid_key' | 'wrong_request_format' | 'exhausted_credits' | 'unknown_error';

export class RainforestApiError extends Error {
  kind: RainforestErrorKind;
  status?: number;
  rawMessage?: string;

  constructor(kind: RainforestErrorKind, message: string, options: { status?: number; rawMessage?: string } = {}) {
    super(message);
    this.name = 'RainforestApiError';
    this.kind = kind;
    this.status = options.status;
    this.rawMessage = options.rawMessage;
  }
}

const RAINFOREST_ENDPOINT = 'https://api.rainforestapi.com/request';
const RAINFOREST_AUTH_METHOD = 'api_key query parameter';
const AMAZON_DOMAIN = 'amazon.com';
const AESTHETIC_TERMS = ['aesthetic', 'pretty', 'minimal', 'neutral', 'stylish', 'decor', 'ceramic', 'gold', 'glass', 'linen', 'bow', 'vanity', 'cozy', 'ribbed', 'woven'];

export function rainforestDebugConfig() {
  const apiKey = process.env.RAINFOREST_API_KEY?.trim() || '';
  return {
    apiKeyPresent: Boolean(apiKey),
    apiKeyLength: apiKey.length,
    envVar: 'RAINFOREST_API_KEY',
    authMethod: RAINFOREST_AUTH_METHOD,
    endpointFormat: `${RAINFOREST_ENDPOINT}?api_key=KEY&type=search&amazon_domain=${AMAZON_DOMAIN}&search_term=KEYWORD`,
  };
}

export async function searchRainforestProducts(keyword: string) {
  const apiKey = process.env.RAINFOREST_API_KEY?.trim();

  logRainforestConfig();

  if (!apiKey) {
    throw new RainforestApiError(
      'missing_key',
      'API key missing: RAINFOREST_API_KEY is not configured. Add it to server environment variables before running Rainforest searches.'
    );
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

  logRainforestRequest(keyword, params);

  const response = await fetch(`${RAINFOREST_ENDPOINT}?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(15000),
  });

  const responseText = await response.text();
  const payload = parseRainforestPayload(responseText);

  if (!response.ok) {
    const rawMessage = extractRainforestErrorMessage(payload, responseText, apiKey);
    const classified = classifyRainforestError(response.status, rawMessage);
    console.warn('[Rainforest API] Search request failed', {
      status: response.status,
      statusText: response.statusText,
      apiKeyPresent: true,
      apiKeyLength: apiKey.length,
      authMethod: RAINFOREST_AUTH_METHOD,
      errorKind: classified.kind,
      responseMessage: rawMessage,
    });
    throw new RainforestApiError(classified.kind, classified.message, { status: response.status, rawMessage });
  }

  console.info('[Rainforest API] Search request completed', {
    status: response.status,
    resultCount: payload.search_results?.length ?? 0,
  });

  if (payload.request_info?.success === false || payload.error) {
    const rawMessage = extractRainforestErrorMessage(payload, responseText, apiKey);
    const classified = classifyRainforestError(response.status, rawMessage);
    console.warn('[Rainforest API] Search response was unsuccessful', {
      apiKeyPresent: true,
      apiKeyLength: apiKey.length,
      authMethod: RAINFOREST_AUTH_METHOD,
      errorKind: classified.kind,
      responseMessage: rawMessage,
    });
    throw new RainforestApiError(classified.kind, classified.message, { status: response.status, rawMessage });
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

export function keywordFallbackLead(keyword: string, errorMessage: string): ProductLeadInput {
  return {
    title: keyword,
    source: 'Keyword-only Scout fallback',
    trendKeyword: keyword,
    reasonItMightSell: `Rainforest lookup failed, so Scout saved this keyword-only lead for manual research. Error: ${errorMessage}`,
  };
}

export function safeRainforestError(error: unknown) {
  if (error instanceof RainforestApiError) {
    return {
      kind: error.kind,
      status: error.status,
      message: error.message,
      rawMessage: error.rawMessage,
    };
  }

  const message = error instanceof Error ? error.message : 'Unknown Rainforest API error';
  return {
    kind: 'unknown_error' as const,
    message,
    rawMessage: message,
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

function logRainforestConfig() {
  console.info('[Rainforest API] Configuration check', rainforestDebugConfig());
}

function logRainforestRequest(keyword: string, params: URLSearchParams) {
  const safeParams = new URLSearchParams(params);
  safeParams.set('api_key', '[REDACTED]');

  console.info('[Rainforest API] Starting product search', {
    endpoint: RAINFOREST_ENDPOINT,
    authMethod: RAINFOREST_AUTH_METHOD,
    searchTerm: keyword,
    queryParams: safeParams.toString(),
  });
}

function parseRainforestPayload(responseText: string): RainforestPayload {
  if (!responseText) return {};

  try {
    return JSON.parse(responseText);
  } catch {
    return {};
  }
}

function extractRainforestErrorMessage(payload: RainforestPayload, responseText: string, apiKey: string) {
  const message = payload.error || payload.message || payload.request_info?.message || responseText.slice(0, 300) || 'Rainforest API returned an empty error response';
  return redactApiKey(message, apiKey);
}

function classifyRainforestError(status: number | undefined, rawMessage: string): { kind: RainforestErrorKind; message: string } {
  const lower = rawMessage.toLowerCase();

  if (lower.includes('api key') && (lower.includes('missing') || lower.includes('required') || lower.includes('not supplied'))) {
    return { kind: 'missing_key', message: `API key missing: ${rawMessage}` };
  }

  if (status === 401 || lower.includes('invalid api key') || lower.includes('unauthorized') || lower.includes('authentication')) {
    return { kind: 'invalid_key', message: `Invalid key: Rainforest rejected RAINFOREST_API_KEY. Raw error: ${rawMessage}` };
  }

  if (status === 400 || lower.includes('parameter') || lower.includes('invalid request') || lower.includes('request format') || lower.includes('type')) {
    return { kind: 'wrong_request_format', message: `Wrong request format: verify api_key, type=search, amazon_domain, and search_term query parameters. Raw error: ${rawMessage}` };
  }

  if (status === 402 || status === 429 || lower.includes('credit') || lower.includes('quota') || lower.includes('limit') || lower.includes('exhaust')) {
    return { kind: 'exhausted_credits', message: `Exhausted credits or rate limit: ${rawMessage}` };
  }

  return { kind: 'unknown_error', message: `Unknown error: Rainforest API search failed${status ? ` with status ${status}` : ''}. Raw error: ${rawMessage}` };
}

function redactApiKey(value: string, apiKey: string) {
  return apiKey ? value.replaceAll(apiKey, '[REDACTED]') : value;
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
