import { ArrowRight, ShoppingCart, Star } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

export default async function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      products: {
        orderBy: { dateAdded: 'desc' }
      }
    }
  });

  if (!category) {
    notFound();
  }

  const getCategoryImage = (name: string) => {
    const images: {[key: string]: string} = {
      'Home Decor': 'https://images.unsplash.com/photo-1616489953149-75517454e9c3?auto=format&fit=crop&q=80&w=800',
      'Fashion Finds': 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&q=80&w=800',
      'Skincare': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=800',
      'Beauty Tools': 'https://images.unsplash.com/photo-1596462502278-27bfdc4033c8?auto=format&fit=crop&q=80&w=800',
      'Mom Life Favorites': 'https://images.unsplash.com/photo-1484981138541-3d074aa97716?auto=format&fit=crop&q=80&w=800',
      'Under $25 Finds': 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=800',
    };
    return images[name] || 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800';
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <span className="text-brand-gold uppercase tracking-[0.3em] text-[10px] font-bold">Curated Category</span>
        <h1 className="text-5xl font-serif mt-4 mb-6 tracking-tighter text-brand-black">{category.name}</h1>
        <div className="h-0.5 w-20 bg-brand-gold mx-auto mb-6"></div>
      </div>

      {category.products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {category.products.map((item) => (
            <div key={item.id} className="luxury-card group overflow-hidden">
              <div className="relative aspect-[4/5] overflow-hidden bg-brand-cream">
                <img 
                  src={getCategoryImage(category.name)} 
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
                <div className="mt-4 flex items-center justify-between">
                  <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    item.blogPostStatus === 'Published' ? 'bg-green-50 text-green-700' : 'bg-brand-blush text-brand-black/60'
                  }`}>
                    {item.blogPostStatus}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-brand-cream/30 rounded-sm italic text-brand-black/40">
          We are currently hand-picking the best {category.name} for you.
        </div>
      )}
    </div>
  );
}
