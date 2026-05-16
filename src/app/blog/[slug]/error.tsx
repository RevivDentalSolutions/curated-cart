'use client';

import Link from 'next/link';

export default function BlogPostError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-[70vh] bg-brand-cream/60 px-4 py-20 text-center text-brand-black">
      <div className="mx-auto max-w-xl rounded-[2rem] border border-brand-blush bg-white p-8 shadow-sm">
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-gold">Editorial page recovery</span>
        <h1 className="mt-4 font-serif text-4xl leading-tight">This article needs a quick refresh.</h1>
        <p className="mt-4 text-sm leading-7 text-brand-black/60">
          The post data is safe, but one of the editorial modules could not render. Try refreshing, or return to the blog library.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button type="button" onClick={reset} className="btn-primary rounded-full px-6 py-3">Try Again</button>
          <Link href="/blog" className="btn-outline rounded-full px-6 py-3">Back to Blog</Link>
        </div>
      </div>
    </div>
  );
}
