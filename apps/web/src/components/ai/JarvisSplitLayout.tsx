'use client';

/**
 * JarvisSplitLayout — Mission Control style floating overlay.
 *
 * ISOLATION CONTRACT:
 * - Rendered as a fixed-position layer (z-50). It overlays the page but does
 *   NOT modify any parent DOM, layout, CSS variable, or route.
 * - The backdrop is semi-transparent so the underlying page remains visible.
 * - Closing the overlay restores the page to exactly its previous state.
 * - No global style side-effects are introduced here.
 */

import { useEffect, useRef } from 'react';
import { Bot, X, Sparkles, Download, RefreshCw, Send, ShoppingCart, ArrowRight, Mic, MicOff } from 'lucide-react';
import { VisualContentRenderer, type VisualContent } from './VisualContentRenderer';
import { VoiceSettings } from './VoiceSettings';

export interface SplitMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  products?: any[];
  chart?: any;
  navigation?: string;
  time: string;
}

interface JarvisSplitLayoutProps {
  isOpen: boolean;
  onClose: () => void;
  messages: SplitMessage[];
  loading: boolean;
  input: string;
  onInputChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onExportPDF: () => void;
  onAddToCart: (product: any) => void;
  visualContent: VisualContent | null;
  onQuickCommand?: (cmd: string) => void;
  isListening: boolean;
  onToggleListen: () => void;
  ttsEnabled: boolean;
  onTtsChange: (enabled: boolean) => void;
  sttEnabled: boolean;
  onSttChange: (enabled: boolean) => void;
}

// ─── Simple markdown-lite renderer ───────────────────────────────────────────

function MsgText({ text }: { text: string }) {
  return (
    <div className="whitespace-pre-line space-y-1 text-xs leading-relaxed">
      {text.split('\n').map((line, idx) => {
        if (line.includes('**')) {
          const parts = line.split('**');
          const content = parts.map((part, i) =>
            i % 2 === 1
              ? <strong key={i} className="font-extrabold text-primary dark:text-purple-300">{part}</strong>
              : part
          );
          return line.trim().startsWith('- ')
            ? <div key={idx} className="flex gap-1.5 ml-2"><span>•</span><span>{content.slice(1)}</span></div>
            : <p key={idx}>{content}</p>;
        }
        if (line.trim().startsWith('- ')) {
          return <div key={idx} className="flex gap-1.5 ml-2"><span>•</span><span>{line.trim().slice(2)}</span></div>;
        }
        return <p key={idx}>{line}</p>;
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function JarvisSplitLayout({
  isOpen,
  onClose,
  messages,
  loading,
  input,
  onInputChange,
  onSubmit,
  onExportPDF,
  onAddToCart,
  visualContent,
  onQuickCommand,
  isListening,
  onToggleListen,
  ttsEnabled,
  onTtsChange,
  sttEnabled,
  onSttChange,
}: JarvisSplitLayoutProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Safe rendering with fallback
  const renderContent = () => {
    if (!visualContent || visualContent.visualType === 'empty') {
      return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center px-6">
          <p className="text-sm font-semibold text-foreground">Ask JARVIS to show products, charts, or comparisons</p>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => onQuickCommand?.('show products')}
              className="px-4 py-2 bg-secondary hover:bg-primary/10 hover:text-primary rounded-full text-xs font-semibold transition cursor-pointer"
            >
              Show products
            </button>
            <button
              onClick={() => onQuickCommand?.('sales chart')}
              className="px-4 py-2 bg-secondary hover:bg-primary/10 hover:text-primary rounded-full text-xs font-semibold transition cursor-pointer"
            >
              Sales chart
            </button>
          </div>
        </div>
      );
    }

    try {
      return <VisualContentRenderer content={visualContent} />;
    } catch (error) {
      console.error('Visual render error:', error);
      return <div className="text-red-500 text-xs p-4">Something went wrong rendering visual content. Please try again.</div>;
    }
  };

  // Auto-scroll chat on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Prevent body scroll while overlay is open (restore on close)
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const hasVisualContent = visualContent && visualContent.visualType !== 'empty';

  return (
    // Fixed overlay — does NOT affect page layout at all
    <div
      className="fixed inset-0 z-[9998] flex"
      role="dialog"
      aria-modal="true"
      aria-label="JARVIS Mission Control"
    >
      {/* Semi-transparent backdrop — page shows through */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── Overlay content — stops click propagation ─────────────────────── */}
      <div
        className="relative z-10 flex w-full h-full pointer-events-none items-end justify-end md:items-stretch md:justify-start"
        style={{ padding: '1rem' }}
      >
        {/* ── Left Panel: Chat (fixed 380px, full height) ───────────────────── */}
        <div
          className="
            pointer-events-auto
            flex flex-col
            w-full max-w-[380px]
            h-[500px] max-h-[75vh] md:h-full
            bg-card/95 backdrop-blur-xl
            border border-border/50 rounded-3xl
            shadow-2xl overflow-hidden
            animate-in slide-in-from-left duration-300
          "
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="shrink-0 px-4 py-3 bg-gradient-to-r from-primary/10 to-purple-500/10 border-b border-border/50 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <Bot className="w-4 h-4" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-background" />
                </div>
                <div>
                  <h2 className="font-bold text-sm text-foreground flex items-center gap-1">
                    JARVIS AI <Sparkles className="w-3 h-3 text-primary animate-pulse" />
                  </h2>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Mission Control</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={onExportPDF}
                  disabled={messages.length <= 1}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-xl transition cursor-pointer disabled:opacity-40"
                  title="Export PDF"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-xl transition cursor-pointer"
                  title="Close JARVIS"
                  aria-label="Close JARVIS"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Voice Settings Toggles */}
            <VoiceSettings
              ttsEnabled={ttsEnabled}
              onTtsChange={onTtsChange}
              sttEnabled={sttEnabled}
              onSttChange={onSttChange}
            />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary/10" id="jarvis-split-chat-messages">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div className={`max-w-[82%] flex flex-col gap-1.5 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`px-3.5 py-2.5 rounded-2xl border ${
                    msg.role === 'user'
                      ? 'bg-primary text-white border-primary/20 rounded-tr-none'
                      : 'bg-card text-foreground border-border/50 rounded-tl-none shadow-sm'
                  }`}>
                    <MsgText text={msg.text} />
                  </div>

                  {/* Compact product strip inside chat */}
                  {msg.products && msg.products.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar max-w-[260px]">
                      {msg.products.slice(0, 3).map((p: any) => (
                        <div key={p.id} className="shrink-0 w-20 bg-card border border-border/40 rounded-xl p-1.5 space-y-1">
                          <div className="aspect-square bg-secondary/30 rounded-lg overflow-hidden">
                            {p.image
                              ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center text-lg">💄</div>
                            }
                          </div>
                          <p className="text-[8px] font-semibold text-foreground truncate">{p.name}</p>
                          <button
                            onClick={() => onAddToCart(p)}
                            className="w-full py-0.5 rounded-lg bg-primary/10 text-primary text-[7px] font-bold hover:bg-primary hover:text-white transition flex items-center justify-center gap-0.5 cursor-pointer"
                          >
                            <ShoppingCart className="w-2 h-2" /> Add
                          </button>
                        </div>
                      ))}
                      {msg.products.length > 3 && (
                        <div className="shrink-0 w-20 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-center">
                          <span className="text-[9px] font-bold text-primary">+{msg.products.length - 3} more</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Navigation pill */}
                  {msg.navigation && (
                    <div className="flex items-center gap-1.5 text-[10px] text-primary font-semibold bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                      <ArrowRight className="w-3 h-3" />
                      <span>Navigating to {msg.navigation}</span>
                    </div>
                  )}

                  <span className="text-[8px] text-muted-foreground px-1">{msg.time}</span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 items-center">
                <div className="w-7 h-7 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-card px-3 py-2 rounded-2xl border border-border/40 text-[10px] text-muted-foreground flex items-center gap-1.5">
                  <RefreshCw className="w-3 h-3 animate-spin text-primary" />
                  JARVIS is thinking...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={onSubmit} className="shrink-0 p-3 border-t border-border/50 bg-card flex gap-2 items-center">
            {sttEnabled && (
              <button
                type="button"
                onClick={onToggleListen}
                className={`p-2.5 rounded-2xl border transition duration-200 cursor-pointer flex items-center justify-center shrink-0 ${
                  isListening
                    ? 'bg-red-500 border-red-500 text-white animate-pulse'
                    : 'bg-secondary/40 border-border/40 hover:bg-secondary text-muted-foreground hover:text-foreground'
                }`}
                title={isListening ? 'Stop listening' : 'Start listening'}
              >
                <Mic className="w-4 h-4" />
              </button>
            )}
            
            <div className="relative flex-1">
              <input
                type="text"
                value={input}
                onChange={(e) => onInputChange(e.target.value)}
                placeholder={isListening ? 'Listening...' : 'Ask JARVIS anything...'}
                className="w-full px-3 py-2.5 rounded-2xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 text-xs"
                disabled={loading}
              />
              {isListening && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 pointer-events-none">
                  <span className="w-0.5 h-2.5 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <span className="w-0.5 h-3.5 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <span className="w-0.5 h-2.5 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2.5 bg-primary text-white rounded-2xl hover:bg-primary/90 transition shadow-md shadow-primary/20 disabled:opacity-50 cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* ── Right Panel: Visual Content (flex-1, full height, hidden on mobile) ── */}
        <div
          className={`
            pointer-events-auto
            hidden md:flex flex-col
            flex-1 ml-3 h-full
            bg-card/90 backdrop-blur-xl
            border border-border/50 rounded-3xl
            shadow-2xl overflow-hidden
            animate-in slide-in-from-right duration-300
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Panel Header */}
          <div className="shrink-0 px-5 py-3 bg-gradient-to-r from-purple-500/10 to-primary/5 border-b border-border/50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                {hasVisualContent
                  ? visualContent?.visualType === 'products'
                    ? `${visualContent.products?.length ?? 0} Products`
                    : visualContent?.visualType === 'chart'
                    ? 'Analytics Chart'
                    : visualContent?.visualType === 'comparison'
                    ? 'Comparison Table'
                    : visualContent?.visualType === 'web_search'
                    ? 'Search Results'
                    : visualContent?.visualType === 'image'
                    ? 'Generated Image'
                    : 'Visual Output'
                  : 'Visual Panel'
                }
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Results appear here automatically</p>
            </div>
            {hasVisualContent && (
              <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 capitalize">
                {visualContent?.visualType}
              </span>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden p-5">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
