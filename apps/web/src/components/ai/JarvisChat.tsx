'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { api } from '@/lib/api';
import { SvgChart } from './SvgChart';
import { 
  Bot, MessageSquare, Send, X, Download, RefreshCw, 
  Sparkles, ArrowRight, ShoppingCart, User, HelpCircle 
} from 'lucide-react';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  products?: any[];
  chart?: any;
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

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setSessionId(`sess_jarvis_${Date.now()}`);
    // Load a welcome message
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        text: `🌸 Hello ${user?.name || 'there'}! I am **JARVIS**, your personal Beauty Parlé AI Assistant. 

How can I assist you today? You can ask me to:
- 💄 **Recommend products** matching skin concerns or shade queries.
- 📦 **View order details** ("check my order #5").
- ${user?.role === 'admin' || user?.role === 'super_admin' ? '- 📊 **Check sales statistics** ("show revenue today/this week").\n' : ''}- ⚙️ **Navigate the website** ("go to coupons page").
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

    const userText = input;
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
          text: data.reply,
          products: data.products,
          chart: data.chart,
          time: assistantTime,
        }
      ]);

      // If AI requested navigation
      if (data.navigation) {
        toast.info(`Redirecting you to ${data.navigation}... 🚀`);
        setTimeout(() => {
          router.push(`/${locale}${data.navigation}`);
          setIsOpen(false);
        }, 1800);
      }

    } catch (err: any) {
      console.error('Failed to get reply from JARVIS', err);
      toast.error('Error connecting to JARVIS. Try again.');
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
                    {/* Render plain text with markdown support (bolding and bullet lists) */}
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

                  {/* Render Visual Products widget if attached */}
                  {msg.products && msg.products.length > 0 && (
                    <div className="flex gap-3 overflow-x-auto py-1 pr-4 w-full no-scrollbar max-w-[280px] sm:max-w-[320px]">
                      {msg.products.map((prod) => (
                        <div key={prod.id} className="bg-card w-36 shrink-0 p-2.5 rounded-2xl border border-border/40 shadow-sm flex flex-col justify-between space-y-2">
                          <div className="space-y-1">
                            <div className="aspect-square bg-secondary/35 rounded-xl flex items-center justify-center text-xl relative overflow-hidden">
                              {prod.image ? (
                                <img src={prod.image} alt={prod.name} className="object-cover w-full h-full" />
                              ) : '💄'}
                            </div>
                            <h5 className="font-bold text-[9px] text-foreground truncate">{prod.name}</h5>
                            <p className="text-[9px] font-bold text-primary">${Number(prod.price).toFixed(2)}</p>
                          </div>
                          <button
                            onClick={() => handleAddToCart(prod)}
                            className="w-full py-1.5 bg-primary/10 text-primary hover:bg-primary text-white rounded-lg text-[8px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <ShoppingCart className="w-2.5 h-2.5" />
                            <span>Add</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Render Visual Svg Chart widget if attached */}
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
              placeholder="Ask JARVIS about sales, products, coupons..."
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
