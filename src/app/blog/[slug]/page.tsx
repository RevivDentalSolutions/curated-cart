import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import ProductImage from '@/components/ProductImage';
import AffiliateDisclosureNotice from '@/components/AffiliateDisclosureNotice';
import { prisma } from '@/lib/prisma';
import { getCategoryImage } from '@/lib/categories';
import { withAmazonAssociatesTag } from '@/lib/affiliate';
import { fallbackLatestPosts } from '@/lib/homepage-fallback';
import { isPublicBlogPost } from '@/lib/blog-visibility';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = process.env.DATABASE_URL ? await prisma.blogPost.findUnique({ where: { slug } }) : fallbackLatestPosts.find((item) => item.slug === slug);
  if (!post) return {};
  return { title: post.metaTitle || post.title, description: post.metaDescription || post.excerpt || undefined };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  await connection();
  const { slug } = await params;
  const post = process.env.DATABASE_URL ? await prisma.blogPost.findUnique({
    where: { slug },
    include: { category: true, products: { include: { category: true } } },
  }) : fallbackLatestPosts.find((item) => item.slug === slug);

  if (!post || !isPublicBlogPost(post)) notFound();

  const paragraphs = (post.content || post.excerpt || '').split('\n').filter(Boolean);

  return (
    <article className="container mx-auto max-w-4xl px-4 py-16 text-brand-black">
      <Link href="/blog" className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-gold">← Back to Blog</Link>
      <span className="mt-8 block text-[10px] font-bold uppercase tracking-[0.3em] text-brand-gold">{post.category.name}</span>
      <h1 className="mt-4 text-5xl font-serif tracking-tighter">{post.title}</h1>
      {(post.featuredImage || post.category?.name) && (
        <div className="mt-10 aspect-[16/9] overflow-hidden rounded-sm bg-brand-cream">
          <ProductImage src={post.featuredImage || getCategoryImage(post.category.name)} alt={post.title} className="h-full w-full object-cover" />
        </div>
      )}
      <div className="prose prose-neutral mt-10 max-w-none">
        {paragraphs.length > 0 ? paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>) : <p>{post.excerpt || post.metaDescription}</p>}
      </div>
      {post.products.length > 0 && (
        <section className="mt-14 border-t border-brand-blush pt-10">
          <AffiliateDisclosureNotice className="mb-6" />
          <h2 className="text-3xl font-serif">Shop the guide</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {post.products.map((product) => (
              <article key={product.id} className="luxury-card overflow-hidden">
                <div className="aspect-square overflow-hidden bg-brand-cream"><ProductImage src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" /></div>
                <div className="p-5"><h3 className="font-serif text-lg">{product.name}</h3><p className="mt-2 text-sm text-brand-black/60">{product.description || product.category.name}</p><a href={withAmazonAssociatesTag(product.affiliateLink || product.amazonLink)} target="_blank" rel="sponsored noopener noreferrer" className="btn-primary mt-4 block py-3 text-center text-[10px]">Shop the Find</a></div>
              </article>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
