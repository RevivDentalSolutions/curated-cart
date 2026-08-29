import NewsletterSignup from '@/components/NewsletterSignup';

export default function Footer() {
  return (
    <footer className="bg-brand-black text-brand-cream py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <h3 className="font-serif text-2xl mb-4">The Curated Cart</h3>
            <p className="text-sm text-brand-beige opacity-80 max-w-md leading-relaxed">
              Your daily dose of curated style. We find the most beautiful, practical, and viral Amazon products so you don't have to. From home decor to must-have skincare, we've got you covered.
            </p>
          </div>
          <div>
            <h4 className="font-sans text-xs font-bold uppercase tracking-[0.2em] mb-6 text-brand-gold">Categories</h4>
            <ul className="text-sm space-y-3 text-brand-beige opacity-80">
              <li><a href="/blog?category=home-decor" className="hover:text-brand-cream transition-colors">Home Decor</a></li>
              <li><a href="/blog?category=fashion-finds" className="hover:text-brand-cream transition-colors">Fashion Finds</a></li>
              <li><a href="/blog?category=skincare" className="hover:text-brand-cream transition-colors">Skincare</a></li>
              <li><a href="/blog?category=mom-life" className="hover:text-brand-cream transition-colors">Mom Life Favorites</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-sans text-xs font-bold uppercase tracking-[0.2em] mb-6 text-brand-gold">Site Info</h4>
            <ul className="text-sm space-y-3 text-brand-beige opacity-80 mb-6">
              <li><a href="/privacy-policy" className="hover:text-brand-cream transition-colors">Privacy Policy</a></li>
              <li><a href="/affiliate-disclosure" className="hover:text-brand-cream transition-colors">Affiliate Disclosure</a></li>
              <li><a href="/contact" className="hover:text-brand-cream transition-colors">Contact</a></li>
            </ul>
            <h4 className="font-sans text-xs font-bold uppercase tracking-[0.2em] mb-6 text-brand-gold">Newsletter</h4>
            <p className="text-sm mb-4 text-brand-beige opacity-80">Get my weekly Amazon finds delivered to your inbox.</p>
            <NewsletterSignup source="footer" />
          </div>
        </div>
        <div className="mt-16 pt-8 border-t border-brand-beige/10 text-center">
          <p className="text-[10px] text-brand-beige/60 max-w-3xl mx-auto leading-relaxed">
            AMAZON ASSOCIATES DISCLOSURE: As an Amazon Associate I earn from qualifying purchases. The Curated Cart is a participant in the Amazon Services LLC Associates Program, an affiliate advertising program designed to provide a means for sites to earn advertising fees by advertising and linking to Amazon.com.
          </p>
          <p className="mt-8 text-[10px] text-brand-beige/40 uppercase tracking-widest">
            &copy; {new Date().getFullYear()} The Curated Cart. Pretty finds. Practical buys.
          </p>
        </div>
      </div>
    </footer>
  );
}
