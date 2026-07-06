import { MetadataRoute } from 'next';

const baseUrl = 'https://www.shopthecuratedcart.com';

const staticRoutes: MetadataRoute.Sitemap = ['', '/blog', '/top-picks', '/categories', '/affiliate-disclosure', '/privacy-policy', '/contact'].map((route) => ({
  url: `${baseUrl}${route}`,
  lastModified: new Date(),
  changeFrequency: 'daily',
  priority: 1.0,
}));

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!process.env.DATABASE_URL) {
    return staticRoutes;
  }

  try {
    const { prisma } = await import('@/lib/prisma');

    const [posts, categories] = await Promise.all([
      prisma.blogPost.findMany({
        where: { isPublished: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.category.findMany({
        select: { id: true },
      }),
    ]);

    const postUrls = posts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    const categoryUrls = categories.map((cat) => ({
      url: `${baseUrl}/categories/${cat.id}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }));

    return [...staticRoutes, ...postUrls, ...categoryUrls];
  } catch {
    return staticRoutes;
  }
}
