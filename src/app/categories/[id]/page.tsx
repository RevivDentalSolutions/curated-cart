import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import ProductImage from '@/components/ProductImage';
import {
  MAIN_CATEGORIES,
  categoryNamesForSlug,
  getCategoryCollection,
  getCategoryImage,
  getDisplayCategoryName,
} from '@/lib/categories';

type CategoryPageProps = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return MAIN_CATEGORIES.map((category) => ({ id: category.slug }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { id } = await params;
  const collection = getCategoryCollection(id);

  if (!collection) {
    return {
      title: 'Curated Category | The Curated Cart',
      description: 'Shop polished, practical finds from The Curated Cart.',
    };
  }

  return {
    title: `${collection.name} | The Curated Cart`,
    description: collection.description,
    openGraph: {
      title: `${collection.name} | The Curated Cart`,
      description: collection.description,
      images: [{ url: collection.image, alt: `${collection.name} curated category mood board` }],
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
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

  if (!category) {
    if (collection) {
      return (
        <div className="container mx-auto px-4 py-16">
          <CategoryHero
            name={collection.name}
            image={collection.image}
            itemCount={0}
            description={collection.description}
            subheadline={collection.heroSubheadline}
          />
          {collection.slug === 'elevated-summer' && <ElevatedSummerPlaceholders />}
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

  const featuredPosts = displayCollection?.slug === 'elevated-summer'
    ? await prisma.blogPost.findMany({
        where: {
          isPublished: true,
          category: {
            name: { in: categoryNames },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 3,
      })
    : [];

  return (
    <div className="container mx-auto px-4 py-16">
      <CategoryHero
        name={displayName}
        image={displayCollection?.image || getCategoryImage(displayName)}
        itemCount={products.length}
        description={displayCollection?.description}
        subheadline={displayCollection?.heroSubheadline}
      />

      {displayCollection?.slug === 'elevated-summer' && (
        <ElevatedSummerPlaceholders featuredPosts={featuredPosts} />
      )}

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

function CategoryHero({
  name,
  image,
  itemCount,
  description,
  subheadline,
}: {
  name: string;
  image: string;
  itemCount: number;
  description?: string;
  subheadline?: string;
}) {
  return (
    <div className="relative mb-16 overflow-hidden rounded-sm bg-brand-cream px-6 py-20 text-center shadow-sm">
      <ProductImage src={image} alt={`${name} category mood`} className="absolute inset-0 h-full w-full object-cover opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-r from-brand-cream via-brand-cream/90 to-brand-blush/70"></div>
      <div className="relative mx-auto max-w-3xl">
        <span className="text-brand-gold uppercase tracking-[0.3em] text-[10px] font-bold">Curated Category</span>
        <h1 className="text-5xl font-serif mt-4 mb-6 tracking-tighter text-brand-black">{name}</h1>
        <div className="h-0.5 w-20 bg-brand-gold mx-auto mb-6"></div>
        <p className="mx-auto mb-6 max-w-2xl text-base font-serif leading-8 text-brand-black/75">
          {subheadline || description || 'A polished edit of pretty, practical finds for a softer cart.'}
        </p>
        <p className="text-sm uppercase tracking-[0.25em] text-brand-black/50">
          {itemCount} {itemCount === 1 ? 'curated item' : 'curated items'}
        </p>
      </div>
    </div>
  );
}

function ElevatedSummerPlaceholders({
  featuredPosts = [],
}: {
  featuredPosts?: { id: string; slug: string; title: string; excerpt: string | null; metaDescription: string | null }[];
}) {
  const productCollections = ['Poolside polish', 'Beach bag essentials', 'Vacation glow-up'];
  const bannerIdeas = ['Neutral resort mood board', 'Soft cream packing list pin', 'Golden hour beach flat lay'];

  return (
    <section className="mb-16 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-sm border border-brand-blush bg-white p-8 shadow-sm">
        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-brand-gold">Featured Summer Blog Posts</span>
        <div className="mt-6 grid gap-4">
          {featuredPosts.length > 0 ? (
            featuredPosts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group border-b border-brand-blush pb-4 last:border-0 last:pb-0">
                <h2 className="font-serif text-2xl text-brand-black transition-colors group-hover:text-brand-gold">{post.title}</h2>
                <p className="mt-2 text-sm leading-6 text-brand-black/60">{post.excerpt || post.metaDescription}</p>
              </Link>
            ))
          ) : (
            <div className="rounded-sm bg-brand-cream/70 p-6 text-sm italic leading-7 text-brand-black/50">
              Placeholder: add elevated summer blog posts here for beach days, vacation packing, poolside hosting, and warm-weather beauty edits.
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-sm border border-brand-blush bg-brand-cream p-8 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-brand-gold">Curated Product Collections</span>
          <div className="mt-5 space-y-3">
            {productCollections.map((collection) => (
              <div key={collection} className="flex items-center justify-between border-b border-brand-beige/50 pb-3 text-sm text-brand-black/70 last:border-0 last:pb-0">
                <span>{collection}</span>
                <span className="text-[9px] uppercase tracking-widest text-brand-black/35">Coming soon</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-sm border border-brand-blush bg-white p-8 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-brand-gold">Pinterest-Ready Image Banners</span>
          <div className="mt-5 grid gap-3">
            {bannerIdeas.map((banner) => (
              <div key={banner} className="aspect-[5/2] rounded-sm bg-gradient-to-r from-brand-nude via-brand-cream to-brand-blush p-4 text-xs uppercase tracking-[0.2em] text-brand-black/45">
                {banner}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function EmptyCategory({ name }: { name: string }) {
  return (
    <div className="text-center py-20 bg-brand-cream/30 rounded-sm italic text-brand-black/40">
      We are currently hand-picking the best {name} finds for you.
    </div>
  );
}
