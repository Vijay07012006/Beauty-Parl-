'use client';
 
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Menu, X, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';

 
export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout, hydrate } = useAuthStore();
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'en';


  const { totalItems } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    hydrate();
    setMounted(true);
  }, []);

 
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center gap-2 group">
          <span className="text-2xl font-playfair font-bold text-primary group-hover:scale-105 transition-transform">
            Beauty Parlé
          </span>
          <Sparkles size={16} className="text-accent animate-pulse" />
        </Link>
 
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href={`/${locale}/products`} className="text-sm font-medium hover:text-primary transition-colors relative group">
            Products
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
          </Link>
          <Link href={`/${locale}/categories`} className="text-sm font-medium hover:text-primary transition-colors relative group">
            Categories
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
          </Link>
          <Link href={`/${locale}/booking`} className="text-sm font-medium hover:text-primary transition-colors relative group">
            Book Appointment
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
          </Link>
          <Link href={`/${locale}/about`} className="text-sm font-medium hover:text-primary transition-colors relative group">
            About
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
          </Link>
        </nav>
 
        {/* Right Actions */}
        <div className="flex items-center gap-4">
          {/* Language Switcher */}
          <button className="text-sm px-3 py-1 rounded-full border border-border hover:border-primary transition-colors cursor-pointer">
            🌐 EN
          </button>
          
          {/* Cart */}
          <Link href={`/${locale}/cart`} className="relative p-2 hover:bg-secondary rounded-full transition-colors">
            <ShoppingCart size={20} />
            <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
              {mounted ? totalItems() : 0}
            </span>
          </Link>

          {/* Auth Button */}
          {user ? (
            <button onClick={logout} className="text-sm hover:text-primary transition-colors cursor-pointer font-medium">
              Logout
            </button>
          ) : (
            <Link href={`/${locale}/auth/login`} className="text-sm hover:text-primary transition-colors font-medium">
              Sign In
            </Link>
          )}
 
          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 hover:bg-secondary rounded-full transition-colors cursor-pointer"
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
            className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl"
          >
            <nav className="container mx-auto px-4 py-6 flex flex-col gap-4">
              <Link href={`/${locale}/products`} className="text-sm font-medium hover:text-primary transition-colors py-2" onClick={() => setIsMenuOpen(false)}>
                Products
              </Link>
              <Link href={`/${locale}/categories`} className="text-sm font-medium hover:text-primary transition-colors py-2" onClick={() => setIsMenuOpen(false)}>
                Categories
              </Link>
              <Link href={`/${locale}/booking`} className="text-sm font-medium hover:text-primary transition-colors py-2" onClick={() => setIsMenuOpen(false)}>
                Book Appointment
              </Link>
              <Link href={`/${locale}/about`} className="text-sm font-medium hover:text-primary transition-colors py-2" onClick={() => setIsMenuOpen(false)}>
                About
              </Link>
              <Link href={`/${locale}/contact`} className="text-sm font-medium hover:text-primary transition-colors py-2" onClick={() => setIsMenuOpen(false)}>
                Contact
              </Link>
              {user ? (
                <button 
                  onClick={() => { logout(); setIsMenuOpen(false); }} 
                  className="text-sm font-medium hover:text-primary transition-colors py-2 text-left cursor-pointer"
                >
                  Logout
                </button>
              ) : (
                <Link href={`/${locale}/auth/login`} className="text-sm font-medium hover:text-primary transition-colors py-2" onClick={() => setIsMenuOpen(false)}>
                  Sign In
                </Link>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
