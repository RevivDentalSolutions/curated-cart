/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from 'react';
import { 
  Plus, Search, TrendingUp, FileText, 
  DollarSign, Calendar, CheckSquare,
  Clock, AlertCircle, Loader2
} from 'lucide-react';
import AIAssistant from '@/components/AIAssistant';

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [automationData, setAutomationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeProduct, setActiveProduct] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [newProduct, setNewProduct] = useState({
    name: '',
    categoryId: '',
    amazonLink: '',
    imageUrl: '',
    price: '',
    source: '',
    published: true,
  });

  const fetchData = async () => {
    try {
      const [dashRes, autoRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/automations'),
      ]);
      
      const dashJson = await dashRes.json();
      const autoJson = await autoRes.json();
      
      if (dashJson.success) setDashboardData(dashJson.data);
      if (autoJson.success) setAutomationData(autoJson.data);
      
      // Fetch categories from prisma directly in a small API
      const catResponse = await fetch('/api/categories-list');
      const catJson = await catResponse.json();
      if (catJson.success) setCategories(catJson.data);

    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  return (
    <div className="bg-brand-cream/50 min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
          <div>
            <h1 className="text-4xl font-serif mb-2 text-brand-black">Viral Product Tracker</h1>
            <p className="text-sm text-brand-black/60 uppercase tracking-widest">Manage your finds & content strategy</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} /> Add New Find
          </button>
        </div>

        {showAddModal && (
          <div className="fixed inset-0 bg-brand-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-sm shadow-xl p-8 animate-in fade-in zoom-in duration-300">
              <h2 className="font-serif text-2xl mb-6 text-brand-black">Add New Amazon Find</h2>
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-brand-black/60 mb-1 block">Product Name</label>
                  <input 
                    required
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    type="text" 
                    className="w-full border border-brand-blush p-3 text-sm focus:outline-none focus:border-brand-gold rounded-sm" 
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-brand-black/60 mb-1 block">Category</label>
                  <select 
                    required
                    value={newProduct.categoryId}
                    onChange={(e) => setNewProduct({...newProduct, categoryId: e.target.value})}
                    className="w-full border border-brand-blush p-3 text-sm focus:outline-none focus:border-brand-gold rounded-sm bg-white"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat: any) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-brand-black/60 mb-1 block">Amazon Link</label>
                  <input 
                    value={newProduct.amazonLink}
                    onChange={(e) => setNewProduct({...newProduct, amazonLink: e.target.value})}
                    type="url" 
                    className="w-full border border-brand-blush p-3 text-sm focus:outline-none focus:border-brand-gold rounded-sm" 
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-brand-black/60 mb-1 block">Product Image URL</label>
                  <input
                    value={newProduct.imageUrl}
                    onChange={(e) => setNewProduct({...newProduct, imageUrl: e.target.value})}
                    type="url"
                    placeholder="https://..."
                    className="w-full border border-brand-blush p-3 text-sm focus:outline-none focus:border-brand-gold rounded-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-widest text-brand-black/60 mb-1 block">Price</label>
                    <input 
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                      type="number" step="0.01"
                      className="w-full border border-brand-blush p-3 text-sm focus:outline-none focus:border-brand-gold rounded-sm" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-widest text-brand-black/60 mb-1 block">Source</label>
                    <input 
                      value={newProduct.source}
                      onChange={(e) => setNewProduct({...newProduct, source: e.target.value})}
                      placeholder="TikTok, IG, etc."
                      type="text" 
                      className="w-full border border-brand-blush p-3 text-sm focus:outline-none focus:border-brand-gold rounded-sm" 
                    />
                  </div>
                </div>
                <label className="flex items-center gap-3 rounded-sm border border-brand-blush bg-brand-cream/30 p-3 text-xs font-bold uppercase tracking-widest text-brand-black/70">
                  <input
                    type="checkbox"
                    checked={newProduct.published}
                    onChange={(e) => setNewProduct({...newProduct, published: e.target.checked})}
                    className="h-4 w-4 accent-brand-gold"
                  />
                  Publish immediately
                </label>
                <div className="flex gap-4 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setShowAddModal(false)}
                    className="flex-grow btn-outline py-3"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-grow btn-primary py-3"
                  >
                    Save Find
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Stats Grid */}
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
          {/* Main Tracker Table */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-sm border border-brand-blush shadow-sm overflow-hidden">
              <div className="p-6 border-b border-brand-blush flex flex-col md:flex-row justify-between items-center gap-4">
                <h3 className="font-serif text-xl text-brand-black">Ready to Promote</h3>
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <div className="relative flex-grow">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-black/40" />
                    <input 
                      type="text" 
                      placeholder="Search products..." 
                      className="w-full pl-9 pr-4 py-2 text-xs border border-brand-blush rounded-sm focus:outline-none focus:border-brand-gold"
                    />
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
                        <td className="px-6 py-4">
                          <span className="text-[10px] uppercase tracking-tighter px-2 py-1 rounded-full font-bold bg-green-100 text-green-700">
                            {p.blogPostStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handlePublishToggle(p)}
                            className={`text-[10px] uppercase tracking-tighter px-2 py-1 rounded-full font-bold ${p.published ? 'bg-blue-100 text-blue-700' : 'bg-brand-cream text-brand-black/50'}`}
                          >
                            {p.published ? 'Published' : 'Draft'}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-xs opacity-60 text-brand-black">{new Date(p.dateAdded).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => setActiveProduct(p)}
                            className="text-brand-gold hover:text-brand-black transition-colors"
                          >
                            <FileText size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {dashboardData?.lists.readyToPromote.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-sm text-brand-black/40 italic">
                          No products ready to promote yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Needs Content Section */}
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
                        <p className="text-[10px] uppercase tracking-widest text-brand-black/40 font-bold mt-1">
                          {p.category?.name} • {p.source || 'Viral Find'} • {p.published ? 'Published' : 'Draft'}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        onClick={() => handlePublishToggle(p)}
                        className="btn-outline py-2 px-4 text-[10px]"
                      >
                        {p.published ? 'Unpublish' : 'Publish Product'}
                      </button>
                      <button 
                        onClick={() => setActiveProduct(p)}
                        className="btn-outline py-2 px-4 text-[10px]"
                      >
                        Generate Content
                      </button>
                    </div>
                  </div>
                ))}
                {dashboardData?.lists.needsContent.length === 0 && (
                  <p className="text-center text-sm text-brand-black/40 italic py-4">All caught up! No products need content.</p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar / Checklist */}
          <div className="space-y-8">
            {/* Weekly Checklist */}
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
                    <div className="h-1 bg-brand-cream/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-brand-gold transition-all duration-1000" 
                        style={{ width: `${Math.min((task.current / task.target) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Content Calendar Suggestion */}
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
            // Refresh data
            window.location.reload();
          }} 
        />
      )}
    </div>
  );
}
