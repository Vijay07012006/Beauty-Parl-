'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { api } from '@/lib/api';
import { JarvisSplitLayout } from './JarvisSplitLayout';
import type { VisualContent } from './VisualContentRenderer';
import { VoiceService } from '@/services/voice.service';
import { Bot, X } from 'lucide-react';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// ─── Client-side route sanitizer (mirrors server ALLOWED_PAGES set exactly) ──

const ALLOWED_PAGES = new Set([
  'profile', 'orders', 'cart', 'wishlist', 'addresses', 'checkout',
  'beauty-box', 'loyalty', 'referral', 'gamification', 'preferences',
  'quiz', 'routine-builder', 'skin-analysis', 'virtual-try-on',
  'subscriptions', 'ai-history',
  'products', 'categories', 'compare', 'looks', 'clean-beauty', 'live-shopping',
  'about', 'contact', 'faq', 'blog', 'booking', 'shipping', 'returns', 'privacy', 'terms',
  'admin/dashboard', 'admin/products', 'admin/orders', 'admin/users',
  'admin/coupons', 'admin/reviews', 'admin/settings', 'admin/ugc',
  'admin/chat', 'admin/live-shopping',
]);

function sanitizeNavigationRoute(route: string | undefined | null): string | null {
  if (!route || typeof route !== 'string') return null;
  if (/^(https?:|\/\/|javascript:|data:)/i.test(route)) return null;
  const stripped = route.replace(/^\/+/, '').replace(/^[a-z]{2}\//i, '');
  if (ALLOWED_PAGES.has(stripped)) return `/${stripped}`;
  return null;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  products?: any[];
  chart?: any;
  navigation?: string;
  time: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function JarvisChat() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const { user } = useAuthStore();
  const { addItem } = useCartStore();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [visualContent, setVisualContent] = useState<VisualContent | null>(null);

  // Voice States
  const [isListening, setIsListening] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('jarvis_tts_enabled');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });
  const [sttEnabled, setSttEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('jarvis_stt_enabled');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });

  const voiceService = useRef<VoiceService | null>(null);

  // Instantiate VoiceService
  useEffect(() => {
    if (typeof window !== 'undefined') {
      voiceService.current = new VoiceService();
    }
  }, []);

  // Set TTS preference to localStorage
  const handleTtsChange = useCallback((enabled: boolean) => {
    setTtsEnabled(enabled);
    localStorage.setItem('jarvis_tts_enabled', String(enabled));
    if (!enabled && voiceService.current) {
      voiceService.current.stopSpeaking();
    }
  }, []);

  // Set STT preference to localStorage
  const handleSttChange = useCallback((enabled: boolean) => {
    setSttEnabled(enabled);
    localStorage.setItem('jarvis_stt_enabled', String(enabled));
    if (!enabled && voiceService.current) {
      voiceService.current.stopListening();
      setIsListening(false);
    }
  }, []);

  // ── Init session + welcome message ────────────────────────────────────────
  useEffect(() => {
    setSessionId(`sess_jarvis_${Date.now()}`);
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      text: `🌸 Hello ${user?.name || 'there'}! I am **JARVIS**, your Beauty Parlé AI.

How can I help?
- 💄 **Show products** — "show me skincare under ₹500"
- 📊 **Sales stats** — "show revenue this week" *(admin)*
- 📦 **Order details** — "check my order #12"
- 🧭 **Navigate** — "navigate cart", "go to wishlist"
- 📝 **Export** — "download this conversation"`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);
  }, [user]);

  // Speech Recognition setup when listening status toggles
  useEffect(() => {
    if (isListening && voiceService.current && sttEnabled) {
      const rec = voiceService.current.initSpeechRecognition(
        (text, isFinal) => {
          setInput(text);
          if (isFinal && text.trim().length > 0) {
            submitMessage(text);
            setInput('');
          }
        },
        () => {
          setIsListening(false);
        },
        () => {
          setIsListening(false);
          toast.error('Voice input error. Please try speaking again.');
        }
      );

      if (rec) {
        voiceService.current.startListening();
      } else {
        setIsListening(false);
        toast.error('Speech recognition is not supported in this browser.');
      }
    } else if (!isListening && voiceService.current) {
      voiceService.current.stopListening();
    }
  }, [isListening, sttEnabled]);

  const toggleListening = useCallback(() => {
    if (!sttEnabled) {
      toast.info('Please enable Voice Input in settings first.');
      return;
    }
    setIsListening((prev) => !prev);
  }, [sttEnabled]);

  // ── Send message ──────────────────────────────────────────────────────────
  const submitMessage = useCallback(async (text: string) => {
    if (!text || loading) return;

    if (!user) {
      toast.error('Please log in to chat with JARVIS');
      return;
    }

    // Stop speaking when user submits a new prompt
    if (voiceService.current) {
      voiceService.current.stopSpeaking();
    }

    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [...prev, { id: `u_${Date.now()}`, role: 'user', text, time: userTime }]);
    setLoading(true);

    try {
      const { data } = await api.post('/ai/chat', { message: text, sessionId });

      const assistantTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages((prev) => [
        ...prev,
        {
          id: `a_${Date.now()}`,
          role: 'assistant',
          text: data.reply || 'Done!',
          products: data.products,
          chart: data.chart,
          navigation: data.navigation,
          time: assistantTime,
        },
      ]);

      // Speak response if voice response is enabled
      if (ttsEnabled && voiceService.current && data.reply) {
        voiceService.current.speak(data.reply);
      }

      // ── Update visual panel ──────────────────────────────────────────────
      if (data.visualType && data.data) {
        if (data.visualType === 'products') {
          setVisualContent({ visualType: 'products', products: data.data });
        } else if (data.visualType === 'chart') {
          setVisualContent({ visualType: 'chart', chart: data.data });
        } else if (data.visualType === 'web_search') {
          setVisualContent({ visualType: 'web_search', webSearch: data.data });
        } else if (data.visualType === 'image') {
          setVisualContent({ visualType: 'image', imageUrl: data.data.url, imagePrompt: data.data.prompt });
        }
      } else if (data.products?.length > 0) {
        setVisualContent({ visualType: 'products', products: data.products });
      } else if (data.chart) {
        setVisualContent({ visualType: 'chart', chart: data.chart });
      }

      // ── Handle navigation (double-sanitized) ────────────────────────────
      if (data.navigation) {
        const safe = sanitizeNavigationRoute(data.navigation);
        if (safe) {
          toast.info(`Navigating to ${safe}...`);
          setTimeout(() => {
            setIsOpen(false);
            router.push(`/${locale}${safe}`);
          }, 1800);
        } else {
          console.warn('[JarvisChat] Blocked unsafe navigation route:', data.navigation);
        }
      }

    } catch (err: any) {
      const msg = err?.response?.data?.error || 'JARVIS encountered an error. Please try again.';
      toast.error(msg);
      setMessages((prev) => [
        ...prev,
        { id: `e_${Date.now()}`, role: 'assistant', text: `⚠️ ${msg}`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
      ]);
    } finally {
      setLoading(false);
    }
  }, [loading, sessionId, user, locale, router, ttsEnabled]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput('');
    submitMessage(text);
  };

  const handleQuickCommand = useCallback((cmd: string) => {
    submitMessage(cmd);
  }, [submitMessage]);

  // ── PDF export ────────────────────────────────────────────────────────────
  const handleExportPDF = useCallback(async () => {
    const el = document.getElementById('jarvis-split-chat-messages');
    if (!el) return;
    toast.loading('Generating PDF...');
    try {
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#fff' });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgW = 210;
      const imgH = (canvas.height * imgW) / canvas.width;
      let left = imgH, pos = 0;
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, pos, imgW, imgH);
      left -= 295;
      while (left >= 0) { pos = left - imgH; pdf.addPage(); pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, pos, imgW, imgH); left -= 295; }
      pdf.save(`jarvis-chat-${Date.now()}.pdf`);
      toast.dismiss();
      toast.success('Chat exported as PDF!');
    } catch {
      toast.dismiss();
      toast.error('PDF export failed');
    }
  }, []);

  // ── Add to cart ───────────────────────────────────────────────────────────
  const handleAddToCart = useCallback((product: any) => {
    addItem({ id: Number(product.id), name: product.name, price: Number(product.price), image: product.image || '', maxStock: product.stock ?? 99, quantity: 1 });
    toast.success(`🛒 Added ${product.name} to cart!`);
  }, [addItem]);

  // ── Open / close ─────────────────────────────────────────────────────────
  const handleOpen = () => setIsOpen(true);
  const handleClose = () => {
    setIsOpen(false);
    if (voiceService.current) {
      voiceService.current.stopSpeaking();
      voiceService.current.stopListening();
      setIsListening(false);
    }
  };

  return (
    <>
      {/* Mission Control Overlay */}
      <JarvisSplitLayout
        isOpen={isOpen}
        onClose={handleClose}
        messages={messages}
        loading={loading}
        input={input}
        onInputChange={setInput}
        onSubmit={handleSend}
        onExportPDF={handleExportPDF}
        onAddToCart={handleAddToCart}
        visualContent={visualContent}
        onQuickCommand={handleQuickCommand}
        isListening={isListening}
        onToggleListen={toggleListening}
        ttsEnabled={ttsEnabled}
        onTtsChange={handleTtsChange}
        sttEnabled={sttEnabled}
        onSttChange={handleSttChange}
      />

      {/* Floating Action Button — always visible */}
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-tr from-primary to-purple-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer border border-white/10 group"
        aria-label="Open JARVIS AI"
      >
        {isOpen
          ? <X className="w-6 h-6" onClick={(e) => { e.stopPropagation(); handleClose(); }} />
          : <>
              <Bot className="w-7 h-7 group-hover:rotate-12 transition-transform duration-300" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-background animate-pulse" />
            </>
        }
      </button>
    </>
  );
}
