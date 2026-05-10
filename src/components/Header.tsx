import Link from 'next/link';
import { ShoppingCart, Search, Menu } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-brand-cream border-b border-brand-blush sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button className="md:hidden text-brand-black">
              <Menu size={24} />
            </button>
            <Link href="/" className="flex flex-col items-center">
              <span className="text-2xl md:text-3xl font-serif tracking-tighter text-brand-black uppercase">The Curated Cart</span>
              <span className="text-[10px] md:text-xs uppercase tracking-[0.3em] text-brand-gold -mt-1">Pretty finds. Practical buys.</span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/blog" className="nav-link">Blog</Link>
            <Link href="/top-picks" className="nav-link">Top Picks</Link>
            <Link href="/categories" className="nav-link">Categories</Link>
            <Link href="/dashboard" className="nav-link">Tracker</Link>
          </nav>

          <div className="flex items-center space-x-4">
            <button className="text-brand-black hover:text-brand-gold transition-colors">
              <Search size={20} />
            </button>
            <Link href="/dashboard" className="text-brand-black hover:text-brand-gold transition-colors">
              <ShoppingCart size={20} />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
