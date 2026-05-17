import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Filter } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { connection } from 'next/server';
import { MAIN_CATEGORIES, categoryNamesForSlug, getCategoryCollection, getCategoryImage } from '@/lib/categories';

export const metadata: Metadata = {
  title: 'Pretty & Practical Posts | The Curated Cart',
  description: 'Browse The Curated Cart blog by category, including Elevated Summer, beauty, home, kitchen, fashion, and Amazon favorites.',
};

type BlogPageProps = {
  searchParams: Promise<{ category?: string }>;
};

export default async function BlogPage({ searchParams }: BlogPageProps) {
  await connection();
  const { category } = await searchParams;
  const selectedCollection = category ? getCategoryCollection(category) : undefined;
  const selectedCategoryNames = selectedCollection ? categoryNamesForSlug(selectedCollection.slug) : [];

  const posts = await prisma.blogPost.findMany({
    where: {
      isPublished: true,
      ...(selectedCategoryNames.length > 0
        ? {
            category: {
              name: { in: selectedCategoryNames },
            },
          }
        : {}),
    },
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <span className="text-brand-gold uppercase tracking-[0.3em] text-[10px] font-bold">The Library</span>
        <h1 className="text-5xl font-serif mt-4 mb-8 text-brand-black">Pretty & Practical Posts</h1>

        {/* Category Filter */}
        <div className="flex flex-wrap items-center justify-center gap-4 max-w-5xl mx-auto border-y border-brand-blush py-6">
          <Filter size={14} className="text-brand-gold mr-2 hidden md:block" />
          <Link
            href="/blog"
            className={`text-[10px] uppercase tracking-widest px-4 py-1 rounded-full transition-colors ${
              !selectedCollection ? 'bg-brand-black text-brand-cream' : 'text-brand-black/60 hover:text-brand-gold'
            }`}
          >
            All
          </Link>
          {MAIN_CATEGORIES.map((cat) => (
            <Link
              href={`/blog?category=${cat.slug}`}
              key={cat.slug}
              className={`text-[10px] uppercase tracking-widest px-4 py-1 rounded-full transition-colors ${
                selectedCollection?.slug === cat.slug
                  ? 'bg-brand-black text-brand-cream'
                  : 'text-brand-black/60 hover:text-brand-gold'
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>

      {selectedCollection?.slug === 'elevated-summer' && (
        <div className="mb-14 rounded-sm border border-brand-blush bg-brand-cream p-8 text-center shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-brand-gold">Elevated Summer Blog Edit</span>
          <p className="mx-auto mt-4 max-w-2xl font-serif text-xl leading-8 text-brand-black/75">
            Pretty poolside finds, beach day essentials, vacation favorites, and soft luxury summer picks.
          </p>
          <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-brand-black/55">
            Placeholder space for featured summer blog posts, Pinterest-friendly image banners, and seasonal shopping guides as the summer library grows.
          </p>
        </div>
      )}

      {posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
          {posts.map((post) => (
            <Link href={`/blog/${post.slug}`} key={post.id} className="group">
              <div className="aspect-[4/3] overflow-hidden mb-6 bg-brand-nude">
                <img
                  src={post.featuredImage || getCategoryImage(post.category.name)}
                  alt={post.title}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="flex items-center gap-4 mb-3">
                <span className="text-[9px] uppercase tracking-[0.2em] px-2 py-1 bg-brand-blush text-brand-black font-bold">
                  {post.category.name}
                </span>
                <span className="text-[9px] uppercase tracking-[0.1em] text-brand-black/40">
                  {new Date(post.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h2 className="text-2xl font-serif group-hover:text-brand-gold transition-colors leading-tight mb-4 text-brand-black">
                {post.title}
              </h2>
              <p className="text-sm text-brand-black/60 line-clamp-2 leading-relaxed mb-6">
                {post.excerpt || post.metaDescription}
              </p>
              <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 group-hover:gap-4 transition-all text-brand-black">
                Read the Review <ArrowRight size={12} />
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-brand-cream/30 rounded-sm italic text-brand-black/40">
          {selectedCollection
            ? `Our ${selectedCollection.name} posts are being curated. Check back soon!`
            : 'Our library is being curated. Check back soon!'}
        </div>
      )}

      {/* Pagination */}
      {posts.length > 0 && (
        <div className="mt-20 flex justify-center items-center space-x-4 border-t border-brand-blush pt-10">
          <button className="text-[10px] uppercase tracking-widest font-bold opacity-30 cursor-not-allowed text-brand-black">Previous</button>
          <span className="text-xs font-serif text-brand-gold">1 / 1</span>
          <button className="text-[10px] uppercase tracking-widest font-bold opacity-30 cursor-not-allowed text-brand-black">Next</button>
        </div>
      )}
    </div>
  );
}
