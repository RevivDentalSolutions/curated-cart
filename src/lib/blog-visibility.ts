/**
 * These posts were already part of the public Curated Cart experience: they
 * remain in the live sitemap, but a prior publishing-state change made the
 * public pages treat them as drafts. Keep the recovery list deliberately
 * narrow so newly created drafts stay private.
 */
export const recoveredPublicBlogSlugs = [
  'luxury-beach-day-must-haves',
  'everyday-beauty-essentials',
  'neutral-travel-edit-amazon-finds',
  'hair-rescue-edit-luxury-finds',
  'neutral-luxury-kitchen-finds-2',
] as const;

export const publicBlogPostWhere = {
  OR: [
    { isPublished: true },
    { slug: { in: [...recoveredPublicBlogSlugs] } },
  ],
};

export function isPublicBlogPost(post: { isPublished: boolean; slug: string }) {
  return post.isPublished || recoveredPublicBlogSlugs.includes(post.slug as (typeof recoveredPublicBlogSlugs)[number]);
}
