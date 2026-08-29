import Link from 'next/link';
import { Search, Menu, ShoppingBag } from 'lucide-react';

const AMAZON_PROFILE_URL =
  'https://www.amazon.com/gp/profile/amzn1.account.AELCMFL6SMBCPIP3MYY54OUSFB2Q?ref=css&ccs_id=ac7fe8bd-8247-4534-96bd-1a09b3706331';

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
            <Link href="/affiliate-disclosure" className="nav-link">Disclosure</Link>
            <a
              href={AMAZON_PROFILE_URL}
              target="_blank"
              rel="sponsored noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-brand-gold px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-black transition-colors hover:bg-brand-gold hover:text-white"
              aria-label="Shop all Curated Cart products on Amazon (opens in a new tab)"
            >
              <ShoppingBag size={15} aria-hidden="true" />
              Shop All Amazon Finds
            </a>
          </nav>

          <div className="flex items-center space-x-4">
            <a
              href={AMAZON_PROFILE_URL}
              target="_blank"
              rel="sponsored noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-brand-gold px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-black transition-colors hover:bg-brand-gold hover:text-white md:hidden"
              aria-label="Shop all Curated Cart products on Amazon (opens in a new tab)"
            >
              <ShoppingBag size={14} aria-hidden="true" />
              Amazon Shop
            </a>
            <button className="text-brand-black hover:text-brand-gold transition-colors">
              <Search size={20} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
