import Image from 'next/image';

const products = [
  {
    id: '1',
    name: 'Antique Brass Vanity Mirror',
    category: 'Home Decor',
    price: '$45.00',
    image: 'https://images.unsplash.com/photo-1618220179428-22790b461013?q=80&w=800&auto=format&fit=crop',
    link: '#',
  },
  {
    id: '2',
    name: 'Satin Slip Dress - Champagne',
    category: 'Fashion Finds',
    price: '$28.99',
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=800&auto=format&fit=crop',
    link: '#',
  },
  {
    id: '3',
    name: 'Gua Sha & Roller Set',
    category: 'Skincare',
    price: '$15.50',
    image: 'https://images.unsplash.com/photo-1601612620952-4043c5bc4a71?q=80&w=800&auto=format&fit=crop',
    link: '#',
  },
  {
    id: '4',
    name: 'Neutral Aesthetic Coffee Table Books',
    category: 'Home Decor',
    price: '$32.00',
    image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=800&auto=format&fit=crop',
    link: '#',
  },
];

export default function FeaturedProducts() {
  return (
    <section className="py-20 bg-brand-cream/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-4xl font-serif font-bold text-brand-black">Trending This Week</h2>
            <div className="h-1 w-20 bg-brand-gold mt-4"></div>
          </div>
          <a href="/top-picks" className="text-sm font-bold uppercase tracking-widest text-brand-gold hover:text-brand-black transition-colors">
            View All Products &rarr;
          </a>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product) => (
            <div key={product.id} className="group flex flex-col bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="relative aspect-[3/4] overflow-hidden">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-brand-cream/90 backdrop-blur-sm text-brand-black text-[10px] font-bold uppercase tracking-widest px-3 py-1">
                    {product.category}
                  </span>
                </div>
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="font-serif text-lg font-bold text-brand-black mb-2 group-hover:text-brand-gold transition-colors">
                  {product.name}
                </h3>
                <p className="text-brand-gold font-bold mb-6">{product.price}</p>
                <div className="mt-auto flex flex-col gap-3">
                  <a 
                    href={product.link}
                    className="w-full text-center bg-brand-black text-brand-cream py-3 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-brand-gold transition-colors"
                  >
                    Shop the Find
                  </a>
                  <button className="w-full py-3 border border-brand-beige text-brand-black text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-brand-cream transition-colors flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Worth It?
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
