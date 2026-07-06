import { prisma } from './prisma';
import { startOfWeek, endOfWeek, addDays, format } from 'date-fns';

export async function getWeeklyChecklist() {
  const now = new Date();
  const start = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  const end = endOfWeek(now, { weekStartsOn: 1 });

  const productsAdded = await prisma.product.count({
    where: {
      dateAdded: {
        gte: start,
        lte: end,
      },
    },
  });

  const blogPostsPublished = await prisma.blogPost.count({
    where: {
      isPublished: true,
      updatedAt: {
        gte: start,
        lte: end,
      },
    },
  });

  const pinsCreated = await prisma.product.count({
    where: {
      pinStatus: 'Completed',
      dateAdded: {
        gte: start,
        lte: end,
      },
    },
  });

  const tiktokPosted = await prisma.product.count({
    where: {
      tiktokStatus: 'Completed',
      dateAdded: {
        gte: start,
        lte: end,
      },
    },
  });

  // For the email, we'll check if any content bundle was created this week 
  // and has an email blurb.
  const emailDrafted = await prisma.contentBundle.count({
    where: {
      emailBlurb: { not: null },
      createdAt: {
        gte: start,
        lte: end,
      },
    },
  });

  return [
    { id: 1, task: 'Add 5 viral products', current: productsAdded, target: 5, completed: productsAdded >= 5 },
    { id: 2, task: 'Publish 1 blog post', current: blogPostsPublished, target: 1, completed: blogPostsPublished >= 1 },
    { id: 3, task: 'Create 3 Pinterest pins', current: pinsCreated, target: 3, completed: pinsCreated >= 3 },
    { id: 4, task: 'Post 1 TikTok/Reel', current: tiktokPosted, target: 1, completed: tiktokPosted >= 1 },
    { id: 5, task: 'Send 1 email', current: emailDrafted, target: 1, completed: emailDrafted >= 1 },
  ];
}

export async function getContentCalendar() {
  const now = new Date();
  const start = startOfWeek(now, { weekStartsOn: 1 });
  
  // Get products that need content
  const needsContent = await prisma.product.findMany({
    where: {
      blogPostStatus: 'Needs Content',
    },
    take: 7,
    orderBy: {
      dateAdded: 'desc',
    },
  });

  const calendar = [];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  for (let i = 0; i < 7; i++) {
    const date = addDays(start, i);
    const dayName = days[i];
    
    // Assign a product to each day if available
    const product = needsContent[i];
    
    calendar.push({
      date: format(date, 'MMM dd'),
      day: dayName,
      suggestion: product 
        ? `Create content for ${product.name}` 
        : 'Research new viral trends',
      status: product ? 'Drafting' : 'Planning',
      productId: product?.id || null,
    });
  }

  return calendar;
}
