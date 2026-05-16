'use client';

import Link from 'next/link';

export default function BlogEditorError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen bg-brand-cream/60 px-4 py-20 text-center text-brand-black">
      <div className="mx-auto max-w-xl rounded-[2rem] border border-brand-blush bg-white p-8 shadow-sm">
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-gold">Editor recovery</span>
        <h1 className="mt-4 font-serif text-4xl leading-tight">The editor could not load this draft.</h1>
        <p className="mt-4 text-sm leading-7 text-brand-black/60">
          Your blog data was not deleted. This usually means the database migration is still being applied or the draft needs to be reopened.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button type="button" onClick={reset} className="btn-primary rounded-full px-6 py-3">Retry Editor</button>
          <Link href="/dashboard" className="btn-outline rounded-full px-6 py-3">Back to Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
