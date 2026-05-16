import Link from 'next/link';
import { ShoppingCart, Sparkles, Star, ThumbsDown, ThumbsUp } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import CreatePinsButton from '@/components/CreatePinsButton';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import BlogArticleHeader from '@/components/BlogArticleHeader';
import ProductImage from '@/components/ProductImage';

type BlogProduct = NonNullable<Awaited<ReturnType<typeof getPost>>>['products'][number];
type ProductModule =
  | { type: 'hero'; product: BlogProduct }
  | { type: 'split'; product: BlogProduct; align: 'left' | 'right' }
  | { type: 'quote' }
  | { type: 'pair'; products: BlogProduct[] }
  | { type: 'collage'; products: BlogProduct[] }
  | { type: 'masonry'; products: BlogProduct[] };

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

function buildProductModules(products: BlogProduct[]): ProductModule[] {
  const modules: ProductModule[] = [];
  const remaining = [...products];

  const hero = remaining.shift();
  if (hero) {
    modules.push({ type: 'hero', product: hero });
  }

  const splitLeft = remaining.shift();
  if (splitLeft) {
    modules.push({ type: 'split', product: splitLeft, align: 'left' });
  }

  if (products.length > 1) {
    modules.push({ type: 'quote' });
  }

  const pair = remaining.splice(0, 2);
  if (pair.length > 0) {
    modules.push({ type: 'pair', products: pair });
  }

  const splitRight = remaining.shift();
  if (splitRight) {
    modules.push({ type: 'split', product: splitRight, align: 'right' });
  }

  const collage = remaining.splice(0, 3);
  if (collage.length > 0) {
    modules.push({ type: 'collage', products: collage });
  }

  if (remaining.length > 0) {
    modules.push({ type: 'masonry', products: remaining });
  }

  return modules;
}

function getModuleInsertIndex(paragraphCount: number, moduleIndex: number, moduleCount: number) {
  if (paragraphCount === 0) {
    return 0;
  }

  return Math.min(
    paragraphCount - 1,
    Math.max(0, Math.floor(((moduleIndex + 1) * paragraphCount) / (moduleCount + 1)))
  );
}

function StarRating() {
  return (
    <div className="flex text-brand-gold" aria-label="Five star rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} size={12} fill="currentColor" />
      ))}
    </div>
  );
}

function ProductImageFrame({
  product,
  className = '',
  imageClassName = '',
  priority = false,
}: {
  product: BlogProduct;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
}) {
  return (
    <div className={`group relative ${className}`}>
      <div className="absolute -inset-3 rounded-[2rem] bg-white/45 shadow-[0_24px_70px_rgba(197,160,89,0.16)] backdrop-blur-xl transition-transform duration-500 group-hover:rotate-1 md:-inset-5" />
      <div className="absolute -left-5 top-10 h-28 w-28 rounded-full bg-brand-blush/80 blur-2xl" />
      <div className="absolute -bottom-7 -right-6 h-32 w-32 rounded-full bg-brand-gold/15 blur-2xl" />
      <div className="relative overflow-hidden rounded-[1.75rem] bg-brand-nude shadow-[0_28px_60px_rgba(26,26,26,0.13)] ring-1 ring-white/80">
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          className={`h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 ${imageClassName}`}
        />
      </div>
      {priority && (
        <div className="absolute -right-4 top-8 hidden rounded-full border border-white/80 bg-white/70 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-brand-black/60 shadow-sm backdrop-blur md:block">
          Editor loved
        </div>
      )}
    </div>
  );
}

function ProductDetails({ product, index, compact = false }: { product: BlogProduct; index: number; compact?: boolean }) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-5 flex items-center justify-between gap-4">
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-gold">
          Editor&apos;s Pick No. {index + 1}
        </span>
        <StarRating />
      </div>

      <h3 className={`${compact ? 'text-2xl md:text-3xl' : 'text-3xl md:text-5xl'} leading-[1.02] text-brand-black`}>
        {product.name}
      </h3>
      <p className="mt-5 text-sm leading-7 text-brand-black/65 md:text-base md:leading-8">
        {product.viralTrendNotes ||
          'A polished, practical find selected for its elevated look, everyday usefulness, and giftable appeal.'}
      </p>

      <div className="my-7 grid grid-cols-1 gap-4 border-y border-brand-blush/80 py-5 sm:grid-cols-2">
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
        className="btn-primary mt-auto inline-flex items-center justify-center gap-2 rounded-full px-7 py-3 text-center"
      >
        Shop the Find <ShoppingCart size={14} />
      </Link>
    </div>
  );
}

function EditorialQuoteBlock() {
  return (
    <aside className="not-prose relative mx-auto my-16 max-w-4xl overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#fffaf6_0%,#fdf2f0_56%,#f5ebe0_100%)] px-7 py-10 text-center shadow-[0_24px_70px_rgba(197,160,89,0.13)] md:my-24 md:px-14 md:py-14">
      <div className="absolute left-8 top-8 h-20 w-20 rounded-full bg-white/70 blur-2xl" />
      <Sparkles className="mx-auto mb-5 text-brand-gold" size={20} />
      <p className="mx-auto max-w-2xl font-serif text-3xl leading-tight text-brand-black md:text-5xl md:leading-[1.05]">
        &ldquo;This is the kind of hair care that makes getting ready feel expensive.&rdquo;
      </p>
      <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.32em] text-brand-black/45">
        The beauty editor mood
      </p>
    </aside>
  );
}

function HeroProductSection({ product }: { product: BlogProduct }) {
  return (
    <section className="not-prose relative my-16 overflow-hidden rounded-[2.25rem] bg-brand-black text-brand-cream shadow-[0_32px_90px_rgba(26,26,26,0.18)] md:my-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(197,160,89,0.34),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(253,242,240,0.18),transparent_30%)]" />
      <div className="relative grid items-center gap-10 p-6 md:grid-cols-[1.08fr_0.92fr] md:p-10 lg:p-14">
        <ProductImageFrame
          product={product}
          priority
          className="-ml-1 md:-ml-12 md:-my-4"
          imageClassName="aspect-[4/5] md:aspect-[5/4]"
        />
        <div className="md:py-8">
          <div className="mb-6 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.32em] text-brand-gold">
            <span className="h-px w-10 bg-brand-gold/60" />
            Favorite pick
          </div>
          <h2 className="font-serif text-4xl leading-[0.98] md:text-6xl lg:text-7xl">
            The piece that sets the tone.
          </h2>
          <p className="mt-6 max-w-md text-sm leading-7 text-brand-cream/70 md:text-base md:leading-8">
            The first add-to-cart moment should feel like opening a beauty editor&apos;s private shelf: sculptural, useful, and a little indulgent.
          </p>
          <div className="mt-8 rounded-[1.5rem] border border-white/70 bg-brand-cream/95 p-5 text-brand-black shadow-lg backdrop-blur">
            <ProductDetails product={product} index={0} compact />
          </div>
        </div>
      </div>
    </section>
  );
}

function SplitProductSection({ product, index, align }: { product: BlogProduct; index: number; align: 'left' | 'right' }) {
  const image = (
    <ProductImageFrame
      product={product}
      className={align === 'left' ? 'md:-ml-8' : 'md:-mr-8'}
      imageClassName="aspect-[3/4] md:aspect-[4/5]"
    />
  );
  const copy = (
    <div className="rounded-[2rem] border border-white/80 bg-white/70 p-6 shadow-[0_24px_70px_rgba(197,160,89,0.11)] backdrop-blur md:p-9">
      <ProductDetails product={product} index={index} />
    </div>
  );

  return (
    <section className="not-prose my-16 grid items-center gap-8 md:my-24 md:grid-cols-2 md:gap-12">
      {align === 'left' ? image : copy}
      {align === 'left' ? copy : image}
    </section>
  );
}

function PairProductGrid({ products, startIndex }: { products: BlogProduct[]; startIndex: number }) {
  return (
    <section className="not-prose my-16 rounded-[2.25rem] bg-white/55 p-5 shadow-[0_20px_70px_rgba(197,160,89,0.1)] ring-1 ring-brand-blush/80 md:my-24 md:p-9">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-brand-gold">Two-shelf edit</p>
          <h2 className="mt-3 font-serif text-4xl leading-none text-brand-black md:text-6xl">Pretty, practical, paired.</h2>
        </div>
        <p className="max-w-sm text-sm leading-7 text-brand-black/55">
          A side-by-side moment for finds that work beautifully together without feeling overly matched.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 md:gap-8">
        {products.map((product, offset) => (
          <article key={product.id} className={offset % 2 === 1 ? 'md:pt-16' : ''}>
            <ProductImageFrame product={product} imageClassName="aspect-[4/5]" />
            <div className="mt-8 rounded-[1.75rem] bg-brand-cream/80 p-6">
              <ProductDetails product={product} index={startIndex + offset} compact />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function FloatingCollageSection({ products, startIndex }: { products: BlogProduct[]; startIndex: number }) {
  return (
    <section className="not-prose my-16 overflow-hidden rounded-[2.5rem] bg-[linear-gradient(160deg,#fdf2f0_0%,#fcfaf7_52%,#f5ebe0_100%)] p-6 md:my-24 md:p-10 lg:p-12">
      <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-brand-gold">The vanity tray</p>
          <h2 className="mt-4 font-serif text-4xl leading-[0.98] text-brand-black md:text-6xl">
            A floating collage of little luxuries.
          </h2>
          <p className="mt-6 text-sm leading-7 text-brand-black/60 md:text-base md:leading-8">
            This section is designed to feel saved from a Pinterest board: layered images, soft movement, and products that create a whole mood together.
          </p>
        </div>
        <div className="grid auto-rows-[minmax(160px,auto)] grid-cols-2 gap-4 md:gap-6">
          {products.map((product, offset) => (
            <article
              key={product.id}
              className={`rounded-[2rem] border border-white/80 bg-white/65 p-3 shadow-[0_24px_60px_rgba(197,160,89,0.12)] backdrop-blur ${
                offset === 0 ? 'col-span-2 md:col-span-1 md:row-span-2 md:-ml-4' : offset === 1 ? 'md:mr-8' : 'col-span-2 md:col-span-1 md:-mt-8 md:ml-10'
              }`}
            >
              <ProductImage
                src={product.imageUrl}
                alt={product.name}
                className={`w-full rounded-[1.5rem] object-cover shadow-sm transition-transform duration-700 hover:scale-[1.03] ${
                  offset === 0 ? 'aspect-[4/5] h-full' : 'aspect-[5/4]'
                }`}
              />
              <div className="p-4">
                <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-brand-gold">
                  Pick {startIndex + offset + 1}
                </span>
                <h3 className="mt-2 font-serif text-xl leading-tight text-brand-black">{product.name}</h3>
                <Link
                  href={product.amazonLink || product.affiliateLink || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex text-[10px] font-bold uppercase tracking-[0.24em] text-brand-black underline decoration-brand-gold/50 underline-offset-4 transition-colors hover:text-brand-gold"
                >
                  Shop the edit
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function MasonryProductGrid({ products, startIndex }: { products: BlogProduct[]; startIndex: number }) {
  return (
    <section className="not-prose my-16 md:my-24">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-brand-gold">More to adore</p>
        <h2 className="mt-4 font-serif text-4xl leading-none text-brand-black md:text-6xl">The finishing touches.</h2>
      </div>
      <div className="columns-1 gap-6 md:columns-2 lg:columns-3">
        {products.map((product, offset) => (
          <article
            key={product.id}
            className="mb-6 break-inside-avoid overflow-hidden rounded-[2rem] border border-brand-blush/80 bg-white/75 p-4 shadow-[0_18px_55px_rgba(197,160,89,0.1)] backdrop-blur transition-transform duration-300 hover:-translate-y-1"
          >
            <ProductImage
              src={product.imageUrl}
              alt={product.name}
              className={`w-full rounded-[1.5rem] object-cover transition-transform duration-700 hover:scale-[1.03] ${offset % 3 === 1 ? 'aspect-[1/1]' : 'aspect-[4/5]'}`}
            />
            <div className="p-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-brand-gold">
                Editor&apos;s Pick No. {startIndex + offset + 1}
              </span>
              <h3 className="mt-3 font-serif text-2xl leading-tight text-brand-black">{product.name}</h3>
              <p className="mt-3 text-sm leading-6 text-brand-black/60">
                {product.viralTrendNotes || 'A refined detail that makes the whole edit feel more intentional.'}
              </p>
              <Link
                href={product.amazonLink || product.affiliateLink || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary mt-5 inline-flex rounded-full px-5 py-2"
              >
                Shop
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ProductModuleRenderer({ module, moduleIndex }: { module: ProductModule; moduleIndex: number }) {
  const startingIndexByType = {
    hero: 0,
    split: moduleIndex === 1 ? 1 : 4,
    pair: 2,
    collage: 5,
    masonry: 8,
    quote: 0,
  } as const;

  if (module.type === 'hero') {
    return <HeroProductSection product={module.product} />;
  }

  if (module.type === 'split') {
    return <SplitProductSection product={module.product} index={startingIndexByType.split} align={module.align} />;
  }

  if (module.type === 'quote') {
    return <EditorialQuoteBlock />;
  }

  if (module.type === 'pair') {
    return <PairProductGrid products={module.products} startIndex={startingIndexByType.pair} />;
  }

  if (module.type === 'collage') {
    return <FloatingCollageSection products={module.products} startIndex={startingIndexByType.collage} />;
  }

  return <MasonryProductGrid products={module.products} startIndex={startingIndexByType.masonry} />;
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
  const productModules = buildProductModules(post.products);
  const readingTime = calculateReadingTime(
    [post.title, post.excerpt, post.metaDescription, post.content, ...post.products.map((product) => product.viralTrendNotes)].join(' ')
  );

  return (
    <article className="overflow-hidden pb-20">
      <BlogArticleHeader
        category={post.category.name}
        title={post.title}
        publishedAt={post.createdAt}
        readingTime={readingTime}
      />

      <div className="container mx-auto max-w-6xl px-4 pt-12 md:pt-16">
        {isAdmin && (
          <div className="not-prose mx-auto mb-8 max-w-3xl rounded-2xl border border-brand-blush bg-white/80 p-4 shadow-sm backdrop-blur">
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
            <p className="mx-auto max-w-3xl text-center text-2xl font-light italic leading-10 text-brand-black/70 md:text-3xl md:leading-[1.45]">
              {post.excerpt || post.metaDescription}
            </p>
          )}

          {post.featuredImage && (
            <figure className="not-prose relative mx-auto my-12 max-w-5xl md:my-20">
              <div className="absolute -left-8 top-10 h-36 w-36 rounded-full bg-brand-blush/80 blur-3xl" />
              <div className="absolute -right-8 bottom-6 h-40 w-40 rounded-full bg-brand-gold/15 blur-3xl" />
              <div className="relative overflow-hidden rounded-[2.25rem] bg-white/60 p-3 shadow-[0_30px_90px_rgba(197,160,89,0.14)] ring-1 ring-white/80 backdrop-blur">
                <ProductImage
                  src={post.featuredImage}
                  alt={post.title}
                  className="aspect-[4/5] w-full rounded-[1.75rem] object-cover md:aspect-[16/9]"
                />
              </div>
              <figcaption className="px-2 py-5 text-center text-[10px] font-bold uppercase tracking-[0.28em] text-brand-black/40">
                Curated inspiration for this edit
              </figcaption>
            </figure>
          )}

          {paragraphs.length > 0 ? (
            <div className="space-y-8 text-[1.05rem] leading-8 text-brand-black/75 md:text-lg md:leading-9">
              {paragraphs.map((paragraph, paragraphIndex) => (
                <div key={`${paragraph.slice(0, 24)}-${paragraphIndex}`}>
                  <p className="mx-auto max-w-3xl whitespace-pre-wrap">{paragraph}</p>
                  {productModules.map((module, moduleIndex) =>
                    getModuleInsertIndex(paragraphs.length, moduleIndex, productModules.length) === paragraphIndex ? (
                      <ProductModuleRenderer key={`${module.type}-${moduleIndex}`} module={module} moduleIndex={moduleIndex} />
                    ) : null
                  )}
                </div>
              ))}
            </div>
          ) : (
            productModules.length > 0 && (
              <div className="not-prose">
                {productModules.map((module, moduleIndex) => (
                  <ProductModuleRenderer key={`${module.type}-${moduleIndex}`} module={module} moduleIndex={moduleIndex} />
                ))}
              </div>
            )
          )}

          <div className="not-prose mx-auto my-16 max-w-4xl rounded-[2rem] border border-white/80 bg-white/65 p-8 text-center shadow-[0_24px_70px_rgba(197,160,89,0.12)] backdrop-blur md:my-24 md:p-12">
            <span className="text-[10px] font-bold uppercase tracking-[0.32em] text-brand-gold">Worth it?</span>
            <h3 className="mt-4 text-3xl leading-tight text-brand-black md:text-5xl">The quiet-luxury verdict</h3>
            <p className="mx-auto mt-5 max-w-2xl text-sm italic leading-7 text-brand-black/70 md:text-base md:leading-8">
              &ldquo;If you&rsquo;re looking for an easy way to elevate your lifestyle without a major splurge, these pieces are selected for that pretty-meets-practical sweet spot.&rdquo;
            </p>
          </div>
        </div>

        <section className="mt-20 rounded-[2.25rem] border border-white/80 bg-[linear-gradient(135deg,#fff_0%,#fdf2f0_100%)] px-6 py-12 text-center shadow-[0_24px_70px_rgba(197,160,89,0.11)] md:px-10">
          <div className="mx-auto mb-6 h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-brand-nude shadow-sm">
            <ProductImage
              src="https://res.cloudinary.com/dt7s4c04l/image/upload/v1778858976/Curated_edpgwe.png"
              alt="Jessica, curator of The Curated Cart"
              className="h-full w-full object-cover"
            />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-gold">
            Curated by Jessica
          </span>
          <h4 className="mt-3 text-2xl text-brand-black md:text-4xl">Luxury-inspired finds for real life</h4>
          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-brand-black/60">
            Jessica edits the internet&apos;s prettiest practical discoveries into calm, shoppable guides for home, beauty, style, and thoughtful gifting.
          </p>
          <button className="btn-primary mt-8 rounded-full">Follow My Storefront</button>
        </section>
      </div>
    </article>
  );
}
