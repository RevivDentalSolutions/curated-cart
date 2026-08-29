"use client";

import { useState } from 'react';

type NewsletterSignupProps = {
  source: 'homepage' | 'footer';
  layout?: 'row' | 'stacked';
};

export default function NewsletterSignup({ source, layout = 'stacked' }: NewsletterSignupProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function subscribe(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('submitting');
    setMessage('');

    const formData = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          source,
          website: formData.get('website'),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to join right now.');

      setEmail('');
      setStatus('success');
      setMessage('You’re on the list! Watch your inbox for the next Cart Drop.');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Unable to join right now. Please try again.');
    }
  }

  const isRow = layout === 'row';

  return (
    <form onSubmit={subscribe} className={isRow ? 'mt-8 flex flex-col gap-4 md:flex-row md:flex-wrap' : 'flex flex-col space-y-2'}>
      <label className="sr-only" htmlFor={`newsletter-email-${source}`}>Email address</label>
      <input
        id={`newsletter-email-${source}`}
        name="email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder={isRow ? 'Your email address' : 'Email address'}
        className={isRow
          ? 'flex-grow bg-white px-6 py-4 text-sm text-brand-black focus:outline-none focus:ring-2 focus:ring-brand-gold'
          : 'w-full border border-brand-beige/20 bg-white/5 px-4 py-2 text-sm text-brand-cream focus:border-brand-gold focus:outline-none'}
      />
      <div className="absolute left-[-9999px]" aria-hidden="true">
        <label htmlFor={`newsletter-website-${source}`}>Website</label>
        <input id={`newsletter-website-${source}`} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <button
        type="submit"
        disabled={status === 'submitting'}
        className={isRow
          ? 'btn-primary py-4 disabled:cursor-wait disabled:opacity-60'
          : 'bg-brand-gold px-4 py-2 text-xs font-bold uppercase tracking-widest text-brand-black transition-colors hover:bg-brand-beige disabled:cursor-wait disabled:opacity-60'}
      >
        {status === 'submitting' ? 'Joining…' : isRow ? 'Join the List' : 'Join the Cart Drop'}
      </button>
      {message && (
        <p role="status" className={`${isRow ? 'md:basis-full' : ''} text-xs ${status === 'error' ? 'text-red-300' : 'text-brand-gold'}`}>
          {message}
        </p>
      )}
    </form>
  );
}
