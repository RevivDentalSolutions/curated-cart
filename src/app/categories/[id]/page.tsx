import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import ProductImage from '@/components/ProductImage';

export default async function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      products: {
        where: { blogPostStatus: 'Published' },
        orderBy: { dateAdded: 'desc' }
      }
    }
  });

  if (!category) {
    notFound();
  }

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
        <div className="text-center py-20 bg-brand-cream/30 rounded-sm italic text-brand-black/40">
          We are currently hand-picking the best {category.name} for you.
        </div>
      )}
    </div>
  );
}
