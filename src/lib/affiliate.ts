const AMAZON_HOST_PATTERN = /(^|\.)amazon\.|(^|\.)amzn\.to$/i;

export const AMAZON_ASSOCIATES_DISCLOSURE = 'As an Amazon Associate I earn from qualifying purchases.';

export function amazonAssociatesTag() {
  return process.env.NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG || process.env.AMAZON_ASSOCIATES_TAG || '';
}

export function isAmazonUrl(url: string | null | undefined) {
  if (!url) return false;
  try {
    return AMAZON_HOST_PATTERN.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

export function withAmazonAssociatesTag(url: string | null | undefined) {
  if (!url) return '#';

  try {
    const parsed = new URL(url);
    const tag = amazonAssociatesTag();

    if (tag && isAmazonUrl(url)) {
      parsed.searchParams.set('tag', tag);
    }

    return parsed.toString();
  } catch {
    return url;
  }
}
