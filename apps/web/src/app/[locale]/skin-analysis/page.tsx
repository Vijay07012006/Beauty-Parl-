'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProductCard } from '@/components/products/ProductCard';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Camera, ShieldAlert, ArrowRight, RefreshCw } from 'lucide-react';
import Link from 'next/link';

const sampleSelfies = [
  { name: 'Selfie 1 (Dry/Sensitive)', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400' },
  { name: 'Selfie 2 (Combination)', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400' },
  { name: 'Selfie 3 (Oily/Acne)', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400' },
];

export default function SkinAnalysisPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const { token } = useAuthStore();
  const [imageUrl, setImageUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  useEffect(() => {
    if (!token) {
      toast.error('Please sign in to access AI Skin Diagnostics');
      router.push(`/${locale}/auth/login`);
    }
  }, [token, locale]);

  const handleAnalyze = async (urlToAnalyze?: string) => {
    const targetUrl = urlToAnalyze || imageUrl;
    if (!targetUrl) {
      toast.error('Please enter an image URL or choose a sample selfie');
      return;
    }

    setAnalyzing(true);
    setResult(null);

    // Dynamic scanning micro-delay for realistic visual feedback
    await new Promise((resolve) => setTimeout(resolve, 2500));

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await api.post('/skin-analysis/analyze', { imageUrl: targetUrl }, { headers });
      setResult(res.data);
      toast.success('Diagnosis compiled successfully! ✨');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to complete skin analysis');
    } finally {
      setAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setImageUrl('');
    setResult(null);
  };

  return (
    <>
      <Header />
      <main className="min-h-screen py-12 bg-secondary/10">
        <div className="container mx-auto px-4 max-w-4xl space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-4xl md:text-5xl font-playfair font-bold text-foreground">AI Skin Analysis</h1>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Our advanced machine-learning classifier scans facial characteristics, identifies oily/dry areas, and recommends clinical-grade routines.
            </p>
          </div>

          <div className="bg-card border border-border/40 p-6 md:p-8 rounded-3xl shadow-sm">
            <AnimatePresence mode="wait">
              {/* Form step */}
              {!analyzing && !result && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                      Choose a Sample Selfie to Test Instantly
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {sampleSelfies.map((sample) => (
                        <div
                          key={sample.name}
                          onClick={() => {
                            setImageUrl(sample.url);
                            handleAnalyze(sample.url);
                          }}
                          className="group relative aspect-square rounded-2xl overflow-hidden bg-secondary/20 border border-border/40 hover:border-primary/50 transition cursor-pointer"
                        >
                          <img src={sample.url} alt={sample.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                          <div className="absolute inset-0 bg-black/40 flex items-end p-3">
                            <span className="text-[10px] font-bold text-white uppercase">{sample.name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-border/40"></div>
                    <span className="flex-shrink mx-4 text-xs font-bold text-muted-foreground uppercase">Or paste image URL</span>
                    <div className="flex-grow border-t border-border/40"></div>
                  </div>

                  <div className="space-y-3">
                    <input
                      type="url"
                      placeholder="Paste portrait image URL (HTTPS)"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full bg-secondary/10 border border-border/50 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
                    />
                    <button
                      onClick={() => handleAnalyze()}
                      className="w-full py-3.5 bg-primary text-white font-bold rounded-full hover:bg-primary/95 transition cursor-pointer flex items-center justify-center gap-2 text-xs"
                    >
                      <Camera className="w-4 h-4" /> Analyze Skin Now
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Scanning loader screen */}
              {analyzing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-16 space-y-6"
                >
                  <div className="relative w-48 h-48 rounded-full overflow-hidden border-2 border-primary/30">
                    <img src={imageUrl} alt="Scanning face" className="w-full h-full object-cover" />
                    {/* Glowing scanline overlay */}
                    <div className="absolute left-0 w-full h-1.5 bg-primary shadow-[0_0_10px_rgba(219,39,119,0.8)] animate-bounce" style={{ top: '0%' }} />
                    <div className="absolute inset-0 bg-primary/10 animate-pulse" />
                  </div>
                  <div className="text-center space-y-1">
                    <h3 className="text-lg font-bold text-foreground flex items-center justify-center gap-2">
                      <Sparkles className="w-4.5 h-4.5 text-primary animate-spin" /> Neural Scan Running...
                    </h3>
                    <p className="text-xs text-muted-foreground">Classifying pore density, sebum levels, and moisture patches</p>
                  </div>
                </motion.div>
              )}

              {/* Result report screen */}
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="aspect-square rounded-3xl overflow-hidden bg-secondary/20 max-w-[280px] mx-auto border border-border/40">
                      <img src={result.imageUrl} alt="Analyzed Selfie" className="w-full h-full object-cover" />
                    </div>

                    <div className="space-y-4">
                      <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary font-bold px-3 py-1 rounded-full text-xs uppercase">
                        Skin Type: {result.skinType}
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                          Identified Conditions & Concerns
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {result.concerns?.map((concern: string) => (
                            <span key={concern} className="px-3 py-1 bg-secondary text-foreground border border-border/30 rounded-lg text-xs font-semibold uppercase">
                              {concern.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="p-4 bg-secondary/15 rounded-2xl border border-border/30 flex gap-2.5 text-xs text-muted-foreground leading-relaxed">
                        <ShieldAlert className="w-5 h-5 text-primary shrink-0" />
                        <span>
                          Machine-learning diagnostic results are for cosmetic recommendations only. Consult a dermatologist for persistent conditions.
                        </span>
                      </div>
                    </div>
                  </div>

                  <hr className="border-border/30" />

                  {/* Recommendations */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-playfair font-bold text-foreground">Matched Routine Recommendations</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {result.products?.map((product: any) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-center pt-4">
                    <button
                      onClick={resetAnalysis}
                      className="flex items-center gap-2 px-6 py-3 border border-border bg-card hover:bg-secondary/40 rounded-full font-semibold transition text-xs cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4" /> Analyze Another Selfie
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
