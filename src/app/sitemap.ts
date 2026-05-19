import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { siteUrl } from '@/lib/site-url';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteUrl();
  const generatedAt = new Date();
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: generatedAt },
    { url: `${baseUrl}/blog`, lastModified: generatedAt },
    { url: `${baseUrl}/categories`, lastModified: generatedAt },
    { url: `${baseUrl}/top-picks`, lastModified: generatedAt },
  ];

  if (!process.env.DATABASE_URL) {
    console.warn('[sitemap] DATABASE_URL is not set; returning static sitemap entries only.');
    return staticPages;
  }

  try {
    const posts = await prisma.blogPost.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    });

    const blogPages: MetadataRoute.Sitemap = posts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.updatedAt,
    }));

    return [...staticPages, ...blogPages];
  } catch (error) {
    console.error('[sitemap] Failed to load published blog posts. Falling back to static URLs.', error);
    return staticPages;
  }
}
