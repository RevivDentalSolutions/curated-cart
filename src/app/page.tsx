import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { connection } from 'next/server';
import ProductImage from '@/components/ProductImage';
import AffiliateDisclosureNotice from '@/components/AffiliateDisclosureNotice';
import { prisma } from '@/lib/prisma';
import { buildCategoryCards, getCategoryImage } from '@/lib/categories';
import { withAmazonAssociatesTag } from '@/lib/affiliate';
import { fallbackCategories, fallbackFeaturedFinds, fallbackLatestPosts } from '@/lib/homepage-fallback';

export const dynamic = 'force-dynamic';

export default async function Home() {
  await connection();

  const hasDatabase = Boolean(process.env.DATABASE_URL);
  const [categorySources, featuredFinds, latestPosts] = hasDatabase
    ? await Promise.all([
        prisma.category.findMany({ include: { products: { where: { published: true }, select: { id: true } } }, take: 8 }),
        prisma.product.findMany({
          where: { published: true },
          select: {
            id: true,
            name: true,
            imageUrl: true,
            affiliateLink: true,
            amazonLink: true,
            viralTrendNotes: true,
            contentIdea: true,
            category: { select: { name: true } },
          },
          take: 6,
          orderBy: { dateAdded: 'desc' },
        }),
        prisma.blogPost.findMany({ where: { isPublished: true }, include: { category: true }, take: 3, orderBy: { createdAt: 'desc' } }),
      ])
    : [fallbackCategories, fallbackFeaturedFinds, fallbackLatestPosts];

  const categories = buildCategoryCards(categorySources);

  return (
    <div className="flex flex-col gap-20 pb-20">
      <section className="bg-brand-nude/30 py-24 text-center">
        <div className="container mx-auto px-4">
          <span className="text-sm uppercase tracking-[0.4em] text-brand-gold">Pretty finds. Practical buys.</span>
          <h1 className="mt-5 text-5xl md:text-7xl font-serif tracking-tighter text-brand-black">The Curated Cart</h1>
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-brand-black/65">
            Curated Amazon-style shopping guides for home, beauty, fashion, gifts, and everyday upgrades — with clear affiliate disclosure and no unsupported price claims.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/top-picks" className="btn-primary">Shop Featured Finds</Link>
            <Link href="/blog" className="btn-outline">Read Buying Guides</Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4">
        <AffiliateDisclosureNotice className="mb-6" />
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <span className="text-brand-gold uppercase tracking-[0.2em] text-[10px] font-bold">Featured Finds</span>
            <h2 className="text-4xl font-serif mt-2 text-brand-black">Fresh Curated Picks</h2>
          </div>
          <Link href="/top-picks" className="nav-link flex items-center gap-2">View All <ArrowRight size={14} /></Link>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {featuredFinds.map((item) => (
            <article key={item.id} className="luxury-card group overflow-hidden">
              <div className="relative aspect-[4/5] overflow-hidden bg-brand-cream">
                <ProductImage src={item.imageUrl} alt={item.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="p-6">
                <span className="text-[10px] uppercase tracking-widest text-brand-gold font-bold">{item.category.name}</span>
                <h3 className="mt-2 font-serif text-xl text-brand-black">{item.name}</h3>
                <p className="mt-3 min-h-12 text-sm leading-6 text-brand-black/65">{'description' in item ? item.description : item.viralTrendNotes || item.contentIdea || 'A hand-picked find selected for The Curated Cart readers.'}</p>
                <a href={withAmazonAssociatesTag(item.affiliateLink || item.amazonLink)} target="_blank" rel="sponsored noopener noreferrer" className="btn-primary mt-5 block py-3 text-center text-[10px]">Shop the Find</a>
              </div>
            </article>
          ))}
        </div>
        {featuredFinds.length === 0 && <div className="text-center py-20 bg-brand-cream/30 italic text-brand-black/40">Fresh finds coming soon.</div>}
      </section>

      <section className="bg-brand-blush/20 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="text-4xl font-serif text-brand-black">Shop by Category</h2>
            <div className="mt-4 h-0.5 w-20 bg-brand-gold mx-auto" />
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {categories.map((cat) => (
              <Link href={cat.href} key={cat.slug} className="group relative aspect-[4/5] overflow-hidden bg-brand-cream rounded-sm shadow-sm">
                <ProductImage src={cat.image} alt={`${cat.name} curated category`} className="h-full w-full object-cover opacity-85 transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-brand-black/75 to-transparent p-4">
                  <div><span className="text-[9px] font-bold uppercase tracking-[0.2em] text-brand-gold">{cat.itemCount} items</span><h3 className="mt-2 text-sm font-bold uppercase tracking-widest text-white">{cat.name}</h3></div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <span className="text-brand-gold uppercase tracking-[0.2em] text-[10px] font-bold">Guides</span>
            <h2 className="text-4xl font-serif mt-2 text-brand-black">Latest Blog Posts</h2>
          </div>
          <Link href="/blog" className="nav-link flex items-center gap-2">Read More <ArrowRight size={14} /></Link>
        </div>
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {latestPosts.map((post) => (
            <Link href={`/blog/${post.slug}`} key={post.id} className="group">
              <div className="aspect-[16/9] overflow-hidden bg-brand-nude">
                <ProductImage src={post.featuredImage || getCategoryImage(post.category.name)} alt={post.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <span className="mt-5 block text-[10px] uppercase tracking-[0.2em] text-brand-gold font-bold">{post.category.name}</span>
              <h3 className="mt-2 text-2xl font-serif text-brand-black group-hover:text-brand-gold">{post.title}</h3>
              <p className="mt-3 text-sm leading-6 text-brand-black/65">{post.excerpt || post.metaDescription}</p>
            </Link>
          ))}
        </div>
        {latestPosts.length === 0 && <div className="text-center py-20 bg-brand-cream/30 italic text-brand-black/40">Buying guides coming soon.</div>}
      </section>

      <section className="bg-brand-black py-20 text-center">
        <div className="container mx-auto max-w-2xl px-4">
          <h2 className="text-brand-cream text-4xl font-serif">Join the Weekly Cart Drop</h2>
          <p className="mt-4 text-sm text-brand-gold/80">Email signup placeholder for future newsletter integration.</p>
          <form className="mt-8 flex flex-col gap-4 md:flex-row">
            <input type="email" placeholder="Your email address" className="flex-grow bg-white px-6 py-4 text-sm text-brand-black" />
            <button className="btn-primary py-4">Join the List</button>
          </form>
        </div>
      </section>
    </div>
  );
}
