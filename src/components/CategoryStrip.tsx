const categories = [
  { name: 'Home Decor', slug: 'home-decor', color: 'bg-brand-blush' },
  { name: 'Fashion Finds', slug: 'fashion-finds', color: 'bg-brand-nude' },
  { name: 'Skincare', slug: 'skincare', color: 'bg-brand-cream' },
  { name: 'Beauty Tools', slug: 'beauty-tools', color: 'bg-brand-beige' },
  { name: 'Mom Life', slug: 'mom-life', color: 'bg-brand-blush' },
];

export default function CategoryStrip() {
  return (
    <section className="py-12 bg-white border-y border-brand-beige/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h3 className="text-center font-sans text-xs font-bold uppercase tracking-[0.2em] mb-8 text-brand-gold">
          Shop by Category
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {categories.map((cat) => (
            <a 
              key={cat.slug}
              href={`/blog?category=${cat.slug}`}
              className={`${cat.color} aspect-[4/3] flex items-center justify-center p-4 text-center hover:scale-[1.02] transition-transform duration-300 group shadow-sm`}
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
