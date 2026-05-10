import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

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

export async function generateContentBundle(product: any) {
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
