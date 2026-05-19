const PROD_FALLBACK = 'https://www.shopthecuratedcart.com';

function extractUrlCandidate(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const markdownLinkMatch = trimmed.match(/\((https?:\/\/[^\s)]+)\)/i);
  if (markdownLinkMatch?.[1]) {
    return markdownLinkMatch[1];
  }

  return trimmed;
}

function normalizeUrl(value?: string | null) {
  const candidate = extractUrlCandidate(value);
  if (!candidate) return null;

  const withProtocol = /^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`;

  try {
    const parsed = new URL(withProtocol);
    return parsed.origin;
  } catch {
    return null;
  }
}

export function siteUrl() {
  return (
    normalizeUrl(process.env.NEXT_PUBLIC_SITE_URL) ||
    normalizeUrl(process.env.SITE_URL) ||
    normalizeUrl(process.env.VERCEL_URL) ||
    normalizeUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL) ||
    PROD_FALLBACK
  );
}
