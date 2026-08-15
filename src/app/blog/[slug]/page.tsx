import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import BlogArticleHeader from '@/components/BlogArticleHeader';
import ProductImage from '@/components/ProductImage';
import AffiliateDisclosureNotice from '@/components/AffiliateDisclosureNotice';
import { prisma } from '@/lib/prisma';
import { getCategoryImage } from '@/lib/categories';
import { withAmazonAssociatesTag } from '@/lib/affiliate';
import { fallbackLatestPosts } from '@/lib/homepage-fallback';
import { isPublicBlogPost } from '@/lib/blog-visibility';

export const dynamic = 'force-dynamic';

const siteUrl = 'https://www.shopthecuratedcart.com';
const kitchenEditorialHero = '/images/neutral-kitchen-hero.jpg';

type GuideProduct = {
  id: string;
  name: string;
  imageUrl: string | null;
  affiliateLink: string | null;
  amazonLink: string | null;
  categoryName: string | null;
};

function readingTime(content?: string | null) {
  const words = content?.trim().split(/\s+/).filter(Boolean).length ?? 0;
  return `${Math.max(1, Math.ceil(words / 200))} Minute Read`;
}

function productHref(product: GuideProduct) {
  return withAmazonAssociatesTag(product.affiliateLink || product.amazonLink);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = process.env.DATABASE_URL ? await prisma.blogPost.findUnique({ where: { slug } }) : fallbackLatestPosts.find((item) => item.slug === slug);
  if (!post) return {};

  const title = post.metaTitle || post.title;
  const description = post.metaDescription || post.excerpt || undefined;
  const url = `${siteUrl}/blog/${post.slug}`;

  return {
    title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      publishedTime: new Date(post.createdAt).toISOString(),
      modifiedTime: new Date(post.updatedAt).toISOString(),
      images: post.featuredImage ? [{ url: post.featuredImage, alt: post.title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: post.featuredImage ? [post.featuredImage] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  await connection();
  const { slug } = await params;
  const post = process.env.DATABASE_URL ? await prisma.blogPost.findUnique({
    where: { slug },
    include: { category: true },
  }) : fallbackLatestPosts.find((item) => item.slug === slug);

  if (!post || !isPublicBlogPost(post)) notFound();

  // The production catalog predates Product.description. This intentionally
  // selects only the stable fields required for the editorial product modules.
  const products: GuideProduct[] = process.env.DATABASE_URL
    ? await prisma.$queryRawUnsafe<GuideProduct[]>(`
      SELECT p."id", p."name", p."imageUrl", p."affiliateLink", p."amazonLink", c."name" AS "categoryName"
      FROM "_ProductBlogPosts" relation
      JOIN "Product" p ON p."id" = relation."B"
      LEFT JOIN "Category" c ON c."id" = p."categoryId"
      WHERE relation."A" = $1
      ORDER BY p."name"
    `, post.id)
    : [];

  const paragraphs = (post.content || post.excerpt || '').split(/\n{2,}/).map((value) => value.trim()).filter(Boolean);
  const articleUrl = `${siteUrl}/blog/${post.slug}`;
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.metaDescription || post.excerpt || undefined,
    image: post.featuredImage || undefined,
    datePublished: new Date(post.createdAt).toISOString(),
    dateModified: new Date(post.updatedAt).toISOString(),
    mainEntityOfPage: articleUrl,
    author: { '@type': 'Organization', name: 'The Curated Cart' },
    publisher: { '@type': 'Organization', name: 'The Curated Cart' },
  };
  const featuredProduct = products.find((product) => product.imageUrl === post.featuredImage) || products[0];
  const heroImage = post.slug === 'neutral-luxury-kitchen-finds'
    ? kitchenEditorialHero
    : post.featuredImage || featuredProduct?.imageUrl || getCategoryImage(post.category.name);

  return (
    <article className="pb-24 text-brand-black">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <BlogArticleHeader
        category={post.category.name}
        title={post.title}
        publishedAt={new Date(post.createdAt)}
        readingTime={readingTime([post.title, post.excerpt, post.content].filter(Boolean).join(' '))}
      />

      <div className="container mx-auto max-w-5xl px-4 pt-10 md:pt-14">
        <div className="mx-auto max-w-4xl overflow-hidden bg-brand-cream shadow-sm">
          <div className="aspect-[16/8] overflow-hidden">
            <ProductImage src={heroImage} alt={post.title} className="h-full w-full object-cover" />
          </div>
        </div>

        <div className="mx-auto max-w-3xl">
          {(post.excerpt || post.metaDescription) && (
            <p className="mt-12 border-y border-brand-blush py-7 text-xl font-light italic leading-9 text-brand-black/75 md:text-2xl md:leading-10">
              {post.excerpt || post.metaDescription}
            </p>
          )}

          <div className="mt-10 space-y-7 text-[1.05rem] leading-8 text-brand-black/75 md:text-lg md:leading-9">
            {paragraphs.map((paragraph, index) => (
              <p key={`${index}-${paragraph.slice(0, 30)}`} className={index > 0 && /^\d+\./.test(paragraph) ? 'font-medium text-brand-black' : undefined}>
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        {products.length > 0 && (
          <section className="mx-auto mt-16 max-w-5xl border-t border-brand-blush pt-14 md:mt-20">
            <div className="mx-auto max-w-3xl text-center">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-gold">Shop the Edit</span>
              <h2 className="mt-3 text-4xl font-serif tracking-tight md:text-5xl">The featured finds</h2>
              <AffiliateDisclosureNotice className="mx-auto mt-6 max-w-2xl text-left" />
            </div>

            {featuredProduct && (
              <article className="mt-10 grid overflow-hidden border border-brand-blush bg-white shadow-sm md:grid-cols-2">
                <div className="aspect-[4/3] overflow-hidden bg-brand-cream md:aspect-auto">
                  <ProductImage src={featuredProduct.imageUrl} alt={featuredProduct.name} className="h-full w-full object-cover" />
                </div>
                <div className="flex flex-col justify-center p-8 md:p-12">
                  <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-brand-gold">Editor&apos;s opening pick</span>
                  <h3 className="mt-4 text-3xl font-serif leading-tight md:text-4xl">{featuredProduct.name}</h3>
                  <p className="mt-5 text-sm leading-7 text-brand-black/60">
                    A curated {featuredProduct.categoryName?.toLowerCase() || 'lifestyle'} find from this guide, selected to make the routine feel a little more intentional.
                  </p>
                  <a href={productHref(featuredProduct)} target="_blank" rel="sponsored noopener noreferrer" className="btn-primary mt-8 inline-flex w-fit items-center gap-2 px-6 py-3 text-[10px]">
                    Shop the Find <ArrowUpRight size={14} />
                  </a>
                </div>
              </article>
            )}

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {products.filter((product) => product.id !== featuredProduct?.id).map((product, index) => (
                <article key={product.id} className={`group overflow-hidden border border-brand-blush bg-white shadow-sm ${index % 3 === 2 ? 'md:col-span-2 md:grid md:grid-cols-[0.9fr_1.1fr]' : ''}`}>
                  <div className={`overflow-hidden bg-brand-cream ${index % 3 === 2 ? 'aspect-[4/3] md:aspect-auto' : 'aspect-square'}`}>
                    <ProductImage src={product.imageUrl} alt={product.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  </div>
                  <div className="p-6 md:p-8">
                    <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand-gold">{product.categoryName || 'Curated find'}</span>
                    <h3 className="mt-3 text-2xl font-serif leading-tight">{product.name}</h3>
                    <p className="mt-4 text-sm leading-7 text-brand-black/60">A polished, practical addition to this edit—tap through for the retailer&apos;s current details.</p>
                    <a href={productHref(product)} target="_blank" rel="sponsored noopener noreferrer" className="mt-6 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-black transition-colors hover:text-brand-gold">
                      Shop the Find <ArrowUpRight size={13} />
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="mx-auto mt-16 max-w-3xl border-y border-brand-blush bg-brand-cream/30 px-8 py-12 text-center md:mt-20">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-gold">The Curated Cart</span>
          <h2 className="mt-4 text-3xl font-serif">Pretty finds. Practical buys.</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-brand-black/65">Thoughtful shopping edits for the things that make everyday life feel more put together.</p>
          <Link href="/blog" className="mt-7 inline-flex text-[10px] font-bold uppercase tracking-[0.22em] text-brand-black hover:text-brand-gold">Explore more guides →</Link>
        </section>
      </div>
    </article>
  );
}
