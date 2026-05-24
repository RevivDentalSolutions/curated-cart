import { z } from 'zod';

const productLeadInputSchema = z.object({
  title: z.string().trim().min(2),
  source: z.string().trim().min(2).default('Manual import'),
  sourceUrl: z.string().trim().url().optional().or(z.literal('')),
  imageUrl: z.string().trim().url().optional().or(z.literal('')),
  trendKeyword: z.string().trim().optional().or(z.literal('')),
  suggestedCategory: z.string().trim().optional().or(z.literal('')),
  estimatedPrice: z.coerce.number().positive().optional().or(z.literal('')),
  rating: z.coerce.number().min(0).max(5).optional().or(z.literal('')),
  reviewCount: z.coerce.number().int().nonnegative().optional().or(z.literal('')),
  asin: z.string().trim().optional().or(z.literal('')),
  affiliatePlaceholderUrl: z.string().trim().url().optional().or(z.literal('')),
  reasonItMightSell: z.string().trim().optional().or(z.literal('')),
});

export const scoutRequestSchema = z.object({
  sourceType: z.enum(['manual', 'rss', 'automation', 'amazon', 'tiktok', 'pinterest', 'url']).default('manual'),
  rssFeedUrl: z.string().trim().url().optional(),
  createProductDrafts: z.boolean().optional().default(false),
  leads: z.array(productLeadInputSchema).min(1).max(50).optional(),
}).superRefine((value, context) => {
  if (!value.leads?.length) {
    context.addIssue({
      code: 'custom',
      message: 'At least one lead is required. RSS ingestion should pass parsed feed items as leads.',
      path: ['leads'],
    });
  }
});

export type ProductLeadInput = z.infer<typeof productLeadInputSchema>;

const brandFitTerms = [
  'pretty',
  'practical',
  'home',
  'decor',
  'beauty',
  'skincare',
  'fashion',
  'mom',
  'organizer',
  'gift',
  'neutral',
  'minimal',
  'cozy',
  'kitchen',
];

const visualTerms = ['aesthetic', 'pretty', 'minimal', 'neutral', 'stylish', 'decor', 'ceramic', 'gold', 'glass', 'linen', 'bow', 'vanity', 'pastel', 'ribbed', 'woven'];
const problemSolvingTerms = ['organizer', 'storage', 'cleaner', 'portable', 'compact', 'hack', 'tool', 'kit', 'solution', 'easy'];
const trendTerms = ['viral', 'trending', 'tiktok', 'pinterest', 'amazon', 'dupe', 'bestseller', 'popular', 'obsessed'];
const giftTerms = ['gift', 'stocking', 'birthday', 'hostess', 'mom', 'teacher', 'set', 'bundle'];

function containsAny(haystack: string, needles: string[]) {
  return needles.some((needle) => haystack.includes(needle));
}

function categoryFallback(input: ProductLeadInput) {
  const text = `${input.title} ${input.trendKeyword ?? ''} ${input.reasonItMightSell ?? ''}`.toLowerCase();

  if (containsAny(text, ['beauty', 'skincare', 'makeup', 'lip', 'hair'])) return 'Beauty Tools';
  if (containsAny(text, ['fashion', 'bag', 'pajama', 'jewelry', 'shoe'])) return 'Fashion Finds';
  if (containsAny(text, ['mom', 'baby', 'kid', 'school'])) return 'Mom Life Favorites';
  if (containsAny(text, ['decor', 'home', 'kitchen', 'bed', 'organizer'])) return 'Home Decor';
  if (input.estimatedPrice && Number(input.estimatedPrice) <= 25) return 'Under $25 Finds';

  return input.suggestedCategory || 'Worth the Splurge';
}

function coerceOptionalNumber(value: ProductLeadInput['estimatedPrice'] | ProductLeadInput['rating'] | ProductLeadInput['reviewCount']) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

export function scoreProductLead(input: ProductLeadInput) {
  const estimatedPrice = coerceOptionalNumber(input.estimatedPrice);
  const rating = coerceOptionalNumber(input.rating);
  const reviewCount = coerceOptionalNumber(input.reviewCount);
  const text = `${input.title} ${input.source} ${input.trendKeyword ?? ''} ${input.suggestedCategory ?? ''} ${input.reasonItMightSell ?? ''}`.toLowerCase();

  const trendStrength = Math.min(15, 6 + (containsAny(text, trendTerms) ? 6 : 0) + (input.trendKeyword ? 3 : 0));
  const visualAppeal = Math.min(20, 7 + (containsAny(text, visualTerms) ? 9 : 0) + (containsAny(text, ['set', 'kit']) ? 2 : 0) + (input.imageUrl ? 2 : 0));
  const giftability = Math.min(15, 5 + (containsAny(text, giftTerms) ? 7 : 0) + (estimatedPrice && estimatedPrice <= 50 ? 3 : 0));
  const priceFit = Math.min(15, estimatedPrice ? (estimatedPrice <= 25 ? 15 : estimatedPrice <= 50 ? 13 : estimatedPrice <= 75 ? 10 : 3) : 7);
  const usefulness = Math.min(15, 6 + (containsAny(text, problemSolvingTerms) ? 8 : 0) + (containsAny(text, ['daily', 'routine']) ? 1 : 0));
  const brandFit = Math.min(10, 4 + (containsAny(text, brandFitTerms) ? 5 : 0) + (estimatedPrice && estimatedPrice <= 75 ? 1 : 0));
  const ratingScore = Math.min(15, rating ? (rating >= 4.7 ? 15 : rating >= 4.5 ? 13 : rating >= 4.2 ? 10 : rating >= 4 ? 7 : 3) : 5);
  const reviewScore = Math.min(10, reviewCount ? (reviewCount >= 10000 ? 10 : reviewCount >= 3000 ? 8 : reviewCount >= 1000 ? 6 : reviewCount >= 250 ? 4 : 2) : 3);

  const viralityScore = Math.round(trendStrength + visualAppeal + giftability + priceFit + usefulness + brandFit + ratingScore + reviewScore);

  return {
    viralityScore: Math.max(0, Math.min(100, viralityScore)),
    suggestedCategory: categoryFallback(input),
    reasonItMightSell: input.reasonItMightSell || [
      `Trend strength: ${trendStrength}/15`,
      `Visual appeal: ${visualAppeal}/20`,
      `Giftability: ${giftability}/15`,
      `Price fit: ${priceFit}/15`,
      `Usefulness: ${usefulness}/15`,
      `Brand fit: ${brandFit}/10`,
      `Rating: ${ratingScore}/15`,
      `Review volume: ${reviewScore}/10`,
    ].join('; '),
  };
}

export function normalizeLead(input: ProductLeadInput) {
  const score = scoreProductLead(input);

  return {
    title: input.title,
    source: input.source,
    sourceUrl: input.sourceUrl || undefined,
    imageUrl: input.imageUrl || undefined,
    trendKeyword: input.trendKeyword || undefined,
    suggestedCategory: score.suggestedCategory,
    estimatedPrice: coerceOptionalNumber(input.estimatedPrice),
    rating: coerceOptionalNumber(input.rating),
    reviewCount: coerceOptionalNumber(input.reviewCount),
    asin: input.asin || undefined,
    affiliatePlaceholderUrl: input.affiliatePlaceholderUrl || undefined,
    reasonItMightSell: score.reasonItMightSell,
    viralityScore: score.viralityScore,
  };
}
