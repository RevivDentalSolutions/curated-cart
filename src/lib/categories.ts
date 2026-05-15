export type CategoryCollection = {
  name: string;
  slug: string;
  aliases: string[];
  image: string;
  accent: string;
};

export type CategorySource = {
  id: string;
  name: string;
  products?: { id: string }[];
  _count?: { products: number };
};

export const MAIN_CATEGORIES: CategoryCollection[] = [
  {
    name: 'Beauty',
    slug: 'beauty',
    aliases: ['Beauty', 'Skincare', 'Beauty Tools'],
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc4033c8?auto=format&fit=crop&q=80&w=1200',
    accent: 'blush',
  },
  {
    name: 'Hair',
    slug: 'hair',
    aliases: ['Hair', 'Hair Care', 'Hair Tools'],
    image: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&q=80&w=1200',
    accent: 'cream',
  },
  {
    name: 'Fashion',
    slug: 'fashion',
    aliases: ['Fashion', 'Fashion Finds', 'Style'],
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=1200',
    accent: 'nude',
  },
  {
    name: 'Home',
    slug: 'home',
    aliases: ['Home', 'Home Decor'],
    image: 'https://images.unsplash.com/photo-1602872030219-ad2b9a54315c?auto=format&fit=crop&q=80&w=1200',
    accent: 'beige',
  },
  {
    name: 'Kitchen',
    slug: 'kitchen',
    aliases: ['Kitchen', 'Kitchen Finds', 'Coffee Bar'],
    image: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&q=80&w=1200',
    accent: 'cream',
  },
  {
    name: 'Wellness',
    slug: 'wellness',
    aliases: ['Wellness', 'Self Care'],
    image: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&q=80&w=1200',
    accent: 'blush',
  },
  {
    name: 'Mom Life',
    slug: 'mom-life',
    aliases: ['Mom Life', 'Mom Life Favorites', 'Motherhood'],
    image: 'https://images.unsplash.com/photo-1542385151-efd9000785a0?auto=format&fit=crop&q=80&w=1200',
    accent: 'nude',
  },
  {
    name: 'Amazon Favorites',
    slug: 'amazon-favorites',
    aliases: ['Amazon Favorites', 'Under $25 Finds', 'Worth the Splurge'],
    image: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?auto=format&fit=crop&q=80&w=1200',
    accent: 'beige',
  },
];

const normalize = (value: string) => value.trim().toLowerCase();

export function getCategoryCollection(value: string) {
  const normalizedValue = normalize(value);

  return MAIN_CATEGORIES.find((category) => {
    return (
      category.slug === normalizedValue ||
      normalize(category.name) === normalizedValue ||
      category.aliases.some((alias) => normalize(alias) === normalizedValue)
    );
  });
}

export function categoryNamesForSlug(slug: string) {
  return getCategoryCollection(slug)?.aliases || [];
}

export function getDisplayCategoryName(name: string) {
  return getCategoryCollection(name)?.name || name;
}

export function getCategoryImage(nameOrSlug: string) {
  return (
    getCategoryCollection(nameOrSlug)?.image ||
    'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&q=80&w=1200'
  );
}

export function getCategoryHref(category: CategoryCollection) {
  return `/categories/${category.slug}`;
}

export function buildCategoryCards(categories: CategorySource[]) {
  return MAIN_CATEGORIES.map((category) => {
    const matchingCategories = categories.filter((sourceCategory) => {
      return category.aliases.some((alias) => normalize(alias) === normalize(sourceCategory.name));
    });

    const itemCount = matchingCategories.reduce((total, sourceCategory) => {
      if (sourceCategory.products) {
        return total + sourceCategory.products.length;
      }

      return total + (sourceCategory._count?.products || 0);
    }, 0);

    return {
      ...category,
      href: getCategoryHref(category),
      itemCount,
    };
  });
}
