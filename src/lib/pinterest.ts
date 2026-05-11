import { prisma } from '@/lib/prisma';

const PINTEREST_API_BASE = 'https://api.pinterest.com/v5';
const DEFAULT_BOARD_NAME = 'The Curated Cart Finds';

type PinSource =
  | { productId: string; blogPostId?: never; leadId?: never }
  | { blogPostId: string; productId?: never; leadId?: never }
  | { leadId: string; productId?: never; blogPostId?: never };

type DraftSeed = {
  productId?: string;
  blogPostId?: string;
  name: string;
  categoryName?: string;
  description?: string | null;
  destinationUrl?: string | null;
  imageUrl?: string | null;
  trendNotes?: string | null;
  boardName?: string;
};

function trimTo(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1).trim()}…` : value;
}

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || 'https://thecuratedcart.com').replace(/\/$/, '');
}

function boardSuggestion(categoryName?: string | null) {
  if (!categoryName) return DEFAULT_BOARD_NAME;
  return `${categoryName} Finds`;
}

function destinationForProduct(product: Awaited<ReturnType<typeof prisma.product.findUnique>>) {
  if (!product) return siteUrl();
  return product.affiliateLink || product.amazonLink || product.affiliatePlaceholderUrl || `${siteUrl()}/categories/${product.categoryId}`;
}

function pinDraftsFromSeed(seed: DraftSeed) {
  const category = seed.categoryName || 'lifestyle';
  const cleanName = seed.name.replace(/\s+/g, ' ').trim();
  const description = seed.description || seed.trendNotes || `A pretty, practical ${category} find curated by The Curated Cart.`;
  const destinationUrl = seed.destinationUrl || siteUrl();
  const boardName = seed.boardName || boardSuggestion(seed.categoryName);
  const imagePromptBase = `Create a vertical 2:3 Pinterest pin for The Curated Cart featuring ${cleanName}. Use a soft neutral luxury palette, feminine editorial styling, warm daylight, tasteful product callouts, and clean Canva-friendly spacing.`;

  return [
    {
      title: trimTo(`${cleanName}: Pretty Find Worth Saving`, 100),
      description: trimTo(`${description} Save this ${category} find for your next curated cart refresh.`, 800),
      destinationUrl,
      altText: trimTo(`${cleanName} styled as a soft neutral ${category} Pinterest shopping pin.`, 500),
      boardName,
      imageUrl: seed.imageUrl || null,
      imagePrompt: `${imagePromptBase} Include a small headline: "Pretty find worth saving".`,
    },
    {
      title: trimTo(`The ${category} upgrade: ${cleanName}`, 100),
      description: trimTo(`A polished ${category} pick with practical everyday appeal. ${description}`, 800),
      destinationUrl,
      altText: trimTo(`Pinterest pin for ${cleanName} with neutral styling and The Curated Cart branding.`, 500),
      boardName,
      imageUrl: seed.imageUrl || null,
      imagePrompt: `${imagePromptBase} Design it like a mini shopping guide with one hero product image and two concise benefit bubbles.`,
    },
    {
      title: trimTo(`Save this curated ${category} find`, 100),
      description: trimTo(`Add ${cleanName} to your shortlist if you love pretty finds that are also practical buys. ${description}`, 800),
      destinationUrl,
      altText: trimTo(`${cleanName} shown in an elegant vertical Pinterest graphic for a curated ${category} board.`, 500),
      boardName,
      imageUrl: seed.imageUrl || null,
      imagePrompt: `${imagePromptBase} Leave space for a Canva text overlay and subtle The Curated Cart footer branding.`,
    },
  ];
}

export function pinterestCredentialsConfigured() {
  return Boolean(process.env.PINTEREST_ACCESS_TOKEN && process.env.PINTEREST_DEFAULT_BOARD_ID);
}

export async function createPinterestPinDrafts(source: PinSource) {
  const defaultBoardId = process.env.PINTEREST_DEFAULT_BOARD_ID || null;

  let seed: DraftSeed | null = null;

  if ('productId' in source) {
    const product = await prisma.product.findUnique({
      where: { id: source.productId },
      include: { category: true, contentBundle: true },
    });
    if (!product) throw new Error('Product not found');
    seed = {
      productId: product.id,
      name: product.name,
      categoryName: product.category.name,
      description: product.contentBundle?.pinDescription || product.viralTrendNotes || product.contentIdea,
      destinationUrl: destinationForProduct(product),
      imageUrl: product.imageUrl,
      trendNotes: product.viralTrendNotes,
    };
  }

  if ('blogPostId' in source) {
    const post = await prisma.blogPost.findUnique({
      where: { id: source.blogPostId },
      include: { category: true, products: { include: { category: true }, take: 1 } },
    });
    if (!post) throw new Error('Blog post not found');
    seed = {
      blogPostId: post.id,
      productId: post.products[0]?.id,
      name: post.title,
      categoryName: post.category.name,
      description: post.excerpt || post.metaDescription || post.content?.slice(0, 260),
      destinationUrl: `${siteUrl()}/blog/${post.slug}`,
      imageUrl: post.featuredImage || post.products[0]?.imageUrl,
      trendNotes: post.metaDescription,
    };
  }

  if ('leadId' in source) {
    const lead = await prisma.productLead.findUnique({ where: { id: source.leadId } });
    if (!lead) throw new Error('Product lead not found');
    if (lead.status !== 'Approved') throw new Error('Scout lead must be approved before creating pins');
    seed = {
      name: lead.title,
      categoryName: lead.suggestedCategory || undefined,
      description: lead.reasonItMightSell,
      destinationUrl: lead.sourceUrl || lead.affiliatePlaceholderUrl || siteUrl(),
      imageUrl: lead.imageUrl,
      trendNotes: lead.trendKeyword,
    };
  }

  if (!seed) throw new Error('Choose a product, blog post, or approved Scout lead');

  const drafts = pinDraftsFromSeed(seed).map((draft) => ({
    ...draft,
    productId: seed.productId,
    blogPostId: seed.blogPostId,
    boardId: defaultBoardId,
  }));

  return prisma.pinterestPin.createManyAndReturn({ data: drafts });
}

export async function fetchPinterestBoards() {
  const token = process.env.PINTEREST_ACCESS_TOKEN;
  if (!token) throw new Error('PINTEREST_ACCESS_TOKEN is not configured');

  const response = await fetch(`${PINTEREST_API_BASE}/boards?page_size=100`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || payload?.error?.message || 'Unable to fetch Pinterest boards');
  }

  const items = Array.isArray(payload.items) ? payload.items : [];
  return items.map((board: { id: string; name: string; pin_count?: number }) => ({
    id: board.id,
    name: board.name,
    pinCount: board.pin_count,
  }));
}

export async function publishPinterestPin(id: string, selectedBoardId?: string) {
  const token = process.env.PINTEREST_ACCESS_TOKEN;
  const envBoardId = process.env.PINTEREST_DEFAULT_BOARD_ID;

  if (!token) {
    throw new Error('Pinterest publishing needs PINTEREST_ACCESS_TOKEN. Drafts are still available for manual copy/paste.');
  }

  const pin = await prisma.pinterestPin.findUnique({ where: { id } });
  if (!pin) throw new Error('Pinterest pin draft not found');
  if (!pin.imageUrl) throw new Error('Add an image URL before publishing through the Pinterest API');

  const boardId = selectedBoardId || pin.boardId || envBoardId;
  if (!boardId) {
    throw new Error('Choose a Pinterest board ID before publishing, or set PINTEREST_DEFAULT_BOARD_ID.');
  }
  const response = await fetch(`${PINTEREST_API_BASE}/pins`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      board_id: boardId,
      media_source: {
        source_type: 'image_url',
        url: pin.imageUrl,
      },
      title: pin.title,
      description: pin.description,
      alt_text: pin.altText,
      link: pin.destinationUrl,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.message || payload?.error?.message || 'Pinterest pin publish failed';
    await prisma.pinterestPin.update({
      where: { id: pin.id },
      data: { status: 'Failed', errorMessage: message, boardId },
    });
    throw new Error(message);
  }

  return prisma.pinterestPin.update({
    where: { id: pin.id },
    data: {
      status: 'Published',
      pinterestPinId: payload.id || null,
      errorMessage: null,
      boardId,
    },
  });
}
