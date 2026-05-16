import type { Prisma } from '@prisma/client';

export type EditorSectionType =
  | 'hero'
  | 'text'
  | 'productSpotlight'
  | 'quote'
  | 'collage'
  | 'productGrid'
  | 'pinterestCallout'
  | 'verdict';

export type BlogEditorSection = {
  id: string;
  type: EditorSectionType;
  label: string;
  eyebrow?: string;
  heading?: string;
  body?: string;
  quote?: string;
  imageUrls?: string[];
  productIds?: string[];
  layout?: string;
  ctaText?: string;
  note?: string;
};

export type BlogImageAsset = {
  id: string;
  url: string;
  alt?: string;
  role?: 'featured' | 'collage' | 'inline';
  objectPosition?: string;
};

export const DEFAULT_AFFILIATE_DISCLOSURE =
  'This post may contain affiliate links. As an Amazon Associate, I earn from qualifying purchases at no extra cost to you.';

export function makeSectionId(prefix = 'section') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function cleanEditorHtml(value?: string | null) {
  if (!value) return '';

  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/\son\w+=("[^"]*"|'[^']*'|[^\s>]*)/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
}

export function plainTextFromHtml(value?: string | null) {
  return cleanEditorHtml(value)
    .replace(/<br\s*\/?>(\n)?/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function normalizeEditorSections(value: Prisma.JsonValue | BlogEditorSection[] | null | undefined): BlogEditorSection[] {
  if (!Array.isArray(value)) return [];

  const sections: BlogEditorSection[] = [];
  value.forEach((section, index) => {
      if (!section || typeof section !== 'object' || Array.isArray(section)) return null;
      const record = section as Record<string, unknown>;
      const type = typeof record.type === 'string' ? record.type : 'text';
      const allowedTypes: EditorSectionType[] = ['hero', 'text', 'productSpotlight', 'quote', 'collage', 'productGrid', 'pinterestCallout', 'verdict'];

      sections.push({
        id: typeof record.id === 'string' ? record.id : `section-${index}`,
        type: allowedTypes.includes(type as EditorSectionType) ? (type as EditorSectionType) : 'text',
        label: typeof record.label === 'string' ? record.label : 'Editorial Section',
        eyebrow: typeof record.eyebrow === 'string' ? record.eyebrow : '',
        heading: typeof record.heading === 'string' ? record.heading : '',
        body: typeof record.body === 'string' ? cleanEditorHtml(record.body) : '',
        quote: typeof record.quote === 'string' ? record.quote : '',
        imageUrls: Array.isArray(record.imageUrls) ? record.imageUrls.filter((url): url is string => typeof url === 'string') : [],
        productIds: Array.isArray(record.productIds) ? record.productIds.filter((id): id is string => typeof id === 'string') : [],
        layout: typeof record.layout === 'string' ? record.layout : 'editorial',
        ctaText: typeof record.ctaText === 'string' ? record.ctaText : '',
        note: typeof record.note === 'string' ? record.note : '',
      });
    });

  return sections;
}

export function normalizeImageLibrary(value: Prisma.JsonValue | BlogImageAsset[] | null | undefined): BlogImageAsset[] {
  if (!Array.isArray(value)) return [];

  const assets: BlogImageAsset[] = [];
  value.forEach((asset, index) => {
      if (!asset || typeof asset !== 'object' || Array.isArray(asset)) return null;
      const record = asset as Record<string, unknown>;
      const url = typeof record.url === 'string' ? record.url : '';
      if (!url) return null;

      assets.push({
        id: typeof record.id === 'string' ? record.id : `image-${index}`,
        url,
        alt: typeof record.alt === 'string' ? record.alt : '',
        role: record.role === 'featured' || record.role === 'collage' || record.role === 'inline' ? record.role : 'inline',
        objectPosition: typeof record.objectPosition === 'string' ? record.objectPosition : 'center',
      });
    });

  return assets;
}

export function createDefaultEditorSections(input: {
  intro?: string | null;
  productSections?: string | null;
  conclusion?: string | null;
  products: Array<{ id: string; name: string; imageUrl?: string | null; viralTrendNotes?: string | null }>;
  featuredImage?: string | null;
}): BlogEditorSection[] {
  const sections: BlogEditorSection[] = [];
  const productBlurbs = (input.productSections || '')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (input.intro || input.featuredImage) {
    sections.push({
      id: makeSectionId('hero'),
      type: 'hero',
      label: 'Hero section',
      eyebrow: 'The Edit',
      heading: 'A curated beauty moment',
      body: input.intro ? `<p>${input.intro}</p>` : '',
      imageUrls: input.featuredImage ? [input.featuredImage] : input.products.map((product) => product.imageUrl).filter((url): url is string => Boolean(url)).slice(0, 1),
      productIds: input.products.slice(0, 1).map((product) => product.id),
      layout: 'full-width',
    });
  }

  const firstProduct = input.products[0];
  if (firstProduct) {
    sections.push({
      id: makeSectionId('spotlight'),
      type: 'productSpotlight',
      label: 'Favorite Pick',
      eyebrow: 'Favorite Pick',
      heading: firstProduct.name,
      body: `<p>${productBlurbs[0] || firstProduct.viralTrendNotes || 'A refined everyday find with a polished, beauty-editor feel.'}</p>`,
      imageUrls: firstProduct.imageUrl ? [firstProduct.imageUrl] : [],
      productIds: [firstProduct.id],
      layout: 'image-left',
    });
  }

  if (input.products.length > 1) {
    sections.push({
      id: makeSectionId('quote'),
      type: 'quote',
      label: 'Quote block',
      quote: 'This is the kind of edit that makes getting ready feel more intentional.',
      layout: 'blush-card',
    });
  }

  const pairedProducts = input.products.slice(1, 3);
  if (pairedProducts.length > 0) {
    sections.push({
      id: makeSectionId('grid'),
      type: 'productGrid',
      label: 'Side-by-side products',
      eyebrow: 'The Pairing',
      heading: 'Pretty, practical, paired.',
      body: '<p>A concise edit of complementary finds that bring polish to the routine without feeling overdone.</p>',
      imageUrls: pairedProducts.map((product) => product.imageUrl).filter((url): url is string => Boolean(url)),
      productIds: pairedProducts.map((product) => product.id),
      layout: 'two-column',
    });
  }

  const collageProducts = input.products.slice(3, 6);
  if (collageProducts.length > 0) {
    sections.push({
      id: makeSectionId('collage'),
      type: 'collage',
      label: 'The Vanity Tray',
      eyebrow: 'The Vanity Tray',
      heading: 'A soft-focus mix of little luxuries.',
      body: '<p>Layer these pieces into the routine when you want the everyday details to feel calmer, prettier, and more considered.</p>',
      imageUrls: collageProducts.map((product) => product.imageUrl).filter((url): url is string => Boolean(url)),
      productIds: collageProducts.map((product) => product.id),
      layout: 'floating-collage',
    });
  }

  if (input.conclusion) {
    sections.push({
      id: makeSectionId('verdict'),
      type: 'verdict',
      label: 'Worth It?',
      eyebrow: 'Worth It?',
      heading: 'The quiet-luxury verdict',
      body: `<p>${input.conclusion}</p>`,
      layout: 'centered-card',
    });
  }

  return sections;
}

export function sectionsToPlainContent(sections: BlogEditorSection[]) {
  return sections
    .map((section) => [section.heading, section.quote, plainTextFromHtml(section.body)].filter(Boolean).join('\n'))
    .filter(Boolean)
    .join('\n\n');
}
