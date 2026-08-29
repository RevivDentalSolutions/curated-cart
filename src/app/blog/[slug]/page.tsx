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
import { isPublicBlogPost, publicBlogPostWhere } from '@/lib/blog-visibility';
import { isAdminAuthenticated } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

type GuideProduct = {
  id: string;
  name: string;
  imageUrl: string | null;
  affiliateLink: string | null;
  amazonLink: string | null;
  categoryName: string | null;
};

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
  const url = `https://www.shopthecuratedcart.com/blog/${post.slug}`;
  return {
    title,
    description,
    robots: isDraftPreview ? { index: false, follow: false } : undefined,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      images: post.featuredImage ? [{ url: post.featuredImage, alt: post.title }] : undefined,
    },
    twitter: { card: 'summary_large_image', title, description, images: post.featuredImage ? [post.featuredImage] : undefined },
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

  // The production database predates Product.description. Read only the
  // product fields needed to render a guide so recovered posts remain usable.
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

  const relatedPosts = process.env.DATABASE_URL
    ? await prisma.blogPost.findMany({
        where: { ...publicBlogPostWhere, id: { not: post.id }, category: { name: post.category.name } },
        include: { category: true },
        take: 3,
        orderBy: { createdAt: 'desc' },
      })
    : fallbackLatestPosts.filter((item) => item.slug !== slug).slice(0, 3);

  const paragraphs = (post.content || post.excerpt || '')
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const productMatch = (paragraph: string) => {
    const normalizedParagraph = paragraph.toLowerCase().replace(/[^a-z0-9]/g, '');
    const paragraphTokens = new Set(paragraph.toLowerCase().match(/[a-z0-9]+/g)?.filter((token) => token.length > 2) || []);
    return products.find((product) => {
      const normalizedName = product.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const nameTokens = new Set(product.name.toLowerCase().match(/[a-z0-9]+/g)?.filter((token) => token.length > 2) || []);
      const sharedTokens = [...paragraphTokens].filter((token) => nameTokens.has(token)).length;
      return normalizedParagraph.length > 7 && (
        normalizedName.includes(normalizedParagraph) ||
        normalizedParagraph.includes(normalizedName) ||
        sharedTokens >= Math.min(3, paragraphTokens.size)
      );
    });
  };
  const hasProductStructuredCopy = paragraphs.some((paragraph) => Boolean(productMatch(paragraph)));
  const introCount = hasProductStructuredCopy ? 1 : 2;
  const intro = paragraphs.slice(0, introCount);
  const body = paragraphs.slice(introCount);
  const sectionNames = slug === 'neutral-luxury-kitchen-finds-2'
    ? ['The Foundation', 'The Countertop Edit', 'Everyday Luxuries', 'Cookware Worth Displaying', 'The Finishing Touches']
    : ['Set the Mood', 'The Editor’s Picks', 'Everyday Upgrades', 'Worth a Closer Look', 'The Finishing Touches'];
  const consumedParagraphs = new Set<number>();
  const highlights = body.flatMap((paragraph, index) => {
    if (consumedParagraphs.has(index)) return [];
    const product = productMatch(paragraph);
    if (!product) return [];
    consumedParagraphs.add(index);
    const commentary = body[index + 1];
    if (commentary) consumedParagraphs.add(index + 1);
    return [{ product, commentary }];
  });
  const featureHighlights = (highlights.length > 0 ? highlights : products.map((product) => ({ product, commentary: undefined }))).slice(0, 5);
  const miniHighlights = highlights.slice(5);
  const remainingEditorialCopy = body.filter((_, index) => !consumedParagraphs.has(index));
  const articleUrl = `https://www.shopthecuratedcart.com/blog/${post.slug}`;
  const editorialHero = slug === 'neutral-luxury-kitchen-finds-2'
    ? '/neutral-luxury-kitchen-editorial-hero.webp'
    : post.featuredImage || getCategoryImage(post.category.name);
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.metaDescription || post.excerpt || undefined,
    image: post.featuredImage || undefined,
    datePublished: post.createdAt,
    dateModified: post.updatedAt,
    mainEntityOfPage: articleUrl,
    publisher: { '@type': 'Organization', name: 'The Curated Cart', url: 'https://www.shopthecuratedcart.com' },
  };
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.shopthecuratedcart.com' },
      { '@type': 'ListItem', position: 2, name: 'The Library', item: 'https://www.shopthecuratedcart.com/blog' },
      { '@type': 'ListItem', position: 3, name: post.title, item: articleUrl },
    ],
  };

  return (
    <article className="editorial-article text-brand-black">
      {isDraftPreview && !isPublicBlogPost(post) && (
        <div className="border-b border-brand-gold/30 bg-brand-cream px-4 py-3 text-center text-[10px] font-bold uppercase tracking-[0.22em] text-brand-black">
          Draft preview — this post is not public yet
        </div>
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <header className="container mx-auto max-w-6xl px-4 pt-10 md:pt-16">
        <Link href="/blog" className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-gold">← The Library</Link>
        <span className="mt-10 block text-[10px] font-bold uppercase tracking-[0.3em] text-brand-gold">{post.category.name}</span>
        <h1 className="mt-4 max-w-4xl text-4xl font-serif leading-[1.03] tracking-tighter md:text-7xl">{post.title}</h1>
        {post.excerpt && <p className="mt-6 max-w-2xl text-base leading-7 text-brand-black/65 md:text-lg">{post.excerpt}</p>}
      </header>
      {editorialHero && (
        <div className="mx-auto mt-10 aspect-[4/3] max-h-[440px] max-w-5xl overflow-hidden bg-brand-cream md:aspect-[16/7]">
          <ProductImage src={editorialHero} alt={`A curated neutral luxury kitchen featuring cookware, glass storage, utensils, and countertop finds`} className="h-full w-full object-cover" fetchPriority="high" />
        </div>
      )}
      <div className="container mx-auto max-w-3xl px-5 py-12 md:py-16">
        <AffiliateDisclosureNotice className="mb-10" />
        <div className="editorial-intro">
          {intro.length > 0 ? intro.map((paragraph, index) => <p key={`${paragraph}-${index}`}>{paragraph}</p>) : <p>{post.excerpt || post.metaDescription}</p>}
        </div>
      </div>

      {featureHighlights.map(({ product, commentary }, index) => {
        const reverse = index % 2 === 1;
        return (
          <section key={product.id} className={`editorial-feature ${reverse ? 'editorial-feature-reverse' : ''}`}>
            <div className="editorial-feature-image">
              <ProductImage src={product.imageUrl} alt={product.name} className="h-full w-full object-contain p-8 md:p-14" loading="lazy" />
            </div>
            <div className="editorial-feature-copy">
              <span>{String(index + 1).padStart(2, '0')} / The Curated Edit</span>
              <h2>{sectionNames[index]}</h2>
              <h3>{product.name}</h3>
              {commentary && <p>{commentary}</p>}
              <a href={withAmazonAssociatesTag(product.affiliateLink || product.amazonLink)} target="_blank" rel="sponsored noopener noreferrer">Shop this find →</a>
            </div>
          </section>
        );
      })}

      {miniHighlights.length > 0 && (
        <section className="container mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-gold">Complete the space</span>
            <h2 className="mt-3 text-4xl font-serif">The Little Luxuries</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {miniHighlights.map(({ product, commentary }) => (
              <article key={product.id} className="group">
                <div className="aspect-square overflow-hidden bg-brand-nude">
                  <ProductImage src={product.imageUrl} alt={product.name} className="h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-[1.03]" loading="lazy" />
                </div>
                <h3 className="mt-5 text-2xl font-serif leading-tight">{product.name}</h3>
                {commentary && <p className="mt-3 text-sm leading-6 text-brand-black/65">{commentary}</p>}
                <a href={withAmazonAssociatesTag(product.affiliateLink || product.amazonLink)} target="_blank" rel="sponsored noopener noreferrer" className="mt-4 inline-block border-b border-brand-gold pb-1 text-[10px] font-bold uppercase tracking-[0.16em]">Shop this find →</a>
              </article>
            ))}
          </div>
        </section>
      )}

      {remainingEditorialCopy.length > 0 && (
        <section className="container mx-auto max-w-3xl px-5 py-14 md:py-20">
          <div className="editorial-body">
            {remainingEditorialCopy.map((paragraph, index) => <p key={`${paragraph}-${index}`}>{paragraph}</p>)}
          </div>
        </section>
      )}

      {products.length > 0 && (
        <section className="bg-white py-16 md:py-24">
          <div className="container mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-gold">Everything in one place</span>
            <h2 className="mt-3 text-4xl font-serif md:text-5xl">Shop the Edit</h2>
            <p className="mt-4 text-sm leading-6 text-brand-black/60">The complete collection from this guide, curated for easy browsing.</p>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-5 md:gap-5">
            {products.map((product) => (
              <article key={product.id} className="luxury-card overflow-hidden">
                <div className="aspect-square overflow-hidden bg-brand-cream"><ProductImage src={product.imageUrl} alt={product.name} className="h-full w-full object-contain p-3" loading="lazy" /></div>
                <div className="p-4 md:p-5"><h3 className="font-serif text-base md:text-lg">{product.name}</h3><p className="mt-2 hidden text-sm text-brand-black/60 sm:block">{product.categoryName || 'Curated find'}</p><a href={withAmazonAssociatesTag(product.affiliateLink || product.amazonLink)} target="_blank" rel="sponsored noopener noreferrer" className="btn-primary mt-4 block px-2 py-3 text-center text-[9px] md:text-[10px]">Shop the Find</a></div>
              </article>
            ))}
          </div>
          </div>
        </section>
      )}

      {relatedPosts.length > 0 && (
        <section className="container mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="flex items-end justify-between gap-4 border-b border-brand-beige/60 pb-5">
            <div><span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-gold">Keep shopping</span><h2 className="mt-2 text-3xl font-serif">More Finds You’ll Love</h2></div>
            <Link href="/blog" className="nav-link">All guides →</Link>
          </div>
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            {relatedPosts.map((related) => (
              <Link href={`/blog/${related.slug}`} key={related.id} className="group">
                <div className="aspect-[4/3] overflow-hidden bg-brand-nude"><ProductImage src={related.featuredImage || getCategoryImage(related.category.name)} alt={related.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" /></div>
                <h3 className="mt-4 text-xl font-serif leading-tight group-hover:text-brand-gold">{related.title}</h3>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
