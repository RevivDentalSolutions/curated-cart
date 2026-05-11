import { prisma } from './prisma';

export async function getDashboardStats() {
  const needsContentCount = await prisma.product.count({
    where: { blogPostStatus: 'Needs Content' },
  });

  const readyToPromoteCount = await prisma.product.count({
    where: { blogPostStatus: 'Ready to Promote' },
  });

  const publishedCount = await prisma.product.count({
    where: { published: true },
  });

  const productsNeedsContent = await prisma.product.findMany({
    where: { blogPostStatus: 'Needs Content' },
    include: { category: true },
    take: 5,
    orderBy: { dateAdded: 'desc' },
  });

  const productsReadyToPromote = await prisma.product.findMany({
    where: { blogPostStatus: 'Ready to Promote' },
    include: { category: true, contentBundle: true },
    take: 5,
    orderBy: { dateAdded: 'desc' },
  });

  return {
    stats: {
      needsContent: needsContentCount,
      readyToPromote: readyToPromoteCount,
      published: publishedCount,
    },
    lists: {
      needsContent: productsNeedsContent,
      readyToPromote: productsReadyToPromote,
    }
  };
}
