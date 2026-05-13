import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

type BlogArticleHeaderProps = {
  category: string;
  title: string;
  publishedAt: Date;
  readingTime: string;
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
}: BlogArticleHeaderProps) {
  return (
    <header className="relative isolate overflow-hidden border-b border-brand-blush bg-brand-cream">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(253,242,240,0.95),transparent_34%),radial-gradient(circle_at_top_right,rgba(214,204,194,0.38),transparent_30%),linear-gradient(135deg,#fcfaf7_0%,#fffaf6_42%,#fdf2f0_100%)]" />
      <div className="absolute left-1/2 top-8 -z-10 h-64 w-64 -translate-x-1/2 rounded-full bg-white/60 blur-3xl" />
      <div className="container relative mx-auto max-w-5xl px-4 py-14 text-center md:py-20 lg:py-24">
        <Link
          href="/blog"
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-brand-blush/80 bg-white/55 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.24em] text-brand-black/55 shadow-sm shadow-brand-beige/10 transition-colors hover:border-brand-gold/40 hover:text-brand-gold"
        >
          <ArrowLeft size={12} /> Back to Library
        </Link>

        <div className="mx-auto mb-8 flex max-w-2xl items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-[0.32em] text-brand-gold">
          <span className="h-px w-8 bg-brand-gold/40 sm:w-12" />
          <span>{category}</span>
          <span className="h-px w-8 bg-brand-gold/40 sm:w-12" />
        </div>

        <h1 className="mx-auto max-w-4xl text-balance text-4xl leading-[1.08] text-brand-black md:text-6xl lg:text-7xl">
          {title}
        </h1>

        <p className="mx-auto mt-8 max-w-2xl rounded-sm border border-white/75 bg-white/45 px-5 py-4 text-xs font-light leading-relaxed text-brand-black/60 shadow-sm shadow-brand-beige/10 md:text-sm">
          Affiliate disclosure: This post may contain affiliate links. As an Amazon Associate, I earn from qualifying purchases at no extra cost to you.
        </p>

        <div className="mx-auto mt-7 flex max-w-xl flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[10px] font-bold uppercase tracking-[0.22em] text-brand-black/45">
          <time dateTime={publishedAt.toISOString()}>{formatPublishedDate(publishedAt)}</time>
          <span aria-hidden="true">•</span>
          <span>{readingTime}</span>
        </div>
      </div>
      <div className="h-px bg-gradient-to-r from-transparent via-brand-gold/35 to-transparent" />
    </header>
  );
}
