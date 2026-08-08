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
  const { user, logout, hydrate } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname?.split('/')[1] || 'en';
  
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center gap-2 group">
          <span className="text-2xl font-playfair font-bold text-primary group-hover:scale-105 transition-transform select-none">
            Beauty Parlé
          </span>
          <Sparkles size={16} className="text-accent animate-pulse" />
        </Link>
 
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href={`/${locale}/products`} className="text-sm font-medium hover:text-primary transition-colors relative group">
            {t('products')}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
          </Link>
          <Link href={`/${locale}/categories`} className="text-sm font-medium hover:text-primary transition-colors relative group">
            {t('categories')}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
          </Link>
          <Link href={`/${locale}/booking`} className="text-sm font-medium hover:text-primary transition-colors relative group">
            {t('book_appointment')}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
          </Link>
          <Link href={`/${locale}/about`} className="text-sm font-medium hover:text-primary transition-colors relative group">
            {t('about')}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
          </Link>
          <Link href={`/${locale}/wishlist`} className="text-sm font-medium hover:text-primary transition-colors relative group">
            {t('wishlist')}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
          </Link>
        </nav>
 
        {/* Right Actions */}
        <div className="flex items-center gap-4">
          {/* Language Switcher Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border hover:border-primary/70 transition-colors text-xs font-semibold bg-secondary/20 cursor-pointer select-none"
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
          
          {/* Wishlist */}
          <Link href={`/${locale}/wishlist`} className="relative p-2 hover:bg-secondary rounded-full transition-colors" aria-label="Wishlist">
            <Heart size={20} className={mounted && wishlistCount > 0 ? 'fill-red-500 text-red-500' : ''} />
            {mounted && wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold animate-pulse">
                {wishlistCount > 99 ? '99+' : wishlistCount}
              </span>
            )}
          </Link>

          {/* Cart */}
          <Link href={`/${locale}/cart`} className="relative p-2 hover:bg-secondary rounded-full transition-colors" aria-label="Cart">
            <ShoppingCart size={20} />
            <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
              {mounted ? totalItems() : 0}
            </span>
          </Link>

          {/* Auth Button */}
          {user ? (
            <div className="hidden lg:flex items-center gap-4 text-xs font-semibold">
              <Link href={`/${locale}/profile`} className="hover:text-primary transition-colors">
                {t('profile')}
              </Link>
              <Link href={`/${locale}/orders`} className="hover:text-primary transition-colors">
                {t('orders')}
              </Link>
              <Link href={`/${locale}/preferences`} className="hover:text-primary transition-colors">
                {t('preferences')}
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
            className="lg:hidden p-2 hover:bg-secondary rounded-full transition-colors cursor-pointer"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
  
      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl"
          >
            <nav className="container mx-auto px-4 py-6 flex flex-col gap-4">
              <Link href={`/${locale}/products`} className="text-sm font-medium hover:text-primary transition-colors py-2" onClick={() => setIsMenuOpen(false)}>
                {t('products')}
              </Link>
              <Link href={`/${locale}/categories`} className="text-sm font-medium hover:text-primary transition-colors py-2" onClick={() => setIsMenuOpen(false)}>
                {t('categories')}
              </Link>
              <Link href={`/${locale}/booking`} className="text-sm font-medium hover:text-primary transition-colors py-2" onClick={() => setIsMenuOpen(false)}>
                {t('book_appointment')}
              </Link>
              <Link href={`/${locale}/about`} className="text-sm font-medium hover:text-primary transition-colors py-2" onClick={() => setIsMenuOpen(false)}>
                {t('about')}
              </Link>
              <Link href={`/${locale}/wishlist`} className="text-sm font-medium hover:text-primary transition-colors py-2" onClick={() => setIsMenuOpen(false)}>
                {t('wishlist')}
              </Link>
              {user ? (
                <>
                  <Link href={`/${locale}/profile`} className="text-sm font-medium hover:text-primary transition-colors py-2" onClick={() => setIsMenuOpen(false)}>
                    {t('profile')}
                  </Link>
                  <Link href={`/${locale}/orders`} className="text-sm font-medium hover:text-primary transition-colors py-2" onClick={() => setIsMenuOpen(false)}>
                    {t('orders')}
                  </Link>
                  <Link href={`/${locale}/preferences`} className="text-sm font-medium hover:text-primary transition-colors py-2" onClick={() => setIsMenuOpen(false)}>
                    {t('preferences')}
                  </Link>
                  <button 
                    onClick={() => { logout(); setIsMenuOpen(false); }} 
                    className="text-sm font-medium hover:text-primary transition-colors py-2 text-left cursor-pointer"
                  >
                    {t('logout')}
                  </button>
                </>
              ) : (
                <Link href={`/${locale}/auth/login`} className="text-sm font-medium hover:text-primary transition-colors py-2" onClick={() => setIsMenuOpen(false)}>
                  {t('sign_in')}
                </Link>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
