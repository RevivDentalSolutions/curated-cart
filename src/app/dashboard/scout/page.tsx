"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bot, CheckCircle2, Loader2, Mail, PlayCircle, Plus, ShieldCheck, Sparkles, XCircle } from 'lucide-react';
import CreatePinsButton from '@/components/CreatePinsButton';

type ProductLead = {
  id: string;
  title: string;
  source: string;
  sourceUrl?: string | null;
  imageUrl?: string | null;
  trendKeyword?: string | null;
  suggestedCategory?: string | null;
  estimatedPrice?: number | null;
  reasonItMightSell: string;
  viralityScore: number;
  status: 'New' | 'Approved' | 'Rejected';
  createdAt: string;
};

type AutomationConfig = {
  autoImportEnabled: boolean;
  autoApproveHighScoringLeads: boolean;
  autoGenerateContentBundles: boolean;
  highScoreThreshold: number;
  rssFeeds: string[];
  amazonMoversUrls: string[];
  tiktokKeywords: string[];
  pinterestKeywords: string[];
  productUrls: string[];
  lastRunAt?: string | null;
};

type RunSummary = { skipped?: boolean; reason?: string; discovered?: number; created?: number; deduped?: number; approved?: number; fallbackCreated?: number };
type DraftSummary = { scanned: number; created: number; errors: string[] };
type Toast = { type: 'success' | 'error'; message: string };

const emptyLead = { title: '', source: 'Manual import', sourceUrl: '', imageUrl: '', trendKeyword: '', suggestedCategory: '', estimatedPrice: '', reasonItMightSell: '' };
const defaultAutomationConfig: AutomationConfig = { autoImportEnabled: false, autoApproveHighScoringLeads: false, autoGenerateContentBundles: false, highScoreThreshold: 85, rssFeeds: [], amazonMoversUrls: [], tiktokKeywords: [], pinterestKeywords: [], productUrls: [] };

function listToText(values: string[]) { return values.join('\n'); }
function textToList(value: string) { return value.split('\n').map((line) => line.trim()).filter(Boolean); }

function formatApiError(route: string, status: number, payload: unknown) {
  const error = payload && typeof payload === 'object' && 'error' in payload ? (payload as { error?: unknown }).error : undefined;
  const detail = typeof error === 'string' ? error : error ? JSON.stringify(error) : 'No error detail returned';
  return `${route} failed (${status}): ${detail}`;
}

async function readApiJson(response: Response, route: string) {
  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    throw new Error(`${route} failed (${response.status}): response was not valid JSON`);
  }

  if (!response.ok || !payload || typeof payload !== 'object' || !('success' in payload) || !(payload as { success?: unknown }).success) {
    throw new Error(formatApiError(route, response.status, payload));
  }

  return payload as { success: true; data?: unknown; meta?: unknown };
}

function summarizeRun(summary: RunSummary) {
  if (summary.skipped) return summary.reason || 'Scout run skipped.';

  return `Scout run complete: ${summary.created || 0} created, ${summary.deduped || 0} deduped, ${summary.approved || 0} approved${summary.fallbackCreated ? `, ${summary.fallbackCreated} keyword fallback` : ''}.`;
}

function sourceBadge(source: string) {
  const lower = source.toLowerCase();
  if (lower.includes('tiktok')) return { label: 'TikTok', className: 'bg-black text-white' };
  if (lower.includes('pinterest')) return { label: 'Pinterest', className: 'bg-red-50 text-red-700' };
  if (lower.includes('amazon')) return { label: 'Amazon', className: 'bg-amber-50 text-amber-700' };
  if (lower.includes('rss')) return { label: 'RSS', className: 'bg-blue-50 text-blue-700' };
  return { label: 'Manual', className: 'bg-brand-cream text-brand-black/60' };
}

export default function ProductScoutPage() {
  const [leads, setLeads] = useState<ProductLead[]>([]);
  const [automationConfig, setAutomationConfig] = useState<AutomationConfig>(defaultAutomationConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingAutomation, setSavingAutomation] = useState(false);
  const [runningAutomation, setRunningAutomation] = useState(false);
  const [generatingDrafts, setGeneratingDrafts] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyLead);
  const [pastedIdeas, setPastedIdeas] = useState('');
  const [runSummary, setRunSummary] = useState<RunSummary | null>(null);
  const [draftSummary, setDraftSummary] = useState<DraftSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const newLeadCount = useMemo(() => leads.filter((lead) => lead.status === 'New').length, [leads]);
  const averageScore = useMemo(() => leads.length ? Math.round(leads.reduce((sum, lead) => sum + lead.viralityScore, 0) / leads.length) : 0, [leads]);
  const hasAutomationSources = useMemo(() => [
    automationConfig.rssFeeds,
    automationConfig.amazonMoversUrls,
    automationConfig.tiktokKeywords,
    automationConfig.pinterestKeywords,
    automationConfig.productUrls,
  ].some((values) => values.length > 0), [automationConfig]);

  const fetchLeads = async ({ preserveToast = false } = {}) => {
    try {
      setError(null);
      const [leadPayload, automationPayload] = await Promise.all([
        fetch('/api/scout').then((response) => readApiJson(response, 'GET /api/scout')),
        fetch('/api/scout/automations').then((response) => readApiJson(response, 'GET /api/scout/automations')),
      ]);
      setLeads((leadPayload.data as ProductLead[]) || []);
      setAutomationConfig((automationPayload.data as AutomationConfig) || defaultAutomationConfig);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load product scout data';
      setError(message);
      if (!preserveToast) setToast({ type: 'error', message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchLeads();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const saveAutomationConfig = async (nextConfig = automationConfig) => {
    setSavingAutomation(true);
    try {
      const response = await fetch('/api/scout/automations', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(nextConfig) });
      const payload = await readApiJson(response, 'PUT /api/scout/automations');
      const savedConfig = payload.data as AutomationConfig;
      setAutomationConfig(savedConfig);
      return savedConfig;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to save automation settings';
      setError(message);
      setToast({ type: 'error', message });
      throw err;
    } finally {
      setSavingAutomation(false);
    }
  };

  const runScoutNow = async () => {
    setRunningAutomation(true); setRunSummary(null); setError(null); setToast(null);
    try {
      const savedConfig = await saveAutomationConfig();
      const response = await fetch('/api/scout/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: savedConfig }),
      });
      const payload = await readApiJson(response, 'POST /api/scout/automations');
      const summary = payload.data as RunSummary;
      setRunSummary(summary);
      setToast({ type: 'success', message: summarizeRun(summary) });
      await fetchLeads({ preserveToast: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to run scout automation';
      setError(message);
      setToast({ type: 'error', message });
    } finally { setRunningAutomation(false); }
  };

  const submitManualLead = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError(null);
    try {
      const response = await fetch('/api/scout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sourceType: 'manual', leads: [form] }) });
      await readApiJson(response, 'POST /api/scout');
      setForm(emptyLead); await fetchLeads();
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to save lead'); }
    finally { setSaving(false); }
  };

  const importPastedIdeas = async (createProductDrafts = false) => {
    const importedLeads = textToList(pastedIdeas).map((line) => ({ title: line, source: 'Pasted trend list', trendKeyword: 'manual trend import', reasonItMightSell: '' }));
    if (!importedLeads.length) return;
    setSaving(true); setDraftSummary(null); setError(null);
    try {
      const response = await fetch('/api/scout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sourceType: 'automation', leads: importedLeads, createProductDrafts }) });
      await readApiJson(response, 'POST /api/scout');
      setPastedIdeas(''); await fetchLeads();
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to import ideas'); }
    finally { setSaving(false); }
  };

  const generateQueuedProductDrafts = async () => {
    setGeneratingDrafts(true); setDraftSummary(null); setError(null);
    try {
      const response = await fetch('/api/scout/generate-drafts', { method: 'POST' });
      const data = await readApiJson(response, 'POST /api/scout/generate-drafts');
      setDraftSummary(data.data as DraftSummary); await fetchLeads();
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to generate product drafts'); }
    finally { setGeneratingDrafts(false); }
  };

  const approveLead = async (id: string) => {
    setActingId(id); setError(null);
    try {
      const response = await fetch(`/api/scout/${id}/approve`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ generateContentBundle: automationConfig.autoGenerateContentBundles }) });
      await readApiJson(response, `POST /api/scout/${id}/approve`);
      await fetchLeads();
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to approve lead'); }
    finally { setActingId(null); }
  };

  const rejectLead = async (id: string) => {
    setActingId(id); setError(null);
    try {
      const response = await fetch(`/api/scout/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'Rejected' }) });
      await readApiJson(response, `PATCH /api/scout/${id}`);
      await fetchLeads();
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to reject lead'); }
    finally { setActingId(null); }
  };

  const updateAutomationList = (key: keyof Pick<AutomationConfig, 'rssFeeds' | 'amazonMoversUrls' | 'tiktokKeywords' | 'pinterestKeywords' | 'productUrls'>, value: string) => setAutomationConfig({ ...automationConfig, [key]: textToList(value) });
  const toggle = (key: keyof Pick<AutomationConfig, 'autoImportEnabled' | 'autoApproveHighScoringLeads' | 'autoGenerateContentBundles'>) => { const nextConfig = { ...automationConfig, [key]: !automationConfig[key] }; setAutomationConfig(nextConfig); saveAutomationConfig(nextConfig); };

  return (
    <div className="min-h-screen bg-brand-cream/50"><div className="container mx-auto px-4 py-10">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-brand-black/60 hover:text-brand-gold mb-8"><ArrowLeft size={14} /> Back to tracker</Link>
      <div className="flex flex-col lg:flex-row justify-between gap-6 mb-10"><div><p className="text-xs uppercase tracking-[0.3em] text-brand-gold font-bold mb-3">Admin Product Scout</p><h1 className="text-4xl md:text-5xl font-serif text-brand-black mb-4">Viral Product Scout Bot</h1><p className="text-brand-black/60 max-w-2xl leading-relaxed">Capture product ideas, approve draft products, and generate approval-based Pinterest pins for approved Scout leads.</p></div><div className="grid grid-cols-2 gap-3 min-w-[280px]"><Stat label="New Leads" value={newLeadCount} /><Stat label="Avg Score" value={averageScore} /></div></div>
      {toast && <div role="status" aria-live="polite" className={`mb-6 border px-4 py-3 text-sm rounded-sm ${toast.type === 'success' ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-700'}`}>{toast.message}</div>}
      {error && !toast && <div role="alert" className="mb-6 border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm rounded-sm">{error}</div>}
      {(runSummary || draftSummary) && <div className="mb-6 border border-brand-blush bg-white text-brand-black/70 px-4 py-3 text-sm rounded-sm">{runSummary && <span>{summarizeRun(runSummary)} </span>}{draftSummary && <span>Drafts: {draftSummary.created}/{draftSummary.scanned} created. {draftSummary.errors?.join(' ')}</span>}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-10">
        <form onSubmit={submitManualLead} className="bg-white border border-brand-blush p-6 rounded-sm shadow-sm space-y-4"><div className="flex items-center gap-2"><Plus size={18} className="text-brand-gold" /><h2 className="font-serif text-2xl text-brand-black">Manual Lead</h2></div><Input label="Product title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required /><Input label="Source URL" value={form.sourceUrl} onChange={(v) => setForm({ ...form, sourceUrl: v })} /><Input label="Image URL" value={form.imageUrl} onChange={(v) => setForm({ ...form, imageUrl: v })} /><Input label="Suggested category" value={form.suggestedCategory} onChange={(v) => setForm({ ...form, suggestedCategory: v })} /><Input label="Estimated price" value={form.estimatedPrice} onChange={(v) => setForm({ ...form, estimatedPrice: v })} type="number" /><Textarea label="Why it might sell" value={form.reasonItMightSell} onChange={(v) => setForm({ ...form, reasonItMightSell: v })} /><button disabled={saving} className="btn-primary w-full inline-flex items-center justify-center gap-2 disabled:opacity-60">{saving ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />} Save Lead</button></form>
        <div className="bg-white border border-brand-blush p-6 rounded-sm shadow-sm xl:col-span-2 space-y-4"><div className="flex items-center gap-2"><Sparkles size={18} className="text-brand-gold" /><h2 className="font-serif text-2xl text-brand-black">Trend Import</h2></div><textarea value={pastedIdeas} onChange={(event) => setPastedIdeas(event.target.value)} className="w-full min-h-44 border border-brand-blush p-3 text-sm focus:outline-none focus:border-brand-gold rounded-sm" placeholder={'Paste one product idea per line...'} /><div className="flex flex-wrap gap-3"><button onClick={() => importPastedIdeas(false)} disabled={saving} className="btn-outline py-2 px-4 text-[10px] disabled:opacity-60">Import to Queue</button><button onClick={() => importPastedIdeas(true)} disabled={saving} className="btn-outline py-2 px-4 text-[10px] disabled:opacity-60">Import Amazon Drafts</button><button onClick={generateQueuedProductDrafts} disabled={generatingDrafts} className="btn-primary inline-flex items-center gap-2 py-2 px-4 text-[10px] disabled:opacity-60">{generatingDrafts ? <Loader2 className="animate-spin" size={14} /> : <ShieldCheck size={14} />} Generate Queued Drafts</button></div></div>
      </div>

      <div className="bg-white border border-brand-blush rounded-sm shadow-sm p-6 mb-10"><div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6 mb-6"><div><div className="flex items-center gap-3 mb-2"><Bot className="text-brand-gold" size={22} /><h2 className="font-serif text-3xl text-brand-black">Automate Scout</h2></div><p className="text-sm text-brand-black/60 max-w-3xl leading-relaxed">Configure compliant scheduled ingestion. Save settings before using cron.</p></div><div className="space-y-2"><button type="button" onClick={runScoutNow} disabled={runningAutomation || savingAutomation} className="btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-60">{runningAutomation ? <Loader2 className="animate-spin" size={16} /> : <PlayCircle size={16} />} {runningAutomation ? 'Running scout…' : 'Run Scout Now'}</button>{!hasAutomationSources && <p className="text-[11px] text-brand-black/50 max-w-xs">Add at least one RSS feed, keyword, Amazon URL, or product URL before running Scout.</p>}</div></div><div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6"><ToggleCard label="Auto-import enabled" active={automationConfig.autoImportEnabled} onClick={() => toggle('autoImportEnabled')} /><ToggleCard label="Auto-approve high scores" active={automationConfig.autoApproveHighScoringLeads} onClick={() => toggle('autoApproveHighScoringLeads')} /><ToggleCard label="Auto-generate bundles" active={automationConfig.autoGenerateContentBundles} onClick={() => toggle('autoGenerateContentBundles')} /></div><div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4"><AutomationTextarea label="RSS feeds" value={listToText(automationConfig.rssFeeds)} placeholder="https://example.com/feed.xml" onChange={(value) => updateAutomationList('rssFeeds', value)} /><AutomationTextarea label="Amazon Movers & Shakers URLs" value={listToText(automationConfig.amazonMoversUrls)} placeholder="https://www.amazon.com/gp/movers-and-shakers/..." onChange={(value) => updateAutomationList('amazonMoversUrls', value)} /><AutomationTextarea label="TikTok trend keywords" value={listToText(automationConfig.tiktokKeywords)} placeholder={'vanity restock organizer\nbow makeup bag'} onChange={(value) => updateAutomationList('tiktokKeywords', value)} /><AutomationTextarea label="Pinterest trend keywords" value={listToText(automationConfig.pinterestKeywords)} placeholder={'cozy neutral bedroom finds\npretty pantry labels'} onChange={(value) => updateAutomationList('pinterestKeywords', value)} /><AutomationTextarea label="Manual pasted product URLs" value={listToText(automationConfig.productUrls)} placeholder="https://brand.com/products/item" onChange={(value) => updateAutomationList('productUrls', value)} /><div className="border border-brand-blush p-4 rounded-sm bg-brand-cream/30 space-y-4"><Input label="Auto-approval threshold" value={String(automationConfig.highScoreThreshold)} onChange={(value) => setAutomationConfig({ ...automationConfig, highScoreThreshold: Number(value) })} type="number" /><button onClick={() => saveAutomationConfig()} disabled={savingAutomation} className="btn-primary w-full text-xs disabled:opacity-60">Save Automation</button><div className="bg-brand-cream/60 p-4 rounded-sm text-xs text-brand-black/60 leading-relaxed flex gap-3"><Mail size={18} className="text-brand-gold shrink-0" /><span>Weekly admin email summary can plug into this saved lead queue later.</span></div></div></div></div>

      <div className="bg-white border border-brand-blush rounded-sm shadow-sm overflow-hidden"><div className="p-6 border-b border-brand-blush flex flex-col md:flex-row md:items-center justify-between gap-2"><h2 className="font-serif text-2xl text-brand-black">Lead Queue</h2><p className="text-xs uppercase tracking-widest text-brand-black/50">Approve leads to create Product drafts</p></div>{loading ? <div className="py-16 flex justify-center"><Loader2 className="animate-spin text-brand-gold" size={32} /></div> : <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="bg-brand-cream/50 text-[10px] uppercase tracking-widest font-bold text-brand-black/40 border-b border-brand-blush"><th className="px-6 py-4">Lead</th><th className="px-6 py-4">Source</th><th className="px-6 py-4">Score</th><th className="px-6 py-4">Category</th><th className="px-6 py-4">Price</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Actions</th></tr></thead><tbody className="divide-y divide-brand-blush">{leads.map((lead) => { const badge = sourceBadge(lead.source); return <tr key={lead.id} className="align-top hover:bg-brand-cream/20 transition-colors"><td className="px-6 py-5 min-w-[360px]"><div className="flex gap-4"><div className="w-16 h-16 rounded-sm bg-brand-cream border border-brand-blush bg-cover bg-center shrink-0" style={{ backgroundImage: lead.imageUrl ? `url(${lead.imageUrl})` : undefined }} /><div><p className="font-bold text-brand-black mb-1">{lead.title}</p><p className="text-xs text-brand-black/50 mb-2">{new Date(lead.createdAt).toLocaleDateString()}</p><p className="text-xs text-brand-black/60 leading-relaxed">{lead.reasonItMightSell}</p>{lead.sourceUrl && <a href={lead.sourceUrl} target="_blank" className="text-xs text-brand-gold hover:underline mt-2 inline-block">View source</a>}</div></div></td><td className="px-6 py-5"><span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-full font-bold ${badge.className}`}>{badge.label}</span></td><td className="px-6 py-5"><span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-brand-gold/10 text-brand-gold font-bold">{lead.viralityScore}</span></td><td className="px-6 py-5 text-sm text-brand-black/70">{lead.suggestedCategory || 'Unsorted'}</td><td className="px-6 py-5 text-sm text-brand-black/70">{lead.estimatedPrice ? `$${lead.estimatedPrice.toFixed(2)}` : 'TBD'}</td><td className="px-6 py-5"><span className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-full font-bold bg-brand-cream text-brand-black/60">{lead.status}</span></td><td className="px-6 py-5 min-w-[180px] space-y-2"><button onClick={() => approveLead(lead.id)} disabled={actingId === lead.id || lead.status === 'Approved'} className="w-full btn-primary text-xs inline-flex items-center justify-center gap-2 disabled:opacity-50">{actingId === lead.id ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />} Approve Lead</button>{lead.status === 'Approved' && <CreatePinsButton leadId={lead.id} className="w-full btn-outline text-xs py-2" />}<button onClick={() => rejectLead(lead.id)} disabled={actingId === lead.id || lead.status === 'Rejected'} className="w-full border border-brand-blush px-4 py-2 text-xs uppercase tracking-widest text-brand-black/60 hover:text-red-700 hover:border-red-200 disabled:opacity-50 inline-flex items-center justify-center gap-2"><XCircle size={14} /> Reject</button></td></tr>; })}{!leads.length && <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-brand-black/40 italic">No leads yet. Add a manual lead or import a trend list to start scouting.</td></tr>}</tbody></table></div>}</div>
    </div></div>
  );
}

function Stat({ label, value }: { label: string; value: number }) { return <div className="bg-white border border-brand-blush p-5 rounded-sm shadow-sm"><p className="text-[10px] uppercase tracking-widest text-brand-black/50 mb-2">{label}</p><p className="text-3xl font-serif text-brand-black">{value}</p></div>; }
function Input({ label, value, onChange, type = 'text', required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) { return <label className="space-y-1 block"><span className="text-[10px] uppercase font-bold tracking-widest text-brand-black/60">{label}</span><input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-full border border-brand-blush p-3 text-sm focus:outline-none focus:border-brand-gold rounded-sm" /></label>; }
function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="space-y-1 block"><span className="text-[10px] uppercase font-bold tracking-widest text-brand-black/60">{label}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} className="w-full border border-brand-blush p-3 text-sm focus:outline-none focus:border-brand-gold rounded-sm min-h-24" /></label>; }
function ToggleCard({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) { return <button onClick={onClick} className="border border-brand-blush bg-brand-cream/30 p-4 rounded-sm text-left flex items-center justify-between hover:border-brand-gold transition-colors"><span className="text-xs uppercase tracking-widest text-brand-black/70 font-bold">{label}</span><span className={`w-11 h-6 rounded-full p-1 transition-colors ${active ? 'bg-brand-gold' : 'bg-brand-blush'}`}><span className={`block w-4 h-4 rounded-full bg-white transition-transform ${active ? 'translate-x-5' : 'translate-x-0'}`} /></span></button>; }
function AutomationTextarea({ label, value, placeholder, onChange }: { label: string; value: string; placeholder: string; onChange: (value: string) => void }) { return <label className="space-y-1 block"><span className="text-[10px] uppercase font-bold tracking-widest text-brand-black/60">{label}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} className="w-full border border-brand-blush p-3 text-sm focus:outline-none focus:border-brand-gold rounded-sm min-h-32" placeholder={placeholder} /></label>; }
