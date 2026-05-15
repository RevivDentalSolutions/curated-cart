/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.category.findMany();
  
  const home = categories.find(c => c.name === 'Home');
  const fashion = categories.find(c => c.name === 'Fashion');
  const beauty = categories.find(c => c.name === 'Beauty');

  if (home) {
    await prisma.product.create({
      data: {
        name: 'Arched Full Length Mirror with Gold Frame',
        categoryId: home.id,
        amazonLink: 'https://amazon.com/dp/B08YRP9D76',
        price: 129.99,
        source: 'TikTok Viral',
        viralTrendNotes: 'The perfect dupe for the Anthropologie mirror. Everyone is obsessed with the minimalist gold frame.',
        blogPostStatus: 'Published',
        dateAdded: new Date()
      }
    });
  }

  if (fashion) {
    await prisma.product.create({
      data: {
        name: 'Matching Ribbed Knit Set (Blush)',
        categoryId: fashion.id,
        amazonLink: 'https://amazon.com/dp/B09D8G7H8L',
        price: 45.00,
        source: 'Instagram Reels',
        viralTrendNotes: 'Super soft, high-end feel. Perfect for travel or lounging. Available in 12 colors.',
        blogPostStatus: 'Needs Content',
        dateAdded: new Date()
      }
    });
  }

  if (beauty) {
    await prisma.product.create({
      data: {
        name: 'Facial Ice Roller for De-puffing',
        categoryId: beauty.id,
        amazonLink: 'https://amazon.com/dp/B07GZV6K9H',
        price: 18.95,
        source: 'Amazon Favorites',
        viralTrendNotes: 'A morning essential. Reduces redness and wakes up your skin instantly.',
        blogPostStatus: 'Ready to Promote',
        dateAdded: new Date()
      }
    });
  }

  console.log('Sample products added!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
