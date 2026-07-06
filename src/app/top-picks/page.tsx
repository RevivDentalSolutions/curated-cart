import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { connection } from 'next/server';
import ProductImage from '@/components/ProductImage';
import AffiliateDisclosureNotice from '@/components/AffiliateDisclosureNotice';
import { prisma } from '@/lib/prisma';
import { withAmazonAssociatesTag } from '@/lib/affiliate';
import { fallbackCategories, fallbackFeaturedFinds } from '@/lib/homepage-fallback';

export const dynamic = 'force-dynamic';

export default async function TopPicks() {
  await connection();
  const hasDatabase = Boolean(process.env.DATABASE_URL);
  const categories = hasDatabase ? await prisma.category.findMany({
    include: { products: { where: { published: true }, orderBy: { dateAdded: 'desc' } } },
  }) : fallbackCategories.map((category) => ({ ...category, products: fallbackFeaturedFinds.filter((product) => product.categoryId === category.id) }));
  const sections = categories.filter((category) => category.products.length > 0);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mb-16 text-center">
        <span className="text-brand-gold uppercase tracking-[0.3em] text-[10px] font-bold">The Best Finds</span>
        <h1 className="text-5xl font-serif mt-4 mb-6 tracking-tighter text-brand-black">Top Picks</h1>
        <p className="mx-auto max-w-lg text-sm leading-7 text-brand-black/60">Browse curated products by category. Prices are intentionally omitted unless available from an approved API.</p>
      </div>
      <AffiliateDisclosureNotice className="mb-10" />
      <div className="space-y-20">
        {sections.map((section) => (
          <section key={section.id}>
            <div className="mb-8 flex items-center gap-6"><h2 className="text-3xl font-serif text-brand-black">{section.name}</h2><div className="h-px flex-1 bg-brand-blush" /></div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {section.products.map((item) => (
                <article key={item.id} className="luxury-card overflow-hidden">
                  <div className="aspect-square overflow-hidden bg-brand-cream"><ProductImage src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" /></div>
                  <div className="p-6"><h3 className="font-serif text-xl text-brand-black">{item.name}</h3><p className="mt-3 text-sm leading-6 text-brand-black/65">{item.description || 'Curated affiliate find.'}</p><a href={withAmazonAssociatesTag(item.affiliateLink || item.amazonLink)} target="_blank" rel="sponsored noopener noreferrer" className="btn-primary mt-5 block py-3 text-center text-[10px]">Shop the Find</a></div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
      {sections.length === 0 && <div className="text-center py-20 bg-brand-cream/30 italic text-brand-black/40">We are currently hand-picking the best finds for you.</div>}
      <div className="mt-20 text-center"><Link href="/categories" className="btn-outline inline-flex items-center gap-2">Browse Categories <ArrowRight size={14} /></Link></div>
    </div>
  );
}
