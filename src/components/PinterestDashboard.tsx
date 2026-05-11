"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Clipboard, Download, Loader2, PinIcon, Send, Sparkles } from 'lucide-react';

type PinterestPin = {
  id: string;
  title: string;
  description: string;
  destinationUrl: string;
  imageUrl?: string | null;
  imagePrompt?: string | null;
  altText: string;
  boardName: string;
  boardId?: string | null;
  status: 'Draft' | 'Ready' | 'Published' | 'Failed';
  pinterestPinId?: string | null;
  errorMessage?: string | null;
  product?: { name: string } | null;
  blogPost?: { title: string; slug: string } | null;
};

type Board = { id: string; name: string; pinCount?: number };

const emptyBoards: Board[] = [];

function statusClass(status: PinterestPin['status']) {
  if (status === 'Published') return 'bg-green-100 text-green-700';
  if (status === 'Ready') return 'bg-blue-100 text-blue-700';
  if (status === 'Failed') return 'bg-red-100 text-red-700';
  return 'bg-brand-cream text-brand-black/60';
}

export default function PinterestDashboard() {
  const [pins, setPins] = useState<PinterestPin[]>([]);
  const [boards, setBoards] = useState<Board[]>(emptyBoards);
  const [canPublish, setCanPublish] = useState(false);
  const [defaultBoardId, setDefaultBoardId] = useState<string | null>(null);
  const [selectedDefaultBoardId, setSelectedDefaultBoardId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchPins = async () => {
    const response = await fetch('/api/pinterest/pins');
    const data = await response.json();
    if (data.success) {
      setPins(data.data);
      setCanPublish(Boolean(data.meta?.canPublish));
      setDefaultBoardId(data.meta?.defaultBoardId || null);
      setSelectedDefaultBoardId((current) => current || data.meta?.defaultBoardId || '');
    } else {
      setMessage(data.error || 'Unable to load pins');
    }
    setLoading(false);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchPins();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const testConnection = async () => {
    setTesting(true);
    setMessage(null);
    try {
      const response = await fetch('/api/pinterest/boards');
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Pinterest connection failed');
      setBoards(data.data);
      setCanPublish(Boolean(data.meta?.canPublish));
      setDefaultBoardId(data.meta?.defaultBoardId || null);
      setSelectedDefaultBoardId((current) => current || data.meta?.defaultBoardId || data.data[0]?.id || '');
      setMessage(`Pinterest connection works. Found ${data.data.length} board${data.data.length === 1 ? '' : 's'}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Pinterest connection failed');
    } finally {
      setTesting(false);
    }
  };

  const updatePin = async (pin: PinterestPin, updates: Partial<PinterestPin>) => {
    setSavingId(pin.id);
    setMessage(null);
    try {
      const response = await fetch('/api/pinterest/pins', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: pin.id, ...updates }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Unable to update pin');
      setPins((current) => current.map((item) => (item.id === pin.id ? { ...item, ...data.data } : item)));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to update pin');
    } finally {
      setSavingId(null);
    }
  };

  const publishPin = async (pin: PinterestPin) => {
    setPublishingId(pin.id);
    setMessage(null);
    try {
      const response = await fetch(`/api/pinterest/pins/${pin.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boardId: pin.boardId || selectedDefaultBoardId || defaultBoardId }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Unable to publish pin');
      setPins((current) => current.map((item) => (item.id === pin.id ? { ...item, ...data.data } : item)));
      setMessage('Pin published to Pinterest.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to publish pin');
      await fetchPins();
    } finally {
      setPublishingId(null);
    }
  };

  const copyText = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value);
    setMessage(`${label} copied for Canva/manual posting.`);
  };

  const downloadPrompt = (pin: PinterestPin) => {
    const blob = new Blob([pin.imagePrompt || pin.imageUrl || ''], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${pin.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'pin'}-image-prompt.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-brand-cream/50">
      <div className="container mx-auto px-4 py-10">
        <Link href="/dashboard" className="mb-8 inline-flex items-center gap-2 text-xs uppercase tracking-widest text-brand-black/60 hover:text-brand-gold">
          <ArrowLeft size={14} /> Back to tracker
        </Link>

        <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-brand-gold">Approval-Based Pinterest Studio</p>
            <h1 className="mb-4 text-4xl font-serif text-brand-black md:text-5xl">Pinterest Pin Drafts</h1>
            <p className="max-w-2xl text-brand-black/60 leading-relaxed">
              Review, edit, mark Ready, and only then manually publish pins. If Pinterest credentials are missing, this page remains a Canva-friendly copy/paste workflow.
            </p>
          </div>
          <button onClick={testConnection} disabled={testing} className="btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-60">
            {testing ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />} Test Pinterest Connection
          </button>
        </div>

        {message && <div className="mb-6 rounded-sm border border-brand-blush bg-white px-4 py-3 text-sm text-brand-black/70 shadow-sm">{message}</div>}

        <div className="mb-8 grid gap-4 lg:grid-cols-3">
          <div className="rounded-sm border border-brand-blush bg-white p-5 shadow-sm lg:col-span-2">
            <h2 className="font-serif text-2xl text-brand-black">Boards from safe test</h2>
            <p className="mt-2 text-sm text-brand-black/60">The test fetches boards and IDs only; it never creates or publishes a Pin.</p>
            <div className="mt-4 max-h-56 overflow-auto rounded-sm border border-brand-blush">
              {boards.length ? boards.map((board) => (
                <div key={board.id} className="flex flex-col gap-1 border-b border-brand-blush p-3 text-sm last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-bold text-brand-black">{board.name}</span>
                  <code className="text-xs text-brand-black/50">{board.id}</code>
                </div>
              )) : <p className="p-4 text-sm italic text-brand-black/40">Run the connection test to show board names and board IDs.</p>}
            </div>
          </div>
          <div className="rounded-sm border border-brand-blush bg-white p-5 shadow-sm">
            <h3 className="font-serif text-xl text-brand-black">Publishing Mode</h3>
            <p className="mt-3 text-sm leading-6 text-brand-black/60">
              {canPublish ? 'Pinterest API credentials are set. Publish buttons appear for Ready pins with image URLs.' : 'Fallback mode: credentials are missing, so drafts can be copied into Pinterest or Canva manually.'}
            </p>
            {defaultBoardId && <p className="mt-3 text-xs text-brand-black/50">Env default board: <code>{defaultBoardId}</code></p>}
            {boards.length > 0 && (
              <label className="mt-4 block">
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-black/50">Choose default board for this session</span>
                <select value={selectedDefaultBoardId} onChange={(event) => setSelectedDefaultBoardId(event.target.value)} className="mt-1 w-full rounded-sm border border-brand-blush bg-white p-3 text-sm focus:border-brand-gold focus:outline-none">
                  <option value="">Use env default</option>
                  {boards.map((board) => <option key={board.id} value={board.id}>{board.name} — {board.id}</option>)}
                </select>
              </label>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-brand-gold" size={36} /></div>
        ) : (
          <div className="space-y-6">
            {pins.map((pin) => (
              <article key={pin.id} className="rounded-sm border border-brand-blush bg-white p-6 shadow-sm">
                <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${statusClass(pin.status)}`}>{pin.status}</span>
                    <p className="mt-2 text-xs text-brand-black/40">{pin.product?.name || pin.blogPost?.title || 'Scout-approved draft'}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => updatePin(pin, { status: 'Ready' })} disabled={savingId === pin.id || pin.status === 'Published'} className="btn-outline inline-flex items-center gap-2 px-3 py-2 text-[10px] disabled:opacity-50"><CheckCircle2 size={14} /> Mark Ready</button>
                    {canPublish && pin.status === 'Ready' && (
                      <button onClick={() => publishPin(pin)} disabled={publishingId === pin.id} className="btn-primary inline-flex items-center gap-2 px-3 py-2 text-[10px] disabled:opacity-50">
                        {publishingId === pin.id ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />} Publish to Pinterest
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
                  <div className="space-y-3">
                    <label className="block"><span className="text-[10px] font-bold uppercase tracking-widest text-brand-black/50">Title</span><input value={pin.title} onChange={(event) => setPins((current) => current.map((item) => item.id === pin.id ? { ...item, title: event.target.value } : item))} onBlur={() => updatePin(pin, { title: pin.title })} className="mt-1 w-full rounded-sm border border-brand-blush p-3 text-sm focus:border-brand-gold focus:outline-none" /></label>
                    <label className="block"><span className="text-[10px] font-bold uppercase tracking-widest text-brand-black/50">Description</span><textarea value={pin.description} onChange={(event) => setPins((current) => current.map((item) => item.id === pin.id ? { ...item, description: event.target.value } : item))} onBlur={() => updatePin(pin, { description: pin.description })} className="mt-1 min-h-28 w-full rounded-sm border border-brand-blush p-3 text-sm focus:border-brand-gold focus:outline-none" /></label>
                    <label className="block"><span className="text-[10px] font-bold uppercase tracking-widest text-brand-black/50">Destination URL</span><input value={pin.destinationUrl} onChange={(event) => setPins((current) => current.map((item) => item.id === pin.id ? { ...item, destinationUrl: event.target.value } : item))} onBlur={() => updatePin(pin, { destinationUrl: pin.destinationUrl })} className="mt-1 w-full rounded-sm border border-brand-blush p-3 text-sm focus:border-brand-gold focus:outline-none" /></label>
                    <label className="block"><span className="text-[10px] font-bold uppercase tracking-widest text-brand-black/50">Image URL</span><input value={pin.imageUrl || ''} onChange={(event) => setPins((current) => current.map((item) => item.id === pin.id ? { ...item, imageUrl: event.target.value } : item))} onBlur={() => updatePin(pin, { imageUrl: pin.imageUrl || '' })} placeholder="https://... required for API publishing" className="mt-1 w-full rounded-sm border border-brand-blush p-3 text-sm focus:border-brand-gold focus:outline-none" /></label>
                  </div>

                  <div className="space-y-3 rounded-sm bg-brand-cream/40 p-4">
                    <label className="block"><span className="text-[10px] font-bold uppercase tracking-widest text-brand-black/50">Alt text</span><textarea value={pin.altText} onChange={(event) => setPins((current) => current.map((item) => item.id === pin.id ? { ...item, altText: event.target.value } : item))} onBlur={() => updatePin(pin, { altText: pin.altText })} className="mt-1 min-h-20 w-full rounded-sm border border-brand-blush p-3 text-sm focus:border-brand-gold focus:outline-none" /></label>
                    <label className="block"><span className="text-[10px] font-bold uppercase tracking-widest text-brand-black/50">Board</span><input value={pin.boardName} onChange={(event) => setPins((current) => current.map((item) => item.id === pin.id ? { ...item, boardName: event.target.value } : item))} onBlur={() => updatePin(pin, { boardName: pin.boardName })} className="mt-1 w-full rounded-sm border border-brand-blush p-3 text-sm focus:border-brand-gold focus:outline-none" /></label>
                    <label className="block"><span className="text-[10px] font-bold uppercase tracking-widest text-brand-black/50">Board ID for publishing</span><select value={pin.boardId || selectedDefaultBoardId || defaultBoardId || ''} onChange={(event) => updatePin(pin, { boardId: event.target.value })} className="mt-1 w-full rounded-sm border border-brand-blush bg-white p-3 text-sm focus:border-brand-gold focus:outline-none"><option value="">Use env default / choose after test</option>{boards.map((board) => <option key={board.id} value={board.id}>{board.name} — {board.id}</option>)}</select></label>
                    <label className="block"><span className="text-[10px] font-bold uppercase tracking-widest text-brand-black/50">Image prompt</span><textarea value={pin.imagePrompt || ''} onChange={(event) => setPins((current) => current.map((item) => item.id === pin.id ? { ...item, imagePrompt: event.target.value } : item))} onBlur={() => updatePin(pin, { imagePrompt: pin.imagePrompt || '' })} className="mt-1 min-h-28 w-full rounded-sm border border-brand-blush p-3 text-sm focus:border-brand-gold focus:outline-none" /></label>
                    {pin.errorMessage && <p className="text-xs text-red-700">{pin.errorMessage}</p>}
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => copyText(pin.title, 'Title')} className="btn-outline inline-flex items-center justify-center gap-2 px-3 py-2 text-[10px]"><Clipboard size={13} /> Copy title</button>
                      <button onClick={() => copyText(pin.description, 'Description')} className="btn-outline inline-flex items-center justify-center gap-2 px-3 py-2 text-[10px]"><Clipboard size={13} /> Copy desc</button>
                      <button onClick={() => copyText(pin.destinationUrl, 'Destination URL')} className="btn-outline inline-flex items-center justify-center gap-2 px-3 py-2 text-[10px]"><Clipboard size={13} /> Copy URL</button>
                      <button onClick={() => downloadPrompt(pin)} className="btn-outline inline-flex items-center justify-center gap-2 px-3 py-2 text-[10px]"><Download size={13} /> Prompt</button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
            {!pins.length && <div className="rounded-sm border border-brand-blush bg-white p-12 text-center text-brand-black/40"><PinIcon className="mx-auto mb-4 text-brand-gold" />No Pinterest drafts yet. Use Create Pins from products, blog posts, or approved Scout leads.</div>}
          </div>
        )}
      </div>
    </div>
  );
}
