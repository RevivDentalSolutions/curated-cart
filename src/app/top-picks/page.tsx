import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ShoppingCart, Star } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Our Top Picks | Best of Amazon Finds",
  description: "Explore our hand-picked selection of the best Amazon products across all categories. Luxury dupes, home essentials, and more.",
  alternates: {
    canonical: "https://www.shopthecuratedcart.com/top-picks",
  },
};

export default async function TopPicks() {
  const categories = await prisma.category.findMany({
    include: {
      products: {
        where: {
          blogPostStatus: 'Published'
        },
        take: 3
      }
    }
  });

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

  const sections = categories.filter(cat => cat.products.length > 0);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-20">
        <span className="text-brand-gold uppercase tracking-[0.3em] text-[10px] font-bold">The Best of Amazon</span>
        <h1 className="text-5xl font-serif mt-4 mb-6 tracking-tighter text-brand-black">Our Top Picks</h1>
        <p className="text-sm text-brand-black/60 max-w-lg mx-auto leading-relaxed">
          The best finds, already sorted. We only feature products that meet our high standards for style, quality, and practicality.
        </p>
      </div>

      {sections.length > 0 ? (
        <div className="space-y-24">
          {sections.map((section) => (
            <section key={section.id}>
              <div className="flex items-center gap-6 mb-12">
                <h2 className="text-3xl font-serif whitespace-nowrap text-brand-black">{section.name}</h2>
                <div className="h-px bg-brand-blush w-full"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {section.products.map((item) => (
                  <div key={item.id} className="luxury-card group">
                    <div className="relative aspect-square overflow-hidden bg-brand-cream">
                      <Image 
                        src={getCategoryImage(section.name)} 
                        alt={item.name} 
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                      <div className="absolute top-4 left-4">
                        <div className="flex bg-white/90 backdrop-blur-sm px-2 py-1 rounded-sm text-brand-gold">
                          {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={10} fill="currentColor" />)}
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="font-serif text-xl mb-2 text-brand-black">{item.name}</h3>
                      <p className="text-brand-gold font-bold mb-6">{item.price ? `$${item.price}` : 'Check Price'}</p>
                      <div className="flex gap-2">
                        <a 
                          href={item.amazonLink || '#'} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn-primary flex-grow text-[9px] py-3 text-center"
                        >
                          Add to Cart
                        </a>
                        <Link href="/blog" className="btn-outline text-[9px] py-3 px-4 flex items-center justify-center">
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-brand-cream/30 rounded-sm italic text-brand-black/40">
          We are currently hand-picking the best finds for you.
        </div>
      )}

      <div className="mt-32 bg-brand-blush/30 p-12 text-center rounded-sm max-w-4xl mx-auto border border-brand-blush shadow-inner">
        <h3 className="text-3xl font-serif mb-6 text-brand-black">Didn't find what you were looking for?</h3>
        <p className="text-sm opacity-70 mb-8 leading-relaxed max-w-md mx-auto text-brand-black">
          Explore our full category library for more curated finds in home, fashion, beauty, and more.
        </p>
        <Link href="/categories" className="btn-primary inline-block">Browse All Categories</Link>
      </div>
    </div>
  );
}
