import Link from 'next/link';
import { ExternalLink, ShoppingCart, Star, ThumbsUp, ThumbsDown } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import CreatePinsButton from '@/components/CreatePinsButton';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import BlogArticleHeader from '@/components/BlogArticleHeader';
import ProductImage from '@/components/ProductImage';

type BlogProduct = NonNullable<Awaited<ReturnType<typeof getPost>>>['products'][number];

async function getPost(slug: string) {
  return prisma.blogPost.findUnique({
    where: { slug },
    include: {
      category: true,
      products: {
        include: { category: true },
      },
    },
  });
}

function calculateReadingTime(content?: string | null) {
  const words = content?.trim().split(/\s+/).filter(Boolean).length ?? 0;
  return `${Math.max(1, Math.ceil(words / 200))} Minute Read`;
}

function getParagraphs(content?: string | null) {
  return (content || '')
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function getProductInsertIndex(paragraphCount: number, productIndex: number, productCount: number) {
  if (paragraphCount === 0) {
    return 0;
  }

  return Math.min(
    paragraphCount - 1,
    Math.max(0, Math.floor(((productIndex + 1) * paragraphCount) / (productCount + 1)))
  );
}


function FeaturedProductImageCard({
  imageUrl,
  title,
  product,
}: {
  imageUrl?: string | null;
  title: string;
  product?: BlogProduct;
}) {
  if (!imageUrl) {
    return null;
  }

  const productLink = product?.amazonLink || product?.affiliateLink;

  return (
    <aside className="not-prose mx-auto my-10 max-w-2xl overflow-hidden rounded-sm border border-brand-blush/80 bg-white/85 p-3 shadow-sm shadow-brand-beige/20 md:my-12">
      <div className="grid gap-5 sm:grid-cols-[180px_1fr] sm:items-center md:grid-cols-[220px_1fr]">
        <div className="aspect-square overflow-hidden rounded-sm bg-brand-cream">
          <ProductImage
            src={imageUrl}
            alt={product?.name || title}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="px-1 pb-2 sm:py-3 sm:pr-5">
          <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-brand-gold">
            Featured find from this edit
          </span>
          <h3 className="mt-3 text-2xl leading-tight text-brand-black md:text-3xl">
            {product?.name || title}
          </h3>
          <p className="mt-4 text-sm leading-7 text-brand-black/60">
            {product?.viralTrendNotes ||
              'A polished product detail from this guide, styled as a smaller editorial card so the article stays calm and readable.'}
          </p>
          {productLink && (
            <Link
              href={productLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-brand-black transition-colors hover:text-brand-gold"
            >
              Shop the featured find <ExternalLink size={12} />
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}

function InlineProductCard({ product, index }: { product: BlogProduct; index: number }) {
  return (
    <aside className="not-prose my-10 overflow-hidden border border-brand-blush bg-white shadow-sm md:my-14">
      <div className="grid gap-0 md:grid-cols-[minmax(220px,0.9fr)_1.1fr]">
        <div className="aspect-[4/5] bg-brand-cream md:aspect-auto">
          <ProductImage
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex flex-col p-6 md:p-8">
          <div className="mb-4 flex items-center justify-between gap-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-brand-gold">
              Editor&apos;s Pick No. {index + 1}
            </span>
            <div className="flex text-brand-gold" aria-label="Five star rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} size={12} fill="currentColor" />
              ))}
            </div>
          </div>

          <h3 className="mb-4 text-2xl leading-tight text-brand-black md:text-3xl">
            {product.name}
          </h3>
          <p className="mb-6 text-sm leading-7 text-brand-black/65">
            {product.viralTrendNotes ||
              'A polished, practical find selected for its elevated look, everyday usefulness, and giftable appeal.'}
          </p>

          <div className="mb-8 grid grid-cols-1 gap-5 border-y border-brand-blush py-5 sm:grid-cols-2">
            <div>
              <h4 className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-brand-black">
                <ThumbsUp size={12} className="text-green-600" /> Why it works
              </h4>
              <ul className="space-y-2 text-xs leading-relaxed text-brand-black/60">
                <li>Elevated everyday aesthetic</li>
                <li>Strong value for the price</li>
                <li>Pinterest-friendly styling potential</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-brand-black">
                <ThumbsDown size={12} className="text-red-600" /> Keep in mind
              </h4>
              <ul className="space-y-2 text-xs leading-relaxed text-brand-black/60">
                <li>Popular finds can sell out quickly</li>
                <li>Check sizing, finishes, or dimensions</li>
              </ul>
            </div>
          </div>

          <Link
            href={product.amazonLink || product.affiliateLink || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary mt-auto flex items-center justify-center gap-2 text-center"
          >
            Shop the Find <ShoppingCart size={14} />
          </Link>
        </div>
      </div>
    </aside>
  );
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  await connection();
  const { slug } = await params;
  const post = await getPost(slug);
  const isAdmin = await isAdminAuthenticated();

  if (!post || !post.isPublished) {
    notFound();
  }

  const paragraphs = getParagraphs(post.content);
  const readingTime = calculateReadingTime(
    [post.title, post.excerpt, post.metaDescription, post.content, ...post.products.map((product) => product.viralTrendNotes)].join(' ')
  );
  const featuredProduct =
    post.products.find((product) => product.imageUrl === post.featuredImage) || post.products[0];
  const featuredProductImage = post.featuredImage || featuredProduct?.imageUrl;

  return (
    <article className="pb-20">
      <BlogArticleHeader
        category={post.category.name}
        title={post.title}
        publishedAt={post.createdAt}
        readingTime={readingTime}
      />

      <div className="container mx-auto max-w-3xl px-4 pt-12 md:pt-16">
        {isAdmin && (
          <div className="not-prose mb-8 rounded-sm border border-brand-blush bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-brand-gold">Admin Pinterest Workflow</p>
                <p className="mt-1 text-sm text-brand-black/60">Generate three approval-based pin drafts for this post before publishing.</p>
              </div>
              <CreatePinsButton blogPostId={post.id} className="btn-primary px-4 py-2 text-xs" />
            </div>
          </div>
        )}
        <div className="prose prose-brand max-w-none text-brand-black/80">
          {(post.excerpt || post.metaDescription) && (
            <p className="text-xl font-light italic leading-9 text-brand-black/70 md:text-2xl md:leading-10">
              {post.excerpt || post.metaDescription}
            </p>
          )}

          {paragraphs.length > 0 ? (
            <div className="space-y-7 text-[1.05rem] leading-8 text-brand-black/75 md:text-lg md:leading-9">
              {paragraphs.map((paragraph, paragraphIndex) => (
                <div key={`${paragraph.slice(0, 24)}-${paragraphIndex}`}>
                  <p className="whitespace-pre-wrap">{paragraph}</p>
                  {paragraphIndex === 0 && (
                    <FeaturedProductImageCard
                      imageUrl={featuredProductImage}
                      title={post.title}
                      product={featuredProduct}
                    />
                  )}
                  {post.products.map((product, productIndex) =>
                    getProductInsertIndex(paragraphs.length, productIndex, post.products.length) === paragraphIndex ? (
                      <InlineProductCard key={product.id} product={product} index={productIndex} />
                    ) : null
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="not-prose">
              <FeaturedProductImageCard
                imageUrl={featuredProductImage}
                title={post.title}
                product={featuredProduct}
              />
              {post.products.map((product, productIndex) => (
                <InlineProductCard key={product.id} product={product} index={productIndex} />
              ))}
            </div>
          )}

          <div className="not-prose my-12 border-l-2 border-brand-gold bg-brand-blush/20 p-8">
            <h3 className="mb-4 text-xl text-brand-black">Worth It?</h3>
            <p className="text-sm italic leading-relaxed text-brand-black/80">
              &ldquo;If you&rsquo;re looking for an easy way to elevate your lifestyle without a major splurge, these pieces are selected for that pretty-meets-practical sweet spot.&rdquo;
            </p>
          </div>
        </div>

        <section className="mt-20 border-y border-brand-blush py-12 text-center">
          <div className="mx-auto mb-6 h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-brand-nude shadow-sm">
            <img
              src="https://getrevivedental.squarespace.com/config/asset-library/file-details/7ba5d435-e3df-4ad1-8aed-1cfef98fc028"
              alt="Jessica, curator of The Curated Cart"
              className="h-full w-full object-cover"
            />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-gold">
            Curated by Jessica
          </span>
          <h4 className="mt-3 text-2xl text-brand-black">Luxury-inspired finds for real life</h4>
          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-brand-black/60">
            Jessica edits the internet&apos;s prettiest practical discoveries into calm, shoppable guides for home, beauty, style, and thoughtful gifting.
          </p>
          <button className="btn-primary mt-8">Follow My Storefront</button>
        </section>
      </div>
    </article>
  );
}
