import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/dashboard/', '/admin-recovery/', '/tracker/'],
    },
    sitemap: 'https://www.shopthecuratedcart.com/sitemap.xml',
  };
}
