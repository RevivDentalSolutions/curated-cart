'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6 px-4 text-center">
      <h2 className="text-4xl font-serif text-brand-black">Something went wrong</h2>
      <p className="text-brand-black/60 max-w-md">
        We&rsquo;re having trouble loading this page right now. It might be a temporary glitch in the cart.
      </p>
      <div className="flex gap-4">
        <button
          onClick={() => reset()}
          className="btn-primary"
        >
          Try again
        </button>
        <Link href="/" className="btn-outline">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
