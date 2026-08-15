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

const siteUrl = 'https://www.shopthecuratedcart.com';

function categoryDescription(name: string) {
  return `Shop curated ${name.toLowerCase()} finds from The Curated Cart. Practical, pretty picks selected for everyday life.`;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const collection = getCategoryCollection(id);
  const name = collection?.name || 'Curated Finds';
  const canonicalId = collection?.slug || id;
  const description = categoryDescription(name);

  return {
    title: `${name} Finds`,
    description,
    alternates: { canonical: `/categories/${canonicalId}` },
    openGraph: {
      title: `${name} Finds | The Curated Cart`,
      description,
      url: `${siteUrl}/categories/${canonicalId}`,
      type: 'website',
      images: [{ url: collection?.image || getCategoryImage(name), alt: `${name} curated finds` }],
    },
  };
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

  // Production predates Product.description. Select only fields that exist in
  // the recovered catalog so category pages stay available while the schema
  // repair is handled separately.
  const products = hasDatabase ? await prisma.product.findMany({
    where: { published: true, category: { name: { in: categoryNames } } },
    orderBy: { dateAdded: 'desc' },
    select: {
      id: true,
      name: true,
      imageUrl: true,
      affiliateLink: true,
      amazonLink: true,
      viralTrendNotes: true,
      contentIdea: true,
    },
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
            <div className="p-5"><h2 className="font-serif text-lg text-brand-black">{item.name}</h2><p className="mt-3 text-sm leading-6 text-brand-black/65">{('viralTrendNotes' in item && item.viralTrendNotes) || ('contentIdea' in item && item.contentIdea) || 'A hand-picked find selected for The Curated Cart readers.'}</p><a href={withAmazonAssociatesTag(item.affiliateLink || item.amazonLink)} target="_blank" rel="sponsored noopener noreferrer" className="btn-primary mt-5 block py-3 text-center text-[10px]">Shop the Find</a></div>
          </article>
        ))}
      </div>
      {products.length === 0 && <div className="text-center py-20 bg-brand-cream/30 italic text-brand-black/40">We are currently hand-picking the best {displayName} finds for you.</div>}
    </div>
  );
}
