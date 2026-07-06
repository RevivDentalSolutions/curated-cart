import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import ProductImage from '@/components/ProductImage';
import AffiliateDisclosureNotice from '@/components/AffiliateDisclosureNotice';
import { prisma } from '@/lib/prisma';
import { categoryNamesForSlug, getCategoryCollection, getCategoryImage, getDisplayCategoryName } from '@/lib/categories';
import { withAmazonAssociatesTag } from '@/lib/affiliate';
import { fallbackCategories, fallbackFeaturedFinds } from '@/lib/homepage-fallback';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const collection = getCategoryCollection(id);
  return { title: `${collection?.name || 'Category'} | Curated Amazon Finds` };
}

export default async function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const collection = getCategoryCollection(id);
  const hasDatabase = Boolean(process.env.DATABASE_URL);
  const category = hasDatabase
    ? collection
      ? await prisma.category.findFirst({ where: { name: { in: categoryNamesForSlug(collection.slug) } } })
      : await prisma.category.findUnique({ where: { id } })
    : fallbackCategories.find((cat) => cat.id === id || getCategoryCollection(id)?.slug === collection?.slug) || null;

  if (!category && !collection) notFound();

  const displayName = collection?.name || getDisplayCategoryName(category!.name);
  const categoryNames = collection ? categoryNamesForSlug(collection.slug) : [category!.name];
  const products = hasDatabase ? await prisma.product.findMany({
    where: { published: true, category: { name: { in: categoryNames } } },
    orderBy: { dateAdded: 'desc' },
  }) : fallbackFeaturedFinds.filter((product) => product.categoryId === category?.id || categoryNames.includes(product.category.name));

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="relative mb-16 overflow-hidden rounded-sm bg-brand-cream px-6 py-20 text-center shadow-sm">
        <ProductImage src={collection?.image || getCategoryImage(displayName)} alt={`${displayName} category mood`} className="absolute inset-0 h-full w-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-cream via-brand-cream/90 to-brand-blush/70" />
        <div className="relative mx-auto max-w-3xl"><span className="text-brand-gold uppercase tracking-[0.3em] text-[10px] font-bold">Curated Category</span><h1 className="text-5xl font-serif mt-4 mb-6 tracking-tighter text-brand-black">{displayName}</h1><p className="text-sm uppercase tracking-[0.25em] text-brand-black/50">{products.length} curated items</p></div>
      </div>
      <AffiliateDisclosureNotice className="mb-8" />
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
        {products.map((item) => (
          <article key={item.id} className="luxury-card overflow-hidden">
            <div className="aspect-[4/5] overflow-hidden bg-brand-cream"><ProductImage src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" /></div>
            <div className="p-5"><h3 className="font-serif text-lg text-brand-black">{item.name}</h3><p className="mt-3 text-sm leading-6 text-brand-black/65">{item.description || 'Curated affiliate find.'}</p><a href={withAmazonAssociatesTag(item.affiliateLink || item.amazonLink)} target="_blank" rel="sponsored noopener noreferrer" className="btn-primary mt-5 block py-3 text-center text-[10px]">Shop the Find</a></div>
          </article>
        ))}
      </div>
      {products.length === 0 && <div className="text-center py-20 bg-brand-cream/30 italic text-brand-black/40">We are currently hand-picking the best {displayName} finds for you.</div>}
    </div>
  );
}
