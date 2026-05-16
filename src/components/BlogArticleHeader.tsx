import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

type BlogArticleHeaderProps = {
  category: string;
  title: string;
  publishedAt: Date;
  readingTime: string;
  affiliateDisclosure?: string | null;
};

const formatPublishedDate = (date: Date) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);

export default function BlogArticleHeader({
  category,
  title,
  publishedAt,
  readingTime,
  affiliateDisclosure,
}: BlogArticleHeaderProps) {
  return (
    <header className="relative overflow-hidden border-b border-brand-blush bg-[linear-gradient(135deg,#fcfaf7_0%,#fdf2f0_46%,#f5ebe0_100%)]">
      <div className="absolute left-1/2 top-8 h-56 w-56 -translate-x-1/2 rounded-full bg-white/50 blur-3xl" />
      <div className="container relative mx-auto max-w-5xl px-4 py-14 text-center md:py-20">
        <Link
          href="/blog"
          className="mb-8 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.28em] text-brand-black/50 transition-colors hover:text-brand-gold"
        >
          <ArrowLeft size={12} /> Back to Library
        </Link>

        <div className="mx-auto mb-8 flex max-w-2xl items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-[0.32em] text-brand-gold">
          <span className="h-px w-10 bg-brand-gold/40" />
          <span>{category}</span>
          <span className="h-px w-10 bg-brand-gold/40" />
        </div>

        <h1 className="mx-auto max-w-4xl text-4xl leading-[1.05] text-brand-black md:text-6xl lg:text-7xl">
          {title}
        </h1>

        <div className="mx-auto mt-8 flex max-w-xl flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[10px] font-bold uppercase tracking-[0.22em] text-brand-black/45">
          <time dateTime={publishedAt.toISOString()}>{formatPublishedDate(publishedAt)}</time>
          <span aria-hidden="true">•</span>
          <span>{readingTime}</span>
        </div>

        <p className="mx-auto mt-8 max-w-2xl border-y border-white/70 py-4 text-xs font-light leading-relaxed text-brand-black/55 md:text-sm">
          {affiliateDisclosure || 'Affiliate disclosure: This post may contain affiliate links. As an Amazon Associate, I earn from qualifying purchases at no extra cost to you.'}
        </p>
      </div>
    </header>
  );
}
