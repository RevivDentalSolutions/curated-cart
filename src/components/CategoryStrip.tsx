import { MAIN_CATEGORIES, getCategoryHref } from '@/lib/categories';

const accentClasses: Record<string, string> = {
  blush: 'bg-brand-blush',
  nude: 'bg-brand-nude',
  cream: 'bg-brand-cream',
  beige: 'bg-brand-beige/50',
  sand: 'bg-brand-nude/70',
};

export default function CategoryStrip() {
  return (
    <section className="py-12 bg-white border-y border-brand-beige/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h3 className="text-center font-sans text-xs font-bold uppercase tracking-[0.2em] mb-8 text-brand-gold">
          Shop by Category
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {MAIN_CATEGORIES.map((cat) => (
            <a
              key={cat.slug}
              href={getCategoryHref(cat)}
              className={`${accentClasses[cat.accent]} aspect-[4/3] flex items-center justify-center p-4 text-center hover:scale-[1.02] transition-transform duration-300 group shadow-sm`}
            >
              <span className="font-serif text-lg font-bold text-brand-black group-hover:underline decoration-brand-gold underline-offset-4">
                {cat.name}
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
