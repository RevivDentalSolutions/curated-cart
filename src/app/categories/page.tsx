import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Shop by Category | Curated Amazon Collections",
  description: "Browse our hand-picked Amazon collections in Home Decor, Fashion, Skincare, and more.",
  alternates: {
    canonical: "https://www.shopthecuratedcart.com/categories",
  },
};

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  let categories: Awaited<ReturnType<typeof prisma.category.findMany>> = [];
  try {
    categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      }
    });
  } catch {
    // Fall back to empty states when DB is unavailable.
  }

  const getCategoryImage = (name: string) => {
    const images: {[key: string]: string} = {
      'Home Decor': 'https://images.unsplash.com/photo-1616489953149-75517454e9c3?auto=format&fit=crop&q=80&w=600',
      'Fashion Finds': 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&q=80&w=600',
      'Skincare': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=600',
      'Beauty Tools': 'https://images.unsplash.com/photo-1596462502278-27bfdc4033c8?auto=format&fit=crop&q=80&w=600',
      'Mom Life Favorites': 'https://images.unsplash.com/photo-1484981138541-3d074aa97716?auto=format&fit=crop&q=80&w=600',
      'Under $25 Finds': 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=600',
    };
    return images[name] || 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=600';
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-20">
        <span className="text-brand-gold uppercase tracking-[0.3em] text-[10px] font-bold">Curated Collections</span>
        <h1 className="text-5xl font-serif mt-4 mb-6 tracking-tighter text-brand-black">Shop by Category</h1>
        <div className="h-0.5 w-20 bg-brand-gold mx-auto mb-6"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {categories.map((cat) => (
          <Link href={`/categories/${cat.id}`} key={cat.id} className="group relative h-96 overflow-hidden bg-brand-cream rounded-sm shadow-sm hover:shadow-xl transition-all border border-brand-blush">
            <Image 
              src={getCategoryImage(cat.name)} 
              alt={cat.name} 
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-90" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-black/80 via-brand-black/20 to-transparent flex flex-col justify-end p-8 text-left">
              <span className="text-brand-gold text-[10px] uppercase tracking-[0.3em] font-bold mb-2">
                {cat._count.products} Curated Items
              </span>
              <h2 className="text-brand-cream text-3xl font-serif mb-4 group-hover:translate-x-2 transition-transform">
                {cat.name}
              </h2>
              <div className="w-12 h-0.5 bg-brand-gold group-hover:w-24 transition-all"></div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
