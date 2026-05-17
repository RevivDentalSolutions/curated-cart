import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-brand-cream border-b border-brand-beige">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex-shrink-0 flex flex-col">
            <Link href="/" className="text-2xl font-serif font-bold text-brand-black tracking-tight">
              The Curated Cart
            </Link>
            <span className="text-[10px] font-sans text-brand-gold uppercase tracking-[0.2em] -mt-1">
              Pretty finds. Practical buys.
            </span>
          </div>
          <div className="hidden sm:flex space-x-8">
            <Link href="/" className="text-brand-black hover:text-brand-gold px-3 py-2 text-sm font-medium transition-colors">
              Home
            </Link>
            <Link href="/blog" className="text-brand-black hover:text-brand-gold px-3 py-2 text-sm font-medium transition-colors">
              Blog
            </Link>
            <Link href="/top-picks" className="text-brand-black hover:text-brand-gold px-3 py-2 text-sm font-medium transition-colors">
              Top Picks
            </Link>
            <Link href="/categories/elevated-summer" className="text-brand-black hover:text-brand-gold px-3 py-2 text-sm font-medium transition-colors">
              Elevated Summer
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
