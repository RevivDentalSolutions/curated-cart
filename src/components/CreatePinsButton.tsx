"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, PinIcon, Sparkles } from 'lucide-react';

type Props = {
  productId?: string;
  blogPostId?: string;
  leadId?: string;
  label?: string;
  className?: string;
  onCreated?: () => void;
};

export default function CreatePinsButton({ productId, blogPostId, leadId, label = 'Create Pins', className = 'btn-outline py-2 px-3 text-[9px]', onCreated }: Props) {
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(false);

  const createPins = async () => {
    setCreating(true);
    try {
      const response = await fetch('/api/pinterest/pins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, blogPostId, leadId }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Unable to create pins');
      setCreated(true);
      onCreated?.();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Unable to create pins');
    } finally {
      setCreating(false);
    }
  };

  if (created) {
    return (
      <Link href="/dashboard/pinterest" className={`${className} inline-flex items-center justify-center gap-2`}>
        <PinIcon size={14} /> Review Pins
      </Link>
    );
  }

  return (
    <button onClick={createPins} disabled={creating} className={`${className} inline-flex items-center justify-center gap-2 disabled:opacity-50`}>
      {creating ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
      {creating ? 'Creating...' : label}
    </button>
  );
}
