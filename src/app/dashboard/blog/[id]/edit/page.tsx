import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import BlogPostEditor from '@/components/BlogPostEditor';
import { normalizeEditorSections, normalizeImageLibrary } from '@/lib/blog-editor';

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const isAuthenticated = await isAdminAuthenticated();
  if (!isAuthenticated) {
    redirect('/dashboard');
  }

  const { id } = await params;
  const [post, categories] = await Promise.all([
    prisma.blogPost.findUnique({
      where: { id },
      include: {
        products: { select: { id: true, name: true, imageUrl: true, amazonLink: true, affiliateLink: true } },
      },
    }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
  ]);

  if (!post) {
    notFound();
  }

  return (
    <BlogPostEditor
      initialPost={{
        id: post.id,
        title: post.title,
        subtitle: post.subtitle,
        slug: post.slug,
        categoryId: post.categoryId,
        authorName: post.authorName,
        affiliateDisclosure: post.affiliateDisclosure,
        ctaText: post.ctaText,
        labelFavoritePick: post.labelFavoritePick,
        labelVanityTray: post.labelVanityTray,
        labelWorthIt: post.labelWorthIt,
        excerpt: post.excerpt,
        metaTitle: post.metaTitle,
        metaDescription: post.metaDescription,
        featuredImage: post.featuredImage,
        content: post.content,
        isPublished: post.isPublished,
        scheduledAt: post.scheduledAt?.toISOString() || null,
        editorSections: normalizeEditorSections(post.editorSections),
        imageLibrary: normalizeImageLibrary(post.imageLibrary),
        products: post.products,
      }}
      categories={categories}
    />
  );
}
