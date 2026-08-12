'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Sun, Moon, ShoppingCart, Save, RefreshCw, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface ProductRef {
  id: number;
  name: string;
  price: number;
  image?: string;
}

export default function RoutineBuilderPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const { user } = useAuthStore();
  const { addItem } = useCartStore();

  const [step, setStep] = useState(1);
  const [skinType, setSkinType] = useState('');
  const [concern, setConcern] = useState('');
  const [loading, setLoading] = useState(false);
  const [routine, setRoutine] = useState<any | null>(null);

  const handleNext = () => {
    if (step === 1 && !skinType) {
      toast.error('Please select your skin type');
      return;
    }
    if (step === 2 && !concern) {
      toast.error('Please select your skin concern');
      return;
    }

    if (step === 2) {
      evaluateRoutine();
    } else {
      setStep(step + 1);
    }
  };

  const evaluateRoutine = async () => {
    setLoading(true);
    try {
      const res = await api.post('/routine-builder/analyze', { skinType, primaryConcern: concern });
      setRoutine(res.data);
      toast.success('Your personalized routine compiled successfully! ✨');
    } catch {
      toast.error('Failed to analyze skin choices');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast.error('Please sign in to save your routines to your account');
      router.push(`/${locale}/auth/login`);
      return;
    }

    try {
      // The HttpOnly bp_token cookie is sent automatically via withCredentials
      await api.post('/routine-builder/save', { name: routine.name, products: routine });
      toast.success('Routine saved to your profile! 💾');
    } catch {
      toast.error('Failed to save routine');
    }
  };

  const handleAddAllToCart = () => {
    if (!routine) return;
    const items = [...(routine.morning || []), ...(routine.night || [])];
    
    for (const item of items) {
      addItem({
        id: item.id,
        name: item.name,
        price: Number(item.price),
        image: item.image || '',
        maxStock: 99,
        quantity: 1,
      });
    }

    toast.success('🛒 All routine products added to your cart!');
  };

  const handleReset = () => {
    setSkinType('');
    setConcern('');
    setRoutine(null);
    setStep(1);
  };

  return (
    <>
      <Header />
      <main className="min-h-screen py-12 bg-secondary/10 flex items-center">
        <div className="container mx-auto px-4 max-w-2xl space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-playfair font-bold text-foreground">Interactive Routine Builder</h1>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Answer 2 simple questions to get a dermatological Morning and Night skin regimen tailored to your needs.
            </p>
          </div>

          <div className="bg-card border border-border/40 p-6 md:p-8 rounded-3xl shadow-sm">
            <AnimatePresence mode="wait">
              {/* Step 1: Skin Type */}
              {!loading && !routine && step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-playfair font-bold text-foreground text-center">What is your Skin Type?</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {['dry', 'oily', 'combination', 'normal'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setSkinType(type)}
                        className={`p-5 rounded-2xl border text-xs font-bold capitalize transition cursor-pointer ${
                          skinType === type
                            ? 'bg-primary/5 border-primary text-primary shadow-sm'
                            : 'bg-card border-border/30 hover:border-primary/40'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleNext}
                    className="w-full py-3.5 bg-primary text-white font-bold rounded-full hover:bg-primary/95 transition flex items-center justify-center gap-1 text-xs cursor-pointer"
                  >
                    Next Step <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.div>
              )}

              {/* Step 2: Concern */}
              {!loading && !routine && step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-playfair font-bold text-foreground text-center">What is your primary concern?</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {['acne', 'hydration', 'aging', 'dark_spots'].map((item) => (
                      <button
                        key={item}
                        onClick={() => setConcern(item)}
                        className={`p-5 rounded-2xl border text-xs font-bold capitalize transition cursor-pointer ${
                          concern === item
                            ? 'bg-primary/5 border-primary text-primary shadow-sm'
                            : 'bg-card border-border/30 hover:border-primary/40'
                        }`}
                      >
                        {item.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleNext}
                    className="w-full py-3.5 bg-primary text-white font-bold rounded-full hover:bg-primary/95 transition flex items-center justify-center gap-1 text-xs cursor-pointer"
                  >
                    Build Routine <Sparkles className="w-4 h-4" />
                  </button>
                </motion.div>
              )}

              {/* Loading scanner */}
              {loading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-12 gap-2"
                >
                  <div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                  <span className="text-xs font-bold text-primary animate-pulse">Calculating skin routine...</span>
                </motion.div>
              )}

              {/* REGIMEN RESULTS DISPLAY */}
              {routine && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  <div className="text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full">
                      Regimen Complete
                    </span>
                    <h2 className="text-2xl font-playfair font-bold text-foreground mt-3">{routine.name}</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Morning Regimen */}
                    <div className="space-y-4 bg-amber-500/5 p-4.5 rounded-3xl border border-amber-500/10">
                      <h3 className="text-sm font-bold text-amber-600 flex items-center gap-1.5 uppercase tracking-wide">
                        <Sun className="w-4.5 h-4.5" /> Morning Routine
                      </h3>
                      <div className="space-y-3">
                        {routine.morning?.map((item: ProductRef) => (
                          <div key={item.id} className="flex gap-3 items-center bg-card p-2 rounded-2xl border border-border/20">
                            <div className="w-10 h-10 bg-secondary/15 rounded-lg overflow-hidden shrink-0">
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-xs text-foreground truncate">{item.name}</p>
                              <p className="text-[10px] font-bold text-muted-foreground">Rs. {Number(item.price).toFixed(2)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Night Regimen */}
                    <div className="space-y-4 bg-indigo-500/5 p-4.5 rounded-3xl border border-indigo-500/10">
                      <h3 className="text-sm font-bold text-indigo-500 flex items-center gap-1.5 uppercase tracking-wide">
                        <Moon className="w-4.5 h-4.5" /> Night Routine
                      </h3>
                      <div className="space-y-3">
                        {routine.night?.map((item: ProductRef) => (
                          <div key={item.id} className="flex gap-3 items-center bg-card p-2 rounded-2xl border border-border/20">
                            <div className="w-10 h-10 bg-secondary/15 rounded-lg overflow-hidden shrink-0">
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-xs text-foreground truncate">{item.name}</p>
                              <p className="text-[10px] font-bold text-muted-foreground">Rs. {Number(item.price).toFixed(2)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-border/30">
                    <button
                      onClick={handleAddAllToCart}
                      className="py-3.5 bg-primary text-white rounded-full font-bold text-xs hover:bg-primary/95 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-primary/10"
                    >
                      <ShoppingCart className="w-4 h-4" /> Add All to Cart
                    </button>
                    <button
                      onClick={handleSave}
                      className="py-3.5 bg-neutral-950 text-white rounded-full font-bold text-xs hover:bg-neutral-850 transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-4 h-4" /> Save Routine
                    </button>
                    <button
                      onClick={handleReset}
                      className="py-3.5 border border-border hover:bg-secondary/40 rounded-full font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4" /> Retake Quiz
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
