import { AMAZON_ASSOCIATES_DISCLOSURE } from '@/lib/affiliate';

export default function AffiliateDisclosureNotice({ className = '' }: { className?: string }) {
  return (
    <aside className={`rounded-sm border border-brand-blush bg-brand-cream/60 px-4 py-3 text-xs leading-6 text-brand-black/70 ${className}`}>
      <strong className="text-brand-black">Affiliate disclosure:</strong> {AMAZON_ASSOCIATES_DISCLOSURE} Product links may be affiliate links, and prices/availability can change on the retailer site.
    </aside>
  );
}
