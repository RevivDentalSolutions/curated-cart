"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, ClipboardList, Edit3, FileText, Loader2, Trash2, WandSparkles } from 'lucide-react';
import AIAssistant from '@/components/AIAssistant';
import CreatePinsButton from '@/components/CreatePinsButton';
import ProductImage from '@/components/ProductImage';
import { amazonAssociatesTag } from '@/lib/affiliate';

type Category = { id: string; name: string };
type BlogPost = {
  id: string;
  title: string;
  slug: string;
  isPublished: boolean;
  category?: Category;
  products?: Array<{ id: string; name: string }>;
  updatedAt?: string;
};
type Product = {
  id: string;
  name: string;
  description?: string | null;
  categoryId: string;
  category?: Category;
  imageUrl?: string | null;
  amazonLink?: string | null;
  affiliateLink?: string | null;
  affiliatePlaceholderUrl?: string | null;
  amazonAsin?: string | null;
  source?: string | null;
  viralTrendNotes?: string | null;
  contentIdea?: string | null;
  blogPostStatus?: string | null;
  pinStatus?: string | null;
  tiktokStatus?: string | null;
  published: boolean;
  dateAdded?: string;
  contentBundle?: any;
  blogPosts?: BlogPost[];
};

type Pin = { id: string; status: string; productId?: string | null; product?: { id: string; name: string } | null };

const emptyProduct = {
  id: '',
  name: '',
  description: '',
  categoryId: '',
  imageUrl: '',
  productUrl: '',
  affiliatePlaceholderUrl: '',
  amazonAsin: '',
  source: '',
  viralTrendNotes: '',
  contentIdea: '',
  blogPostStatus: 'Needs Content',
  pinStatus: 'Needs Pin',
  tiktokStatus: 'Pending',
  published: false,
};

const emptyManualPost = {
  id: '', title: '', slug: '', categoryId: '', featuredImage: '', excerpt: '', content: '', metaTitle: '', metaDescription: '', isPublished: false, productIds: [] as string[],
};

const emptyCollectionPost = {
  title: '', slug: '', categoryId: '', intro: '', productSections: '', conclusion: '', excerpt: '', featuredImage: '', metaTitle: '', metaDescription: '', isPublished: false,
};

function productToForm(product: Product) {
  return {
    id: product.id,
    name: product.name || '',
    description: product.description || '',
    categoryId: product.categoryId || '',
    imageUrl: product.imageUrl || '',
    productUrl: product.affiliateLink || product.amazonLink || '',
    affiliatePlaceholderUrl: product.affiliatePlaceholderUrl || '',
    amazonAsin: product.amazonAsin || '',
    source: product.source || '',
    viralTrendNotes: product.viralTrendNotes || '',
    contentIdea: product.contentIdea || '',
    blogPostStatus: product.blogPostStatus || 'Needs Content',
    pinStatus: product.pinStatus || 'Needs Pin',
    tiktokStatus: product.tiktokStatus || 'Pending',
    published: product.published,
  };
}

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [pins, setPins] = useState<Pin[]>([]);
  const [form, setForm] = useState(emptyProduct);
  const [manualPost, setManualPost] = useState(emptyManualPost);
  const [blogEditor, setBlogEditor] = useState(emptyManualPost);
  const [collectionPost, setCollectionPost] = useState(emptyCollectionPost);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    const [productRes, categoryRes, blogRes, pinRes] = await Promise.all([
      fetch('/api/products'),
      fetch('/api/categories-list'),
      fetch('/api/blog-posts'),
      fetch('/api/pinterest/pins'),
    ]);
    const [productJson, categoryJson, blogJson, pinJson] = await Promise.all([
      productRes.json(), categoryRes.json(), blogRes.json(), pinRes.json(),
    ]);
    if (productJson.success) setProducts(productJson.data);
    if (categoryJson.success) setCategories(categoryJson.data);
    if (blogJson.success) setBlogPosts(blogJson.data);
    if (pinJson.success) setPins(pinJson.data);
    setLoading(false);
  }

  useEffect(() => {
    loadData().catch(() => setLoading(false));
  }, []);

  const selectedProducts = useMemo(() => selectedProductIds.map((id) => products.find((product) => product.id === id)).filter(Boolean) as Product[], [products, selectedProductIds]);
  const needsPin = products.filter((product) => !product.pinStatus || product.pinStatus === 'Needs Pin' || product.pinStatus === 'Pending');
  const generatedPins = pins.filter((pin) => pin.status === 'Draft');
  const readyPins = pins.filter((pin) => pin.status === 'Ready');
  const publishedPins = pins.filter((pin) => pin.status === 'Published');
  const complianceIssues = products.flatMap((product) => {
    const issues = [];
    if (!product.description) issues.push({ product, issue: 'Missing description' });
    if (!product.categoryId) issues.push({ product, issue: 'Missing category' });
    if (!product.imageUrl) issues.push({ product, issue: 'Missing image URL' });
    if (!product.affiliateLink && !product.amazonLink && !product.affiliatePlaceholderUrl) issues.push({ product, issue: 'Missing product URL' });
    return issues;
  });
  const amazonTagMissing = !amazonAssociatesTag();

  function toggleSelectedProduct(product: Product) {
    setSelectedProductIds((current) => current.includes(product.id) ? current.filter((id) => id !== product.id) : [...current, product.id]);
    if (!collectionPost.categoryId && product.categoryId) setCollectionPost((post) => ({ ...post, categoryId: product.categoryId }));
  }

  async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const payload = {
      id: form.id || undefined,
      name: form.name,
      description: form.description,
      categoryId: form.categoryId,
      imageUrl: form.imageUrl,
      affiliateLink: form.productUrl,
      amazonLink: form.productUrl,
      affiliatePlaceholderUrl: form.affiliatePlaceholderUrl,
      amazonAsin: form.amazonAsin,
      source: form.source,
      viralTrendNotes: form.viralTrendNotes,
      contentIdea: form.contentIdea,
      blogPostStatus: form.blogPostStatus,
      pinStatus: form.pinStatus,
      tiktokStatus: form.tiktokStatus,
      published: form.published,
    };
    const res = await fetch('/api/products', { method: form.id ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();
    setSaving(false);
    if (!data.success) return alert(data.error || 'Unable to save product');
    setForm(emptyProduct);
    await loadData();
  }

  async function patchProduct(id: string, patch: Partial<Product>) {
    const res = await fetch('/api/products', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...patch }) });
    const data = await res.json();
    if (!data.success) alert(data.error || 'Unable to update product');
    await loadData();
  }

  async function deleteProduct(id: string) {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    const res = await fetch(`/api/products?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    const data = await res.json();
    if (!data.success) alert(data.error || 'Unable to delete product');
    await loadData();
  }

  async function generateDescription(product: Product) {
    setBusyAction(`desc-${product.id}`);
    const res = await fetch('/api/generate-content', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: product.id }) });
    const data = await res.json();
    if (data.success) await patchProduct(product.id, { description: data.data.shortDescription, blogPostStatus: 'Ready to Promote' });
    else alert(data.error || 'Unable to generate product content');
    setBusyAction(null);
  }

  async function createSingleProductPost(product: Product) {
    setBusyAction(`post-${product.id}`);
    const res = await fetch(`/api/products/${product.id}/blog-post`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isPublished: false }) });
    const data = await res.json();
    if (!data.success) alert(data.error || 'Unable to create blog post');
    await loadData();
    setBusyAction(null);
  }

  async function toggleBlogPost(post: BlogPost) {
    const productId = post.products?.[0]?.id;
    const endpoint = productId ? `/api/products/${productId}/blog-post` : '/api/blog-posts';
    const body = productId ? { postId: post.id, isPublished: !post.isPublished } : { id: post.id, isPublished: !post.isPublished };
    const res = await fetch(endpoint, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    if (!data.success) alert(data.error || 'Unable to update blog post');
    await loadData();
  }

  async function createManualPost(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyAction('manual-post');
    const res = await fetch('/api/blog-posts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...manualPost, postType: 'manual' }) });
    const data = await res.json();
    if (data.success) setManualPost(emptyManualPost); else alert(data.error || 'Unable to create manual post');
    await loadData();
    setBusyAction(null);
  }

  function editBlogPost(post: BlogPost & { content?: string | null; excerpt?: string | null; metaTitle?: string | null; metaDescription?: string | null; featuredImage?: string | null; categoryId?: string }) {
    setBlogEditor({
      id: post.id,
      title: post.title || '',
      slug: post.slug || '',
      categoryId: post.categoryId || post.category?.id || '',
      featuredImage: post.featuredImage || '',
      excerpt: post.excerpt || '',
      content: post.content || '',
      metaTitle: post.metaTitle || '',
      metaDescription: post.metaDescription || '',
      isPublished: post.isPublished,
      productIds: post.products?.map((product) => product.id) || [],
    });
  }

  async function saveBlogPost(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!blogEditor.id) return alert('Choose a blog post to edit first.');
    setBusyAction('save-blog-post');
    const res = await fetch('/api/blog-posts', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(blogEditor) });
    const data = await res.json();
    if (data.success) setBlogEditor(emptyManualPost); else alert(data.error || 'Unable to update blog post');
    await loadData();
    setBusyAction(null);
  }

  async function deleteBlogPost(id: string) {
    if (!confirm('Delete this blog post? This cannot be undone.')) return;
    const res = await fetch(`/api/blog-posts?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    const data = await res.json();
    if (!data.success) alert(data.error || 'Unable to delete blog post');
    await loadData();
  }

  async function generateCollectionDraft() {
    if (!collectionPost.title || !collectionPost.categoryId || selectedProductIds.length < 2) return alert('Add a title, category, and at least two selected products.');
    setBusyAction('collection-draft');
    const res = await fetch('/api/blog-posts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'generate-draft', postType: 'collection', title: collectionPost.title, categoryId: collectionPost.categoryId, productIds: selectedProductIds }) });
    const data = await res.json();
    if (data.success) {
      setCollectionPost((post) => ({ ...post, slug: data.data.suggestedSlug || post.slug, intro: data.data.intro || post.intro, productSections: data.data.productSections || post.productSections, conclusion: data.data.conclusion || post.conclusion, excerpt: post.excerpt || data.data.metaDescription || '', metaTitle: data.data.seoTitle || post.metaTitle, metaDescription: data.data.metaDescription || post.metaDescription }));
    } else alert(data.error || 'Unable to generate collection draft');
    setBusyAction(null);
  }

  async function createCollectionPost(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyAction('collection-post');
    const res = await fetch('/api/blog-posts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...collectionPost, postType: 'collection', productIds: selectedProductIds }) });
    const data = await res.json();
    if (data.success) { setCollectionPost(emptyCollectionPost); setSelectedProductIds([]); } else alert(data.error || 'Unable to create collection post');
    await loadData();
    setBusyAction(null);
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-brand-cream/50"><Loader2 className="animate-spin text-brand-gold" size={48} /></div>;

  return (
    <div className="min-h-screen bg-brand-cream/40 text-brand-black">
      <div className="container mx-auto px-4 py-10 space-y-10">
        <header className="rounded-sm border border-brand-blush bg-white p-8 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-gold">Curated Cart Studio</span>
          <h1 className="mt-2 text-5xl font-serif tracking-tighter">Content Publishing Command Center</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-brand-black/65">Manage affiliate-safe products, AI content, blog drafts, Pinterest pins, and compliance checks without bringing back fake prices, fake reviews, or hardcoded Amazon tags.</p>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <Metric label="Products" value={products.length} />
          <Metric label="Published" value={products.filter((p) => p.published).length} />
          <Metric label="Blog drafts" value={blogPosts.filter((p) => !p.isPublished).length} />
          <Metric label="Compliance flags" value={complianceIssues.length + (amazonTagMissing ? 1 : 0)} />
        </section>

        <section className="rounded-sm border border-brand-blush bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div><span className="text-[10px] font-bold uppercase tracking-[0.25em] text-brand-gold">1. Product Library</span><h2 className="text-3xl font-serif">Add and edit products</h2></div>
            {form.id && <button onClick={() => setForm(emptyProduct)} className="btn-outline px-4 py-2 text-xs">Cancel edit</button>}
          </div>
          <form onSubmit={saveProduct} className="grid gap-4 lg:grid-cols-3">
            <Input label="Product title" required value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
            <label className="space-y-1 text-xs font-bold uppercase tracking-widest text-brand-black/60">Category<select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="w-full border border-brand-blush bg-white p-3 text-sm font-normal normal-case tracking-normal text-brand-black"><option value="">Choose category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
            <Input label="Image URL" required type="url" value={form.imageUrl} onChange={(value) => setForm({ ...form, imageUrl: value })} />
            <Input label="Product/Amazon URL" required type="url" value={form.productUrl} onChange={(value) => setForm({ ...form, productUrl: value })} />
            <Input label="Affiliate placeholder URL" type="url" value={form.affiliatePlaceholderUrl} onChange={(value) => setForm({ ...form, affiliatePlaceholderUrl: value })} />
            <Input label="Amazon ASIN" value={form.amazonAsin} onChange={(value) => setForm({ ...form, amazonAsin: value })} />
            <Textarea label="Description" value={form.description} onChange={(value) => setForm({ ...form, description: value })} />
            <Textarea label="Editorial notes / viral trend notes" value={form.viralTrendNotes} onChange={(value) => setForm({ ...form, viralTrendNotes: value })} />
            <Textarea label="Content idea" value={form.contentIdea} onChange={(value) => setForm({ ...form, contentIdea: value })} />
            <Input label="Source" value={form.source} onChange={(value) => setForm({ ...form, source: value })} />
            <Input label="Blog/editorial status" value={form.blogPostStatus} onChange={(value) => setForm({ ...form, blogPostStatus: value })} />
            <Input label="Pinterest status" value={form.pinStatus} onChange={(value) => setForm({ ...form, pinStatus: value })} />
            <Input label="TikTok/social status" value={form.tiktokStatus} onChange={(value) => setForm({ ...form, tiktokStatus: value })} />
            <label className="flex items-center gap-3 rounded-sm border border-brand-blush bg-brand-cream/30 p-3 text-xs font-bold uppercase tracking-widest"><input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="h-4 w-4 accent-brand-gold" /> Published</label>
            <button disabled={saving} className="btn-primary py-3 disabled:opacity-50">{saving ? 'Saving...' : form.id ? 'Save Product Changes' : 'Add Product'}</button>
          </form>

          <div className="mt-8 divide-y divide-brand-blush">
            {products.map((product) => (
              <div key={product.id} className="grid gap-4 py-5 lg:grid-cols-[88px_1fr_auto] lg:items-center">
                <div className="h-22 w-22 overflow-hidden rounded-sm bg-brand-cream"><ProductImage src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" /></div>
                <div>
                  <div className="flex flex-wrap items-center gap-2"><h3 className="font-serif text-xl">{product.name}</h3><Badge>{product.published ? 'Published' : 'Draft'}</Badge><Badge>{product.blogPostStatus || 'Needs Content'}</Badge><Badge>{product.pinStatus || 'Needs Pin'}</Badge></div>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-brand-gold">{product.category?.name || 'No category'} • {product.source || 'No source'}</p>
                  <p className="mt-2 max-w-3xl text-sm text-brand-black/65">{product.description || product.viralTrendNotes || 'No product description yet.'}</p>
                </div>
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <button onClick={() => setForm(productToForm(product))} className="btn-outline px-3 py-2 text-[10px]"><Edit3 size={12} /> Edit</button>
                  <button onClick={() => patchProduct(product.id, { published: !product.published })} className="btn-outline px-3 py-2 text-[10px]">{product.published ? 'Unpublish' : 'Publish'}</button>
                  <button onClick={() => patchProduct(product.id, { published: false, blogPostStatus: 'Archived' })} className="btn-outline px-3 py-2 text-[10px]">Archive</button>
                  <button onClick={() => deleteProduct(product.id)} className="btn-primary px-3 py-2 text-[10px]"><Trash2 size={12} /> Delete</button>
                  <button onClick={() => toggleSelectedProduct(product)} className="btn-outline px-3 py-2 text-[10px]">{selectedProductIds.includes(product.id) ? 'Remove from Roundup' : 'Add to Roundup'}</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-sm border border-brand-blush bg-white p-6 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-brand-gold">2. AI Studio</span><h2 className="mt-1 text-3xl font-serif">Generate content from products</h2>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {products.map((product) => (
              <div key={product.id} className="rounded-sm border border-brand-blush bg-brand-cream/20 p-4">
                <h3 className="font-serif text-xl">{product.name}</h3><p className="mt-1 text-xs uppercase tracking-widest text-brand-black/45">{product.category?.name}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => generateDescription(product)} disabled={busyAction === `desc-${product.id}`} className="btn-outline px-3 py-2 text-[10px]"><WandSparkles size={12} /> Generate description</button>
                  <button onClick={() => setActiveProduct(product)} className="btn-outline px-3 py-2 text-[10px]">Open content bundle</button>
                  <button onClick={() => createSingleProductPost(product)} disabled={busyAction === `post-${product.id}`} className="btn-primary px-3 py-2 text-[10px]"><FileText size={12} /> Generate blog post</button>
                  <CreatePinsButton productId={product.id} label="Generate Pinterest pin" className="btn-outline px-3 py-2 text-[10px]" onCreated={() => patchProduct(product.id, { pinStatus: 'Generated' })} />
                  <button onClick={() => setActiveProduct(product)} className="btn-outline px-3 py-2 text-[10px]">Generate social caption</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-8 xl:grid-cols-2">
          <div className="rounded-sm border border-brand-blush bg-white p-6 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-brand-gold">3. Blog Drafts</span><h2 className="mt-1 text-3xl font-serif">Drafts and publishing</h2>
            <div className="mt-5 space-y-3">{blogPosts.map((post) => <div key={post.id} className="rounded-sm border border-brand-blush p-4"><div className="flex items-start justify-between gap-4"><div><h3 className="font-serif text-lg">{post.title}</h3><p className="mt-1 text-xs text-brand-black/55">{post.isPublished ? 'Published' : 'Draft'} • {post.products?.map((p) => p.name).join(', ') || 'No connected products'}</p></div><div className="flex flex-wrap gap-2"><Link href={`/blog/${post.slug}${post.isPublished ? '' : '?preview=1'}`} target="_blank" rel="noopener noreferrer" className="btn-outline px-3 py-2 text-[10px]">Preview</Link><button onClick={() => editBlogPost(post as any)} className="btn-outline px-3 py-2 text-[10px]">Edit</button><button onClick={() => toggleBlogPost(post)} className="btn-primary px-3 py-2 text-[10px]">{post.isPublished ? 'Unpublish' : 'Publish'}</button><button onClick={() => deleteBlogPost(post.id)} className="btn-outline px-3 py-2 text-[10px]">Delete</button></div></div></div>)}</div>

            {blogEditor.id && <form onSubmit={saveBlogPost} className="mt-8 grid gap-3 rounded-sm border border-brand-blush bg-brand-cream/20 p-4"><h3 className="font-serif text-xl">Edit blog post</h3><Input label="Title" required value={blogEditor.title} onChange={(value) => setBlogEditor({ ...blogEditor, title: value })} /><Input label="Slug" value={blogEditor.slug} onChange={(value) => setBlogEditor({ ...blogEditor, slug: value })} /><Textarea label="Excerpt" value={blogEditor.excerpt} onChange={(value) => setBlogEditor({ ...blogEditor, excerpt: value })} /><Textarea label="Body/content" value={blogEditor.content} onChange={(value) => setBlogEditor({ ...blogEditor, content: value })} /><label className="space-y-1 text-xs font-bold uppercase tracking-widest text-brand-black/60">Connected products<select multiple value={blogEditor.productIds} onChange={(e) => setBlogEditor({ ...blogEditor, productIds: Array.from(e.target.selectedOptions).map((option) => option.value) })} className="min-h-32 w-full border border-brand-blush bg-white p-3 text-sm font-normal normal-case tracking-normal">{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label><label className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest"><input type="checkbox" checked={blogEditor.isPublished} onChange={(e) => setBlogEditor({ ...blogEditor, isPublished: e.target.checked })} className="h-4 w-4 accent-brand-gold" /> Published</label><div className="grid gap-2 md:grid-cols-2"><button type="button" onClick={() => setBlogEditor(emptyManualPost)} className="btn-outline py-3">Cancel</button><button disabled={busyAction === 'save-blog-post'} className="btn-primary py-3">Save Blog Post</button></div></form>}
            <form onSubmit={createManualPost} className="mt-8 grid gap-3"><h3 className="font-serif text-xl">Create manual post</h3><Input label="Title" required value={manualPost.title} onChange={(value) => setManualPost({ ...manualPost, title: value })} /><Input label="Slug" value={manualPost.slug} onChange={(value) => setManualPost({ ...manualPost, slug: value })} /><label className="space-y-1 text-xs font-bold uppercase tracking-widest text-brand-black/60">Category<select required value={manualPost.categoryId} onChange={(e) => setManualPost({ ...manualPost, categoryId: e.target.value })} className="w-full border border-brand-blush bg-white p-3 text-sm font-normal normal-case tracking-normal"><option value="">Choose category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><Textarea label="Post content" value={manualPost.content} onChange={(value) => setManualPost({ ...manualPost, content: value })} /><button disabled={busyAction === 'manual-post'} className="btn-primary py-3">Save Manual Blog Draft</button></form>
          </div>

          <div className="rounded-sm border border-brand-blush bg-white p-6 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-brand-gold">Roundup Builder</span><h2 className="mt-1 text-3xl font-serif">Collection blog post</h2>
            <div className="mt-4 rounded-sm bg-brand-cream/50 p-3 text-sm">Selected products: {selectedProducts.map((product) => product.name).join(', ') || 'None yet'}</div>
            <form onSubmit={createCollectionPost} className="mt-5 grid gap-3"><Input label="Roundup title" required value={collectionPost.title} onChange={(value) => setCollectionPost({ ...collectionPost, title: value })} /><label className="space-y-1 text-xs font-bold uppercase tracking-widest text-brand-black/60">Category<select required value={collectionPost.categoryId} onChange={(e) => setCollectionPost({ ...collectionPost, categoryId: e.target.value })} className="w-full border border-brand-blush bg-white p-3 text-sm font-normal normal-case tracking-normal"><option value="">Choose category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><Textarea label="Intro" value={collectionPost.intro} onChange={(value) => setCollectionPost({ ...collectionPost, intro: value })} /><Textarea label="Product sections" value={collectionPost.productSections} onChange={(value) => setCollectionPost({ ...collectionPost, productSections: value })} /><Textarea label="Conclusion" value={collectionPost.conclusion} onChange={(value) => setCollectionPost({ ...collectionPost, conclusion: value })} /><div className="grid gap-2 md:grid-cols-2"><button type="button" onClick={generateCollectionDraft} disabled={busyAction === 'collection-draft'} className="btn-outline py-3">Generate AI Draft</button><button disabled={busyAction === 'collection-post' || selectedProductIds.length < 2} className="btn-primary py-3 disabled:opacity-50">Save Roundup Draft</button></div></form>
          </div>
        </section>

        <section className="rounded-sm border border-brand-blush bg-white p-6 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-brand-gold">4. Pinterest Queue</span><h2 className="mt-1 text-3xl font-serif">Pin content status</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-4"><QueueColumn title="Needs pin" items={needsPin.map((p) => p.name)} /><QueueColumn title="Generated" items={generatedPins.map((pin) => pin.product?.name || pin.id)} /><QueueColumn title="Ready" items={readyPins.map((pin) => pin.product?.name || pin.id)} /><QueueColumn title="Published" items={publishedPins.map((pin) => pin.product?.name || pin.id)} /></div>
        </section>

        <section className="rounded-sm border border-brand-blush bg-white p-6 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-brand-gold">5. Compliance Checklist</span><h2 className="mt-1 text-3xl font-serif">Amazon Associates readiness</h2>
          <div className="mt-5 space-y-3"><ComplianceItem ok={!amazonTagMissing} text={amazonTagMissing ? 'Missing Amazon tracking tag environment variable.' : 'Amazon tracking tag environment variable is configured.'} /><ComplianceItem ok text="Affiliate disclosure pages and notices remain in the site shell/public pages." /><ComplianceItem ok text="Dashboard does not expose manual fake price, rating, or review fields." />{complianceIssues.map(({ product, issue }) => <ComplianceItem key={`${product.id}-${issue}`} ok={false} text={`${product.name}: ${issue}`} />)}{complianceIssues.length === 0 && <ComplianceItem ok text="All products have the required category, image, URL, and description fields." />}</div>
        </section>
      </div>
      {activeProduct && <AIAssistant product={activeProduct} onClose={() => { setActiveProduct(null); loadData(); }} />}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) { return <div className="rounded-sm border border-brand-blush bg-white p-5 shadow-sm"><p className="text-[10px] font-bold uppercase tracking-widest text-brand-black/45">{label}</p><p className="mt-1 text-3xl font-serif">{value}</p></div>; }
function Badge({ children }: { children: React.ReactNode }) { return <span className="rounded-full bg-brand-cream px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-brand-black/55">{children}</span>; }
function Input({ label, value, onChange, type = 'text', required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) { return <label className="space-y-1 text-xs font-bold uppercase tracking-widest text-brand-black/60">{label}<input required={required} type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full border border-brand-blush p-3 text-sm font-normal normal-case tracking-normal text-brand-black" /></label>; }
function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="space-y-1 text-xs font-bold uppercase tracking-widest text-brand-black/60 lg:col-span-1">{label}<textarea value={value} onChange={(e) => onChange(e.target.value)} rows={4} className="w-full border border-brand-blush p-3 text-sm font-normal normal-case tracking-normal text-brand-black" /></label>; }
function QueueColumn({ title, items }: { title: string; items: string[] }) { return <div className="rounded-sm border border-brand-blush bg-brand-cream/30 p-4"><h3 className="font-serif text-lg">{title}</h3><div className="mt-3 space-y-2">{items.length ? items.slice(0, 8).map((item) => <p key={item} className="rounded-sm bg-white p-2 text-xs">{item}</p>) : <p className="text-xs italic text-brand-black/40">Nothing here.</p>}</div></div>; }
function ComplianceItem({ ok, text }: { ok: boolean; text: string }) { return <div className={`flex items-start gap-3 rounded-sm border p-3 text-sm ${ok ? 'border-green-100 bg-green-50 text-green-800' : 'border-amber-100 bg-amber-50 text-amber-800'}`}>{ok ? <CheckCircle2 size={16} /> : <ClipboardList size={16} />}<span>{text}</span></div>; }
