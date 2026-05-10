"use client";

import { useState, useEffect } from 'react';
import { Loader2, X, Sparkles, Copy, Check } from 'lucide-react';

interface ContentBundle {
  blogPostTitle: string;
  blogPostOutline: string;
  shortDescription: string;
  pinTitle: string;
  pinDescription: string;
  tiktokHook: string;
  tiktokScript: string;
  facebookCaption: string;
  emailBlurb: string;
  suggestedHashtags: string;
}

export default function AIAssistant({ product, onClose }: { product: any, onClose: () => void }) {
  const [generating, setGenerating] = useState(false);
  const [content, setContent] = useState<ContentBundle | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    // If product already has a content bundle, load it
    if (product.contentBundle) {
      setContent(product.contentBundle);
    }
  }, [product]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id }),
      });
      const data = await response.json();
      if (data.success) {
        setContent(data.data);
      } else {
        alert(data.error || 'Failed to generate content');
      }
    } catch (error) {
      console.error('Error generating content:', error);
      alert('An error occurred while generating content.');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const Section = ({ title, text, id }: { title: string, text: string, id: string }) => (
    <div className="space-y-3 p-4 bg-white border border-brand-blush rounded-sm shadow-sm">
      <div className="flex justify-between items-center border-b border-brand-blush pb-2">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-brand-black">{title}</h3>
        <button 
          onClick={() => copyToClipboard(text, id)}
          className="text-brand-gold hover:text-brand-black transition-colors"
        >
          {copied === id ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
      <div className="text-sm text-brand-black/70 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto pr-2 custom-scrollbar">
        {text}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-brand-black/40 backdrop-blur-sm z-50 flex justify-end">
      <div className="bg-brand-cream w-full max-w-2xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="p-6 border-b border-brand-blush flex justify-between items-center bg-white">
          <div>
            <h2 className="font-serif font-bold text-2xl text-brand-black">AI Content Assistant</h2>
            <p className="text-[10px] text-brand-gold font-bold uppercase tracking-widest mt-1">
              Curating content for: {product.name}
            </p>
          </div>
          <button onClick={onClose} className="text-brand-black/40 hover:text-brand-black transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-grow overflow-y-auto p-8 space-y-8">
          {!content && !generating && (
            <div className="text-center py-20 space-y-6">
              <div className="inline-flex p-4 bg-brand-blush/30 rounded-full text-brand-gold">
                <Sparkles size={48} />
              </div>
              <div className="max-w-xs mx-auto">
                <h3 className="font-serif text-xl mb-2 text-brand-black">Ready to curate?</h3>
                <p className="text-sm text-brand-black/60 italic">
                  "Click the button below to generate a full SEO and social media bundle for this viral find."
                </p>
              </div>
            </div>
          )}

          {generating && (
            <div className="text-center py-20 space-y-4">
              <Loader2 className="animate-spin text-brand-gold mx-auto" size={48} />
              <p className="text-sm font-serif italic text-brand-black">Curating the perfect luxury tone...</p>
            </div>
          )}

          {content && !generating && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
              <div className="md:col-span-2">
                <Section title="SEO Blog Post Title" text={content.blogPostTitle} id="title" />
              </div>
              <div className="md:col-span-2">
                <Section title="Blog Post Outline" text={content.blogPostOutline} id="outline" />
              </div>
              <Section title="Short Description" text={content.shortDescription} id="desc" />
              <Section title="Pinterest Pin" text={`${content.pinTitle}\n\n${content.pinDescription}`} id="pin" />
              <Section title="TikTok / Reel Hook" text={content.tiktokHook} id="hook" />
              <Section title="TikTok Script" text={content.tiktokScript} id="script" />
              <Section title="Facebook Caption" text={content.facebookCaption} id="fb" />
              <Section title="Email Newsletter" text={content.emailBlurb} id="email" />
              <div className="md:col-span-2">
                <Section title="Suggested Hashtags" text={content.suggestedHashtags} id="tags" />
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-white border-t border-brand-blush">
          <button 
            onClick={handleGenerate}
            disabled={generating}
            className="w-full bg-brand-black text-brand-cream py-4 font-bold text-xs uppercase tracking-widest hover:bg-brand-gold transition-colors shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                {content ? 'Re-Generate Content Bundle' : 'Generate Content Bundle'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
