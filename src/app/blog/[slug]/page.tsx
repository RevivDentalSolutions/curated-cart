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
import { isAdminAuthenticated } from '@/lib/admin-auth';

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

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ preview?: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const isDraftPreview = (await searchParams)?.preview === '1' && await isAdminAuthenticated();
  const post = process.env.DATABASE_URL ? await prisma.blogPost.findUnique({ where: { slug } }) : fallbackLatestPosts.find((item) => item.slug === slug);
  if (!post) return {};

  const title = post.metaTitle || post.title;
  const description = post.metaDescription || post.excerpt || undefined;
  const url = `${siteUrl}/blog/${post.slug}`;

  return {
    title,
    description,
    robots: isDraftPreview ? { index: false, follow: false } : undefined,
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

export default async function BlogPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ preview?: string }>;
}) {
  await connection();
  const { slug } = await params;
  const isDraftPreview = (await searchParams)?.preview === '1' && await isAdminAuthenticated();
  const post = process.env.DATABASE_URL ? await prisma.blogPost.findUnique({
    where: { slug },
    include: { category: true },
  }) : fallbackLatestPosts.find((item) => item.slug === slug);

  if (!post || (!isPublicBlogPost(post) && !isDraftPreview)) notFound();

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

  const storyParagraphs = paragraphs.length > 0 ? paragraphs : [post.excerpt || post.metaDescription || ''];
  const heroProducts = products.slice(0, 3);
  const hasCustomHeader = Boolean(post.featuredImage) && !products.some((product) => product.imageUrl === post.featuredImage);

  function insertAfterParagraph(productIndex: number) {
    if (storyParagraphs.length <= 1) return 0;
    return Math.min(
      storyParagraphs.length - 1,
      Math.floor(((productIndex + 1) * storyParagraphs.length) / (products.length + 1))
    );
  }

  return (
    <article className="pb-24 text-brand-black">
      {isDraftPreview && !isPublicBlogPost(post) && (
        <div className="border-b border-brand-gold/30 bg-brand-cream px-4 py-3 text-center text-[10px] font-bold uppercase tracking-[0.22em] text-brand-black">
          Draft preview — this post is not public yet
        </div>
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <BlogArticleHeader
        category={post.category.name}
        title={post.title}
        publishedAt={new Date(post.createdAt)}
        readingTime={readingTime([post.title, post.excerpt, post.content].filter(Boolean).join(' '))}
      />

      <div className="container mx-auto max-w-6xl px-4 pt-10 md:pt-14">
        {hasCustomHeader ? (
          <div className="mx-auto max-w-5xl overflow-hidden bg-brand-cream shadow-sm">
            <ProductImage src={post.featuredImage} alt={post.title} className="aspect-[16/7] w-full object-cover" />
          </div>
        ) : heroProducts.length > 1 ? (
          <div className="mx-auto grid max-w-5xl gap-3 overflow-hidden bg-brand-cream p-3 shadow-sm md:grid-cols-[1.35fr_0.65fr]">
            <div className="flex min-h-[320px] items-center justify-center bg-white p-6 md:min-h-[520px]">
              <ProductImage src={heroProducts[0].imageUrl} alt={heroProducts[0].name} className="h-full max-h-[480px] w-full object-contain" />
            </div>
            <div className="grid gap-3">
              {heroProducts.slice(1).map((product) => (
                <div key={product.id} className="flex min-h-[190px] items-center justify-center bg-white p-5 md:min-h-0">
                  <ProductImage src={product.imageUrl} alt={product.name} className="h-full max-h-[245px] w-full object-contain" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto flex min-h-[320px] max-w-4xl items-center justify-center overflow-hidden bg-brand-cream p-8 shadow-sm md:min-h-[480px]">
            <ProductImage src={heroImage} alt={post.title} className="h-full max-h-[460px] w-full object-contain" />
          </div>
        )}

        <div className="mx-auto max-w-4xl">
          {(post.excerpt || post.metaDescription) && (
            <p className="mx-auto mt-12 max-w-3xl border-y border-brand-blush py-7 text-xl font-light italic leading-9 text-brand-black/75 md:text-2xl md:leading-10">
              {post.excerpt || post.metaDescription}
            </p>
          )}

          {products.length > 0 && <AffiliateDisclosureNotice className="mx-auto mt-8 max-w-3xl" />}

          <div className="mt-10">
            {storyParagraphs.map((paragraph, paragraphIndex) => (
              <div key={`${paragraphIndex}-${paragraph.slice(0, 30)}`}>
                {paragraph && (
                  <p className={`mx-auto max-w-3xl text-[1.05rem] leading-8 text-brand-black/75 md:text-lg md:leading-9 ${paragraphIndex > 0 ? 'mt-7' : ''}`}>
                    {paragraph}
                  </p>
                )}

                {products
                  .map((product, productIndex) => ({ product, productIndex }))
                  .filter(({ productIndex }) => insertAfterParagraph(productIndex) === paragraphIndex)
                  .map(({ product, productIndex }) => (
                    <article
                      key={product.id}
                      className={`my-12 grid overflow-hidden border border-brand-blush bg-white shadow-[0_20px_55px_rgba(197,160,89,0.10)] md:my-16 md:grid-cols-2 ${productIndex % 2 === 1 ? 'md:[&>div:first-child]:order-2' : ''}`}
                    >
                      <div className="flex min-h-[300px] items-center justify-center bg-brand-cream/60 p-7 md:min-h-[420px]">
                        <ProductImage src={product.imageUrl} alt={product.name} className="h-full max-h-[390px] w-full object-contain transition-transform duration-700 hover:scale-105" />
                      </div>
                      <div className="flex flex-col justify-center p-7 md:p-10">
                        <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-brand-gold">
                          Editor&apos;s Pick No. {productIndex + 1}
                        </span>
                        <h2 className="mt-4 font-serif text-3xl leading-tight md:text-4xl">{product.name}</h2>
                        <p className="mt-5 text-sm leading-7 text-brand-black/60">
                          A polished, practical {product.categoryName?.toLowerCase() || 'lifestyle'} find selected for this edit. Tap through for the retailer&apos;s current details, colors, and availability.
                        </p>
                        <a href={productHref(product)} target="_blank" rel="sponsored noopener noreferrer" className="btn-primary mt-7 inline-flex w-fit items-center gap-2 px-6 py-3 text-[10px]">
                          Shop the Find <ArrowUpRight size={14} />
                        </a>
                      </div>
                    </article>
                  ))}
              </div>
            ))}
          </div>
        </div>

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
