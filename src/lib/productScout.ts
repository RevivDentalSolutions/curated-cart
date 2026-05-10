import { z } from 'zod';

const productLeadInputSchema = z.object({
  title: z.string().trim().min(2),
  source: z.string().trim().min(2).default('Manual import'),
  sourceUrl: z.string().trim().url().optional().or(z.literal('')),
  imageUrl: z.string().trim().url().optional().or(z.literal('')),
  trendKeyword: z.string().trim().optional().or(z.literal('')),
  suggestedCategory: z.string().trim().optional().or(z.literal('')),
  estimatedPrice: z.coerce.number().positive().optional().or(z.literal('')),
  reasonItMightSell: z.string().trim().optional().or(z.literal('')),
});

export const scoutRequestSchema = z.object({
  sourceType: z.enum(['manual', 'rss', 'automation', 'amazon', 'tiktok', 'pinterest', 'url']).default('manual'),
  rssFeedUrl: z.string().trim().url().optional(),
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

const visualTerms = ['aesthetic', 'pretty', 'minimal', 'neutral', 'stylish', 'decor', 'ceramic', 'gold', 'glass', 'linen'];
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

export function scoreProductLead(input: ProductLeadInput) {
  const estimatedPrice = typeof input.estimatedPrice === 'number' ? input.estimatedPrice : undefined;
  const text = `${input.title} ${input.source} ${input.trendKeyword ?? ''} ${input.suggestedCategory ?? ''} ${input.reasonItMightSell ?? ''}`.toLowerCase();

  const trendStrength = Math.min(20, 8 + (containsAny(text, trendTerms) ? 8 : 0) + (input.trendKeyword ? 4 : 0));
  const visualAppeal = Math.min(20, 8 + (containsAny(text, visualTerms) ? 9 : 0) + (containsAny(text, ['set', 'kit']) ? 3 : 0));
  const giftability = Math.min(20, 7 + (containsAny(text, giftTerms) ? 10 : 0) + (estimatedPrice && estimatedPrice <= 50 ? 3 : 0));
  const impulsePotential = Math.min(20, estimatedPrice ? (estimatedPrice <= 25 ? 20 : estimatedPrice <= 50 ? 16 : estimatedPrice <= 75 ? 8 : 3) : 10);
  const usefulness = Math.min(20, 8 + (containsAny(text, problemSolvingTerms) ? 10 : 0) + (containsAny(text, ['daily', 'routine']) ? 2 : 0));
  const brandFit = Math.min(20, 8 + (containsAny(text, brandFitTerms) ? 10 : 0) + (estimatedPrice && estimatedPrice <= 75 ? 2 : 0));

  const viralityScore = Math.round((trendStrength + visualAppeal + giftability + impulsePotential + usefulness + brandFit) / 1.2);

  return {
    viralityScore: Math.max(0, Math.min(100, viralityScore)),
    suggestedCategory: categoryFallback(input),
    reasonItMightSell: input.reasonItMightSell || [
      `Trend strength: ${trendStrength}/20`,
      `Visual appeal: ${visualAppeal}/20`,
      `Giftability: ${giftability}/20`,
      `Impulse-buy fit: ${impulsePotential}/20`,
      `Problem-solving usefulness: ${usefulness}/20`,
      `Curated Cart brand fit: ${brandFit}/20`,
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
    estimatedPrice: typeof input.estimatedPrice === 'number' ? input.estimatedPrice : undefined,
    reasonItMightSell: score.reasonItMightSell,
    viralityScore: score.viralityScore,
  };
}
