'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { api } from '@/lib/api';
import { SvgChart } from './SvgChart';
import { JarvisVisualOverlay, type VisualOverlayData } from './JarvisVisualOverlay';
import { 
  Bot, MessageSquare, Send, X, Download, RefreshCw, 
  Sparkles, ArrowRight, ShoppingCart, User, HelpCircle, Layers
} from 'lucide-react';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// ===========================================================
// CLIENT-SIDE ROUTE SANITIZER
// Must match the server-side ALLOWED_PAGES whitelist exactly.
// ===========================================================
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

/**
 * Sanitizes a navigation route received from the API.
 * Returns a safe relative path or null if the route is disallowed.
 */
function sanitizeNavigationRoute(route: string | undefined | null): string | null {
  if (!route || typeof route !== 'string') return null;
  // Block any external URLs, protocol-relative URLs, or javascript:
  if (/^(https?:|\/\/|javascript:|data:)/i.test(route)) return null;
  // Normalise: strip leading slashes and locale prefix (e.g. /en/cart → cart)
  const stripped = route.replace(/^\/+/, '').replace(/^[a-z]{2}\//i, '');
  if (ALLOWED_PAGES.has(stripped)) return `/${stripped}`;
  return null;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  products?: any[];
  chart?: any;
  navigation?: string;
  time: string;
}

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

  // Visual overlay state
  const [overlayData, setOverlayData] = useState<VisualOverlayData | null>(null);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setSessionId(`sess_jarvis_${Date.now()}`);
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        text: `🌸 Hello ${user?.name || 'there'}! I am **JARVIS**, your personal Beauty Parlé AI Assistant. 

How can I assist you today? You can ask me to:
- 💄 **Recommend products** matching skin concerns or shade queries.
- 📦 **View order details** ("check my order #5").
- ${user?.role === 'admin' || user?.role === 'super_admin' ? '📊 **Check sales statistics** ("show revenue today/this week").\n- ' : ''}- ⚙️ **Navigate the website** ("navigate cart", "go to profile", "open wishlist").
- 📝 **Download this conversation** as a PDF file.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ]);
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('chat-open');
    } else {
      document.body.classList.remove('chat-open');
    }
    return () => {
      document.body.classList.remove('chat-open');
    };
  }, [isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    if (!user) {
      toast.error('Please log in to chat with JARVIS');
      return;
    }

    const userText = input.trim();
    setInput('');
    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsgId = `user_${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: 'user', text: userText, time: userTime }
    ]);
    setLoading(true);

    try {
      const response = await api.post('/ai/chat', {
        message: userText,
        sessionId,
      });

      const data = response.data;
      const assistantTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const assistantMsgId = `assistant_${Date.now()}`;

      setMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          role: 'assistant',
          text: data.reply || 'Done!',
          products: data.products,
          chart: data.chart,
          navigation: data.navigation,
          time: assistantTime,
        }
      ]);

      // ── Visual overlay: open when AI returns structured data ─────────────
      const hasVisuals = (data.products?.length > 0) || data.chart || data.navigation;
      if (hasVisuals) {
        const overlayPayload: VisualOverlayData = {};
        if (data.products?.length > 0) {
          overlayPayload.visual_type = 'products';
          overlayPayload.products = data.products;
        }
        if (data.chart) {
          overlayPayload.visual_type = 'chart';
          overlayPayload.chart = data.chart;
        }
        if (data.navigation) {
          // Sanitize the navigation route on the client side before using it
          const safeRoute = sanitizeNavigationRoute(data.navigation);
          if (safeRoute) {
            overlayPayload.navigation = safeRoute;
            overlayPayload.visual_type = 'navigation';
          }
        }
        setOverlayData(overlayPayload);
      }

      // ── Automatic navigation: only executes if server confirmed a safe route ─
      if (data.navigation) {
        const safeRoute = sanitizeNavigationRoute(data.navigation);
        if (safeRoute) {
          toast.info(`Navigating to ${safeRoute}... 🚀`);
          setTimeout(() => {
            router.push(`/${locale}${safeRoute}`);
            setIsOpen(false);
          }, 2000);
        } else {
          console.warn('JARVIS returned an unsafe navigation route — ignored:', data.navigation);
        }
      }

    } catch (err: any) {
      console.error('Failed to get reply from JARVIS', err);
      const errMsg = err?.response?.data?.error || 'Error connecting to JARVIS. Try again.';
      toast.error(errMsg);
      setMessages((prev) => [
        ...prev,
        {
          id: `error_${Date.now()}`,
          role: 'assistant',
          text: `⚠️ ${errMsg}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    const chatContent = document.getElementById('jarvis-chat-messages-container');
    if (!chatContent) return;

    toast.loading('Generating chat export PDF...');
    try {
      const canvas = await html2canvas(chatContent, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#FFFFFF',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`beauty-parle-jarvis-chat-${Date.now()}.pdf`);
      toast.dismiss();
      toast.success('Chat history saved as PDF! 📄');
    } catch (err) {
      toast.dismiss();
      console.error(err);
      toast.error('Failed to export PDF');
    }
  };

  const handleAddToCart = (product: any) => {
    addItem({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      image: product.image || '',
      maxStock: product.stock || 10,
      quantity: 1,
    });
    toast.success(`🛒 Added ${product.name} to cart!`);
  };

  return (
    <>
      {/* Visual Overlay Panel — outside the chat drawer */}
      <JarvisVisualOverlay
        data={overlayData}
        onClose={() => setOverlayData(null)}
      />

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-tr from-primary to-purple-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer border border-white/10 group"
        aria-label="Ask JARVIS AI"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Bot className="w-7 h-7 group-hover:rotate-12 transition-transform duration-300" />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-background animate-pulse" />
        )}
      </button>

      {/* Floating Chat Drawer Container */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-[380px] max-w-[92vw] h-[500px] max-h-[75vh] bg-card/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-border/50 flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300 chat-container">
          
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-primary/10 to-purple-500/10 border-b border-border/50 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary relative">
                <Bot className="w-4.5 h-4.5" />
                <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border border-background" />
              </div>
              <div>
                <h3 className="font-playfair font-bold text-sm text-foreground flex items-center gap-1">
                  JARVIS AI <Sparkles className="w-3 h-3 text-primary animate-pulse" />
                </h3>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Memory & Database enabled</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Toggle overlay button */}
              {overlayData && (
                <button
                  onClick={() => setOverlayData(null)}
                  className="p-2 text-primary hover:bg-primary/10 rounded-xl transition cursor-pointer"
                  title="Close visual panel"
                >
                  <Layers className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={handleExportPDF}
                disabled={messages.length <= 1}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary/40 rounded-xl transition cursor-pointer disabled:opacity-50"
                title="Download PDF"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary/40 rounded-xl transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Thread container */}
          <div 
            id="jarvis-chat-messages-container"
            className="flex-1 p-4 overflow-y-auto space-y-4 bg-secondary/15"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`w-full flex gap-3 ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {/* Avatar Icon */}
                {msg.role !== 'user' && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 text-xs">
                    <Bot className="w-4.5 h-4.5" />
                  </div>
                )}

                {/* Message Bubble & widgets */}
                <div className={`max-w-[85%] flex flex-col gap-2 ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}>
                  <div className={`p-3.5 rounded-2xl border text-xs leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-primary text-white border-primary/20 rounded-tr-none' 
                      : 'bg-card text-foreground border-border/50 rounded-tl-none shadow-sm'
                  }`}>
                    {/* Render plain text with markdown-lite support */}
                    <div className="whitespace-pre-line space-y-1.5">
                      {msg.text.split('\n').map((line, idx) => {
                        let content: any = line;
                        if (line.includes('**')) {
                          const parts = line.split('**');
                          content = parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-extrabold text-primary dark:text-purple-300">{part}</strong> : part);
                        }
                        
                        if (line.trim().startsWith('- ')) {
                          return (
                            <div key={idx} className="flex gap-1.5 ml-2">
                              <span>•</span>
                              <span>{line.trim().slice(2)}</span>
                            </div>
                          );
                        }
                        
                        return <p key={idx}>{content}</p>;
                      })}
                    </div>
                  </div>

                  {/* Inline product thumbnail strip (compact) */}
                  {msg.products && msg.products.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto py-1 pr-4 w-full no-scrollbar max-w-[280px] sm:max-w-[320px]">
                      {msg.products.slice(0, 3).map((prod) => (
                        <div key={prod.id} className="bg-card w-24 shrink-0 p-2 rounded-2xl border border-border/40 shadow-sm flex flex-col gap-1.5">
                          <div className="aspect-square bg-secondary/35 rounded-lg flex items-center justify-center overflow-hidden">
                            {prod.image ? (
                              <img src={prod.image} alt={prod.name} className="object-cover w-full h-full" />
                            ) : '💄'}
                          </div>
                          <p className="font-bold text-[8px] text-foreground truncate">{prod.name}</p>
                          <p className="text-[8px] font-bold text-primary">₹{Number(prod.price).toFixed(2)}</p>
                          <button
                            onClick={() => handleAddToCart(prod)}
                            className="w-full py-1 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg text-[7px] font-bold transition flex items-center justify-center gap-0.5 cursor-pointer"
                          >
                            <ShoppingCart className="w-2 h-2" />
                            <span>Add</span>
                          </button>
                        </div>
                      ))}
                      {msg.products.length > 3 && (
                        <div
                          className="w-24 shrink-0 rounded-2xl border border-primary/30 bg-primary/5 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-primary/10 transition p-2"
                          onClick={() => setOverlayData({ visual_type: 'products', products: msg.products })}
                        >
                          <span className="text-[10px] font-bold text-primary">+{msg.products.length - 3} more</span>
                          <ArrowRight className="w-3 h-3 text-primary" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Inline chart */}
                  {msg.chart && (
                    <div className="w-full max-w-[280px] sm:max-w-[320px]">
                      <SvgChart 
                        type={msg.chart.type} 
                        title={msg.chart.title} 
                        labels={msg.chart.labels} 
                        values={msg.chart.values} 
                      />
                    </div>
                  )}

                  {/* Navigation pill */}
                  {msg.navigation && (
                    <div className="flex items-center gap-1.5 text-[10px] text-primary font-semibold bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
                      <ArrowRight className="w-3 h-3" />
                      <span>Navigating to {msg.navigation}</span>
                    </div>
                  )}
                  
                  <span className="text-[8px] text-muted-foreground block px-1 self-end">{msg.time}</span>
                </div>
              </div>
            ))}

            {/* Agent Typing Indicator */}
            {loading && (
              <div className="flex gap-3 max-w-[80%] mr-auto items-center animate-pulse">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Bot className="w-4.5 h-4.5" />
                </div>
                <div className="bg-card p-3 rounded-2xl border border-border/40 text-[10px] text-muted-foreground font-medium flex items-center gap-1.5">
                  <RefreshCw className="w-3 h-3 animate-spin text-primary" />
                  <span>JARVIS is querying database...</span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Form input controls */}
          <form 
            onSubmit={handleSend}
            className="p-4 border-t border-border/50 bg-card flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask JARVIS about products, orders, navigate cart..."
              className="flex-1 p-3 rounded-2xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 text-xs"
              required
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-3 bg-primary text-white rounded-2xl hover:bg-primary/95 transition shadow-md shadow-primary/20 disabled:opacity-55 cursor-pointer flex items-center justify-center"
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          </form>

        </div>
      )}
    </>
  );
}
