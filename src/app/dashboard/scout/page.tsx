"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  Loader2,
  Mail,
  PlayCircle,
  Plus,
  Radio,
  ShieldCheck,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { ArrowLeft, CheckCircle2, Loader2, Mail, Plus, Radio, ShieldCheck, Sparkles, XCircle } from 'lucide-react';

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

type RunSummary = {
  skipped: boolean;
  reason?: string;
  discovered: number;
  created: number;
  deduped: number;
  approved: number;
};

const emptyLead = {
  title: '',
  source: 'Manual import',
  sourceUrl: '',
  imageUrl: '',
  trendKeyword: '',
  suggestedCategory: '',
  estimatedPrice: '',
  reasonItMightSell: '',
};

const defaultAutomationConfig: AutomationConfig = {
  autoImportEnabled: false,
  autoApproveHighScoringLeads: false,
  autoGenerateContentBundles: false,
  highScoreThreshold: 85,
  rssFeeds: [],
  amazonMoversUrls: [],
  tiktokKeywords: [],
  pinterestKeywords: [],
  productUrls: [],
};

function listToText(values: string[]) {
  return values.join('\n');
}

function textToList(value: string) {
  return value.split('\n').map((line) => line.trim()).filter(Boolean);
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
  const [actingId, setActingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyLead);
  const [pastedIdeas, setPastedIdeas] = useState('');
  const [runSummary, setRunSummary] = useState<RunSummary | null>(null);
export default function ProductScoutPage() {
  const [leads, setLeads] = useState<ProductLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyLead);
  const [pastedIdeas, setPastedIdeas] = useState('');
  const [error, setError] = useState<string | null>(null);

  const newLeadCount = useMemo(() => leads.filter((lead) => lead.status === 'New').length, [leads]);
  const averageScore = useMemo(() => {
    if (!leads.length) return 0;
    return Math.round(leads.reduce((sum, lead) => sum + lead.viralityScore, 0) / leads.length);
  }, [leads]);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      const [leadResponse, automationResponse] = await Promise.all([
        fetch('/api/scout'),
        fetch('/api/scout/automations'),
      ]);
      const leadData = await leadResponse.json();
      const automationData = await automationResponse.json();

      if (leadData.success) setLeads(leadData.data);
      else setError(leadData.error || 'Failed to load leads');

      if (automationData.success) setAutomationConfig(automationData.data);
      else setError(automationData.error || 'Failed to load automation settings');
    } catch {
      setError('Failed to load product scout data');
  const fetchLeads = async () => {
    try {
      setError(null);
      const response = await fetch('/api/scout');
      const data = await response.json();

      if (data.success) {
        setLeads(data.data);
      } else {
        setError(data.error || 'Failed to load leads');
      }
    } catch {
      setError('Failed to load product leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchDashboardData();
      fetchLeads();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const saveAutomationConfig = async (nextConfig = automationConfig) => {
    setSavingAutomation(true);
    setError(null);

    try {
      const response = await fetch('/api/scout/automations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextConfig),
      });
      const data = await response.json();

      if (!data.success) throw new Error(data.error || 'Unable to save automation settings');
      setAutomationConfig(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save automation settings');
    } finally {
      setSavingAutomation(false);
    }
  };

  const runScoutNow = async () => {
    setRunningAutomation(true);
    setRunSummary(null);
    setError(null);

    try {
      await saveAutomationConfig();
      const response = await fetch('/api/scout/automations', { method: 'POST' });
      const data = await response.json();

      if (!data.success) throw new Error(data.error || 'Unable to run scout automation');
      setRunSummary(data.data);
      await fetchDashboardData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to run scout automation');
    } finally {
      setRunningAutomation(false);
    }
  };

  const submitManualLead = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/scout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceType: 'manual', leads: [form] }),
      });
      const data = await response.json();

      if (!data.success) throw new Error(typeof data.error === 'string' ? data.error : 'Unable to save lead');

      setForm(emptyLead);
      await fetchDashboardData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save lead');
    } finally {
      setSaving(false);
    }
  };

  const importPastedIdeas = async () => {
    const importedLeads = textToList(pastedIdeas).map((line) => ({
      title: line,
      source: 'Pasted trend list',
      trendKeyword: 'manual trend import',
      reasonItMightSell: '',
    }));

    if (!importedLeads.length) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/scout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceType: 'automation', leads: importedLeads }),
      });
      const data = await response.json();

      if (!data.success) throw new Error(typeof data.error === 'string' ? data.error : 'Unable to import ideas');

      setPastedIdeas('');
      await fetchDashboardData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to import ideas');
    } finally {
      setSaving(false);
    }
  };

  const approveLead = async (id: string) => {
    setActingId(id);
    setError(null);

    try {
      const response = await fetch(`/api/scout/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generateContentBundle: automationConfig.autoGenerateContentBundles }),
      });
      const data = await response.json();

      if (!data.success) throw new Error(data.error || 'Unable to approve lead');

      await fetchDashboardData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to approve lead');
    } finally {
      setActingId(null);
    }
  };

  const rejectLead = async (id: string) => {
    setActingId(id);
    setError(null);

    try {
      const response = await fetch(`/api/scout/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Rejected' }),
      });
      const data = await response.json();

      if (!data.success) throw new Error(data.error || 'Unable to reject lead');

      await fetchDashboardData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reject lead');
    } finally {
      setActingId(null);
    }
  };

  const updateAutomationList = (key: keyof Pick<AutomationConfig, 'rssFeeds' | 'amazonMoversUrls' | 'tiktokKeywords' | 'pinterestKeywords' | 'productUrls'>, value: string) => {
    setAutomationConfig({ ...automationConfig, [key]: textToList(value) });
  };

  const toggle = (key: keyof Pick<AutomationConfig, 'autoImportEnabled' | 'autoApproveHighScoringLeads' | 'autoGenerateContentBundles'>) => {
    const nextConfig = { ...automationConfig, [key]: !automationConfig[key] };
    setAutomationConfig(nextConfig);
    saveAutomationConfig(nextConfig);
  };

  return (
    <div className="min-h-screen bg-brand-cream/50">
      <div className="container mx-auto px-4 py-10">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-brand-black/60 hover:text-brand-gold mb-8">
          <ArrowLeft size={14} /> Back to tracker
        </Link>

        <div className="flex flex-col lg:flex-row justify-between gap-6 mb-10">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-brand-gold font-bold mb-3">Admin Product Scout</p>
            <h1 className="text-4xl md:text-5xl font-serif text-brand-black mb-4">Viral Product Scout Bot</h1>
            <p className="text-brand-black/60 max-w-2xl leading-relaxed">
              Capture allowed product ideas from manual research, RSS/API feeds, Amazon affiliate-safe links, TikTok and Pinterest keyword exports, or pasted product URLs. The scout normalizes, deduplicates, scores, and queues every lead for editorial review.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 min-w-[280px]">
            <div className="bg-white border border-brand-blush p-5 rounded-sm shadow-sm">
              <p className="text-[10px] uppercase tracking-widest text-brand-black/50 mb-2">New Leads</p>
              <p className="text-3xl font-serif text-brand-black">{newLeadCount}</p>
            </div>
            <div className="bg-white border border-brand-blush p-5 rounded-sm shadow-sm">
              <p className="text-[10px] uppercase tracking-widest text-brand-black/50 mb-2">Avg Score</p>
              <p className="text-3xl font-serif text-brand-black">{averageScore}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm rounded-sm">
            {error}
          </div>
        )}

        <div className="bg-white border border-brand-blush rounded-sm shadow-sm p-6 mb-10">
          <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Bot className="text-brand-gold" size={22} />
                <h2 className="font-serif text-3xl text-brand-black">Automate Scout</h2>
              </div>
              <p className="text-sm text-brand-black/60 max-w-3xl leading-relaxed">
                Configure compliant scheduled ingestion. The cron endpoint is <code className="bg-brand-cream px-1 py-0.5">/api/cron/scout</code>; set <code className="bg-brand-cream px-1 py-0.5">SCOUT_CRON_SECRET</code> and call it with <code className="bg-brand-cream px-1 py-0.5">?secret=...</code> from Neon/Vercel cron.
              </p>
            </div>
            <button onClick={runScoutNow} disabled={runningAutomation || savingAutomation} className="btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-60">
              {runningAutomation ? <Loader2 className="animate-spin" size={16} /> : <PlayCircle size={16} />} Run Scout Now
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            <ToggleCard label="Auto-import enabled" active={automationConfig.autoImportEnabled} onClick={() => toggle('autoImportEnabled')} />
            <ToggleCard label="Auto-approve high scores" active={automationConfig.autoApproveHighScoringLeads} onClick={() => toggle('autoApproveHighScoringLeads')} />
            <ToggleCard label="Auto-generate bundles" active={automationConfig.autoGenerateContentBundles} onClick={() => toggle('autoGenerateContentBundles')} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            <AutomationTextarea label="RSS feeds" value={listToText(automationConfig.rssFeeds)} placeholder="https://example.com/feed.xml" onChange={(value) => updateAutomationList('rssFeeds', value)} />
            <AutomationTextarea label="Amazon Movers & Shakers URLs" value={listToText(automationConfig.amazonMoversUrls)} placeholder="https://www.amazon.com/gp/movers-and-shakers/..." onChange={(value) => updateAutomationList('amazonMoversUrls', value)} />
            <AutomationTextarea label="TikTok trend keywords" value={listToText(automationConfig.tiktokKeywords)} placeholder={"vanity restock organizer\nbow makeup bag"} onChange={(value) => updateAutomationList('tiktokKeywords', value)} />
            <AutomationTextarea label="Pinterest trend keywords" value={listToText(automationConfig.pinterestKeywords)} placeholder={"cozy neutral bedroom finds\npretty pantry labels"} onChange={(value) => updateAutomationList('pinterestKeywords', value)} />
            <AutomationTextarea label="Manual pasted product URLs" value={listToText(automationConfig.productUrls)} placeholder="https://brand.com/products/item" onChange={(value) => updateAutomationList('productUrls', value)} />
            <div className="border border-brand-blush p-4 rounded-sm bg-brand-cream/30 space-y-4">
              <label className="space-y-1 block">
                <span className="text-[10px] uppercase font-bold tracking-widest text-brand-black/60">Auto-approval threshold</span>
                <input type="number" min="1" max="100" value={automationConfig.highScoreThreshold} onChange={(event) => setAutomationConfig({ ...automationConfig, highScoreThreshold: Number(event.target.value) })} className="w-full border border-brand-blush p-3 text-sm focus:outline-none focus:border-brand-gold rounded-sm" />
              </label>
              <button onClick={() => saveAutomationConfig()} disabled={savingAutomation} className="btn-secondary w-full disabled:opacity-60">
                {savingAutomation ? 'Saving...' : 'Save Automation Settings'}
              </button>
              {runSummary && (
                <div className="text-xs text-brand-black/60 leading-relaxed bg-white border border-brand-blush p-3">
                  Run complete: {runSummary.discovered} discovered, {runSummary.created} saved, {runSummary.deduped} duplicates skipped, {runSummary.approved} auto-approved.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-10">
          <form onSubmit={submitManualLead} className="xl:col-span-2 bg-white border border-brand-blush rounded-sm shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="text-brand-gold" size={20} />
              <h2 className="font-serif text-2xl text-brand-black">Add Lead</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="space-y-1 md:col-span-2"><span className="text-[10px] uppercase font-bold tracking-widest text-brand-black/60">Product idea</span><input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="w-full border border-brand-blush p-3 text-sm focus:outline-none focus:border-brand-gold rounded-sm" placeholder="e.g. Aesthetic travel jewelry organizer" /></label>
              <label className="space-y-1"><span className="text-[10px] uppercase font-bold tracking-widest text-brand-black/60">Allowed source</span><input required value={form.source} onChange={(event) => setForm({ ...form, source: event.target.value })} className="w-full border border-brand-blush p-3 text-sm focus:outline-none focus:border-brand-gold rounded-sm" placeholder="Manual, RSS, API, newsletter" /></label>
              <label className="space-y-1"><span className="text-[10px] uppercase font-bold tracking-widest text-brand-black/60">Source URL</span><input value={form.sourceUrl} onChange={(event) => setForm({ ...form, sourceUrl: event.target.value })} className="w-full border border-brand-blush p-3 text-sm focus:outline-none focus:border-brand-gold rounded-sm" placeholder="https://..." type="url" /></label>
              <label className="space-y-1"><span className="text-[10px] uppercase font-bold tracking-widest text-brand-black/60">Image URL</span><input value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} className="w-full border border-brand-blush p-3 text-sm focus:outline-none focus:border-brand-gold rounded-sm" placeholder="https://..." type="url" /></label>
              <label className="space-y-1"><span className="text-[10px] uppercase font-bold tracking-widest text-brand-black/60">Trend keyword</span><input value={form.trendKeyword} onChange={(event) => setForm({ ...form, trendKeyword: event.target.value })} className="w-full border border-brand-blush p-3 text-sm focus:outline-none focus:border-brand-gold rounded-sm" placeholder="viral vanity restock" /></label>
              <label className="space-y-1"><span className="text-[10px] uppercase font-bold tracking-widest text-brand-black/60">Category guess</span><input value={form.suggestedCategory} onChange={(event) => setForm({ ...form, suggestedCategory: event.target.value })} className="w-full border border-brand-blush p-3 text-sm focus:outline-none focus:border-brand-gold rounded-sm" placeholder="Beauty Tools" /></label>
              <label className="space-y-1"><span className="text-[10px] uppercase font-bold tracking-widest text-brand-black/60">Estimated price</span><input value={form.estimatedPrice} onChange={(event) => setForm({ ...form, estimatedPrice: event.target.value })} className="w-full border border-brand-blush p-3 text-sm focus:outline-none focus:border-brand-gold rounded-sm" placeholder="29.99" type="number" min="0" step="0.01" /></label>
              <label className="space-y-1 md:col-span-2"><span className="text-[10px] uppercase font-bold tracking-widest text-brand-black/60">Why it might sell</span><textarea value={form.reasonItMightSell} onChange={(event) => setForm({ ...form, reasonItMightSell: event.target.value })} className="w-full border border-brand-blush p-3 text-sm focus:outline-none focus:border-brand-gold rounded-sm min-h-24" placeholder="Optional. Leave blank and the scout will generate a scoring breakdown." /></label>
              <label className="space-y-1 md:col-span-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-brand-black/60">Product idea</span>
                <input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="w-full border border-brand-blush p-3 text-sm focus:outline-none focus:border-brand-gold rounded-sm" placeholder="e.g. Aesthetic travel jewelry organizer" />
              </label>
              <label className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-brand-black/60">Allowed source</span>
                <input required value={form.source} onChange={(event) => setForm({ ...form, source: event.target.value })} className="w-full border border-brand-blush p-3 text-sm focus:outline-none focus:border-brand-gold rounded-sm" placeholder="Manual, RSS, API, newsletter" />
              </label>
              <label className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-brand-black/60">Source URL</span>
                <input value={form.sourceUrl} onChange={(event) => setForm({ ...form, sourceUrl: event.target.value })} className="w-full border border-brand-blush p-3 text-sm focus:outline-none focus:border-brand-gold rounded-sm" placeholder="https://..." type="url" />
              </label>
              <label className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-brand-black/60">Trend keyword</span>
                <input value={form.trendKeyword} onChange={(event) => setForm({ ...form, trendKeyword: event.target.value })} className="w-full border border-brand-blush p-3 text-sm focus:outline-none focus:border-brand-gold rounded-sm" placeholder="viral vanity restock" />
              </label>
              <label className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-brand-black/60">Category guess</span>
                <input value={form.suggestedCategory} onChange={(event) => setForm({ ...form, suggestedCategory: event.target.value })} className="w-full border border-brand-blush p-3 text-sm focus:outline-none focus:border-brand-gold rounded-sm" placeholder="Beauty Tools" />
              </label>
              <label className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-brand-black/60">Estimated price</span>
                <input value={form.estimatedPrice} onChange={(event) => setForm({ ...form, estimatedPrice: event.target.value })} className="w-full border border-brand-blush p-3 text-sm focus:outline-none focus:border-brand-gold rounded-sm" placeholder="29.99" type="number" min="0" step="0.01" />
              </label>
              <label className="space-y-1 md:col-span-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-brand-black/60">Why it might sell</span>
                <textarea value={form.reasonItMightSell} onChange={(event) => setForm({ ...form, reasonItMightSell: event.target.value })} className="w-full border border-brand-blush p-3 text-sm focus:outline-none focus:border-brand-gold rounded-sm min-h-24" placeholder="Optional. Leave blank and the scout will generate a scoring breakdown." />
              </label>
            </div>
            <button disabled={saving} className="btn-primary inline-flex items-center gap-2 disabled:opacity-60">
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />} Save Lead
            </button>
          </form>

          <div className="bg-white border border-brand-blush rounded-sm shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-3"><Radio className="text-brand-gold" size={20} /><h2 className="font-serif text-2xl text-brand-black">Bulk Import</h2></div>
            <p className="text-sm text-brand-black/60 leading-relaxed">Paste one idea per line from allowed trend sources such as newsletters, RSS readers, marketplaces with API permission, or your own research notes.</p>
            <textarea value={pastedIdeas} onChange={(event) => setPastedIdeas(event.target.value)} className="w-full border border-brand-blush p-3 text-sm focus:outline-none focus:border-brand-gold rounded-sm min-h-40" placeholder={"Pink bow makeup bag\nGlass iced coffee tumbler\nCordless mini desk vacuum"} />
            <button onClick={importPastedIdeas} disabled={saving || !pastedIdeas.trim()} className="btn-secondary w-full disabled:opacity-60">Import Trend List</button>
            <div className="bg-brand-cream/60 p-4 rounded-sm text-xs text-brand-black/60 leading-relaxed flex gap-3"><ShieldCheck size={18} className="text-brand-gold shrink-0" /><span>No prohibited scraping: use manual imports, RSS, official APIs, partner exports, public trend feeds, affiliate-safe URLs, or pasted trend lists.</span></div>
            <div className="bg-brand-cream/60 p-4 rounded-sm text-xs text-brand-black/60 leading-relaxed flex gap-3"><Mail size={18} className="text-brand-gold shrink-0" /><span>Weekly admin email summary can plug into this saved lead queue later.</span></div>
            <div className="flex items-center gap-3">
              <Radio className="text-brand-gold" size={20} />
              <h2 className="font-serif text-2xl text-brand-black">Bulk Import</h2>
            </div>
            <p className="text-sm text-brand-black/60 leading-relaxed">
              Paste one idea per line from allowed trend sources such as newsletters, RSS readers, marketplaces with API permission, or your own research notes.
            </p>
            <textarea value={pastedIdeas} onChange={(event) => setPastedIdeas(event.target.value)} className="w-full border border-brand-blush p-3 text-sm focus:outline-none focus:border-brand-gold rounded-sm min-h-40" placeholder={"Pink bow makeup bag\nGlass iced coffee tumbler\nCordless mini desk vacuum"} />
            <button onClick={importPastedIdeas} disabled={saving || !pastedIdeas.trim()} className="btn-secondary w-full disabled:opacity-60">
              Import Trend List
            </button>
            <div className="bg-brand-cream/60 p-4 rounded-sm text-xs text-brand-black/60 leading-relaxed flex gap-3">
              <ShieldCheck size={18} className="text-brand-gold shrink-0" />
              <span>No prohibited scraping: use manual imports, RSS, official APIs, partner exports, or pasted trend lists.</span>
            </div>
            <div className="bg-brand-cream/60 p-4 rounded-sm text-xs text-brand-black/60 leading-relaxed flex gap-3">
              <Mail size={18} className="text-brand-gold shrink-0" />
              <span>Weekly admin email summary can plug into this saved lead queue later.</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-brand-blush rounded-sm shadow-sm overflow-hidden">
          <div className="p-6 border-b border-brand-blush flex flex-col md:flex-row md:items-center justify-between gap-2">
            <h2 className="font-serif text-2xl text-brand-black">Lead Queue</h2>
            <p className="text-xs uppercase tracking-widest text-brand-black/50">Approve leads to create Product drafts</p>
          </div>
          {loading ? (
            <div className="py-16 flex justify-center"><Loader2 className="animate-spin text-brand-gold" size={32} /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="bg-brand-cream/50 text-[10px] uppercase tracking-widest font-bold text-brand-black/40 border-b border-brand-blush"><th className="px-6 py-4">Lead</th><th className="px-6 py-4">Source</th><th className="px-6 py-4">Score</th><th className="px-6 py-4">Category</th><th className="px-6 py-4">Price</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Actions</th></tr></thead>
                <tbody className="divide-y divide-brand-blush">
                  {leads.map((lead) => {
                    const badge = sourceBadge(lead.source);
                    return (
                      <tr key={lead.id} className="align-top hover:bg-brand-cream/20 transition-colors">
                        <td className="px-6 py-5 min-w-[360px]">
                          <div className="flex gap-4">
                            <div className="w-16 h-16 rounded-sm bg-brand-cream border border-brand-blush bg-cover bg-center shrink-0" style={{ backgroundImage: lead.imageUrl ? `url(${lead.imageUrl})` : undefined }} />
                            <div>
                              <p className="font-bold text-brand-black mb-1">{lead.title}</p>
                              <p className="text-xs text-brand-black/50 mb-2">{new Date(lead.createdAt).toLocaleDateString()}</p>
                              <p className="text-xs text-brand-black/60 leading-relaxed">{lead.reasonItMightSell}</p>
                              {lead.sourceUrl && <a href={lead.sourceUrl} target="_blank" className="text-xs text-brand-gold hover:underline mt-2 inline-block">View source</a>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5"><span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-full font-bold ${badge.className}`}>{badge.label}</span></td>
                        <td className="px-6 py-5"><span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-brand-gold/10 text-brand-gold font-bold">{lead.viralityScore}</span></td>
                        <td className="px-6 py-5 text-sm text-brand-black/70">{lead.suggestedCategory || 'Unsorted'}</td>
                        <td className="px-6 py-5 text-sm text-brand-black/70">{lead.estimatedPrice ? `$${lead.estimatedPrice.toFixed(2)}` : 'TBD'}</td>
                        <td className="px-6 py-5"><span className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-full font-bold bg-brand-cream text-brand-black/60">{lead.status}</span></td>
                        <td className="px-6 py-5 min-w-[180px] space-y-2"><button onClick={() => approveLead(lead.id)} disabled={actingId === lead.id || lead.status === 'Approved'} className="w-full btn-primary text-xs inline-flex items-center justify-center gap-2 disabled:opacity-50">{actingId === lead.id ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />} Approve Lead</button><button onClick={() => rejectLead(lead.id)} disabled={actingId === lead.id || lead.status === 'Rejected'} className="w-full border border-brand-blush px-4 py-2 text-xs uppercase tracking-widest text-brand-black/60 hover:text-red-700 hover:border-red-200 disabled:opacity-50 inline-flex items-center justify-center gap-2"><XCircle size={14} /> Reject</button></td>
                      </tr>
                    );
                  })}
                  {!leads.length && <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-brand-black/40 italic">No leads yet. Add a manual lead or import a trend list to start scouting.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ToggleCard({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="border border-brand-blush bg-brand-cream/30 p-4 rounded-sm text-left flex items-center justify-between hover:border-brand-gold transition-colors">
      <span className="text-xs uppercase tracking-widest text-brand-black/70 font-bold">{label}</span>
      <span className={`w-11 h-6 rounded-full p-1 transition-colors ${active ? 'bg-brand-gold' : 'bg-brand-blush'}`}>
        <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${active ? 'translate-x-5' : 'translate-x-0'}`} />
      </span>
    </button>
  );
}

function AutomationTextarea({ label, value, placeholder, onChange }: { label: string; value: string; placeholder: string; onChange: (value: string) => void }) {
  return (
    <label className="space-y-1 block">
      <span className="text-[10px] uppercase font-bold tracking-widest text-brand-black/60">{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} className="w-full border border-brand-blush p-3 text-sm focus:outline-none focus:border-brand-gold rounded-sm min-h-32" placeholder={placeholder} />
    </label>
  );
}
