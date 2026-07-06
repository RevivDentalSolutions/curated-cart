export const fallbackCategories = [
  {
    id: 'fallback-home',
    name: 'Home',
    products: [{ id: 'fallback-vase' }, { id: 'fallback-basket' }],
  },
  {
    id: 'fallback-beauty',
    name: 'Beauty',
    products: [{ id: 'fallback-roller' }, { id: 'fallback-brushes' }],
  },
  {
    id: 'fallback-fashion',
    name: 'Fashion',
    products: [{ id: 'fallback-pajamas' }],
  },
  {
    id: 'fallback-kitchen',
    name: 'Kitchen',
    products: [{ id: 'fallback-mugs' }],
  },
];

export const fallbackFeaturedFinds = [
  {
    id: 'fallback-vase',
    name: 'Minimalist Ceramic Vase Set',
    description: 'Original editor note: a neutral accent for shelves, consoles, and bedside styling.',
    imageUrl: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&q=80&w=900',
    affiliateLink: 'https://www.amazon.com/',
    amazonLink: 'https://www.amazon.com/',
    category: { name: 'Home' },
  },
  {
    id: 'fallback-roller',
    name: 'Facial Ice Roller',
    description: 'Original editor note: a simple morning routine tool for a calmer vanity setup.',
    imageUrl: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&q=80&w=900',
    affiliateLink: 'https://www.amazon.com/',
    amazonLink: 'https://www.amazon.com/',
    category: { name: 'Beauty' },
  },
  {
    id: 'fallback-mugs',
    name: 'Gold Rim Glass Coffee Mugs',
    description: 'Original editor note: a small coffee-bar upgrade that still feels giftable.',
    imageUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&q=80&w=900',
    affiliateLink: 'https://www.amazon.com/',
    amazonLink: 'https://www.amazon.com/',
    category: { name: 'Kitchen' },
  },
];

export const fallbackLatestPosts: Array<{
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  metaDescription: string;
  featuredImage: string;
  category: { name: string };
}> = [];
