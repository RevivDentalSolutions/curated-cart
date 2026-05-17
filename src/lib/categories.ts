export type CategoryCollection = {
  name: string;
  slug: string;
  description: string;
  heroSubheadline?: string;
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
    description: 'Polished skincare, makeup, and beauty tool finds for an elevated everyday vanity.',
    aliases: ['Beauty', 'Skincare', 'Beauty Tools'],
    image: 'https://res.cloudinary.com/dt7s4c04l/image/upload/v1778864238/Untitled_design_-_2026-05-15T115711.649_vwqujs.png',
    accent: 'blush',
  },
  {
    name: 'Hair',
    slug: 'hair',
    description: 'Pretty hair care and styling tools that make wash days and everyday touch-ups feel more luxe.',
    aliases: ['Hair', 'Hair Care', 'Hair Tools'],
    image: 'https://res.cloudinary.com/dt7s4c04l/image/upload/v1778863751/Untitled_design_-_2026-05-15T114514.941_lhdtuz.png',
    accent: 'cream',
  },
  {
    name: 'Fashion',
    slug: 'fashion',
    description: 'Soft, wearable fashion finds with a neutral, editorial, add-to-cart-now point of view.',
    aliases: ['Fashion', 'Fashion Finds', 'Style'],
    image: 'https://res.cloudinary.com/dt7s4c04l/image/upload/v1778863750/Untitled_design_-_2026-05-15T114649.682_fzw0ug.png',
    accent: 'nude',
  },
  {
    name: 'Home',
    slug: 'home',
    description: 'Warm, texture-rich decor and organization finds for a home that feels quietly expensive.',
    aliases: ['Home', 'Home Decor'],
    image: 'https://res.cloudinary.com/dt7s4c04l/image/upload/v1778863750/Untitled_design_-_2026-05-15T114722.877_rskmnv.png',
    accent: 'beige',
  },
  {
    name: 'Kitchen',
    slug: 'kitchen',
    description: 'Neutral kitchen, coffee bar, and hosting finds that make everyday routines feel styled.',
    aliases: ['Kitchen', 'Kitchen Finds', 'Coffee Bar'],
    image: 'https://res.cloudinary.com/dt7s4c04l/image/upload/v1778863749/Untitled_design_-_2026-05-15T114845.377_hfanjl.png',
    accent: 'cream',
  },
  {
    name: 'Wellness',
    slug: 'wellness',
    description: 'Calming self-care, reset, and wellness essentials for softer daily rituals.',
    aliases: ['Wellness', 'Self Care'],
    image: 'https://res.cloudinary.com/dt7s4c04l/image/upload/v1778863749/Untitled_design_-_2026-05-15T114809.489_j712sr.png',
    accent: 'blush',
  },
  {
    name: 'Mom Life',
    slug: 'mom-life',
    description: 'Pretty and practical motherhood finds that help family spaces feel calm, useful, and collected.',
    aliases: ['Mom Life', 'Mom Life Favorites', 'Motherhood'],
    image: 'https://res.cloudinary.com/dt7s4c04l/image/upload/v1778863750/Untitled_design_-_2026-05-15T114556.110_jwecgb.png',
    accent: 'nude',
  },
  {
    name: 'Amazon Favorites',
    slug: 'amazon-favorites',
    description: 'Worth-it Amazon finds, under-$25 gems, and viral favorites selected with a luxe practical lens.',
    aliases: ['Amazon Favorites', 'Under $25 Finds', 'Worth the Splurge'],
    image: 'https://res.cloudinary.com/dt7s4c04l/image/upload/v1778863751/Untitled_design_-_2026-05-15T114431.040_b326zi.png',
    accent: 'beige',
  },
  {
    name: 'Elevated Summer',
    slug: 'elevated-summer',
    description:
      'A curated collection of elevated beach, poolside, vacation, and warm-weather finds designed to make summer feel effortless, aesthetic, and luxurious.',
    heroSubheadline:
      'Pretty poolside finds, beach day essentials, vacation favorites, and soft luxury summer picks.',
    aliases: ['Elevated Summer', 'Summer', 'Summer Finds', 'Beach Finds', 'Poolside', 'Vacation Favorites'],
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1600',
    accent: 'sand',
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
