'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingCart, Menu, X, Sparkles, Heart, Globe, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useTranslations } from 'next-intl';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'bn', name: 'বাংলা', flag: '🇮🇳' },
  { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
  { code: 'mr', name: 'मराठी', flag: '🇮🇳' },
  { code: 'gu', name: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'kn', name: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml', name: 'മലയാളം', flag: '🇮🇳' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
];

export function Header() {
  const t = useTranslations('common');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  
  const { user, logout, hydrate } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname?.split('/')[1] || 'en';
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const exploreRef = useRef<HTMLDivElement>(null);

  const { totalItems } = useCartStore();
  const wishlistCount = useWishlistStore((state) => state.items.length);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    hydrate();
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
      if (exploreRef.current && !exploreRef.current.contains(event.target as Node)) {
        setIsExploreOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const switchLanguage = (newLocale: string) => {
    const pathSegments = pathname.split('/');
    pathSegments[1] = newLocale;
    router.push(pathSegments.join('/') || '/');
    setIsLangOpen(false);
  };

  const activeLang = languages.find(l => l.code === locale) || languages[0];

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 transition-colors duration-300">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center gap-2 group">
          <span className="text-xl md:text-2xl font-playfair font-bold text-primary group-hover:scale-105 transition-transform select-none">
            Beauty Parlé
          </span>
          <Sparkles size={16} className="text-accent animate-pulse" />
        </Link>
 
        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-5 lg:gap-6 xl:gap-8">
          <Link href={`/${locale}/products`} className="text-xs lg:text-sm font-medium hover:text-primary transition-colors relative group">
            {t('products')}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
          </Link>
          <Link href={`/${locale}/categories`} className="text-xs lg:text-sm font-medium hover:text-primary transition-colors relative group">
            {t('categories')}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
          </Link>
          <Link href={`/${locale}/booking`} className="text-xs lg:text-sm font-medium hover:text-primary transition-colors relative group">
            {t('book_appointment')}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
          </Link>
          <Link href={`/${locale}/live-shopping`} className="text-xs lg:text-sm font-medium hover:text-primary transition-colors relative group">
            Live Shopping
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
          </Link>
          <Link href={`/${locale}/loyalty`} className="text-xs lg:text-sm font-medium hover:text-primary transition-colors relative group">
            Loyalty
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
          </Link>

          {/* Explore Dropdown */}
          <div className="relative" ref={exploreRef}>
            <button
              onClick={() => setIsExploreOpen(!isExploreOpen)}
              className="text-xs lg:text-sm font-medium hover:text-primary transition-colors flex items-center gap-1 cursor-pointer select-none"
            >
              <span>Explore</span>
              <ChevronDown size={12} className={`transition-transform duration-200 ${isExploreOpen ? 'rotate-180' : ''}`} />
            </button>
            
            <AnimatePresence>
              {isExploreOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 mt-2 bg-card rounded-2xl shadow-xl border border-border/50 p-2 w-48 z-50 space-y-0.5"
                >
                  <Link href={`/${locale}/quiz`} onClick={() => setIsExploreOpen(false)} className="block px-3 py-2 rounded-xl text-xs font-semibold hover:bg-secondary/70 transition-colors">
                    Beauty Quiz
                  </Link>
                  <Link href={`/${locale}/skin-analysis`} onClick={() => setIsExploreOpen(false)} className="block px-3 py-2 rounded-xl text-xs font-semibold hover:bg-secondary/70 transition-colors">
                    Skin Analysis
                  </Link>
                  <Link href={`/${locale}/routine-builder`} onClick={() => setIsExploreOpen(false)} className="block px-3 py-2 rounded-xl text-xs font-semibold hover:bg-secondary/70 transition-colors">
                    Routine Builder
                  </Link>
                  <Link href={`/${locale}/beauty-box`} onClick={() => setIsExploreOpen(false)} className="block px-3 py-2 rounded-xl text-xs font-semibold hover:bg-secondary/70 transition-colors">
                    Beauty Box
                  </Link>
                  <Link href={`/${locale}/gamification`} onClick={() => setIsExploreOpen(false)} className="block px-3 py-2 rounded-xl text-xs font-semibold hover:bg-secondary/70 transition-colors">
                    Achievements
                  </Link>
                  <Link href={`/${locale}/referral`} onClick={() => setIsExploreOpen(false)} className="block px-3 py-2 rounded-xl text-xs font-semibold hover:bg-secondary/70 transition-colors">
                    Referrals
                  </Link>
                  <Link href={`/${locale}/looks`} onClick={() => setIsExploreOpen(false)} className="block px-3 py-2 rounded-xl text-xs font-semibold hover:bg-secondary/70 transition-colors text-primary font-bold">
                    Shop by Look
                  </Link>
                  <Link href={`/${locale}/clean-beauty`} onClick={() => setIsExploreOpen(false)} className="block px-3 py-2 rounded-xl text-xs font-semibold hover:bg-secondary/70 transition-colors text-emerald-600 font-bold">
                    Clean Beauty
                  </Link>
                  <Link href={`/${locale}/about`} onClick={() => setIsExploreOpen(false)} className="block px-3 py-2 rounded-xl text-xs font-semibold hover:bg-secondary/70 transition-colors">
                    {t('about')}
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>
 
        {/* Right Actions */}
        <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
          
          {/* Dark/Light Mode Theme Toggle */}
          <ThemeToggle />

          {/* Language Switcher Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-border hover:border-primary/70 transition-colors text-[10px] md:text-xs font-semibold bg-secondary/20 cursor-pointer select-none"
            >
              <Globe size={14} className="text-muted-foreground" />
              <span>{activeLang.flag}</span>
              <span className="hidden sm:inline font-mono">{locale.toUpperCase()}</span>
              <ChevronDown size={12} className={`text-muted-foreground transition-transform duration-200 ${isLangOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isLangOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full right-0 mt-2 bg-card rounded-2xl shadow-xl border border-border/50 p-1.5 w-44 max-h-64 overflow-y-auto z-50 space-y-0.5"
                >
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => switchLanguage(lang.code)}
                      className={`w-full text-left px-3 py-2 rounded-xl hover:bg-secondary/70 transition-colors flex items-center gap-2.5 text-xs font-medium cursor-pointer ${
                        locale === lang.code ? 'bg-primary/10 text-primary font-bold' : 'text-foreground/80'
                      }`}
                    >
                      <span className="text-sm">{lang.flag}</span>
                      <span>{lang.name}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Wishlist Icon */}
          <Link href={`/${locale}/wishlist`} className="relative p-2 hover:bg-secondary rounded-full transition-colors hidden sm:block" aria-label="Wishlist">
            <Heart size={18} className={mounted && wishlistCount > 0 ? 'fill-red-500 text-red-500' : ''} />
            {mounted && wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Cart Icon */}
          <Link href={`/${locale}/cart`} className="relative p-2 hover:bg-secondary rounded-full transition-colors" aria-label="Cart">
            <ShoppingCart size={18} />
            <span className="absolute -top-1 -right-1 bg-primary text-white text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold">
              {mounted ? totalItems() : 0}
            </span>
          </Link>

          {/* Auth Button */}
          {user ? (
            <div className="hidden lg:flex items-center gap-4 text-xs font-semibold">
              {user.loyaltyPoints !== undefined && (
                <Link href={`/${locale}/loyalty`} className="px-2 py-0.5 bg-primary/10 border border-primary/20 text-primary rounded-full font-mono font-bold text-[10px]" title="Loyalty Points">
                  ⭐ {user.loyaltyPoints} pts
                </Link>
              )}
              <Link href={`/${locale}/profile`} className="hover:text-primary transition-colors">
                {t('profile')}
              </Link>
              <Link href={`/${locale}/orders`} className="hover:text-primary transition-colors">
                {t('orders')}
              </Link>
              <Link href={`/${locale}/subscriptions`} className="hover:text-primary transition-colors">
                Subscriptions
              </Link>
              <Link href={`/${locale}/ai-history`} className="hover:text-primary transition-colors">
                AI History
              </Link>
              <button onClick={logout} className="hover:text-primary transition-colors cursor-pointer">
                {t('logout')}
              </button>
            </div>
          ) : (
            <Link href={`/${locale}/auth/login`} className="hidden lg:block text-sm hover:text-primary transition-colors font-medium">
              {t('sign_in')}
            </Link>
          )}
 
          {/* Mobile Menu Toggle */}
          <button 
            className="lg:hidden p-2 hover:bg-secondary rounded-full transition-colors cursor-pointer text-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
  
      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-border/50 bg-card overflow-hidden shadow-lg transition-colors duration-300"
          >
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-1.5">
              
              {/* Quick Actions Row */}
              <div className="flex items-center justify-around py-3 border-b border-border/40 mb-3 bg-secondary/10 rounded-2xl">
                <Link href={`/${locale}/wishlist`} onClick={() => setIsMenuOpen(false)} className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
                  <div className="relative p-2 bg-card rounded-full border border-border/20 shadow-sm">
                    <Heart size={16} className={wishlistCount > 0 ? 'fill-red-500 text-red-500' : ''} />
                    {wishlistCount > 0 && <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold">{wishlistCount}</span>}
                  </div>
                  <span className="text-[10px] font-bold">Wishlist</span>
                </Link>
                <Link href={`/${locale}/cart`} onClick={() => setIsMenuOpen(false)} className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
                  <div className="relative p-2 bg-card rounded-full border border-border/20 shadow-sm">
                    <ShoppingCart size={16} />
                    <span className="absolute -top-0.5 -right-0.5 bg-primary text-white text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold">{totalItems()}</span>
                  </div>
                  <span className="text-[10px] font-bold">Cart</span>
                </Link>
                {user ? (
                  <Link href={`/${locale}/profile`} onClick={() => setIsMenuOpen(false)} className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
                    <div className="p-2 bg-card rounded-full border border-border/20 shadow-sm">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </div>
                    <span className="text-[10px] font-bold">Profile</span>
                  </Link>
                ) : (
                  <Link href={`/${locale}/auth/login`} onClick={() => setIsMenuOpen(false)} className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
                    <div className="p-2 bg-card rounded-full border border-border/20 shadow-sm">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                    </div>
                    <span className="text-[10px] font-bold">Sign In</span>
                  </Link>
                )}
              </div>

              {/* Navigation Links */}
              <Link href={`/${locale}/products`} className="text-xs font-semibold hover:text-primary transition-colors py-2 px-3 hover:bg-secondary/40 rounded-xl" onClick={() => setIsMenuOpen(false)}>
                {t('products')}
              </Link>
              <Link href={`/${locale}/categories`} className="text-xs font-semibold hover:text-primary transition-colors py-2 px-3 hover:bg-secondary/40 rounded-xl" onClick={() => setIsMenuOpen(false)}>
                {t('categories')}
              </Link>
              <Link href={`/${locale}/booking`} className="text-xs font-semibold hover:text-primary transition-colors py-2 px-3 hover:bg-secondary/40 rounded-xl" onClick={() => setIsMenuOpen(false)}>
                {t('book_appointment')}
              </Link>
              <Link href={`/${locale}/looks`} className="text-xs font-bold text-primary hover:text-primary/80 transition-colors py-2 px-3 hover:bg-secondary/40 rounded-xl" onClick={() => setIsMenuOpen(false)}>
                ✨ Shop by Look
              </Link>
              <Link href={`/${locale}/clean-beauty`} className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors py-2 px-3 hover:bg-emerald-50/20 rounded-xl" onClick={() => setIsMenuOpen(false)}>
                🌱 Clean Beauty Filter
              </Link>
              <Link href={`/${locale}/quiz`} className="text-xs font-semibold hover:text-primary transition-colors py-2 px-3 hover:bg-secondary/40 rounded-xl" onClick={() => setIsMenuOpen(false)}>
                Beauty Quiz
              </Link>
              <Link href={`/${locale}/skin-analysis`} className="text-xs font-semibold hover:text-primary transition-colors py-2 px-3 hover:bg-secondary/40 rounded-xl" onClick={() => setIsMenuOpen(false)}>
                Skin Analysis
              </Link>
              <Link href={`/${locale}/routine-builder`} className="text-xs font-semibold hover:text-primary transition-colors py-2 px-3 hover:bg-secondary/40 rounded-xl" onClick={() => setIsMenuOpen(false)}>
                Routine Builder
              </Link>
              <Link href={`/${locale}/beauty-box`} className="text-xs font-semibold hover:text-primary transition-colors py-2 px-3 hover:bg-secondary/40 rounded-xl" onClick={() => setIsMenuOpen(false)}>
                Beauty Box
              </Link>
              <Link href={`/${locale}/live-shopping`} className="text-xs font-semibold hover:text-primary transition-colors py-2 px-3 hover:bg-secondary/40 rounded-xl" onClick={() => setIsMenuOpen(false)}>
                Live Shopping
              </Link>
              <Link href={`/${locale}/loyalty`} className="text-xs font-semibold hover:text-primary transition-colors py-2 px-3 hover:bg-secondary/40 rounded-xl" onClick={() => setIsMenuOpen(false)}>
                Loyalty
              </Link>
              <Link href={`/${locale}/gamification`} className="text-xs font-semibold hover:text-primary transition-colors py-2 px-3 hover:bg-secondary/40 rounded-xl" onClick={() => setIsMenuOpen(false)}>
                Achievements
              </Link>
              <Link href={`/${locale}/referral`} className="text-xs font-semibold hover:text-primary transition-colors py-2 px-3 hover:bg-secondary/40 rounded-xl" onClick={() => setIsMenuOpen(false)}>
                Referrals
              </Link>
              <Link href={`/${locale}/about`} className="text-xs font-semibold hover:text-primary transition-colors py-2 px-3 hover:bg-secondary/40 rounded-xl" onClick={() => setIsMenuOpen(false)}>
                {t('about')}
              </Link>
              <Link href={`/${locale}/faq`} className="text-xs font-semibold hover:text-primary transition-colors py-2 px-3 hover:bg-secondary/40 rounded-xl" onClick={() => setIsMenuOpen(false)}>
                FAQ
              </Link>
              <Link href={`/${locale}/contact`} className="text-xs font-semibold hover:text-primary transition-colors py-2 px-3 hover:bg-secondary/40 rounded-xl" onClick={() => setIsMenuOpen(false)}>
                Contact Us
              </Link>
              <Link href={`/${locale}/blog`} className="text-xs font-semibold hover:text-primary transition-colors py-2 px-3 hover:bg-secondary/40 rounded-xl" onClick={() => setIsMenuOpen(false)}>
                Blog
              </Link>
              <Link href={`/${locale}/terms`} className="text-xs font-semibold hover:text-primary transition-colors py-2 px-3 hover:bg-secondary/40 rounded-xl" onClick={() => setIsMenuOpen(false)}>
                Terms of Service
              </Link>
              <Link href={`/${locale}/privacy`} className="text-xs font-semibold hover:text-primary transition-colors py-2 px-3 hover:bg-secondary/40 rounded-xl" onClick={() => setIsMenuOpen(false)}>
                Privacy Policy
              </Link>
              <Link href={`/${locale}/shipping`} className="text-xs font-semibold hover:text-primary transition-colors py-2 px-3 hover:bg-secondary/40 rounded-xl" onClick={() => setIsMenuOpen(false)}>
                Shipping Policy
              </Link>
              <Link href={`/${locale}/returns`} className="text-xs font-semibold hover:text-primary transition-colors py-2 px-3 hover:bg-secondary/40 rounded-xl" onClick={() => setIsMenuOpen(false)}>
                Returns Policy
              </Link>
              
              {user && (
                <>
                  <div className="border-t border-border/40 my-2 pt-2" />
                  <Link href={`/${locale}/profile`} className="text-xs font-semibold hover:text-primary transition-colors py-2 px-3 hover:bg-secondary/40 rounded-xl" onClick={() => setIsMenuOpen(false)}>
                    {t('profile')}
                  </Link>
                  <Link href={`/${locale}/orders`} className="text-xs font-semibold hover:text-primary transition-colors py-2 px-3 hover:bg-secondary/40 rounded-xl" onClick={() => setIsMenuOpen(false)}>
                    {t('orders')}
                  </Link>
                  <Link href={`/${locale}/subscriptions`} className="text-xs font-semibold hover:text-primary transition-colors py-2 px-3 hover:bg-secondary/40 rounded-xl" onClick={() => setIsMenuOpen(false)}>
                    Subscriptions
                  </Link>
                  <Link href={`/${locale}/ai-history`} className="text-xs font-semibold hover:text-primary transition-colors py-2 px-3 hover:bg-secondary/40 rounded-xl" onClick={() => setIsMenuOpen(false)}>
                    AI History
                  </Link>
                  <button 
                    onClick={() => { logout(); setIsMenuOpen(false); }} 
                    className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors py-2 px-3 hover:bg-rose-500/10 rounded-xl text-left cursor-pointer w-full"
                  >
                    {t('logout')}
                  </button>
                </>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
