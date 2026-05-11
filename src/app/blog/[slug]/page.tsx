import Link from 'next/link';
import { ShoppingCart, Star, ThumbsUp, ThumbsDown } from 'lucide-react';
import { prisma } from '@/lib/prisma';
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

  if (!post || !post.isPublished) {
    notFound();
  }

  const paragraphs = getParagraphs(post.content);
  const readingTime = calculateReadingTime(
    [post.title, post.excerpt, post.metaDescription, post.content, ...post.products.map((product) => product.viralTrendNotes)].join(' ')
  );

  return (
    <article className="pb-20">
      <BlogArticleHeader
        category={post.category.name}
        title={post.title}
        publishedAt={post.createdAt}
        readingTime={readingTime}
      />

      <div className="container mx-auto max-w-3xl px-4 pt-12 md:pt-16">
        <div className="prose prose-brand max-w-none text-brand-black/80">
          {(post.excerpt || post.metaDescription) && (
            <p className="text-xl font-light italic leading-9 text-brand-black/70 md:text-2xl md:leading-10">
              {post.excerpt || post.metaDescription}
            </p>
          )}

          {post.featuredImage && (
            <figure className="not-prose my-10 overflow-hidden border border-brand-blush bg-white p-3 shadow-sm md:my-14">
              <img
                src={post.featuredImage}
                alt={post.title}
                className="aspect-[4/5] w-full object-cover md:aspect-[16/10]"
              />
              <figcaption className="px-2 py-4 text-center text-[10px] font-bold uppercase tracking-[0.24em] text-brand-black/40">
                Curated inspiration for this edit
              </figcaption>
            </figure>
          )}

          {paragraphs.length > 0 ? (
            <div className="space-y-7 text-[1.05rem] leading-8 text-brand-black/75 md:text-lg md:leading-9">
              {paragraphs.map((paragraph, paragraphIndex) => (
                <div key={`${paragraph.slice(0, 24)}-${paragraphIndex}`}>
                  <p className="whitespace-pre-wrap">{paragraph}</p>
                  {post.products.map((product, productIndex) =>
                    getProductInsertIndex(paragraphs.length, productIndex, post.products.length) === paragraphIndex ? (
                      <InlineProductCard key={product.id} product={product} index={productIndex} />
                    ) : null
                  )}
                </div>
              ))}
            </div>
          ) : (
            post.products.length > 0 && (
              <div className="not-prose">
                {post.products.map((product, productIndex) => (
                  <InlineProductCard key={product.id} product={product} index={productIndex} />
                ))}
              </div>
            )
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
