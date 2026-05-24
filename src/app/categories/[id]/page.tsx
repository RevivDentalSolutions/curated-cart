import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import ProductImage from '@/components/ProductImage';
import {
  categoryNamesForSlug,
  getCategoryCollection,
  getCategoryImage,
  getDisplayCategoryName,
} from '@/lib/categories';

export default async function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const collection = getCategoryCollection(id);

  const category = collection
    ? await prisma.category.findFirst({
        where: { name: { in: categoryNamesForSlug(collection.slug) } },
      })
    : await prisma.category.findUnique({
        where: { id },
      });

  return categories.find((category) => slugify(category.name) === param) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;

  try {
    const category = await findCategoryByParam(id);

    if (!category) return {};

    return {
      title: `${category.name} | Curated Amazon Finds`,
      description: `Explore our hand-picked selection of the best Amazon products in the ${category.name} category.`,
      alternates: {
        canonical: `https://www.shopthecuratedcart.com/categories/${slugify(category.name)}`,
      },
    };
  } catch (error) {
    console.error('[categories/:id] Failed to load metadata', { id, error });
    return {};
  }
}

export const dynamic = 'force-dynamic';

export default async function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let category: Awaited<ReturnType<typeof findCategoryByParam>> = null;
  try {
    category = await findCategoryByParam(id);
  } catch (error) {
    console.error('[categories/:id] Runtime fetch failure', { id, error });
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center py-20 bg-brand-cream/30 rounded-sm italic text-brand-black/40">
          We could not load this category right now. Please try again shortly.
        </div>
      </div>
    );
  }

  if (!category) {
    if (collection) {
      return (
        <div className="container mx-auto px-4 py-16">
          <CategoryHero
            name={collection.name}
            image={collection.image}
            itemCount={0}
          />
          <EmptyCategory name={collection.name} />
        </div>
      );
    }

    notFound();
  }

  const displayCollection = getCategoryCollection(category.name);
  const displayName = displayCollection?.name || getDisplayCategoryName(category.name);
  const categoryNames = displayCollection ? categoryNamesForSlug(displayCollection.slug) : [category.name];

  const products = await prisma.product.findMany({
    where: {
      published: true,
      category: {
        name: { in: categoryNames },
      },
    },
    orderBy: { dateAdded: 'desc' },
  });

  return (
    <div className="container mx-auto px-4 py-16">
      <CategoryHero
        name={displayName}
        image={displayCollection?.image || getCategoryImage(displayName)}
        itemCount={products.length}
      />

      {products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((item) => (
            <div key={item.id} className="luxury-card group overflow-hidden">
              <div className="relative aspect-[4/5] overflow-hidden bg-brand-cream">
                <ProductImage
                  src={item.imageUrl}
                  alt={item.name}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform bg-white/90 backdrop-blur-sm">
                  <a href={item.amazonLink || '#'} target="_blank" rel="noopener noreferrer" className="block w-full btn-primary text-[10px] py-3 text-center">
                    Shop on Amazon
                  </a>
                </div>
              </div>
              <div className="p-5 text-left">
                <h3 className="font-serif text-lg mt-1 group-hover:text-brand-gold transition-colors text-brand-black">{item.name}</h3>
                <p className="text-sm font-bold mt-2 text-brand-black">{item.price ? `$${item.price}` : 'Check Price'}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyCategory name={displayName} />
      )}
    </div>
  );
}

function CategoryHero({ name, image, itemCount }: { name: string; image: string; itemCount: number }) {
  return (
    <div className="relative mb-16 overflow-hidden rounded-sm bg-brand-cream px-6 py-20 text-center shadow-sm">
      <ProductImage src={image} alt={`${name} category mood`} className="absolute inset-0 h-full w-full object-cover opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-r from-brand-cream via-brand-cream/90 to-brand-blush/70"></div>
      <div className="relative mx-auto max-w-3xl">
        <span className="text-brand-gold uppercase tracking-[0.3em] text-[10px] font-bold">Curated Category</span>
        <h1 className="text-5xl font-serif mt-4 mb-6 tracking-tighter text-brand-black">{name}</h1>
        <div className="h-0.5 w-20 bg-brand-gold mx-auto mb-6"></div>
        <p className="text-sm uppercase tracking-[0.25em] text-brand-black/50">
          {itemCount} {itemCount === 1 ? 'curated item' : 'curated items'}
        </p>
      </div>
    </div>
  );
}

function EmptyCategory({ name }: { name: string }) {
  return (
    <div className="text-center py-20 bg-brand-cream/30 rounded-sm italic text-brand-black/40">
      We are currently hand-picking the best {name} finds for you.
    </div>
  );
}
