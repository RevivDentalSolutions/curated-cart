const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const categories = [
    'Home Decor',
    'Fashion Finds',
    'Skincare',
    'Beauty Tools',
    'Mom Life Favorites',
    'Under $25 Finds',
    'Worth the Splurge',
  ];

  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log('Categories seeded!');

  // Seed some products
  const homeDecor = await prisma.category.findUnique({ where: { name: 'Home Decor' } });
  const fashionFinds = await prisma.category.findUnique({ where: { name: 'Fashion Finds' } });

  await prisma.product.create({
    data: {
      name: 'Minimalist Ceramic Vase Set',
      categoryId: homeDecor.id,
      amazonLink: 'https://amazon.com/dp/B08SAMPLE1',
      price: 34.99,
      source: 'TikTok',
      blogPostStatus: 'Published',
    }
  });

  await prisma.product.create({
    data: {
      name: 'Oversized Silk Pajama Set',
      categoryId: fashionFinds.id,
      amazonLink: 'https://amazon.com/dp/B08SAMPLE2',
      price: 42.00,
      source: 'Instagram',
      blogPostStatus: 'Ready to Promote',
    }
  });

  // Seed a blog post
  await prisma.blogPost.create({
    data: {
      title: '10 Amazon Home Finds That Look Way More Expensive Than They Are',
      slug: 'amazon-home-finds-expensive-look',
      categoryId: homeDecor.id,
      content: 'Full review content here...',
      metaTitle: 'Luxury Amazon Home Finds',
      metaDescription: 'Discover the best affordable luxury home decor on Amazon.',
      isPublished: true,
    }
  });

  console.log('Seed data added!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
