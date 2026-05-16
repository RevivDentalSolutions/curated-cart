'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Bold,
  Copy,
  GripVertical,
  Heading2,
  ImagePlus,
  Italic,
  List,
  Loader2,
  Monitor,
  Quote,
  Save,
  Smartphone,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import ProductImage from '@/components/ProductImage';
import {
  BlogEditorSection,
  BlogImageAsset,
  DEFAULT_AFFILIATE_DISCLOSURE,
  makeSectionId,
} from '@/lib/blog-editor';

type CategoryOption = { id: string; name: string };
type ProductOption = { id: string; name: string; imageUrl?: string | null; amazonLink?: string | null; affiliateLink?: string | null };
type EditablePost = {
  id: string;
  title: string;
  subtitle?: string | null;
  slug: string;
  categoryId: string;
  authorName?: string | null;
  affiliateDisclosure?: string | null;
  ctaText?: string | null;
  labelFavoritePick?: string | null;
  labelVanityTray?: string | null;
  labelWorthIt?: string | null;
  excerpt?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  featuredImage?: string | null;
  content?: string | null;
  isPublished: boolean;
  scheduledAt?: string | null;
  editorSections: BlogEditorSection[];
  imageLibrary: BlogImageAsset[];
  products: ProductOption[];
};

const sectionTypes: Array<{ type: BlogEditorSection['type']; label: string; description: string }> = [
  { type: 'hero', label: 'Hero section', description: 'Opening image, subtitle, and editorial intro.' },
  { type: 'text', label: 'Editorial text', description: 'Flexible rich text section for story copy.' },
  { type: 'productSpotlight', label: 'Product spotlight', description: 'Premium single-product editor pick.' },
  { type: 'quote', label: 'Quote block', description: 'Magazine pull quote or emotional callout.' },
  { type: 'collage', label: 'Floating collage', description: 'Pinterest-style layered image group.' },
  { type: 'productGrid', label: 'Side-by-side products', description: 'Two or more products in a shoppable edit.' },
  { type: 'pinterestCallout', label: 'Pinterest callout', description: 'Save/share prompt for the post.' },
  { type: 'verdict', label: 'Final verdict', description: 'Closing recommendation or worth-it note.' },
];

function blankSection(type: BlogEditorSection['type'], label?: string): BlogEditorSection {
  return {
    id: makeSectionId(type),
    type,
    label: label || sectionTypes.find((item) => item.type === type)?.label || 'Section',
    eyebrow: type === 'productSpotlight' ? 'Favorite Pick' : type === 'collage' ? 'The Vanity Tray' : '',
    heading: type === 'quote' ? '' : 'New editorial section',
    body: type === 'quote' ? '' : '<p>Add polished editorial copy here.</p>',
    quote: type === 'quote' ? 'Add a refined pull quote here.' : '',
    imageUrls: [],
    productIds: [],
    layout: type === 'productSpotlight' ? 'image-left' : type === 'productGrid' ? 'two-column' : 'editorial',
  };
}

function RichTextEditor({ value, onChange }: { value?: string; onChange: (value: string) => void }) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== (value || '')) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const runCommand = (command: string, commandValue?: string) => {
    document.execCommand(command, false, commandValue);
    onChange(editorRef.current?.innerHTML || '');
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-brand-blush bg-white shadow-sm">
      <div className="flex flex-wrap gap-2 border-b border-brand-blush bg-brand-cream/50 p-2">
        <button type="button" onClick={() => runCommand('formatBlock', 'h2')} className="rounded-full px-3 py-2 text-xs uppercase tracking-widest hover:bg-white"><Heading2 size={14} /></button>
        <button type="button" onClick={() => runCommand('bold')} className="rounded-full px-3 py-2 text-xs uppercase tracking-widest hover:bg-white"><Bold size={14} /></button>
        <button type="button" onClick={() => runCommand('italic')} className="rounded-full px-3 py-2 text-xs uppercase tracking-widest hover:bg-white"><Italic size={14} /></button>
        <button type="button" onClick={() => runCommand('formatBlock', 'blockquote')} className="rounded-full px-3 py-2 text-xs uppercase tracking-widest hover:bg-white"><Quote size={14} /></button>
        <button type="button" onClick={() => runCommand('insertUnorderedList')} className="rounded-full px-3 py-2 text-xs uppercase tracking-widest hover:bg-white"><List size={14} /></button>
        <button type="button" onClick={() => runCommand('insertParagraph')} className="rounded-full px-3 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-white">Space</button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={() => onChange(editorRef.current?.innerHTML || '')}
        className="min-h-36 bg-white px-5 py-4 text-sm leading-7 text-brand-black/75 outline-none prose prose-brand max-w-none"
      />
    </div>
  );
}

function PreviewSection({ section, products, ctaText }: { section: BlogEditorSection; products: ProductOption[]; ctaText: string }) {
  const sectionProducts = products.filter((product) => section.productIds?.includes(product.id));
  const imageUrls = section.imageUrls || [];

  if (section.type === 'quote') {
    return (
      <div className="rounded-[2rem] bg-brand-blush/60 p-8 text-center shadow-sm">
        <Sparkles className="mx-auto mb-4 text-brand-gold" size={18} />
        <p className="font-serif text-3xl leading-tight text-brand-black">&ldquo;{section.quote}&rdquo;</p>
      </div>
    );
  }

  if (section.type === 'collage') {
    return (
      <div className="rounded-[2rem] bg-brand-cream p-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-gold">{section.eyebrow || section.label}</p>
        <h3 className="mt-3 font-serif text-4xl leading-none text-brand-black">{section.heading}</h3>
        <div className="mt-6 grid grid-cols-2 gap-4">
          {imageUrls.map((url, index) => (
            <ProductImage key={`${url}-${index}`} src={url} alt={section.heading || section.label} className={`w-full rounded-[1.5rem] object-cover shadow-sm ${index === 0 ? 'col-span-2 aspect-[16/10]' : 'aspect-[4/5]'}`} />
          ))}
        </div>
        <div className="mt-5 text-sm leading-7 text-brand-black/65" dangerouslySetInnerHTML={{ __html: section.body || '' }} />
      </div>
    );
  }

  if (section.type === 'productGrid') {
    return (
      <div className="rounded-[2rem] bg-white/80 p-6 shadow-sm ring-1 ring-brand-blush">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-gold">{section.eyebrow || section.label}</p>
        <h3 className="mt-3 font-serif text-4xl leading-none text-brand-black">{section.heading}</h3>
        <div className="mt-7 grid gap-5 md:grid-cols-2">
          {sectionProducts.map((product) => (
            <article key={product.id} className="rounded-[1.5rem] bg-brand-cream/70 p-4">
              <ProductImage src={imageUrls[sectionProducts.indexOf(product)] || product.imageUrl} alt={product.name} className="aspect-[4/5] w-full rounded-[1.25rem] object-cover" />
              <h4 className="mt-4 font-serif text-2xl text-brand-black">{product.name}</h4>
              <span className="mt-3 inline-flex text-[10px] font-bold uppercase tracking-widest text-brand-black">{ctaText}</span>
            </article>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[2rem] bg-white/80 p-6 shadow-sm ring-1 ring-brand-blush">
      <div className="grid gap-6 md:grid-cols-2 md:items-center">
        {imageUrls[0] && <ProductImage src={imageUrls[0]} alt={section.heading || section.label} className="aspect-[4/5] w-full rounded-[1.5rem] object-cover shadow-md" />}
        <div className={!imageUrls[0] ? 'md:col-span-2' : ''}>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-gold">{section.eyebrow || section.label}</p>
          <h3 className="mt-3 font-serif text-4xl leading-none text-brand-black">{section.heading}</h3>
          <div className="mt-5 text-sm leading-7 text-brand-black/65" dangerouslySetInnerHTML={{ __html: section.body || '' }} />
          {sectionProducts[0] && <p className="mt-5 text-[10px] font-bold uppercase tracking-widest text-brand-black">{ctaText}: {sectionProducts[0].name}</p>}
        </div>
      </div>
    </div>
  );
}

export default function BlogPostEditor({ initialPost, categories }: { initialPost: EditablePost; categories: CategoryOption[] }) {
  const [post, setPost] = useState<EditablePost>({
    ...initialPost,
    affiliateDisclosure: initialPost.affiliateDisclosure || DEFAULT_AFFILIATE_DISCLOSURE,
    authorName: initialPost.authorName || 'Jessica',
    ctaText: initialPost.ctaText || 'Shop the Find',
    labelFavoritePick: initialPost.labelFavoritePick || 'Favorite Pick',
    labelVanityTray: initialPost.labelVanityTray || 'The Vanity Tray',
    labelWorthIt: initialPost.labelWorthIt || 'Worth It?',
    editorSections: initialPost.editorSections?.length ? initialPost.editorSections : [blankSection('text', 'Editorial text')],
    imageLibrary: initialPost.imageLibrary || [],
  });
  const [activeSectionId, setActiveSectionId] = useState(post.editorSections[0]?.id || '');
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);

  const activeSection = useMemo(
    () => post.editorSections.find((section) => section.id === activeSectionId) || post.editorSections[0],
    [activeSectionId, post.editorSections]
  );

  const updatePost = (updates: Partial<EditablePost>) => setPost((current) => ({ ...current, ...updates }));
  const updateSection = (sectionId: string, updates: Partial<BlogEditorSection>) => {
    setPost((current) => ({
      ...current,
      editorSections: current.editorSections.map((section) => section.id === sectionId ? { ...section, ...updates } : section),
    }));
  };

  const addSection = (type: BlogEditorSection['type']) => {
    const nextSection = blankSection(type);
    setPost((current) => ({ ...current, editorSections: [...current.editorSections, nextSection] }));
    setActiveSectionId(nextSection.id);
  };

  const duplicateSection = (section: BlogEditorSection) => {
    const copySection = { ...section, id: makeSectionId('copy'), label: `${section.label} copy` };
    setPost((current) => ({ ...current, editorSections: [...current.editorSections, copySection] }));
    setActiveSectionId(copySection.id);
  };

  const deleteSection = (sectionId: string) => {
    setPost((current) => {
      const nextSections = current.editorSections.filter((section) => section.id !== sectionId);
      setActiveSectionId(nextSections[0]?.id || '');
      return { ...current, editorSections: nextSections.length ? nextSections : [blankSection('text')] };
    });
  };

  const moveSection = (fromId: string, toId: string) => {
    setPost((current) => {
      const fromIndex = current.editorSections.findIndex((section) => section.id === fromId);
      const toIndex = current.editorSections.findIndex((section) => section.id === toId);
      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return current;
      const nextSections = [...current.editorSections];
      const [moved] = nextSections.splice(fromIndex, 1);
      nextSections.splice(toIndex, 0, moved);
      return { ...current, editorSections: nextSections };
    });
  };

  const addImageUrl = (url: string) => {
    if (!url.trim()) return;
    const asset: BlogImageAsset = { id: makeSectionId('image'), url: url.trim(), role: post.featuredImage ? 'inline' : 'featured', objectPosition: 'center' };
    setPost((current) => ({
      ...current,
      featuredImage: current.featuredImage || asset.url,
      imageLibrary: [...current.imageLibrary, asset],
    }));
  };

  const updateImageAsset = (assetId: string, updates: Partial<BlogImageAsset>) => {
    setPost((current) => ({
      ...current,
      imageLibrary: current.imageLibrary.map((asset) => asset.id === assetId ? { ...asset, ...updates } : asset),
    }));
  };

  const handleUpload = async (file?: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        addImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const savePost = async (publish = false) => {
    setSaving(true);
    setStatusMessage('');
    try {
      const res = await fetch(`/api/blog-posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...post, publish, isPublished: publish ? true : post.isPublished }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Save failed');
      setPost((current) => ({ ...current, isPublished: data.data.isPublished, slug: data.data.slug }));
      setStatusMessage(publish ? 'Published. Your public post has been updated.' : 'Draft saved.');
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Unable to save this draft.');
    } finally {
      setSaving(false);
    }
  };

  const activeImageUrl = activeSection?.imageUrls?.[0] || '';

  return (
    <div className="min-h-screen bg-brand-cream/60 text-brand-black">
      <div className="border-b border-brand-blush bg-white/85 backdrop-blur">
        <div className="container mx-auto flex flex-col gap-4 px-4 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link href="/dashboard" className="mb-2 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-brand-black/50 hover:text-brand-gold"><ArrowLeft size={13} /> Dashboard</Link>
            <h1 className="font-serif text-4xl leading-none">Magazine Draft Editor</h1>
            <p className="mt-2 text-sm text-brand-black/55">AI created the foundation. Refine every field, image, section, and publishing decision manually.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => savePost(false)} disabled={saving} className="btn-outline inline-flex items-center gap-2 rounded-full px-5 py-3 disabled:opacity-50"><Save size={14} /> Save Draft</button>
            <button onClick={() => savePost(true)} disabled={saving} className="btn-primary inline-flex items-center gap-2 rounded-full px-5 py-3 disabled:opacity-50">{saving ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />} Publish</button>
          </div>
        </div>
      </div>

      {statusMessage && <div className="container mx-auto px-4 pt-4"><div className="rounded-2xl border border-brand-blush bg-white px-4 py-3 text-sm text-brand-black/70 shadow-sm">{statusMessage}</div></div>}

      <div className="container mx-auto grid gap-6 px-4 py-8 xl:grid-cols-[280px_minmax(0,1fr)_420px]">
        <aside className="space-y-4">
          <div className="rounded-[2rem] border border-brand-blush bg-white p-4 shadow-sm">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-gold">Sections</p>
            <div className="space-y-2">
              {post.editorSections.map((section) => (
                <button
                  key={section.id}
                  draggable
                  onDragStart={() => setDraggedSectionId(section.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    if (draggedSectionId) moveSection(draggedSectionId, section.id);
                    setDraggedSectionId(null);
                  }}
                  onClick={() => setActiveSectionId(section.id)}
                  className={`flex w-full items-center gap-2 rounded-2xl border p-3 text-left text-xs transition-colors ${activeSectionId === section.id ? 'border-brand-gold bg-brand-blush/40' : 'border-brand-blush bg-brand-cream/30 hover:border-brand-gold'}`}
                >
                  <GripVertical size={14} className="text-brand-black/30" />
                  <span className="min-w-0 flex-1"><span className="block truncate font-bold">{section.label}</span><span className="block truncate text-brand-black/45">{section.type}</span></span>
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-[2rem] border border-brand-blush bg-white p-4 shadow-sm">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-gold">Add module</p>
            <div className="space-y-2">
              {sectionTypes.map((item) => (
                <button key={item.type} type="button" onClick={() => addSection(item.type)} className="w-full rounded-2xl border border-brand-blush bg-brand-cream/30 p-3 text-left hover:border-brand-gold">
                  <span className="block text-xs font-bold">{item.label}</span>
                  <span className="text-[11px] leading-5 text-brand-black/50">{item.description}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="space-y-6">
          <section className="rounded-[2rem] border border-brand-blush bg-white p-5 shadow-sm md:p-7">
            <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-gold">Editable blog fields</p>
            <div className="grid gap-4 md:grid-cols-2">
              <input value={post.title} onChange={(e) => updatePost({ title: e.target.value })} className="rounded-2xl border border-brand-blush p-3 text-sm outline-none focus:border-brand-gold md:col-span-2" placeholder="Blog title" />
              <input value={post.subtitle || ''} onChange={(e) => updatePost({ subtitle: e.target.value })} className="rounded-2xl border border-brand-blush p-3 text-sm outline-none focus:border-brand-gold md:col-span-2" placeholder="Subtitle" />
              <input value={post.slug} onChange={(e) => updatePost({ slug: e.target.value })} className="rounded-2xl border border-brand-blush p-3 text-sm outline-none focus:border-brand-gold" placeholder="Slug" />
              <select value={post.categoryId} onChange={(e) => updatePost({ categoryId: e.target.value })} className="rounded-2xl border border-brand-blush bg-white p-3 text-sm outline-none focus:border-brand-gold">
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
              <input value={post.authorName || ''} onChange={(e) => updatePost({ authorName: e.target.value })} className="rounded-2xl border border-brand-blush p-3 text-sm outline-none focus:border-brand-gold" placeholder="Author name" />
              <input value={post.ctaText || ''} onChange={(e) => updatePost({ ctaText: e.target.value })} className="rounded-2xl border border-brand-blush p-3 text-sm outline-none focus:border-brand-gold" placeholder="CTA text" />
              <input value={post.labelFavoritePick || ''} onChange={(e) => updatePost({ labelFavoritePick: e.target.value })} className="rounded-2xl border border-brand-blush p-3 text-sm outline-none focus:border-brand-gold" placeholder="Favorite Pick label" />
              <input value={post.labelVanityTray || ''} onChange={(e) => updatePost({ labelVanityTray: e.target.value })} className="rounded-2xl border border-brand-blush p-3 text-sm outline-none focus:border-brand-gold" placeholder="The Vanity Tray label" />
              <input value={post.labelWorthIt || ''} onChange={(e) => updatePost({ labelWorthIt: e.target.value })} className="rounded-2xl border border-brand-blush p-3 text-sm outline-none focus:border-brand-gold" placeholder="Worth It label" />
              <input value={post.featuredImage || ''} onChange={(e) => updatePost({ featuredImage: e.target.value })} className="rounded-2xl border border-brand-blush p-3 text-sm outline-none focus:border-brand-gold" placeholder="Featured image URL" />
              <textarea value={post.excerpt || ''} onChange={(e) => updatePost({ excerpt: e.target.value })} className="rounded-2xl border border-brand-blush p-3 text-sm outline-none focus:border-brand-gold md:col-span-2" rows={3} placeholder="Excerpt" />
              <textarea value={post.affiliateDisclosure || ''} onChange={(e) => updatePost({ affiliateDisclosure: e.target.value })} className="rounded-2xl border border-brand-blush p-3 text-sm outline-none focus:border-brand-gold md:col-span-2" rows={2} placeholder="Affiliate disclosure" />
              <input value={post.metaTitle || ''} onChange={(e) => updatePost({ metaTitle: e.target.value })} className="rounded-2xl border border-brand-blush p-3 text-sm outline-none focus:border-brand-gold" placeholder="Meta title" />
              <input value={post.metaDescription || ''} onChange={(e) => updatePost({ metaDescription: e.target.value })} className="rounded-2xl border border-brand-blush p-3 text-sm outline-none focus:border-brand-gold" placeholder="Meta description" />
            </div>
          </section>

          {activeSection && (
            <section className="rounded-[2rem] border border-brand-blush bg-white p-5 shadow-sm md:p-7">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-gold">Section builder</p>
                  <h2 className="mt-2 font-serif text-3xl">{activeSection.label}</h2>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => duplicateSection(activeSection)} className="btn-outline inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs"><Copy size={13} /> Duplicate</button>
                  <button type="button" onClick={() => deleteSection(activeSection.id)} className="rounded-full border border-red-100 px-4 py-2 text-xs font-bold uppercase tracking-widest text-red-700 hover:bg-red-50"><Trash2 size={13} /></button>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <select value={activeSection.type} onChange={(e) => updateSection(activeSection.id, { type: e.target.value as BlogEditorSection['type'] })} className="rounded-2xl border border-brand-blush bg-white p-3 text-sm outline-none focus:border-brand-gold">
                  {sectionTypes.map((item) => <option key={item.type} value={item.type}>{item.label}</option>)}
                </select>
                <input value={activeSection.label} onChange={(e) => updateSection(activeSection.id, { label: e.target.value })} className="rounded-2xl border border-brand-blush p-3 text-sm outline-none focus:border-brand-gold" placeholder="Internal/section label" />
                <input value={activeSection.eyebrow || ''} onChange={(e) => updateSection(activeSection.id, { eyebrow: e.target.value })} className="rounded-2xl border border-brand-blush p-3 text-sm outline-none focus:border-brand-gold" placeholder="Eyebrow label" />
                <input value={activeSection.heading || ''} onChange={(e) => updateSection(activeSection.id, { heading: e.target.value })} className="rounded-2xl border border-brand-blush p-3 text-sm outline-none focus:border-brand-gold" placeholder="Heading" />
                <select value={activeSection.layout || 'editorial'} onChange={(e) => updateSection(activeSection.id, { layout: e.target.value })} className="rounded-2xl border border-brand-blush bg-white p-3 text-sm outline-none focus:border-brand-gold">
                  <option value="editorial">Editorial</option>
                  <option value="full-width">Full-width image</option>
                  <option value="image-left">Image left</option>
                  <option value="image-right">Image right</option>
                  <option value="two-column">Two-column</option>
                  <option value="floating-collage">Floating collage</option>
                  <option value="centered-card">Centered card</option>
                </select>
                <input value={activeSection.ctaText || ''} onChange={(e) => updateSection(activeSection.id, { ctaText: e.target.value })} className="rounded-2xl border border-brand-blush p-3 text-sm outline-none focus:border-brand-gold" placeholder="Section CTA override" />
                <textarea value={activeSection.quote || ''} onChange={(e) => updateSection(activeSection.id, { quote: e.target.value })} className="rounded-2xl border border-brand-blush p-3 text-sm outline-none focus:border-brand-gold md:col-span-2" rows={2} placeholder="Quote text" />
                <div className="md:col-span-2">
                  <RichTextEditor value={activeSection.body || ''} onChange={(value) => updateSection(activeSection.id, { body: value })} />
                </div>
                <div className="rounded-2xl border border-brand-blush bg-brand-cream/30 p-4 md:col-span-2">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-brand-black/50">Products in this section</p>
                  <div className="grid gap-2 md:grid-cols-2">
                    {post.products.map((product) => (
                      <label key={product.id} className="flex items-center gap-3 rounded-xl bg-white p-3 text-xs">
                        <input type="checkbox" checked={activeSection.productIds?.includes(product.id) || false} onChange={(e) => {
                          const currentIds = activeSection.productIds || [];
                          updateSection(activeSection.id, { productIds: e.target.checked ? [...currentIds, product.id] : currentIds.filter((id) => id !== product.id) });
                        }} className="accent-brand-gold" />
                        <span className="font-bold">{product.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-brand-blush bg-brand-cream/30 p-4 md:col-span-2">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-brand-black/50">Section images</p>
                  <input value={activeImageUrl} onChange={(e) => updateSection(activeSection.id, { imageUrls: e.target.value ? [e.target.value, ...(activeSection.imageUrls || []).slice(1)] : (activeSection.imageUrls || []).slice(1) })} className="mb-3 w-full rounded-2xl border border-brand-blush p-3 text-sm outline-none focus:border-brand-gold" placeholder="Primary image URL" />
                  <div className="flex flex-wrap gap-2">
                    {post.imageLibrary.map((asset) => (
                      <button key={asset.id} type="button" onClick={() => updateSection(activeSection.id, { imageUrls: [...(activeSection.imageUrls || []), asset.url] })} className="overflow-hidden rounded-xl border border-brand-blush bg-white p-1 hover:border-brand-gold">
                        <ProductImage src={asset.url} alt={asset.alt || 'Image asset'} className="h-16 w-16 rounded-lg object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}
        </main>

        <aside className="space-y-6">
          <section className="rounded-[2rem] border border-brand-blush bg-white p-5 shadow-sm">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-gold">Image studio</p>
            <div className="flex gap-2">
              <input id="image-url-input" placeholder="Paste image URL" className="min-w-0 flex-1 rounded-2xl border border-brand-blush p-3 text-sm outline-none focus:border-brand-gold" onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addImageUrl((e.target as HTMLInputElement).value);
                  (e.target as HTMLInputElement).value = '';
                }
              }} />
              <label className="btn-outline inline-flex cursor-pointer items-center rounded-full px-4 py-3"><Upload size={14} /><input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e.target.files?.[0])} /></label>
            </div>
            <p className="mt-3 text-xs leading-5 text-brand-black/50">Upload stores a local data URL in the draft for manual review; use final hosted image URLs before publishing if you prefer lighter pages.</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {post.imageLibrary.map((asset) => (
                <div key={asset.id} className={`overflow-hidden rounded-2xl border bg-white p-2 ${post.featuredImage === asset.url ? 'border-brand-gold' : 'border-brand-blush'}`}>
                  <button type="button" onClick={() => updatePost({ featuredImage: asset.url })} className="block w-full overflow-hidden rounded-xl">
                    <ProductImage src={asset.url} alt={asset.alt || 'Library image'} className="aspect-square w-full rounded-xl object-cover" style={{ objectPosition: asset.objectPosition || 'center' }} />
                  </button>
                  <select value={asset.objectPosition || 'center'} onChange={(e) => updateImageAsset(asset.id, { objectPosition: e.target.value })} className="mt-2 w-full rounded-xl border border-brand-blush bg-brand-cream/40 p-2 text-[10px] uppercase tracking-widest">
                    <option value="center">Crop center</option>
                    <option value="top">Crop top</option>
                    <option value="bottom">Crop bottom</option>
                    <option value="left">Crop left</option>
                    <option value="right">Crop right</option>
                  </select>
                </div>
              ))}
              {!post.imageLibrary.length && <div className="col-span-2 rounded-2xl bg-brand-cream/50 p-6 text-center text-xs italic text-brand-black/40"><ImagePlus className="mx-auto mb-2" size={18} />Add images for collages, heroes, and replacements.</div>}
            </div>
          </section>

          <section className="rounded-[2rem] border border-brand-blush bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-gold">Live preview</p>
              <div className="flex rounded-full bg-brand-cream p-1">
                <button onClick={() => setPreviewMode('desktop')} className={`rounded-full px-3 py-2 ${previewMode === 'desktop' ? 'bg-white shadow-sm' : ''}`}><Monitor size={14} /></button>
                <button onClick={() => setPreviewMode('mobile')} className={`rounded-full px-3 py-2 ${previewMode === 'mobile' ? 'bg-white shadow-sm' : ''}`}><Smartphone size={14} /></button>
              </div>
            </div>
            <div className={`mx-auto max-h-[720px] overflow-y-auto rounded-[2rem] bg-brand-cream p-4 transition-all ${previewMode === 'mobile' ? 'max-w-[320px]' : 'max-w-full'}`}>
              <article className="space-y-6 rounded-[1.5rem] bg-[#fcfaf7] p-5">
                <p className="text-center text-[10px] font-bold uppercase tracking-[0.3em] text-brand-gold">{categories.find((category) => category.id === post.categoryId)?.name}</p>
                <h2 className="text-center font-serif text-4xl leading-none text-brand-black">{post.title}</h2>
                {post.subtitle && <p className="text-center text-sm italic leading-6 text-brand-black/60">{post.subtitle}</p>}
                {post.featuredImage && <ProductImage src={post.featuredImage} alt={post.title} className="aspect-[4/5] w-full rounded-[1.5rem] object-cover shadow-sm" />}
                {post.editorSections.map((section) => <PreviewSection key={section.id} section={section} products={post.products} ctaText={section.ctaText || post.ctaText || 'Shop the Find'} />)}
              </article>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
