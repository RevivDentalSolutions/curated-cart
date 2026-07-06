import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { connection } from 'next/server';
import ProductImage from '@/components/ProductImage';
import { buildCategoryCards } from '@/lib/categories';
import { fallbackCategories } from '@/lib/homepage-fallback';

export default async function CategoriesPage() {
  await connection();
  const categorySources = process.env.DATABASE_URL ? await prisma.category.findMany({
    include: {
      products: {
        where: { published: true },
        select: { id: true },
      },
    },
  }) : fallbackCategories;

  const categories = buildCategoryCards(categorySources);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <span className="text-brand-gold uppercase tracking-[0.3em] text-[10px] font-bold">Curated Collections</span>
        <h1 className="text-5xl font-serif mt-4 mb-6 tracking-tighter text-brand-black">Shop by Category</h1>
        <div className="h-0.5 w-20 bg-brand-gold mx-auto mb-6"></div>
        <p className="max-w-2xl mx-auto text-sm leading-7 text-brand-black/60">
          Eight polished edits for a softer, prettier Amazon cart — from beauty staples to elevated home, kitchen, and mom-life finds.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {categories.map((cat) => (
          <Link
            href={cat.href}
            key={cat.slug}
            className="group relative min-h-[22rem] overflow-hidden rounded-sm border border-white/60 bg-brand-cream shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-xl"
          >
            <ProductImage
              src={cat.image}
              alt={`${cat.name} curated category`}
              className="absolute inset-0 h-full w-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-black/75 via-brand-black/25 to-brand-cream/10"></div>
            <div className="absolute inset-4 border border-white/25 transition-colors group-hover:border-brand-gold/70"></div>
            <div className="absolute inset-x-0 bottom-0 p-7 text-left">
              <span className="mb-3 inline-flex bg-brand-cream/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-brand-black backdrop-blur-sm">
                {cat.itemCount} {cat.itemCount === 1 ? 'Curated Item' : 'Curated Items'}
              </span>
              <h2 className="text-3xl font-serif text-brand-cream drop-shadow-sm transition-transform group-hover:translate-x-1">
                {cat.name}
              </h2>
              <div className="mt-4 h-0.5 w-12 bg-brand-gold transition-all group-hover:w-24"></div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
