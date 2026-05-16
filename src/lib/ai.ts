import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

type ProductContentInput = {
  name: string;
  category?: { name?: string | null } | null;
  viralTrendNotes?: string | null;
  contentIdea?: string | null;
};

type CollectionDraftProductInput = {
  name: string;
  category?: { name?: string | null } | null;
  viralTrendNotes?: string | null;
  contentIdea?: string | null;
  source?: string | null;
};

type CollectionBlogDraftInput = {
  title: string;
  categoryName: string;
  products: CollectionDraftProductInput[];
  aestheticVibe?: string;
};

const ContentBundleSchema = z.object({
  blogPostTitle: z.string(),
  blogPostOutline: z.string(),
  shortDescription: z.string(),
  pinTitle: z.string(),
  pinDescription: z.string(),
  tiktokHook: z.string(),
  tiktokScript: z.string(),
  facebookCaption: z.string(),
  emailBlurb: z.string(),
  suggestedHashtags: z.string(),
});

const CollectionBlogDraftSchema = z.object({
  title: z.string(),
  intro: z.string(),
  productSections: z.array(z.object({
    heading: z.string(),
    body: z.string(),
  })),
  conclusion: z.string(),
  seoTitle: z.string(),
  metaDescription: z.string(),
  pinterestDescription: z.string(),
  suggestedSlug: z.string(),
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'blog-post';
}

function formatProductSections(sections: Array<{ heading: string; body: string }>) {
  return sections
    .map((section) => `${section.heading}\n${section.body}`)
    .join('\n\n');
}

export async function generateContentBundle(product: ProductContentInput) {
  if (!process.env.OPENAI_API_KEY) {
    // Return mock data if no API key is present
    return {
      blogPostTitle: `Why the ${product.name} is a Game Changer`,
      blogPostOutline: `1. Introduction to ${product.name}\n2. Key Features\n3. My Experience\n4. Pros & Cons\n5. Final Verdict`,
      shortDescription: `A must-have ${product.category?.name || 'lifestyle'} find that simplifies your routine.`,
      pinTitle: `The viral ${product.name} you NEED!`,
      pinDescription: `Obsessed with this ${product.name}. Perfect for anyone looking to upgrade their ${product.category?.name || 'life'}. #amazonfinds`,
      tiktokHook: `Stop scrolling if you want to see the best ${product.category?.name || 'Amazon'} find of the week!`,
      tiktokScript: `You guys, I found the holy grail. This is the ${product.name} and it's literally changed my life. [Show product] Here's why you need it...`,
      facebookCaption: `Just added the ${product.name} to my curated cart and I'm obsessed! 🛒✨`,
      emailBlurb: `I've been testing the ${product.name} all week and I finally have the verdict. It's a 10/10!`,
      suggestedHashtags: `#amazonfavorites #lifestyle #curatedcart`,
    };
  }

  try {
    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: ContentBundleSchema,
      prompt: `Generate a content bundle for the following product:
        Name: ${product.name}
        Category: ${product.category?.name}
        Trend Notes: ${product.viralTrendNotes || 'N/A'}
        Content Idea: ${product.contentIdea || 'N/A'}
        
        The brand is "The Curated Cart" with a soft neutral luxury aesthetic. 
        The tone should be feminine, helpful, stylish, and fun.
        Tagline: Pretty finds. Practical buys.`,
    });

    return object;
  } catch (error) {
    console.error('Error generating AI content:', error);
    throw new Error('Failed to generate AI content');
  }
}

export async function generateCollectionBlogDraft(input: CollectionBlogDraftInput) {
  const productContext = input.products.map((product, index) => ({
    number: index + 1,
    name: product.name,
    category: product.category?.name || input.categoryName,
    notes: product.viralTrendNotes || product.contentIdea || product.source || 'No extra notes provided.',
  }));

  if (!process.env.OPENAI_API_KEY) {
    const productSections = productContext.map((product) => ({
      heading: `${product.number}. ${product.name}`,
      body: `${product.name} is the kind of pretty-but-practical find that makes an everyday routine feel a little more elevated. It fits the ${input.categoryName.toLowerCase()} mood without feeling fussy, and it is easy to imagine styling, gifting, or reaching for again and again.`,
    }));

    return {
      title: input.title,
      intro: `If your saved folders are full of pretty finds that make everyday life feel more elevated, this ${input.categoryName.toLowerCase()} edit is for you. I pulled together a few favorites with a soft luxury feel, practical uses, and that Pinterest-friendly polish The Curated Cart is all about.`,
      productSections: formatProductSections(productSections),
      conclusion: `These finds are simple ways to bring a little more beauty and ease into your day. Choose the pieces that fit your routine, check current pricing and availability, and save this roundup for the next time you want an elevated everyday upgrade.`,
      seoTitle: `${input.title} | The Curated Cart`,
      metaDescription: `Shop ${input.title.toLowerCase()} with pretty, practical finds selected for an elevated everyday routine.`,
      pinterestDescription: `${input.title}: pretty, practical favorites with a soft luxury feel. Save this roundup for elevated everyday Amazon finds and Pinterest-worthy inspiration.`,
      suggestedSlug: slugify(input.title),
    };
  }

  try {
    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: CollectionBlogDraftSchema,
      prompt: `Create a concise, high-quality affiliate roundup blog draft for The Curated Cart.

Brand voice:
- feminine, aesthetic, soft luxury, practical but elevated
- conversational and Pinterest-friendly
- never robotic, never keyword stuffed
- never include developer-facing layout notes, placeholders, or phrases like "this section is designed"
- the feeling is: "pretty finds that make everyday life feel more elevated"

Inputs:
Collection title: ${input.title}
Category: ${input.categoryName}
Overall aesthetic vibe: ${input.aestheticVibe || 'soft neutral luxury, pretty practical everyday finds'}
Selected products: ${JSON.stringify(productContext, null, 2)}

Return:
- title: keep or lightly improve the collection title
- intro: one polished paragraph
- productSections: one entry per selected product in the same order, each with a short heading and 1-2 short paragraphs of natural lifestyle-oriented affiliate copy
- conclusion: one polished paragraph
- seoTitle: click-worthy but natural, under 60 characters when possible
- metaDescription: natural search snippet, under 155 characters when possible
- pinterestDescription: save-worthy Pinterest description with no hashtag stuffing
- suggestedSlug: lowercase URL slug like clean-girl-perfume-picks or neutral-kitchen-finds

Write polished editorial copy only. Do not mention templates, sections, layouts, modules, or implementation notes. Write for Pinterest clicks, SEO readability, Amazon affiliate conversion, and a calm elevated shopping experience.`,
    });

    return {
      ...object,
      productSections: formatProductSections(object.productSections),
      suggestedSlug: slugify(object.suggestedSlug || object.title || input.title),
    };
  } catch (error) {
    console.error('Error generating collection blog draft:', error);
    throw new Error('Failed to generate collection blog draft');
  }
}
