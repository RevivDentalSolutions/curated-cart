import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
      <Loader2 className="animate-spin text-brand-gold" size={48} />
      <p className="font-serif italic text-brand-black/60">Curating the best for you...</p>
    </div>
  );
}
