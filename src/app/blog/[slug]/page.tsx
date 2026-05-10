import Link from 'next/link';
import { ShoppingCart, ArrowLeft, Star, ThumbsUp, ThumbsDown } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import ProductImage from '@/components/ProductImage';

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  await connection();
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { slug },
    include: { 
      category: true,
      products: {
        include: { category: true }
      }
    }
  });

  if (!post || !post.isPublished) {
    notFound();
  }

  const getCategoryImage = (name: string) => {
    const images: {[key: string]: string} = {
      'Home Decor': 'https://images.unsplash.com/photo-1616489953149-75517454e9c3?auto=format&fit=crop&q=80&w=1600',
      'Fashion Finds': 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&q=80&w=1600',
      'Skincare': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=1600',
      'Beauty Tools': 'https://images.unsplash.com/photo-1596462502278-27bfdc4033c8?auto=format&fit=crop&q=80&w=1600',
      'Mom Life Favorites': 'https://images.unsplash.com/photo-1484981138541-3d074aa97716?auto=format&fit=crop&q=80&w=1600',
      'Under $25 Finds': 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=1600',
    };
    return images[name] || 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=1600';
  };

  return (
    <article className="pb-20">
      {/* Hero */}
      <div className="relative h-[60vh] bg-brand-nude/20">
        <img 
          src={post.featuredImage || getCategoryImage(post.category.name)} 
          alt={post.title} 
          className="w-full h-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-cream via-transparent to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 py-12">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <Link href="/blog" className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-brand-black/60 hover:text-brand-gold transition-colors mb-6">
              <ArrowLeft size={12} /> Back to Library
            </Link>
            <span className="block text-[10px] uppercase tracking-[0.3em] text-brand-gold font-bold mb-4">{post.category.name}</span>
            <h1 className="text-4xl md:text-6xl font-serif leading-tight text-brand-black">{post.title}</h1>
            <p className="mt-4 text-[10px] text-brand-black/40 italic max-w-xl mx-auto uppercase tracking-widest leading-relaxed">
              This post contains affiliate links. As an Amazon Associate, I earn from qualifying purchases.
            </p>
            <div className="mt-8 flex items-center justify-center space-x-6 text-[10px] uppercase tracking-widest text-brand-black/40 font-bold">
              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
              <span>•</span>
              <span>10 Minute Read</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-3xl pt-12">
        <div className="prose prose-brand max-w-none text-brand-black/80">
          <div className="text-lg leading-relaxed font-light italic mb-12 border-l-4 border-brand-blush pl-8">
            {post.metaDescription}
          </div>

          <div className="whitespace-pre-wrap leading-relaxed mb-12">
            {post.content}
          </div>

          {post.products.length > 0 && (
            <>
              <h2 className="text-3xl font-serif mt-16 mb-8 text-brand-black">The Top Picks</h2>
              {post.products.map((product) => (
                <div key={product.id} className="my-12 luxury-card p-6 md:p-8 flex flex-col md:flex-row gap-8">
                  <div className="w-full md:w-2/5 aspect-square bg-brand-cream overflow-hidden">
                    <ProductImage
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="w-full md:w-3/5 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] uppercase tracking-widest text-brand-gold font-bold">Recommended</span>
                      <div className="flex text-brand-gold">
                        {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={12} fill="currentColor" />)}
                      </div>
                    </div>
                    <h3 className="text-2xl font-serif mb-4 text-brand-black">{product.name}</h3>
                    <p className="text-sm text-brand-black/70 mb-6 leading-relaxed">
                      {product.viralTrendNotes || 'This is one of my favorite finds this week. Highly recommend!'}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div>
                        <h4 className="text-[10px] uppercase tracking-widest font-bold flex items-center gap-2 mb-3">
                          <ThumbsUp size={12} className="text-green-600" /> Pros
                        </h4>
                        <ul className="text-xs space-y-2 opacity-70">
                          <li>Great Quality</li>
                          <li>High Value</li>
                          <li>Beautiful Aesthetic</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-[10px] uppercase tracking-widest font-bold flex items-center gap-2 mb-3">
                          <ThumbsDown size={12} className="text-red-600" /> Cons
                        </h4>
                        <ul className="text-xs space-y-2 opacity-70">
                          <li>Limited Stock</li>
                        </ul>
                      </div>
                    </div>

                    <div className="mt-auto flex items-center gap-4">
                      <a 
                        href={product.amazonLink || '#'} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn-primary flex items-center gap-2 flex-grow justify-center text-center"
                      >
                        Shop on Amazon <ShoppingCart size={14} />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          <div className="bg-brand-blush/20 p-8 my-12 border-l-2 border-brand-gold">
            <h3 className="text-xl font-serif mb-4 text-brand-black text-brand-black">Worth It?</h3>
            <p className="text-sm italic leading-relaxed opacity-80 text-brand-black">
              &ldquo;If you&rsquo;re looking for an easy way to elevate your lifestyle without a major splurge, these pieces are 100% worth it. The quality surpassed my expectations.&rdquo;
            </p>
          </div>
        </div>
        
        {/* Author Bio or CTA */}
        <div className="mt-20 border-y border-brand-blush py-12 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-brand-nude rounded-full mb-6 overflow-hidden">
            <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200" alt="Author" />
          </div>
          <h4 className="font-serif text-xl mb-2 text-brand-black">Curated by Sarah</h4>
          <p className="text-sm text-brand-black/60 max-w-md mb-8">
            Obsessed with finding luxury-inspired pieces that don&rsquo;t break the bank. Follow my weekly finds for your home and wardrobe.
          </p>
          <button className="btn-primary">Follow My Storefront</button>
        </div>
      </div>
    </article>
  );
}
