"use client";

import { useEffect, useState } from 'react';
import ProductImage from '@/components/ProductImage';

type Category = { id: string; name: string };
type Product = {
  id: string;
  name: string;
  description?: string | null;
  categoryId: string;
  category?: Category;
  imageUrl?: string | null;
  amazonLink?: string | null;
  affiliateLink?: string | null;
  published: boolean;
  dateAdded: string;
};

const emptyProduct = {
  id: '',
  name: '',
  description: '',
  categoryId: '',
  imageUrl: '',
  affiliateLink: '',
  published: true,
};

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState(emptyProduct);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadData() {
    setLoading(true);
    const [productRes, categoryRes] = await Promise.all([
      fetch('/api/products'),
      fetch('/api/categories-list'),
    ]);
    const [productJson, categoryJson] = await Promise.all([productRes.json(), categoryRes.json()]);
    if (productJson.success) setProducts(productJson.data);
    if (categoryJson.success) setCategories(categoryJson.data);
    setLoading(false);
  }

  useEffect(() => {
    loadData().catch(() => setLoading(false));
  }, []);

  function editProduct(product: Product) {
    setForm({
      id: product.id,
      name: product.name,
      description: product.description || '',
      categoryId: product.categoryId,
      imageUrl: product.imageUrl || '',
      affiliateLink: product.affiliateLink || product.amazonLink || '',
      published: product.published,
    });
  }

  async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const method = form.id ? 'PATCH' : 'POST';
    const body = form.id ? form : { ...form, amazonLink: form.affiliateLink };
    const res = await fetch('/api/products', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(false);
    if (!data.success) {
      alert(data.error || 'Unable to save product');
      return;
    }
    setForm(emptyProduct);
    await loadData();
  }

  async function updateProduct(id: string, patch: Partial<Product>) {
    const res = await fetch('/api/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...patch }),
    });
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

  return (
    <div className="min-h-screen bg-brand-cream/40">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-gold">Admin</span>
          <h1 className="mt-2 text-4xl font-serif text-brand-black">Product Dashboard</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-brand-black/60">
            Add, edit, publish, unpublish, and delete curated affiliate products. Store product links here; Amazon Associates tags can be swapped globally with NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG. Do not enter prices unless they come from an approved API.
          </p>
        </div>

        <form onSubmit={saveProduct} className="mb-10 grid gap-4 rounded-sm border border-brand-blush bg-white p-6 shadow-sm lg:grid-cols-2">
          <div className="lg:col-span-2 flex items-center justify-between gap-4">
            <h2 className="font-serif text-2xl text-brand-black">{form.id ? 'Edit Product' : 'Add Product'}</h2>
            {form.id && <button type="button" onClick={() => setForm(emptyProduct)} className="btn-outline px-4 py-2 text-xs">Cancel Edit</button>}
          </div>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Product title" className="border border-brand-blush p-3 text-sm" />
          <select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="border border-brand-blush bg-white p-3 text-sm">
            <option value="">Choose category</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
          <input required value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="Image URL" type="url" className="border border-brand-blush p-3 text-sm" />
          <input required value={form.affiliateLink} onChange={(e) => setForm({ ...form, affiliateLink: e.target.value })} placeholder="Amazon product URL or affiliate URL" type="url" className="border border-brand-blush p-3 text-sm" />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short product description" rows={3} className="border border-brand-blush p-3 text-sm lg:col-span-2" />
          <label className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-brand-black/70">
            <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="h-4 w-4 accent-brand-gold" />
            Published
          </label>
          <button disabled={saving} className="btn-primary py-3 disabled:opacity-50">{saving ? 'Saving...' : 'Save Product'}</button>
        </form>

        <div className="rounded-sm border border-brand-blush bg-white shadow-sm">
          <div className="border-b border-brand-blush p-6">
            <h2 className="font-serif text-2xl text-brand-black">Products</h2>
          </div>
          {loading ? <p className="p-6 text-sm text-brand-black/50">Loading products...</p> : (
            <div className="divide-y divide-brand-blush">
              {products.map((product) => (
                <div key={product.id} className="grid gap-4 p-5 md:grid-cols-[96px_1fr_auto] md:items-center">
                  <div className="h-24 w-24 overflow-hidden rounded-sm bg-brand-cream">
                    <ProductImage src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-serif text-xl text-brand-black">{product.name}</h3>
                      <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${product.published ? 'bg-green-100 text-green-700' : 'bg-brand-cream text-brand-black/50'}`}>{product.published ? 'Published' : 'Unpublished'}</span>
                    </div>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-brand-gold">{product.category?.name}</p>
                    <p className="mt-2 max-w-2xl text-sm text-brand-black/65">{product.description || 'No description yet.'}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 md:justify-end">
                    <button onClick={() => editProduct(product)} className="btn-outline px-4 py-2 text-xs">Edit</button>
                    <button onClick={() => updateProduct(product.id, { published: !product.published })} className="btn-outline px-4 py-2 text-xs">{product.published ? 'Unpublish' : 'Publish'}</button>
                    <button onClick={() => deleteProduct(product.id)} className="btn-primary px-4 py-2 text-xs">Delete</button>
                  </div>
                </div>
              ))}
              {products.length === 0 && <p className="p-6 text-sm text-brand-black/50">No products yet.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
