import Link from 'next/link';
import { ArrowRight, Filter } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { connection } from 'next/server';
import { fallbackCategories, fallbackLatestPosts } from '@/lib/homepage-fallback';
import { publicBlogPostWhere } from '@/lib/blog-visibility';

export default async function BlogPage() {
  await connection();
  const hasDatabase = Boolean(process.env.DATABASE_URL);
  const categories = hasDatabase ? await prisma.category.findMany() : fallbackCategories;
  const posts = hasDatabase ? await prisma.blogPost.findMany({
    where: publicBlogPostWhere,
    include: { category: true },
    orderBy: { createdAt: 'desc' }
  }) : fallbackLatestPosts;

  const getCategoryImage = (name: string) => {
    const images: {[key: string]: string} = {
      'Home Decor': 'https://images.unsplash.com/photo-1616489953149-75517454e9c3?auto=format&fit=crop&q=80&w=400',
      'Fashion Finds': 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&q=80&w=400',
      'Skincare': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=400',
      'Beauty Tools': 'https://images.unsplash.com/photo-1596462502278-27bfdc4033c8?auto=format&fit=crop&q=80&w=400',
      'Mom Life Favorites': 'https://images.unsplash.com/photo-1484981138541-3d074aa97716?auto=format&fit=crop&q=80&w=400',
      'Under $25 Finds': 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=400',
    };
    return images[name] || 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400';
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <span className="text-brand-gold uppercase tracking-[0.3em] text-[10px] font-bold">The Library</span>
        <h1 className="text-5xl font-serif mt-4 mb-8 text-brand-black">Pretty & Practical Posts</h1>
        
        {/* Category Filter */}
        <div className="flex flex-wrap items-center justify-center gap-4 max-w-4xl mx-auto border-y border-brand-blush py-6">
          <Filter size={14} className="text-brand-gold mr-2 hidden md:block" />
          <button className="text-[10px] uppercase tracking-widest px-4 py-1 rounded-full bg-brand-black text-brand-cream transition-colors">
            All
          </button>
          {categories.map((cat) => (
            <button 
              key={cat.id} 
              className="text-[10px] uppercase tracking-widest px-4 py-1 rounded-full text-brand-black/60 hover:text-brand-gold transition-colors"
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
          {posts.map((post) => (
            <Link href={`/blog/${post.slug}`} key={post.id} className="group">
              <div className="aspect-[4/3] overflow-hidden mb-6 bg-brand-nude">
                <img 
                  src={post.featuredImage || getCategoryImage(post.category.name)} 
                  alt={post.title} 
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
              </div>
              <div className="flex items-center gap-4 mb-3">
                <span className="text-[9px] uppercase tracking-[0.2em] px-2 py-1 bg-brand-blush text-brand-black font-bold">
                  {post.category?.name ?? 'Uncategorized'}
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
          Our library is being curated. Check back soon!
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
