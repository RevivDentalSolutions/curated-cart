"use client";

import { useEffect, useMemo, useState } from 'react';

type Category = { id: string; name: string };
type Product = any;
type BlogPost = any;

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [message, setMessage] = useState('');

  const load = async () => {
    const [p, b, c] = await Promise.all([fetch('/api/products'), fetch('/api/blog-posts'), fetch('/api/categories-list')]);
    setProducts((await p.json()).data || []);
    setPosts((await b.json()).data || []);
    setCategories((await c.json()).data || []);
  };

  useEffect(() => { load(); }, []);

  const toggleSelect = (id: string) => setSelected((prev) => prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]);
  const save = async (text = 'Saved successfully') => { setMessage(text); await load(); setTimeout(() => setMessage(''), 2500); };

  const bulkAction = async (action: string, editorialStatus?: string) => {
    await fetch('/api/products', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: selected, action, data: { editorialStatus } }) });
    setSelected([]); await save('Bulk update applied');
  };

  const orderedProducts = useMemo(() => editingPost?.products?.map((p: any) => p.id) || [], [editingPost]);

  return <div className="container mx-auto px-4 py-10 space-y-8">
    <h1 className="text-3xl font-serif">Admin Dashboard</h1>
    {message && <div className="bg-green-100 border border-green-300 px-4 py-2 text-sm">{message}</div>}

    <section className="space-y-3">
      <h2 className="font-serif text-2xl">Products</h2>
      <div className="flex gap-2 flex-wrap">
        <button className="btn-outline" onClick={() => bulkAction('publish')}>Bulk Publish</button>
        <button className="btn-outline" onClick={() => bulkAction('unpublish')}>Bulk Unpublish</button>
        <button className="btn-outline" onClick={() => bulkAction('archive')}>Bulk Archive</button>
        <button className="btn-outline" onClick={() => bulkAction('editorialStatus', 'Ready to Promote')}>Set Editorial: Ready to Promote</button>
      </div>
      <div className="space-y-2">
        {products.map((product) => <div key={product.id} className="border p-3 flex items-center justify-between gap-3">
          <label className="flex items-center gap-2"><input type="checkbox" checked={selected.includes(product.id)} onChange={() => toggleSelect(product.id)} />{product.name}</label>
          <div className="flex gap-2">
            <button className="btn-outline" onClick={async () => { await fetch('/api/products', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: product.id, data: { isPublished: false } }) }); await save('Product unpublished'); }}>Unpublish</button>
            <button className="btn-outline" onClick={async () => { await fetch('/api/products', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: product.id, data: { isPublished: true } }) }); await save('Product republished'); }}>Republish</button>
            <button className="btn-outline" onClick={async () => { await fetch('/api/products', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: product.id, data: { isArchived: !product.isArchived } }) }); await save('Archive status updated'); }}>{product.isArchived ? 'Unarchive' : 'Archive'}</button>
            <button className="btn-primary" onClick={() => setEditingProduct(product)}>Edit</button>
          </div>
        </div>)}
      </div>
    </section>

    <section className="space-y-3">
      <h2 className="font-serif text-2xl">Blog drafts/admin</h2>
      {posts.map((post) => <div key={post.id} className="border p-3 flex items-center justify-between"><div>{post.title}</div><button className="btn-primary" onClick={() => setEditingPost(post)}>Edit Draft</button></div>)}
    </section>

    {editingProduct && <div className="fixed inset-0 bg-black/50 p-4 overflow-auto"><div className="bg-white max-w-2xl mx-auto p-6 space-y-3">
      <h3 className="text-xl font-serif">Edit Product</h3>
      {['name','slug','description','affiliateLink','image'].map((key) => <input key={key} className="w-full border p-2" placeholder={key} value={editingProduct[key] || ''} onChange={(e)=>setEditingProduct({...editingProduct,[key]:e.target.value})} />)}
      <select className="w-full border p-2" value={editingProduct.categoryId} onChange={(e)=>setEditingProduct({...editingProduct,categoryId:e.target.value})}>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
      <div className="grid grid-cols-3 gap-2">
        <label><input type="checkbox" checked={!!editingProduct.isPublished} onChange={(e)=>setEditingProduct({...editingProduct,isPublished:e.target.checked})}/> Published</label>
        <label><input type="checkbox" checked={!!editingProduct.isFeatured} onChange={(e)=>setEditingProduct({...editingProduct,isFeatured:e.target.checked})}/> Featured</label>
        <label><input type="checkbox" checked={!!editingProduct.isArchived} onChange={(e)=>setEditingProduct({...editingProduct,isArchived:e.target.checked})}/> Archived</label>
      </div>
      <input className="w-full border p-2" placeholder="Editorial status" value={editingProduct.editorialStatus || ''} onChange={(e)=>setEditingProduct({...editingProduct,editorialStatus:e.target.value})} />
      <div className="flex gap-2"><button className="btn-outline" onClick={()=>setEditingProduct(null)}>Cancel</button><button className="btn-primary" onClick={async()=>{await fetch('/api/products',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:editingProduct.id,data:editingProduct})});setEditingProduct(null);await save('Product updated successfully');}}>Save</button></div>
    </div></div>}

    {editingPost && <div className="fixed inset-0 bg-black/50 p-4 overflow-auto"><div className="bg-white max-w-3xl mx-auto p-6 space-y-3">
      <h3 className="text-xl font-serif">Edit Blog Draft</h3>
      {['title','slug','metaTitle','metaDescription','featuredImage'].map((key) => <input key={key} className="w-full border p-2" placeholder={key} value={editingPost[key] || ''} onChange={(e)=>setEditingPost({...editingPost,[key]:e.target.value})} />)}
      <textarea className="w-full border p-2 min-h-40" placeholder="intro/body/content blocks" value={editingPost.content || ''} onChange={(e)=>setEditingPost({...editingPost,content:e.target.value})} />
      <select className="w-full border p-2" value={editingPost.categoryId} onChange={(e)=>setEditingPost({...editingPost,categoryId:e.target.value})}>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
      <label><input type="checkbox" checked={!!editingPost.isPublished} onChange={(e)=>setEditingPost({...editingPost,isPublished:e.target.checked})}/> Published</label>
      <div><div className="font-semibold">Connected products (reorder)</div>{editingPost.products?.map((p:any,idx:number)=><div key={p.id} className="flex items-center gap-2 py-1"><span>{p.name}</span><button className="btn-outline" onClick={()=>{if(idx===0)return;const arr=[...editingPost.products];[arr[idx-1],arr[idx]]=[arr[idx],arr[idx-1]];setEditingPost({...editingPost,products:arr});}}>↑</button><button className="btn-outline" onClick={()=>{if(idx===editingPost.products.length-1)return;const arr=[...editingPost.products];[arr[idx],arr[idx+1]]=[arr[idx+1],arr[idx]];setEditingPost({...editingPost,products:arr});}}>↓</button></div>)}</div>
      <div className="flex gap-2"><button className="btn-outline" onClick={()=>setEditingPost(null)}>Cancel</button><button className="btn-primary" onClick={async()=>{await fetch('/api/blog-posts',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:editingPost.id,data:{...editingPost,productIds:orderedProducts}})});setEditingPost(null);await save('Blog draft updated successfully');}}>Save changes</button></div>
    </div></div>}
  </div>;
}
