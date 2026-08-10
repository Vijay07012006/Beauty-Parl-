'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ChevronDown, Search, Mail, Phone, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  title: string;
  icon: string;
  items: FAQItem[];
}

const faqData: FAQCategory[] = [
  {
    title: 'Orders',
    icon: '🛍️',
    items: [
      {
        question: 'How can I track my order?',
        answer: 'Once your order is shipped, we will send you an email confirmation with a tracking link. You can also view your order status and details directly in your Profile page under the Orders tab.'
      },
      {
        question: 'Can I cancel or modify my order after placing it?',
        answer: 'Orders can only be modified or cancelled within 1 hour of placing them. Please contact our support team immediately at support@beautyparle.com or call us to request changes.'
      },
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept Cash on Delivery (COD), UPI (Google Pay, PhonePe, Paytm), and major Credit/Debit Cards via Razorpay and Stripe.'
      }
    ]
  },
  {
    title: 'Shipping',
    icon: '🚚',
    items: [
      {
        question: 'How long does shipping take?',
        answer: 'Standard shipping takes 3-5 business days. Express shipping options are available at checkout and usually take 1-2 business days depending on your location.'
      },
      {
        question: 'Do you offer free shipping?',
        answer: 'Yes! We offer free standard shipping on all orders over $50. For orders below $50, a standard shipping fee of $5 will be applied.'
      },
      {
        question: 'Do you ship internationally?',
        answer: 'Currently, we ship to addresses within India and selected international destinations. Delivery times and customs duties vary by country.'
      }
    ]
  },
  {
    title: 'Returns',
    icon: '🔄',
    items: [
      {
        question: 'What is your return policy?',
        answer: 'We offer a 15-day return policy for unopened and unused products. Due to hygiene reasons, we cannot accept returns for opened cosmetics unless they are damaged or defective upon arrival.'
      },
      {
        question: 'How do I start a return?',
        answer: 'To initiate a return, visit our Returns Policy page or contact our support team. Pack the items securely and we will schedule a pickup from your shipping address.'
      },
      {
        question: 'When will I get my refund?',
        answer: 'Once we receive and inspect your returned items, refunds are processed within 5-7 business days to your original payment method.'
      }
    ]
  },
  {
    title: 'Products',
    icon: '💄',
    items: [
      {
        question: 'Are your products cruelty-free?',
        answer: 'Yes, Beauty Parlé is committed to ethical sourcing. All our products are 100% cruelty-free and we offer a dedicated range of vegan and organic clean beauty cosmetics.'
      },
      {
        question: 'How do I find the right shade for my skin tone?',
        answer: 'You can take our interactive Beauty Quiz or use our AI-powered Skin Analysis tool to get customized shade and product routine recommendations tailored specifically to you!'
      }
    ]
  },
  {
    title: 'Account',
    icon: '👤',
    items: [
      {
        question: 'How do I earn loyalty points?',
        answer: 'You earn 1 loyalty point for every dollar spent on products. You can also earn bonus points by completing quiz profiles or referring friends. Points can be redeemed for discounts at checkout.'
      },
      {
        question: 'I forgot my password, how do I reset it?',
        answer: 'Go to the Sign In page and click "Forgot Password?". Enter your registered email address and we will send you a password reset link.'
      }
    ]
  }
];

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIndex, setExpandedIndex] = useState<string | null>(null);

  const toggleAccordion = (categoryIndex: number, itemIndex: number) => {
    const key = `${categoryIndex}-${itemIndex}`;
    setExpandedIndex(expandedIndex === key ? null : key);
  };

  // Filter FAQs based on search query
  const filteredCategories = faqData.map((category, catIdx) => {
    const filteredItems = category.items.filter(
      item =>
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return { ...category, items: filteredItems, originalIdx: catIdx };
  }).filter(category => category.items.length > 0);

  return (
    <>
      <Header />
      <main className="min-h-screen py-16 bg-secondary/10">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h1 className="text-4xl md:text-5xl font-playfair font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Have questions? We're here to help. Search below or browse categories to find answers.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative max-w-xl mx-auto mb-12">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted-foreground">
              <Search size={20} />
            </div>
            <input
              type="text"
              placeholder="Search for questions (e.g. shipping, refund)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-full border border-border bg-card text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
            />
          </div>

          {/* FAQ list */}
          <div className="space-y-8">
            {filteredCategories.length > 0 ? (
              filteredCategories.map((category) => (
                <div key={category.title} className="space-y-4">
                  <h2 className="text-xl font-playfair font-bold text-foreground flex items-center gap-2 border-b border-border/50 pb-2">
                    <span className="text-2xl">{category.icon}</span>
                    <span>{category.title}</span>
                  </h2>

                  <div className="space-y-3">
                    {category.items.map((item, idx) => {
                      const itemKey = `${category.originalIdx}-${idx}`;
                      const isExpanded = expandedIndex === itemKey;

                      return (
                        <div
                          key={item.question}
                          className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden transition-all duration-300 hover:border-primary/30"
                        >
                          <button
                            onClick={() => toggleAccordion(category.originalIdx, idx)}
                            className="w-full px-6 py-4 flex items-center justify-between text-left font-semibold text-sm md:text-base text-foreground cursor-pointer select-none"
                          >
                            <span>{item.question}</span>
                            <ChevronDown
                              size={18}
                              className={`text-muted-foreground transition-transform duration-300 ${isExpanded ? 'rotate-180 text-primary' : ''}`}
                            />
                          </button>

                          <AnimatePresence initial={false}>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                              >
                                <div className="px-6 pb-5 pt-1 text-sm md:text-base text-muted-foreground border-t border-border/10 leading-relaxed">
                                  {item.answer}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No matching questions found. Try typing different keywords.
              </div>
            )}
          </div>

          {/* Still need help */}
          <div className="mt-16 bg-card border border-border/50 rounded-3xl p-8 text-center shadow-sm max-w-2xl mx-auto space-y-6">
            <h3 className="text-2xl font-playfair font-bold">Still have questions?</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              If you couldn't find your answers here, our customer support team is available 24/7.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold pt-2">
              <div className="p-4 bg-secondary/20 rounded-2xl flex flex-col items-center gap-2">
                <Mail size={18} className="text-primary" />
                <span>support@beautyparle.com</span>
              </div>
              <div className="p-4 bg-secondary/20 rounded-2xl flex flex-col items-center gap-2">
                <Phone size={18} className="text-primary" />
                <span>+91 98765 43210</span>
              </div>
              <div className="p-4 bg-secondary/20 rounded-2xl flex flex-col items-center gap-2">
                <Clock size={18} className="text-primary" />
                <span>Mon-Sat: 9am - 8pm</span>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
