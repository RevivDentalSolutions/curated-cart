/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Plus, Search, TrendingUp, FileText,
  DollarSign, Calendar, CheckSquare,
  Clock, AlertCircle, Loader2, Layers, Edit3, BookOpen
} from 'lucide-react';
import AIAssistant from '@/components/AIAssistant';
import CreatePinsButton from '@/components/CreatePinsButton';

const emptyCollectionPost = {
  title: '',
  categoryId: '',
  slug: '',
  intro: '',
  productSections: '',
  conclusion: '',
  excerpt: '',
  metaTitle: '',
  metaDescription: '',
  pinterestDescription: '',
  featuredImage: '',
  isPublished: false,
};

const emptyManualPost = {
  title: '',
  slug: '',
  categoryId: '',
  featuredImage: '',
  excerpt: '',
  content: '',
  metaTitle: '',
  metaDescription: '',
  isPublished: false,
};

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [automationData, setAutomationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeProduct, setActiveProduct] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [creatingBlogPostId, setCreatingBlogPostId] = useState<string | null>(null);
  const [savingBlogPost, setSavingBlogPost] = useState(false);
  const [generatingCollectionDraft, setGeneratingCollectionDraft] = useState(false);
  const [updatingBlogPostId, setUpdatingBlogPostId] = useState<string | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [collectionPost, setCollectionPost] = useState(emptyCollectionPost);
  const [manualPost, setManualPost] = useState(emptyManualPost);
  const [newProduct, setNewProduct] = useState({
    name: '',
    categoryId: '',
    amazonLink: '',
    imageUrl: '',
    price: '',
    source: '',
    published: true,
  });

  const selectedProducts = useMemo(
    () => selectedProductIds
      .map((id) => allProducts.find((product) => product.id === id))
      .filter(Boolean),
    [allProducts, selectedProductIds]
  );

  const fetchData = async () => {
    try {
      const [dashRes, autoRes, catResponse, productResponse] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/automations'),
        fetch('/api/categories-list'),
        fetch('/api/products'),
      ]);

      const dashJson = await dashRes.json();
      const autoJson = await autoRes.json();
      const catJson = await catResponse.json();
      const productJson = await productResponse.json();

      if (dashJson.success) setDashboardData(dashJson.data);
      if (autoJson.success) setAutomationData(autoJson.data);
      if (catJson.success) setCategories(catJson.data);
      if (productJson.success) setAllProducts(productJson.data);
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleCollectionProduct = (product: any) => {
    setSelectedProductIds((current) => {
      if (current.includes(product.id)) {
        return current.filter((id) => id !== product.id);
      }

      if (!collectionPost.categoryId && product.categoryId) {
        setCollectionPost((post) => ({ ...post, categoryId: product.categoryId }));
      }

      return [...current, product.id];
    });
  };

  const openCollectionModal = (product?: any) => {
    if (product && !selectedProductIds.includes(product.id)) {
      toggleCollectionProduct(product);
    }
    setShowCollectionModal(true);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setNewProduct({ name: '', categoryId: '', amazonLink: '', imageUrl: '', price: '', source: '', published: true });
        fetchData();
      } else {
        alert(data.error);
      }
    } catch {
      alert('Failed to add product');
    }
  };

  const handlePublishToggle = async (product: any) => {
    try {
      const res = await fetch('/api/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: product.id, published: !product.published }),
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.error);
      }
    } catch {
      alert('Failed to update publish status');
    }
  };

  const handleCreateSingleProductPost = async (product: any) => {
    setCreatingBlogPostId(product.id);
    try {
      const res = await fetch(`/api/products/${product.id}/blog-post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: false }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Single product post saved as a draft. Use collection posts as your primary blog workflow.');
        fetchData();
      } else {
        alert(data.error);
      }
    } catch {
      alert('Failed to create blog post');
    } finally {
      setCreatingBlogPostId(null);
    }
  };

  const handleBlogPostPublishToggle = async (product: any) => {
    const post = product.blogPosts?.[0];
    if (!post) {
      return;
    }

    setUpdatingBlogPostId(post.id);
    try {
      const res = await fetch(`/api/products/${product.id}/blog-post`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id, isPublished: !post.isPublished }),
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.error);
      }
    } catch {
      alert('Failed to update blog post');
    } finally {
      setUpdatingBlogPostId(null);
    }
  };


  const handleGenerateCollectionDraft = async () => {
    if (!collectionPost.title || !collectionPost.categoryId || selectedProductIds.length < 2) {
      alert('Add a title, choose a category, and select at least two products before generating a draft.');
      return;
    }

    setGeneratingCollectionDraft(true);
    try {
      const res = await fetch('/api/blog-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-draft',
          postType: 'collection',
          title: collectionPost.title,
          categoryId: collectionPost.categoryId,
          productIds: selectedProductIds,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCollectionPost((post) => ({
          ...post,
          title: data.data.title || post.title,
          slug: data.data.suggestedSlug || post.slug,
          intro: data.data.intro || post.intro,
          productSections: data.data.productSections || post.productSections,
          conclusion: data.data.conclusion || post.conclusion,
          metaTitle: data.data.seoTitle || post.metaTitle,
          metaDescription: data.data.metaDescription || post.metaDescription,
          pinterestDescription: data.data.pinterestDescription || post.pinterestDescription,
          excerpt: post.excerpt || data.data.metaDescription || data.data.intro || '',
        }));
      } else {
        alert(data.error);
      }
    } catch {
      alert('Failed to generate AI draft');
    } finally {
      setGeneratingCollectionDraft(false);
    }
  };

  const handleGenerateAndOpenEditor = async () => {
    if (!collectionPost.title || !collectionPost.categoryId || selectedProductIds.length < 2) {
      alert('Add a title, choose a category, and select at least two products before generating an editable draft.');
      return;
    }

    setGeneratingCollectionDraft(true);
    try {
      const res = await fetch('/api/blog-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-draft',
          saveDraft: true,
          postType: 'collection',
          title: collectionPost.title,
          slug: collectionPost.slug,
          categoryId: collectionPost.categoryId,
          featuredImage: collectionPost.featuredImage,
          productIds: selectedProductIds,
        }),
      });
      const data = await res.json();
      if (data.success && data.data.blogPostId) {
        window.location.assign(`/dashboard/blog/${data.data.blogPostId}/edit`);
      } else {
        alert(data.error || 'Failed to create editable draft');
      }
    } catch {
      alert('Failed to generate editable draft');
    } finally {
      setGeneratingCollectionDraft(false);
    }
  };

  const handleCreateCollectionPost = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBlogPost(true);
    try {
      const res = await fetch('/api/blog-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...collectionPost, postType: 'collection', productIds: selectedProductIds }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCollectionModal(false);
        setSelectedProductIds([]);
        setCollectionPost(emptyCollectionPost);
        fetchData();
      } else {
        alert(data.error);
      }
    } catch {
      alert('Failed to create collection blog post');
    } finally {
      setSavingBlogPost(false);
    }
  };

  const handleCreateManualPost = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBlogPost(true);
    try {
      const res = await fetch('/api/blog-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...manualPost, postType: 'manual' }),
      });
      const data = await res.json();
      if (data.success) {
        setShowManualModal(false);
        setManualPost(emptyManualPost);
        fetchData();
      } else {
        alert(data.error);
      }
    } catch {
      alert('Failed to create manual blog post');
    } finally {
      setSavingBlogPost(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-brand-cream/50">
        <Loader2 className="animate-spin text-brand-gold" size={48} />
      </div>
    );
  }

  const stats = [
    { label: 'Needs Content', value: dashboardData?.stats.needsContent || '0', icon: Clock, color: 'text-amber-600' },
    { label: 'Ready to Promote', value: dashboardData?.stats.readyToPromote || '0', icon: CheckSquare, color: 'text-green-600' },
    { label: 'Published', value: dashboardData?.stats.published || '0', icon: TrendingUp, color: 'text-blue-600' },
    { label: 'Potential Commission', value: 'High', icon: DollarSign, color: 'text-brand-gold' },
  ];

  const ProductActions = ({ product, compact = false }: { product: any; compact?: boolean }) => (
    <div className={compact ? 'flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end' : 'flex flex-col items-end gap-2'}>
      <button
        onClick={() => openCollectionModal(product)}
        className={compact ? 'btn-primary py-2 px-4 text-[10px]' : 'btn-primary py-2 px-3 text-[9px]'}
      >
        Add to Collection Post
      </button>
      <CreatePinsButton productId={product.id} className={compact ? 'btn-outline py-2 px-4 text-[10px]' : undefined} />
      <button
        onClick={() => handleCreateSingleProductPost(product)}
        disabled={creatingBlogPostId === product.id}
        className={compact ? 'btn-outline py-2 px-4 text-[10px] disabled:opacity-50' : 'btn-outline py-2 px-3 text-[9px] disabled:opacity-50'}
      >
        {creatingBlogPostId === product.id ? 'Creating...' : product.blogPosts?.[0] ? 'Refresh Single Draft' : 'Create Single Product Post'}
      </button>
      {product.blogPosts?.[0] && (
        <Link
          href={`/dashboard/blog/${product.blogPosts[0].id}/edit`}
          className={compact ? 'btn-primary py-2 px-4 text-[10px]' : 'btn-primary py-2 px-3 text-[9px]'}
        >
          Edit Draft
        </Link>
      )}
      {product.blogPosts?.[0] && (
        <button
          onClick={() => handleBlogPostPublishToggle(product)}
          disabled={updatingBlogPostId === product.blogPosts[0].id}
          className={compact ? 'btn-outline py-2 px-4 text-[10px] disabled:opacity-50' : 'btn-outline py-2 px-3 text-[9px] disabled:opacity-50'}
        >
          {product.blogPosts[0].isPublished ? 'Unpublish Post' : 'Publish Post'}
        </button>
      )}
      <button
        onClick={() => setActiveProduct(product)}
        className={compact ? 'btn-outline py-2 px-4 text-[10px]' : 'text-brand-gold hover:text-brand-black transition-colors'}
        title="Open content assistant"
      >
        {compact ? 'Generate Content' : <FileText size={16} />}
      </button>
    </div>
  );

  return (
    <div className="bg-brand-cream/50 min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
          <div>
            <h1 className="text-4xl font-serif mb-2 text-brand-black">Viral Product Tracker</h1>
            <p className="text-sm text-brand-black/60 uppercase tracking-widest">Manage your finds & content strategy</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/pinterest" className="btn-outline flex items-center gap-2">
              Pinterest Dashboard
            </Link>
            <button onClick={() => setShowManualModal(true)} className="btn-outline flex items-center gap-2">
              <Edit3 size={16} /> Create Manual Post
            </button>
            <button onClick={() => openCollectionModal()} className="btn-primary flex items-center gap-2">
              <Layers size={16} /> Create Collection Blog Post
            </button>
            <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
              <Plus size={16} /> Add New Find
            </button>
          </div>
        </div>

        {selectedProductIds.length > 0 && (
          <div className="mb-8 rounded-sm border border-brand-gold bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-brand-gold">Collection Draft Queue</p>
                <p className="mt-1 text-sm text-brand-black/70">
                  {selectedProductIds.length} product{selectedProductIds.length === 1 ? '' : 's'} selected: {selectedProducts.map((product: any) => product.name).join(', ')}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setSelectedProductIds([])} className="btn-outline px-4 py-2 text-xs">Clear</button>
                <button onClick={() => openCollectionModal()} className="btn-primary px-4 py-2 text-xs">Write Collection Post</button>
              </div>
            </div>
          </div>
        )}

        {showAddModal && (
          <div className="fixed inset-0 bg-brand-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-sm shadow-xl p-8 animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
              <h2 className="font-serif text-2xl mb-6 text-brand-black">Add New Amazon Find</h2>
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-brand-black/60 mb-1 block">Product Name</label>
                  <input required value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} type="text" className="w-full border border-brand-blush p-3 text-sm focus:outline-none focus:border-brand-gold rounded-sm" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-brand-black/60 mb-1 block">Category</label>
                  <select required value={newProduct.categoryId} onChange={(e) => setNewProduct({...newProduct, categoryId: e.target.value})} className="w-full border border-brand-blush p-3 text-sm focus:outline-none focus:border-brand-gold rounded-sm bg-white">
                    <option value="">Select Category</option>
                    {categories.map((cat: any) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-brand-black/60 mb-1 block">Amazon Link</label>
                  <input value={newProduct.amazonLink} onChange={(e) => setNewProduct({...newProduct, amazonLink: e.target.value})} type="url" className="w-full border border-brand-blush p-3 text-sm focus:outline-none focus:border-brand-gold rounded-sm" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-brand-black/60 mb-1 block">Product Image URL</label>
                  <input value={newProduct.imageUrl} onChange={(e) => setNewProduct({...newProduct, imageUrl: e.target.value})} type="url" placeholder="https://..." className="w-full border border-brand-blush p-3 text-sm focus:outline-none focus:border-brand-gold rounded-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-widest text-brand-black/60 mb-1 block">Price</label>
                    <input value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} type="number" step="0.01" className="w-full border border-brand-blush p-3 text-sm focus:outline-none focus:border-brand-gold rounded-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-widest text-brand-black/60 mb-1 block">Source</label>
                    <input value={newProduct.source} onChange={(e) => setNewProduct({...newProduct, source: e.target.value})} type="text" className="w-full border border-brand-blush p-3 text-sm focus:outline-none focus:border-brand-gold rounded-sm" />
                  </div>
                </div>
                <label className="flex items-center gap-3 rounded-sm border border-brand-blush bg-brand-cream/30 p-3 text-xs font-bold uppercase tracking-widest text-brand-black/70">
                  <input type="checkbox" checked={newProduct.published} onChange={(e) => setNewProduct({...newProduct, published: e.target.checked})} className="h-4 w-4 accent-brand-gold" />
                  Publish immediately
                </label>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-grow btn-outline py-3">Cancel</button>
                  <button type="submit" className="flex-grow btn-primary py-3">Save Find</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showCollectionModal && (
          <div className="fixed inset-0 bg-brand-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-4xl rounded-sm shadow-xl p-8 animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.3em] text-brand-gold font-bold">Roundup Workflow</span>
                  <h2 className="font-serif text-3xl text-brand-black">Create Collection Blog Post</h2>
                  <p className="mt-2 text-sm text-brand-black/60">Select multiple products and publish one shoppable roundup-style affiliate post.</p>
                </div>
                <button onClick={() => setShowCollectionModal(false)} className="btn-outline px-4 py-2 text-xs">Close</button>
              </div>
              <form onSubmit={handleCreateCollectionPost} className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-4">
                  <input required value={collectionPost.title} onChange={(e) => setCollectionPost({...collectionPost, title: e.target.value})} placeholder="Blog title, e.g. Clean Girl Perfume Picks" className="w-full border border-brand-blush p-3 text-sm focus:outline-none focus:border-brand-gold rounded-sm" />
                  <input value={collectionPost.slug} onChange={(e) => setCollectionPost({...collectionPost, slug: e.target.value})} placeholder="Suggested slug (optional; AI can fill this)" className="w-full border border-brand-blush p-3 text-sm focus:outline-none focus:border-brand-gold rounded-sm" />
                  <select required value={collectionPost.categoryId} onChange={(e) => setCollectionPost({...collectionPost, categoryId: e.target.value})} className="w-full border border-brand-blush p-3 text-sm focus:outline-none focus:border-brand-gold rounded-sm bg-white">
                    <option value="">Select Category</option>
                    {categories.map((cat: any) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                  <textarea required value={collectionPost.intro} onChange={(e) => setCollectionPost({...collectionPost, intro: e.target.value})} placeholder="Intro paragraph" rows={4} className="w-full border border-brand-blush p-3 text-sm focus:outline-none focus:border-brand-gold rounded-sm" />
                  <textarea value={collectionPost.productSections} onChange={(e) => setCollectionPost({...collectionPost, productSections: e.target.value})} placeholder="Product blurbs/sections (AI can fill this; edit before saving)" rows={8} className="w-full border border-brand-blush p-3 text-sm focus:outline-none focus:border-brand-gold rounded-sm" />
                  <textarea required value={collectionPost.conclusion} onChange={(e) => setCollectionPost({...collectionPost, conclusion: e.target.value})} placeholder="Conclusion" rows={3} className="w-full border border-brand-blush p-3 text-sm focus:outline-none focus:border-brand-gold rounded-sm" />
                  <input value={collectionPost.excerpt} onChange={(e) => setCollectionPost({...collectionPost, excerpt: e.target.value})} placeholder="Excerpt (optional)" className="w-full border border-brand-blush p-3 text-sm focus:outline-none focus:border-brand-gold rounded-sm" />
                  <input value={collectionPost.featuredImage} onChange={(e) => setCollectionPost({...collectionPost, featuredImage: e.target.value})} placeholder="Featured image URL (optional)" className="w-full border border-brand-blush p-3 text-sm focus:outline-none focus:border-brand-gold rounded-sm" />
                  <div className="grid gap-4 md:grid-cols-2">
                    <input value={collectionPost.metaTitle} onChange={(e) => setCollectionPost({...collectionPost, metaTitle: e.target.value})} placeholder="SEO title (optional)" className="w-full border border-brand-blush p-3 text-sm focus:outline-none focus:border-brand-gold rounded-sm" />
                    <input value={collectionPost.metaDescription} onChange={(e) => setCollectionPost({...collectionPost, metaDescription: e.target.value})} placeholder="Meta description (optional)" className="w-full border border-brand-blush p-3 text-sm focus:outline-none focus:border-brand-gold rounded-sm" />
                  </div>
                  <textarea value={collectionPost.pinterestDescription} onChange={(e) => setCollectionPost({...collectionPost, pinterestDescription: e.target.value})} placeholder="Pinterest description (optional; for pin copy/reference)" rows={3} className="w-full border border-brand-blush p-3 text-sm focus:outline-none focus:border-brand-gold rounded-sm" />
                  <label className="flex items-center gap-3 rounded-sm border border-brand-blush bg-brand-cream/30 p-3 text-xs font-bold uppercase tracking-widest text-brand-black/70">
                    <input type="checkbox" checked={collectionPost.isPublished} onChange={(e) => setCollectionPost({...collectionPost, isPublished: e.target.checked})} className="h-4 w-4 accent-brand-gold" />
                    Manual publish only after review (unchecked saves draft)
                  </label>
                  <div className="grid gap-3 lg:grid-cols-3">
                    <button type="button" onClick={handleGenerateCollectionDraft} disabled={generatingCollectionDraft || selectedProductIds.length < 2 || !collectionPost.title || !collectionPost.categoryId} className="btn-outline w-full py-3 disabled:opacity-50">
                      {generatingCollectionDraft ? 'Generating...' : 'Generate Copy Only'}
                    </button>
                    <button type="button" onClick={handleGenerateAndOpenEditor} disabled={generatingCollectionDraft || selectedProductIds.length < 2 || !collectionPost.title || !collectionPost.categoryId} className="btn-primary w-full py-3 disabled:opacity-50">
                      {generatingCollectionDraft ? 'Generating...' : 'Generate + Edit'}
                    </button>
                    <button type="submit" disabled={savingBlogPost || selectedProductIds.length < 2} className="btn-outline w-full py-3 disabled:opacity-50">
                      {savingBlogPost ? 'Saving...' : 'Save Without Editor'}
                    </button>
                  </div>
                </div>
                <div className="rounded-sm border border-brand-blush bg-brand-cream/20 p-4">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-brand-black/50">Selected Products ({selectedProductIds.length})</p>
                  <div className="max-h-[520px] space-y-2 overflow-y-auto pr-2">
                    {allProducts.map((product: any) => (
                      <label key={product.id} className="flex items-start gap-3 rounded-sm border border-brand-blush bg-white p-3 text-sm text-brand-black">
                        <input type="checkbox" checked={selectedProductIds.includes(product.id)} onChange={() => toggleCollectionProduct(product)} className="mt-1 h-4 w-4 accent-brand-gold" />
                        <span>
                          <span className="block font-bold">{product.name}</span>
                          <span className="text-[10px] uppercase tracking-widest text-brand-black/40">{product.category?.name}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {showManualModal && (
          <div className="fixed inset-0 bg-brand-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-3xl rounded-sm shadow-xl p-8 animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.3em] text-brand-gold font-bold">Editorial Workflow</span>
                  <h2 className="font-serif text-3xl text-brand-black">Create Manual Post</h2>
                </div>
                <button onClick={() => setShowManualModal(false)} className="btn-outline px-4 py-2 text-xs">Close</button>
              </div>
              <form onSubmit={handleCreateManualPost} className="space-y-4">
                <input required value={manualPost.title} onChange={(e) => setManualPost({...manualPost, title: e.target.value})} placeholder="Title" className="w-full border border-brand-blush p-3 text-sm focus:outline-none focus:border-brand-gold rounded-sm" />
                <input value={manualPost.slug} onChange={(e) => setManualPost({...manualPost, slug: e.target.value})} placeholder="Slug (optional; auto-created from title if blank)" className="w-full border border-brand-blush p-3 text-sm focus:outline-none focus:border-brand-gold rounded-sm" />
                <select required value={manualPost.categoryId} onChange={(e) => setManualPost({...manualPost, categoryId: e.target.value})} className="w-full border border-brand-blush p-3 text-sm focus:outline-none focus:border-brand-gold rounded-sm bg-white">
                  <option value="">Select Category</option>
                  {categories.map((cat: any) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
                <input value={manualPost.featuredImage} onChange={(e) => setManualPost({...manualPost, featuredImage: e.target.value})} placeholder="Featured image URL" className="w-full border border-brand-blush p-3 text-sm focus:outline-none focus:border-brand-gold rounded-sm" />
                <textarea value={manualPost.excerpt} onChange={(e) => setManualPost({...manualPost, excerpt: e.target.value})} placeholder="Excerpt" rows={3} className="w-full border border-brand-blush p-3 text-sm focus:outline-none focus:border-brand-gold rounded-sm" />
                <textarea required value={manualPost.content} onChange={(e) => setManualPost({...manualPost, content: e.target.value})} placeholder="Content/body" rows={10} className="w-full border border-brand-blush p-3 text-sm focus:outline-none focus:border-brand-gold rounded-sm" />
                <div className="grid gap-4 md:grid-cols-2">
                  <input value={manualPost.metaTitle} onChange={(e) => setManualPost({...manualPost, metaTitle: e.target.value})} placeholder="Meta title" className="w-full border border-brand-blush p-3 text-sm focus:outline-none focus:border-brand-gold rounded-sm" />
                  <input value={manualPost.metaDescription} onChange={(e) => setManualPost({...manualPost, metaDescription: e.target.value})} placeholder="Meta description" className="w-full border border-brand-blush p-3 text-sm focus:outline-none focus:border-brand-gold rounded-sm" />
                </div>
                <label className="flex items-center gap-3 rounded-sm border border-brand-blush bg-brand-cream/30 p-3 text-xs font-bold uppercase tracking-widest text-brand-black/70">
                  <input type="checkbox" checked={manualPost.isPublished} onChange={(e) => setManualPost({...manualPost, isPublished: e.target.checked})} className="h-4 w-4 accent-brand-gold" />
                  Manual publish only after review (unchecked saves draft)
                </label>
                <button type="submit" disabled={savingBlogPost} className="btn-primary w-full py-3 disabled:opacity-50">{savingBlogPost ? 'Saving...' : 'Save Manual Post'}</button>
              </form>
            </div>
          </div>
        )}

        <div className="mb-12 rounded-[2rem] border border-brand-blush bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-gold">Magazine CMS</span>
              <h2 className="mt-2 font-serif text-3xl text-brand-black">Editable blog drafts</h2>
              <p className="mt-1 text-sm text-brand-black/60">Open any AI-generated draft in the luxury editor before publishing.</p>
            </div>
            <Link href="/blog" className="btn-outline inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs"><BookOpen size={14} /> View Blog</Link>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {dashboardData?.lists.recentBlogPosts?.map((post: any) => (
              <Link key={post.id} href={`/dashboard/blog/${post.id}/edit`} className="rounded-2xl border border-brand-blush bg-brand-cream/30 p-4 transition-colors hover:border-brand-gold hover:bg-brand-blush/30">
                <span className={`mb-3 inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${post.isPublished ? 'bg-green-100 text-green-700' : 'bg-brand-black text-brand-cream'}`}>{post.isPublished ? 'Published' : 'Draft'}</span>
                <h3 className="font-serif text-xl leading-tight text-brand-black">{post.title}</h3>
                <p className="mt-2 text-[10px] uppercase tracking-widest text-brand-black/45">{post.category?.name} • {post.products?.length || 0} products</p>
              </Link>
            ))}
            {!dashboardData?.lists.recentBlogPosts?.length && <p className="rounded-2xl bg-brand-cream/40 p-5 text-sm italic text-brand-black/40">No blog drafts yet. Use Generate + Edit to create the first editable article.</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-sm border border-brand-blush shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2 bg-brand-cream rounded-sm ${stat.color}`}>
                  <stat.icon size={20} />
                </div>
              </div>
              <p className="text-[10px] uppercase tracking-widest text-brand-black/40 font-bold">{stat.label}</p>
              <h3 className="text-3xl font-serif mt-1 text-brand-black">{stat.value}</h3>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-sm border border-brand-blush shadow-sm overflow-hidden">
              <div className="p-6 border-b border-brand-blush flex flex-col md:flex-row justify-between items-center gap-4">
                <h3 className="font-serif text-xl text-brand-black">Ready to Promote</h3>
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <div className="relative flex-grow">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-black/40" />
                    <input type="text" placeholder="Search products..." className="w-full pl-9 pr-4 py-2 text-xs border border-brand-blush rounded-sm focus:outline-none focus:border-brand-gold" />
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-brand-cream/50 text-[10px] uppercase tracking-widest font-bold text-brand-black/40 border-b border-brand-blush">
                      <th className="px-6 py-4">Product</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Content Status</th>
                      <th className="px-6 py-4">Public</th>
                      <th className="px-6 py-4">Date Added</th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-blush">
                    {dashboardData?.lists.readyToPromote.map((p: any, i: number) => (
                      <tr key={i} className="hover:bg-brand-cream/20 transition-colors text-sm">
                        <td className="px-6 py-4 font-bold text-brand-black">{p.name}</td>
                        <td className="px-6 py-4 text-xs opacity-60 text-brand-black">{p.category?.name}</td>
                        <td className="px-6 py-4"><span className="text-[10px] uppercase tracking-tighter px-2 py-1 rounded-full font-bold bg-green-100 text-green-700">{p.blogPostStatus}</span></td>
                        <td className="px-6 py-4"><button onClick={() => handlePublishToggle(p)} className={`text-[10px] uppercase tracking-tighter px-2 py-1 rounded-full font-bold ${p.published ? 'bg-blue-100 text-blue-700' : 'bg-brand-cream text-brand-black/50'}`}>{p.published ? 'Published' : 'Draft'}</button></td>
                        <td className="px-6 py-4 text-xs opacity-60 text-brand-black">{new Date(p.dateAdded).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-right"><ProductActions product={p} /></td>
                      </tr>
                    ))}
                    {dashboardData?.lists.readyToPromote.length === 0 && (
                      <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-brand-black/40 italic">No products ready to promote yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white p-6 rounded-sm border border-brand-blush shadow-sm">
              <div className="flex items-center gap-2 mb-6 text-brand-black">
                <AlertCircle size={18} className="text-amber-600" />
                <h3 className="font-serif text-xl">Needs Content</h3>
              </div>
              <div className="space-y-4">
                {dashboardData?.lists.needsContent.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-4 bg-brand-cream/30 border border-brand-blush rounded-sm group hover:border-brand-gold transition-colors">
                    <div className="flex items-center gap-4 text-brand-black">
                      <div>
                        <h4 className="text-sm font-bold">{p.name}</h4>
                        <p className="text-[10px] uppercase tracking-widest text-brand-black/40 font-bold mt-1">{p.category?.name} • {p.source || 'Viral Find'} • {p.published ? 'Published' : 'Draft'}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                      <button onClick={() => handlePublishToggle(p)} className="btn-outline py-2 px-4 text-[10px]">{p.published ? 'Unpublish' : 'Publish Product'}</button>
                      <ProductActions product={p} compact />
                    </div>
                  </div>
                ))}
                {dashboardData?.lists.needsContent.length === 0 && <p className="text-center text-sm text-brand-black/40 italic py-4">All caught up! No products need content.</p>}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-brand-black text-brand-cream p-8 rounded-sm shadow-lg">
              <div className="flex items-center gap-2 mb-6 text-brand-gold">
                <CheckSquare size={20} />
                <h3 className="font-serif text-2xl tracking-tighter">Weekly Checklist</h3>
              </div>
              <ul className="space-y-4">
                {automationData?.checklist.map((task: any, i: number) => (
                  <li key={i} className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-bold">
                      <span className={task.completed ? 'text-brand-gold' : 'opacity-80'}>{task.task}</span>
                      <span className="text-brand-gold">{task.current} / {task.target}</span>
                    </div>
                    <div className="h-1 bg-brand-cream/10 rounded-full overflow-hidden"><div className="h-full bg-brand-gold transition-all duration-1000" style={{ width: `${Math.min((task.current / task.target) * 100, 100)}%` }}></div></div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white p-6 rounded-sm border border-brand-blush shadow-sm text-brand-black">
              <div className="flex items-center gap-2 mb-4">
                <Calendar size={18} className="text-brand-gold" />
                <h3 className="font-serif text-lg">Next Week&rsquo;s Plan</h3>
              </div>
              <div className="space-y-3">
                {automationData?.calendar.slice(0, 3).map((day: any, i: number) => (
                  <div key={i} className="p-4 bg-brand-cream/30 border-l-2 border-brand-gold rounded-r-sm">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest mb-1">{day.day} • {day.date}</h4>
                    <p className="text-xs opacity-70">{day.suggestion}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {activeProduct && (
        <AIAssistant
          product={activeProduct}
          onClose={() => {
            setActiveProduct(null);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
