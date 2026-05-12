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

type RunSummary = { skipped?: boolean; reason?: string; discovered?: number; created?: number; deduped?: number; approved?: number };
type DraftSummary = { scanned: number; created: number; errors: string[] };
type RainforestTestResult = {
  success: boolean;
  message: string;
  rawMessage?: string;
  details?: {
    searchTerm?: string;
    resultCount?: number;
    sampleTitles?: string[];
    debug?: { apiKeyPresent: boolean; apiKeyLength: number; authMethod: string; endpointFormat: string };
    errorKind?: string;
    status?: number;
    rawMessage?: string;
  };
};

type ManualProductResult = { productId: string; title: string; pinCount: number; blogPostTitle?: string | null };

const emptyLead = { title: '', source: 'Manual import', sourceUrl: '', imageUrl: '', trendKeyword: '', suggestedCategory: '', estimatedPrice: '', reasonItMightSell: '' };
const emptyManualProduct = { title: '', link: '', imageUrl: '', price: '', asin: '', category: 'Worth the Splurge' };
const defaultAutomationConfig: AutomationConfig = { autoImportEnabled: false, autoApproveHighScoringLeads: false, autoGenerateContentBundles: false, highScoreThreshold: 85, rssFeeds: [], amazonMoversUrls: [], tiktokKeywords: [], pinterestKeywords: [], productUrls: [] };

function listToText(values: string[]) { return values.join('\n'); }
function textToList(value: string) { return value.split('\n').map((line) => line.trim()).filter(Boolean); }

function sourceBadge(source: string) {
  const lower = source.toLowerCase();
  if (lower.includes('fallback')) return { label: 'Fallback', className: 'bg-purple-50 text-purple-700' };
  if (lower.includes('tiktok')) return { label: 'TikTok', className: 'bg-black text-white' };
  if (lower.includes('pinterest')) return { label: 'Pinterest', className: 'bg-red-50 text-red-700' };
  if (lower.includes('amazon')) return { label: 'Amazon', className: 'bg-amber-50 text-amber-700' };
  if (lower.includes('rss')) return { label: 'RSS', className: 'bg-blue-50 text-blue-700' };
  return { label: 'Manual', className: 'bg-brand-cream text-brand-black/60' };
}

export default function ProductScoutClient() {
  const [leads, setLeads] = useState<ProductLead[]>([]);
  const [automationConfig, setAutomationConfig] = useState<AutomationConfig>(defaultAutomationConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingAutomation, setSavingAutomation] = useState(false);
  const [runningAutomation, setRunningAutomation] = useState(false);
  const [generatingDrafts, setGeneratingDrafts] = useState(false);
  const [testingRainforest, setTestingRainforest] = useState(false);
  const [convertingProduct, setConvertingProduct] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyLead);
  const [manualProduct, setManualProduct] = useState(emptyManualProduct);
  const [pastedIdeas, setPastedIdeas] = useState('');
  const [runSummary, setRunSummary] = useState<RunSummary | null>(null);
  const [draftSummary, setDraftSummary] = useState<DraftSummary | null>(null);
  const [rainforestTest, setRainforestTest] = useState<RainforestTestResult | null>(null);
  const [manualProductResult, setManualProductResult] = useState<ManualProductResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const newLeadCount = useMemo(() => leads.filter((lead) => lead.status === 'New').length, [leads]);
  const averageScore = useMemo(() => leads.length ? Math.round(leads.reduce((sum, lead) => sum + lead.viralityScore, 0) / leads.length) : 0, [leads]);

  const fetchLeads = async () => {
    try {
      setError(null);
      const [leadResponse, automationResponse] = await Promise.all([fetch('/api/scout'), fetch('/api/scout/automations')]);
      const leadData = await leadResponse.json();
      const automationData = await automationResponse.json();
      if (leadData.success) setLeads(leadData.data); else setError(leadData.error || 'Failed to load leads');
      if (automationData.success) setAutomationConfig(automationData.data); else setError(automationData.error || 'Failed to load automation settings');
    } catch {
      setError('Failed to load product scout data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => { fetchLeads(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const saveAutomationConfig = async (nextConfig = automationConfig) => {
    setSavingAutomation(true);
    try {
      const response = await fetch('/api/scout/automations', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(nextConfig) });
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
    setRunningAutomation(true); setRunSummary(null); setError(null);
    try {
      await saveAutomationConfig();
      const response = await fetch('/api/scout/automations', { method: 'POST' });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Unable to run scout automation');
      setRunSummary(data.data);
      await fetchLeads();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to run scout automation');
    } finally { setRunningAutomation(false); }
  };

  const testRainforestConnection = async () => {
    setTestingRainforest(true); setRainforestTest(null); setError(null);
    try {
      const response = await fetch('/api/scout/test-rainforest', { method: 'POST' });
      const data = await response.json();
      setRainforestTest({
        success: Boolean(data.success),
        message: data.success
          ? `Connected. Found ${data.data?.resultCount ?? 0} results for pink vanity organizer.`
          : data.error || 'Rainforest connection test failed',
        rawMessage: data.data?.rawMessage,
        details: data.data,
      });
    } catch (err) {
      setRainforestTest({ success: false, message: err instanceof Error ? err.message : 'Rainforest connection test failed' });
    } finally { setTestingRainforest(false); }
  };

  const submitManualLead = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError(null);
    try {
      const response = await fetch('/api/scout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sourceType: 'manual', leads: [form] }) });
      const data = await response.json();
      if (!data.success) throw new Error(typeof data.error === 'string' ? data.error : 'Unable to save lead');
      setForm(emptyLead); await fetchLeads();
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to save lead'); }
    finally { setSaving(false); }
  };

  const convertManualProduct = async (event: React.FormEvent) => {
    event.preventDefault(); setConvertingProduct(true); setManualProductResult(null); setError(null);
    try {
      const response = await fetch('/api/scout/manual-product', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(manualProduct) });
      const data = await response.json();
      if (!data.success) throw new Error(typeof data.error === 'string' ? data.error : 'Unable to convert manual product');
      setManualProductResult({
        productId: data.data.product.id,
        title: data.data.product.name,
        pinCount: data.data.pins?.length ?? 0,
        blogPostTitle: data.data.contentBundle?.blogPostTitle,
      });
      setManualProduct(emptyManualProduct);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to convert manual product'); }
    finally { setConvertingProduct(false); }
  };

  const importPastedIdeas = async (createProductDrafts = false) => {
    const importedLeads = textToList(pastedIdeas).map((line) => ({ title: line, source: 'Pasted trend list', trendKeyword: 'manual trend import', reasonItMightSell: '' }));
    if (!importedLeads.length) return;
    setSaving(true); setDraftSummary(null); setError(null);
    try {
      const response = await fetch('/api/scout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sourceType: 'automation', leads: importedLeads, createProductDrafts }) });
      const data = await response.json();
      if (!data.success) throw new Error(typeof data.error === 'string' ? data.error : 'Unable to import ideas');
      if (data.meta?.rainforestErrors?.length) {
        setError(`Rainforest failed, so Scout saved keyword-only fallback leads. First error: ${data.meta.rainforestErrors[0].message}`);
      }
      setPastedIdeas(''); await fetchLeads();
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to import ideas'); }
    finally { setSaving(false); }
  };

  const generateQueuedProductDrafts = async () => {
    setGeneratingDrafts(true); setDraftSummary(null); setError(null);
    try {
      const response = await fetch('/api/scout/generate-drafts', { method: 'POST' });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Unable to generate product drafts');
      setDraftSummary(data.data); await fetchLeads();
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to generate product drafts'); }
    finally { setGeneratingDrafts(false); }
  };

  const approveLead = async (id: string) => {
    setActingId(id); setError(null);
    try {
      const response = await fetch(`/api/scout/${id}/approve`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ generateContentBundle: automationConfig.autoGenerateContentBundles }) });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Unable to approve lead');
      await fetchLeads();
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to approve lead'); }
    finally { setActingId(null); }
  };

  const rejectLead = async (id: string) => {
    setActingId(id); setError(null);
    try {
      const response = await fetch(`/api/scout/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'Rejected' }) });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Unable to reject lead');
      await fetchLeads();
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to reject lead'); }
    finally { setActingId(null); }
  };

  const updateAutomationList = (key: keyof Pick<AutomationConfig, 'rssFeeds' | 'amazonMoversUrls' | 'tiktokKeywords' | 'pinterestKeywords' | 'productUrls'>, value: string) => setAutomationConfig({ ...automationConfig, [key]: textToList(value) });
  const toggle = (key: keyof Pick<AutomationConfig, 'autoImportEnabled' | 'autoApproveHighScoringLeads' | 'autoGenerateContentBundles'>) => { const nextConfig = { ...automationConfig, [key]: !automationConfig[key] }; setAutomationConfig(nextConfig); saveAutomationConfig(nextConfig); };

  return (
    <div className="min-h-screen bg-brand-cream/50">
      <div className="container mx-auto px-4 py-10">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-brand-black/60 hover:text-brand-gold mb-8"><ArrowLeft size={14} /> Back to Dashboard</Link>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
          <div>
            <span className="text-[10px] uppercase tracking-[0.3em] text-brand-gold font-bold">Product Scout</span>
            <h1 className="text-4xl md:text-5xl font-serif text-brand-black mt-2">Trend-to-product workflow</h1>
            <p className="text-sm text-brand-black/60 mt-3 max-w-2xl">Import trends, test Rainforest safely, fall back to keyword-only leads, and manually convert Amazon finds into content-ready Product drafts.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 min-w-[360px]"><Stat label="New leads" value={newLeadCount} /><Stat label="Average score" value={averageScore} /><Stat label="Total" value={leads.length} /></div>
        </div>

        {error && <div className="mb-6 border border-amber-200 bg-amber-50 text-amber-900 p-4 text-sm rounded-sm">{error}</div>}

        <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-6 mb-8">
          <div className="luxury-card p-6 bg-white border border-brand-blush rounded-sm">
            <div className="flex items-center justify-between gap-4 mb-4"><div><h2 className="font-serif text-2xl text-brand-black">Rainforest Debugger</h2><p className="text-xs uppercase tracking-widest text-brand-black/50">Server-side api_key query test</p></div><ShieldCheck className="text-brand-gold" /></div>
            <p className="text-sm text-brand-black/60 mb-4">Tests <strong>pink vanity organizer</strong> without exposing your API key. Server logs show only whether the key exists and its length.</p>
            <button onClick={testRainforestConnection} disabled={testingRainforest} className="btn-primary text-xs inline-flex items-center gap-2 disabled:opacity-50">{testingRainforest ? <Loader2 className="animate-spin" size={14} /> : <PlayCircle size={14} />} Test Rainforest Connection</button>
            {rainforestTest && <div className={`mt-4 rounded-sm border p-4 text-sm ${rainforestTest.success ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800'}`}>
              <p className="font-bold flex items-center gap-2">{rainforestTest.success ? <CheckCircle2 size={16} /> : <XCircle size={16} />} {rainforestTest.message}</p>
              {rainforestTest.details?.debug && <ul className="mt-3 text-xs space-y-1 text-brand-black/70">
                <li>RAINFOREST_API_KEY present: {rainforestTest.details.debug.apiKeyPresent ? 'Yes' : 'No'}</li>
                <li>Key length only: {rainforestTest.details.debug.apiKeyLength}</li>
                <li>Auth method: {rainforestTest.details.debug.authMethod}</li>
                <li>Endpoint: {rainforestTest.details.debug.endpointFormat}</li>
              </ul>}
              {rainforestTest.details?.errorKind && <p className="mt-3 text-xs">Classification: {rainforestTest.details.errorKind}{rainforestTest.details.status ? ` (${rainforestTest.details.status})` : ''}</p>}
              {rainforestTest.rawMessage && <p className="mt-2 text-xs break-words">Raw error: {rainforestTest.rawMessage}</p>}
              {!!rainforestTest.details?.sampleTitles?.length && <p className="mt-3 text-xs">Sample: {rainforestTest.details.sampleTitles.join(' • ')}</p>}
            </div>}
          </div>

          <form onSubmit={convertManualProduct} className="luxury-card p-6 bg-white border border-brand-blush rounded-sm space-y-4">
            <div><h2 className="font-serif text-2xl text-brand-black">Convert Lead to Product</h2><p className="text-xs uppercase tracking-widest text-brand-black/50">Manual Amazon paste flow</p></div>
            <Input label="Amazon title" value={manualProduct.title} onChange={(value) => setManualProduct({ ...manualProduct, title: value })} required />
            <Input label="Amazon link" value={manualProduct.link} onChange={(value) => setManualProduct({ ...manualProduct, link: value })} required />
            <div className="grid md:grid-cols-2 gap-3"><Input label="Image URL" value={manualProduct.imageUrl} onChange={(value) => setManualProduct({ ...manualProduct, imageUrl: value })} /><Input label="Price" type="number" value={manualProduct.price} onChange={(value) => setManualProduct({ ...manualProduct, price: value })} /></div>
            <div className="grid md:grid-cols-2 gap-3"><Input label="ASIN" value={manualProduct.asin} onChange={(value) => setManualProduct({ ...manualProduct, asin: value })} /><Input label="Category" value={manualProduct.category} onChange={(value) => setManualProduct({ ...manualProduct, category: value })} /></div>
            <button disabled={convertingProduct} className="btn-primary text-xs inline-flex items-center gap-2 disabled:opacity-50">{convertingProduct ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />} Save Product Draft + Draft Content</button>
            {manualProductResult && <div className="bg-green-50 border border-green-200 text-green-800 p-3 text-sm rounded-sm">Created draft for <strong>{manualProductResult.title}</strong>, generated “{manualProductResult.blogPostTitle}”, and created {manualProductResult.pinCount} Pinterest pin drafts.</div>}
          </form>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <form onSubmit={submitManualLead} className="luxury-card p-6 bg-white border border-brand-blush rounded-sm space-y-4">
            <div><h2 className="font-serif text-2xl text-brand-black">Manual Lead</h2><p className="text-xs uppercase tracking-widest text-brand-black/50">Quickly score one idea</p></div>
            <Input label="Title" value={form.title} onChange={(value) => setForm({ ...form, title: value })} required />
            <div className="grid md:grid-cols-2 gap-3"><Input label="Source URL" value={form.sourceUrl} onChange={(value) => setForm({ ...form, sourceUrl: value })} /><Input label="Image URL" value={form.imageUrl} onChange={(value) => setForm({ ...form, imageUrl: value })} /></div>
            <div className="grid md:grid-cols-2 gap-3"><Input label="Trend Keyword" value={form.trendKeyword} onChange={(value) => setForm({ ...form, trendKeyword: value })} /><Input label="Estimated Price" type="number" value={form.estimatedPrice} onChange={(value) => setForm({ ...form, estimatedPrice: value })} /></div>
            <Textarea label="Why it might sell" value={form.reasonItMightSell} onChange={(value) => setForm({ ...form, reasonItMightSell: value })} />
            <button disabled={saving} className="btn-primary text-xs inline-flex items-center gap-2 disabled:opacity-50">{saving ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />} Save Lead</button>
          </form>

          <div className="luxury-card p-6 bg-white border border-brand-blush rounded-sm space-y-4">
            <div><h2 className="font-serif text-2xl text-brand-black">Bulk Ideas</h2><p className="text-xs uppercase tracking-widest text-brand-black/50">One keyword per line</p></div>
            <Textarea label="Trend ideas" value={pastedIdeas} onChange={setPastedIdeas} />
            <div className="flex flex-wrap gap-3"><button onClick={() => importPastedIdeas(false)} disabled={saving} className="btn-primary text-xs inline-flex items-center gap-2 disabled:opacity-50"><Mail size={14} /> Import Leads</button><button onClick={() => importPastedIdeas(true)} disabled={saving} className="btn-outline text-xs inline-flex items-center gap-2 disabled:opacity-50"><Sparkles size={14} /> Import + Draft Amazon Matches</button></div>
          </div>
        </div>

        <div className="luxury-card p-6 bg-white border border-brand-blush rounded-sm mb-8 space-y-5">
          <div className="flex items-center justify-between gap-4"><div><h2 className="font-serif text-2xl text-brand-black">Automation</h2><p className="text-xs uppercase tracking-widest text-brand-black/50">Admin-only Scout settings</p></div><Bot className="text-brand-gold" /></div>
          <div className="grid md:grid-cols-3 gap-3"><ToggleCard label="Auto import" active={automationConfig.autoImportEnabled} onClick={() => toggle('autoImportEnabled')} /><ToggleCard label="Auto approve high scores" active={automationConfig.autoApproveHighScoringLeads} onClick={() => toggle('autoApproveHighScoringLeads')} /><ToggleCard label="Generate content bundles" active={automationConfig.autoGenerateContentBundles} onClick={() => toggle('autoGenerateContentBundles')} /></div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"><AutomationTextarea label="RSS feeds" value={listToText(automationConfig.rssFeeds)} placeholder="https://..." onChange={(value) => updateAutomationList('rssFeeds', value)} /><AutomationTextarea label="Amazon mover URLs" value={listToText(automationConfig.amazonMoversUrls)} placeholder="https://www.amazon.com/gp/movers-and-shakers/..." onChange={(value) => updateAutomationList('amazonMoversUrls', value)} /><AutomationTextarea label="TikTok keywords" value={listToText(automationConfig.tiktokKeywords)} placeholder="viral vanity organizer" onChange={(value) => updateAutomationList('tiktokKeywords', value)} /><AutomationTextarea label="Pinterest keywords" value={listToText(automationConfig.pinterestKeywords)} placeholder="cozy bedroom finds" onChange={(value) => updateAutomationList('pinterestKeywords', value)} /><AutomationTextarea label="Product URLs" value={listToText(automationConfig.productUrls)} placeholder="https://www.amazon.com/dp/..." onChange={(value) => updateAutomationList('productUrls', value)} /><label className="space-y-1 block"><span className="text-[10px] uppercase font-bold tracking-widest text-brand-black/60">High score threshold</span><input type="number" value={automationConfig.highScoreThreshold} onChange={(event) => setAutomationConfig({ ...automationConfig, highScoreThreshold: Number(event.target.value) })} className="w-full border border-brand-blush p-3 text-sm focus:outline-none focus:border-brand-gold rounded-sm" /></label></div>
          <div className="flex flex-wrap gap-3"><button onClick={() => saveAutomationConfig()} disabled={savingAutomation} className="btn-primary text-xs inline-flex items-center gap-2 disabled:opacity-50">{savingAutomation ? <Loader2 className="animate-spin" size={14} /> : <ShieldCheck size={14} />} Save Settings</button><button onClick={runScoutNow} disabled={runningAutomation} className="btn-outline text-xs inline-flex items-center gap-2 disabled:opacity-50">{runningAutomation ? <Loader2 className="animate-spin" size={14} /> : <PlayCircle size={14} />} Run Scout Now</button><button onClick={generateQueuedProductDrafts} disabled={generatingDrafts} className="btn-outline text-xs inline-flex items-center gap-2 disabled:opacity-50">{generatingDrafts ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />} Generate Drafts for Queue</button></div>
          {runSummary && <p className="text-sm text-brand-black/60">Run summary: discovered {runSummary.discovered ?? 0}, created {runSummary.created ?? 0}, deduped {runSummary.deduped ?? 0}, approved {runSummary.approved ?? 0}.</p>}
          {draftSummary && <p className="text-sm text-brand-black/60">Draft summary: scanned {draftSummary.scanned}, created {draftSummary.created}{draftSummary.errors.length ? `, errors: ${draftSummary.errors.join('; ')}` : ''}.</p>}
        </div>

        <div className="luxury-card bg-white border border-brand-blush rounded-sm overflow-hidden">
          <div className="p-6 border-b border-brand-blush"><h2 className="font-serif text-2xl text-brand-black">Lead Queue</h2><p className="text-xs uppercase tracking-widest text-brand-black/50">Approve leads to create Product drafts</p></div>
          {loading ? <div className="py-16 flex justify-center"><Loader2 className="animate-spin text-brand-gold" size={32} /></div> : <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="bg-brand-cream/50 text-[10px] uppercase tracking-widest font-bold text-brand-black/40 border-b border-brand-blush"><th className="px-6 py-4">Lead</th><th className="px-6 py-4">Source</th><th className="px-6 py-4">Score</th><th className="px-6 py-4">Category</th><th className="px-6 py-4">Price</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Actions</th></tr></thead><tbody className="divide-y divide-brand-blush">{leads.map((lead) => { const badge = sourceBadge(lead.source); return <tr key={lead.id} className="align-top hover:bg-brand-cream/20 transition-colors"><td className="px-6 py-5 min-w-[360px]"><div className="flex gap-4"><div className="w-16 h-16 rounded-sm bg-brand-cream border border-brand-blush bg-cover bg-center shrink-0" style={{ backgroundImage: lead.imageUrl ? `url(${lead.imageUrl})` : undefined }} /><div><p className="font-bold text-brand-black mb-1">{lead.title}</p><p className="text-xs text-brand-black/50 mb-2">{new Date(lead.createdAt).toLocaleDateString()}</p><p className="text-xs text-brand-black/60 leading-relaxed">{lead.reasonItMightSell}</p>{lead.sourceUrl && <a href={lead.sourceUrl} target="_blank" className="text-xs text-brand-gold hover:underline mt-2 inline-block">View source</a>}</div></div></td><td className="px-6 py-5"><span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-full font-bold ${badge.className}`}>{badge.label}</span></td><td className="px-6 py-5"><span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-brand-gold/10 text-brand-gold font-bold">{lead.viralityScore}</span></td><td className="px-6 py-5 text-sm text-brand-black/70">{lead.suggestedCategory || 'Unsorted'}</td><td className="px-6 py-5 text-sm text-brand-black/70">{lead.estimatedPrice ? `$${lead.estimatedPrice.toFixed(2)}` : 'TBD'}</td><td className="px-6 py-5"><span className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-full font-bold bg-brand-cream text-brand-black/60">{lead.status}</span></td><td className="px-6 py-5 min-w-[180px] space-y-2"><button onClick={() => approveLead(lead.id)} disabled={actingId === lead.id || lead.status === 'Approved'} className="w-full btn-primary text-xs inline-flex items-center justify-center gap-2 disabled:opacity-50">{actingId === lead.id ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />} Approve Lead</button>{lead.status === 'Approved' && <CreatePinsButton leadId={lead.id} className="w-full btn-outline text-xs py-2" />}<button onClick={() => rejectLead(lead.id)} disabled={actingId === lead.id || lead.status === 'Rejected'} className="w-full border border-brand-blush px-4 py-2 text-xs uppercase tracking-widest text-brand-black/60 hover:text-red-700 hover:border-red-200 disabled:opacity-50 inline-flex items-center justify-center gap-2"><XCircle size={14} /> Reject</button></td></tr>; })}{!leads.length && <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-brand-black/40 italic">No leads yet. Add a manual lead or import a trend list to start scouting.</td></tr>}</tbody></table></div>}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) { return <div className="bg-white border border-brand-blush p-5 rounded-sm shadow-sm"><p className="text-[10px] uppercase tracking-widest text-brand-black/50 mb-2">{label}</p><p className="text-3xl font-serif text-brand-black">{value}</p></div>; }
function Input({ label, value, onChange, type = 'text', required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) { return <label className="space-y-1 block"><span className="text-[10px] uppercase font-bold tracking-widest text-brand-black/60">{label}</span><input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-full border border-brand-blush p-3 text-sm focus:outline-none focus:border-brand-gold rounded-sm" /></label>; }
function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="space-y-1 block"><span className="text-[10px] uppercase font-bold tracking-widest text-brand-black/60">{label}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} className="w-full border border-brand-blush p-3 text-sm focus:outline-none focus:border-brand-gold rounded-sm min-h-24" /></label>; }
function ToggleCard({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) { return <button onClick={onClick} className="border border-brand-blush bg-brand-cream/30 p-4 rounded-sm text-left flex items-center justify-between hover:border-brand-gold transition-colors"><span className="text-xs uppercase tracking-widest text-brand-black/70 font-bold">{label}</span><span className={`w-11 h-6 rounded-full p-1 transition-colors ${active ? 'bg-brand-gold' : 'bg-brand-blush'}`}><span className={`block w-4 h-4 rounded-full bg-white transition-transform ${active ? 'translate-x-5' : 'translate-x-0'}`} /></span></button>; }
function AutomationTextarea({ label, value, placeholder, onChange }: { label: string; value: string; placeholder: string; onChange: (value: string) => void }) { return <label className="space-y-1 block"><span className="text-[10px] uppercase font-bold tracking-widest text-brand-black/60">{label}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} className="w-full border border-brand-blush p-3 text-sm focus:outline-none focus:border-brand-gold rounded-sm min-h-32" placeholder={placeholder} /></label>; }
