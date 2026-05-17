/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const categoryNames = [
  'Beauty',
  'Hair',
  'Fashion',
  'Home',
  'Kitchen',
  'Wellness',
  'Mom Life',
  'Amazon Favorites',
  'Elevated Summer',
];

const products = [
  {
    name: 'Minimalist Ceramic Vase Set',
    category: 'Home',
    amazonLink: 'https://amazon.com/dp/B08SAMPLE1?tag=curatedcart-20',
    affiliateLink: 'https://amazon.com/dp/B08SAMPLE1?tag=curatedcart-20',
    imageUrl: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&q=80&w=900',
    price: 34.99,
    source: 'Editorial Pick',
    viralTrendNotes: 'A neutral sculptural trio that makes shelves, consoles, and nightstands feel instantly styled.',
    contentIdea: 'Style three easy shelf moments with warm neutrals and dried stems.',
    blogPostStatus: 'Published',
    commissionPotential: 'Medium',
  },
  {
    name: 'Oversized Satin Pajama Set',
    category: 'Fashion',
    amazonLink: 'https://amazon.com/dp/B08SAMPLE2?tag=curatedcart-20',
    affiliateLink: 'https://amazon.com/dp/B08SAMPLE2?tag=curatedcart-20',
    imageUrl: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&q=80&w=900',
    price: 42,
    source: 'Instagram Reels',
    viralTrendNotes: 'Soft drape, neutral piping, and a boutique look without the boutique price.',
    contentIdea: 'Compare lounge sets that look elevated enough for weekend hosting.',
    blogPostStatus: 'Published',
    commissionPotential: 'High',
  },
  {
    name: 'Facial Ice Roller for De-Puffing',
    category: 'Beauty',
    amazonLink: 'https://amazon.com/dp/B08SAMPLE3?tag=curatedcart-20',
    affiliateLink: 'https://amazon.com/dp/B08SAMPLE3?tag=curatedcart-20',
    imageUrl: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&q=80&w=900',
    price: 18.95,
    source: 'Amazon Favorites',
    viralTrendNotes: 'A simple morning reset that feels spa-like and fits the neutral vanity aesthetic.',
    contentIdea: 'Build a five-minute morning glow routine under $50.',
    blogPostStatus: 'Published',
    commissionPotential: 'Medium',
  },
  {
    name: 'Pearl Finish Makeup Brush Set',
    category: 'Beauty',
    amazonLink: 'https://amazon.com/dp/B08SAMPLE4?tag=curatedcart-20',
    affiliateLink: 'https://amazon.com/dp/B08SAMPLE4?tag=curatedcart-20',
    imageUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=900',
    price: 24.5,
    source: 'Creator Roundup',
    viralTrendNotes: 'Pretty enough to leave on the counter and practical enough for everyday makeup.',
    contentIdea: 'Round up counter-worthy beauty tools that still perform.',
    blogPostStatus: 'Published',
    commissionPotential: 'Medium',
  },
  {
    name: 'Woven Storage Basket Trio',
    category: 'Mom Life',
    amazonLink: 'https://amazon.com/dp/B08SAMPLE5?tag=curatedcart-20',
    affiliateLink: 'https://amazon.com/dp/B08SAMPLE5?tag=curatedcart-20',
    imageUrl: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=900',
    price: 29.99,
    source: 'Pinterest',
    viralTrendNotes: 'Soft-sided catchalls for toys, throws, and entryway clutter that still look intentional.',
    contentIdea: 'Create a calm drop zone with baskets, labels, and neutral textures.',
    blogPostStatus: 'Published',
    commissionPotential: 'High',
  },
  {
    name: 'Gold Rim Glass Coffee Mugs',
    category: 'Amazon Favorites',
    amazonLink: 'https://amazon.com/dp/B08SAMPLE6?tag=curatedcart-20',
    affiliateLink: 'https://amazon.com/dp/B08SAMPLE6?tag=curatedcart-20',
    imageUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&q=80&w=900',
    price: 22.99,
    source: 'TikTok Viral',
    viralTrendNotes: 'Cafe-at-home energy with a delicate gold rim that feels giftable and luxe.',
    contentIdea: 'Style a cozy coffee bar with small upgrades under $25.',
    blogPostStatus: 'Published',
    commissionPotential: 'Medium',
  },
];

const blogPosts = [
  {
    title: '6 Amazon Finds That Make a Room Feel Quietly Expensive',
    slug: 'amazon-finds-quietly-expensive-room',
    category: 'Home',
    featuredImage: 'https://images.unsplash.com/photo-1616489953149-75517454e9c3?auto=format&fit=crop&q=80&w=1600',
    metaTitle: 'Luxury-Looking Amazon Home Finds',
    metaDescription: 'Neutral, texture-rich Amazon home finds that bring a polished designer feeling to everyday spaces.',
    content: `The easiest way to make a room feel more refined is to repeat soft neutrals, warm metals, and tactile textures. Start with one sculptural piece, add concealed storage, and finish with something that brings a little glow.\n\nThese pieces are intentionally versatile: they work on a console, vanity, entryway bench, coffee bar, or nursery shelf without making the room feel overly styled.`,
    productNames: ['Minimalist Ceramic Vase Set', 'Woven Storage Basket Trio', 'Gold Rim Glass Coffee Mugs'],
  },
  {
    title: 'A Pretty Five-Minute Morning Routine Under $50',
    slug: 'pretty-five-minute-morning-routine-under-50',
    category: 'Beauty',
    featuredImage: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=1600',
    metaTitle: 'Affordable Amazon Morning Routine Finds',
    metaDescription: 'A quick, polished morning routine with affordable skincare and beauty tools that still look beautiful on the counter.',
    content: `A good morning routine does not need to be complicated. Keep the steps sensory and simple: cool, hydrate, blend, and go.\n\nThe best everyday tools are the ones you will actually reach for, so this edit focuses on items that feel calming, look elevated, and tuck neatly into a vanity tray.`,
    productNames: ['Facial Ice Roller for De-Puffing', 'Pearl Finish Makeup Brush Set'],
  },
  {
    title: 'Neutral Weekend Finds for Lounging, Hosting, and Resetting',
    slug: 'neutral-weekend-finds-lounging-hosting-resetting',
    category: 'Fashion',
    featuredImage: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&q=80&w=1600',
    metaTitle: 'Neutral Amazon Weekend Finds',
    metaDescription: 'Soft, practical Amazon finds for a polished weekend at home, from pretty pajamas to coffee bar details.',
    content: `Weekend pieces should feel comfortable without looking forgotten. A matching set, a better mug, and a few clutter-hiding details can make slow mornings feel much more intentional.\n\nThis edit keeps the palette warm and neutral, so every find layers easily with what you already own.`,
    productNames: ['Oversized Satin Pajama Set', 'Gold Rim Glass Coffee Mugs', 'Woven Storage Basket Trio'],
  },
];

async function upsertProduct(product, categoryId) {
  const existing = await prisma.product.findFirst({ where: { name: product.name } });
  const data = { ...product, categoryId };
  delete data.category;

  if (existing) {
    return prisma.product.update({ where: { id: existing.id }, data });
  }

  return prisma.product.create({ data });
}

async function main() {
  const categories = {};

  for (const name of categoryNames) {
    categories[name] = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const seededProducts = {};
  for (const product of products) {
    seededProducts[product.name] = await upsertProduct(product, categories[product.category].id);
  }

  for (const post of blogPosts) {
    const productConnections = post.productNames.map((name) => ({ id: seededProducts[name].id }));
    await prisma.blogPost.upsert({
      where: { slug: post.slug },
      update: {
        title: post.title,
        categoryId: categories[post.category].id,
        content: post.content,
        metaTitle: post.metaTitle,
        metaDescription: post.metaDescription,
        featuredImage: post.featuredImage,
        isPublished: true,
        products: {
          set: productConnections,
        },
      },
      create: {
        title: post.title,
        slug: post.slug,
        categoryId: categories[post.category].id,
        content: post.content,
        metaTitle: post.metaTitle,
        metaDescription: post.metaDescription,
        featuredImage: post.featuredImage,
        isPublished: true,
        products: {
          connect: productConnections,
        },
      },
    });
  }

  console.log('Seeded 9 polished categories, 6 affiliate products, and 3 blog posts.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
