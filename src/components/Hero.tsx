export default function Hero() {
  return (
    <section className="relative bg-brand-cream py-24 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-brand-blush blur-3xl"></div>
        <div className="absolute top-1/2 -right-24 w-64 h-64 rounded-full bg-brand-nude blur-3xl"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center">
          <h2 className="text-brand-gold text-xs font-sans font-bold uppercase tracking-[0.4em] mb-4">
            Pretty & Practical Picks
          </h2>
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-brand-black mb-6 tracking-tight">
            The Curated Cart
          </h1>
          <p className="text-xl md:text-2xl font-serif italic text-brand-black/70 mb-10">
            "Pretty finds. Practical buys."
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a 
              href="/blog" 
              className="bg-brand-black text-brand-cream px-8 py-4 font-bold text-sm uppercase tracking-widest hover:bg-brand-gold transition-colors duration-300"
            >
              Explore the Blog
            </a>
            <a 
              href="/top-picks" 
              className="bg-transparent border-2 border-brand-black text-brand-black px-8 py-4 font-bold text-sm uppercase tracking-widest hover:bg-brand-black hover:text-brand-cream transition-colors duration-300"
            >
              Shop Top Picks
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
