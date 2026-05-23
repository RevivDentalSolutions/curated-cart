import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Heart } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "The Curated Cart | Pretty finds. Practical buys.",
  description: "Your daily dose of curated style. We find the most beautiful, practical, and viral Amazon products so you don't have to.",
  alternates: {
    canonical: "https://www.shopthecuratedcart.com",
  },
};

export const dynamic = 'force-dynamic';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export default async function Home() {
  let categories: Awaited<ReturnType<typeof prisma.category.findMany>> = [];
  let featuredFinds: Awaited<ReturnType<typeof prisma.product.findMany>> = [];
  let latestPosts: Awaited<ReturnType<typeof prisma.blogPost.findMany>> = [];

  try {
    [categories, featuredFinds, latestPosts] = await Promise.all([
      prisma.category.findMany({ take: 6 }),
      prisma.product.findMany({
        where: { blogPostStatus: 'Published' },
        include: { category: true },
        take: 4,
        orderBy: { dateAdded: 'desc' }
      }),
      prisma.blogPost.findMany({
        where: { isPublished: true },
        include: { category: true },
        take: 3,
        orderBy: { createdAt: 'desc' }
      }),
    ]);
  } catch {
    // Fall back to empty sections when DB is unavailable.
  }

  // Fallback images if not provided
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
    <div className="flex flex-col gap-20 pb-20">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden bg-brand-nude/30">
        <div className="container mx-auto px-4 text-center z-10">
          <h1 className="text-5xl md:text-7xl font-serif mb-4 tracking-tighter text-brand-black animate-fade-in">The Curated Cart</h1>
          <p className="text-sm md:text-lg uppercase tracking-[0.4em] text-brand-gold mb-12 animate-slide-up">Pretty finds. Practical buys.</p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 animate-slide-up animation-delay-200">
            <Link href="/blog" className="btn-primary">Read the Blog</Link>
            <Link href="/categories" className="btn-outline">Shop the Finds</Link>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-brand-blush/20 to-transparent pointer-events-none"></div>
      </section>

      {/* Featured Finds */}
      <section className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="text-brand-gold uppercase tracking-[0.2em] text-[10px] font-bold">Pretty & Practical Picks</span>
            <h2 className="text-4xl font-serif mt-2 text-brand-black">Featured Amazon Finds</h2>
          </div>
          <Link href="/top-picks" className="nav-link flex items-center gap-2 group">
            View All <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        
        {featuredFinds.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredFinds.map((item) => (
              <div key={item.id} className="luxury-card group overflow-hidden">
                <div className="relative aspect-[4/5] overflow-hidden bg-brand-cream">
                  <Image 
                    src={item.image || getCategoryImage(item.category.name)} 
                    alt={item.name} 
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <button className="absolute top-4 right-4 p-2 bg-white/80 rounded-full text-brand-black hover:text-red-500 transition-colors">
                    <Heart size={16} />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform bg-white/90 backdrop-blur-sm">
                    <a href={item.amazonLink || '#'} target="_blank" rel="noopener noreferrer" className="block w-full btn-primary text-[10px] py-3 text-center">
                      Shop the Find
                    </a>
                  </div>
                </div>
                <div className="p-5">
                  <span className="text-[10px] uppercase tracking-widest text-brand-gold font-bold">{item.category.name}</span>
                  <h3 className="font-serif text-lg mt-1 group-hover:text-brand-gold transition-colors text-brand-black">{item.name}</h3>
                  <p className="text-sm font-bold mt-2 text-brand-black">{item.price ? `$${item.price}` : 'Check Price'}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-brand-cream/30 rounded-sm italic text-brand-black/40">
            Fresh finds coming soon!
          </div>
        )}
      </section>

      {/* Shop by Category */}
      <section className="bg-brand-blush/20 py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif mb-2 uppercase tracking-tighter text-brand-black">Shop by Category</h2>
            <div className="h-0.5 w-20 bg-brand-gold mx-auto"></div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Link href={`/categories/${slugify(cat.name)}`} key={cat.id} className="group relative aspect-square overflow-hidden bg-brand-cream rounded-sm">
                <Image 
                  src={getCategoryImage(cat.name)} 
                  alt={cat.name} 
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 16vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-80" 
                />
                <div className="absolute inset-0 bg-brand-black/20 group-hover:bg-brand-black/40 transition-colors flex items-center justify-center p-4">
                  <span className="text-white text-xs md:text-sm uppercase tracking-widest font-bold text-center border-b border-white/0 group-hover:border-white/100 transition-all">{cat.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Blog Posts */}
      <section className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="text-brand-gold uppercase tracking-[0.2em] text-[10px] font-bold">This Week&apos;s Cart Drop</span>
            <h2 className="text-4xl font-serif mt-2 text-brand-black">Latest Blog Posts</h2>
          </div>
          <Link href="/blog" className="nav-link flex items-center gap-2 group">
            Read More <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {latestPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {latestPosts.map((post) => (
              <Link href={`/blog/${post.slug}`} key={post.id} className="group">
                <div className="relative aspect-[16/9] overflow-hidden mb-6 bg-brand-nude">
                  <Image 
                    src={getCategoryImage(post.category.name)} 
                    alt={post.title} 
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                </div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-brand-gold font-bold">{post.category.name} • {new Date(post.createdAt).toLocaleDateString()}</span>
                <h3 className="text-2xl font-serif mt-3 mb-4 group-hover:text-brand-gold transition-colors leading-tight text-brand-black">
                  {post.title}
                </h3>
                <p className="text-sm text-brand-black/70 line-clamp-2 leading-relaxed mb-6">
                  {post.metaDescription}
                </p>
                <span className="text-xs uppercase tracking-widest font-bold flex items-center gap-2 group-hover:gap-4 transition-all text-brand-black">
                  Read the Review <ArrowRight size={12} />
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-brand-cream/30 rounded-sm italic text-brand-black/40">
            Working on new articles for you!
          </div>
        )}
      </section>

      {/* Email Signup */}
      <section className="bg-brand-black py-20 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-blush/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>
        
        <div className="container mx-auto px-4 max-w-2xl text-center relative z-10">
          <h2 className="text-brand-cream text-4xl font-serif mb-4 tracking-tighter">Join the Weekly Cart Drop</h2>
          <p className="text-brand-gold/80 text-sm mb-10 tracking-widest uppercase">Never miss a pretty and practical find.</p>
          
          <form className="flex flex-col md:flex-row gap-4">
            <input 
              type="email" 
              placeholder="Your email address" 
              className="bg-white px-6 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-brand-gold flex-grow rounded-sm text-brand-black"
            />
            <button className="btn-primary py-4 whitespace-nowrap">Join the List</button>
          </form>
          <p className="text-brand-cream/40 text-[10px] mt-6 italic">
            By signing up, you agree to receive our weekly Amazon shopping guide.
          </p>
        </div>
      </section>
    </div>
  );
}
