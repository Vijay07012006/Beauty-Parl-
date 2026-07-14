'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useParams } from 'next/navigation';
 
export function Footer() {
  const params = useParams();
  const locale = params?.locale || 'en';

  return (
    <footer className="bg-secondary/50 border-t border-border/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-xl font-playfair font-bold text-primary">Beauty Parlé</h3>
            <p className="text-sm text-muted-foreground">
              Where Beauty Speaks Your Language. Premium cosmetics for everyone.
            </p>
            <div className="flex gap-3">
              <Link href="#" className="p-2 bg-background rounded-full hover:bg-primary hover:text-white transition-colors" aria-label="Instagram">
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </Link>
              <Link href="#" className="p-2 bg-background rounded-full hover:bg-primary hover:text-white transition-colors" aria-label="Facebook">
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </Link>
              <Link href="#" className="p-2 bg-background rounded-full hover:bg-primary hover:text-white transition-colors" aria-label="Twitter">
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                </svg>
              </Link>
              <Link href="#" className="p-2 bg-background rounded-full hover:bg-primary hover:text-white transition-colors" aria-label="Youtube">
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17z" />
                  <polygon points="10 15 15 12 10 9" />
                </svg>
              </Link>
            </div>
          </div>
 
          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold">Quick Links</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href={`/${locale}/products`} className="hover:text-primary transition-colors">Products</Link></li>
              <li><Link href={`/${locale}/categories`} className="hover:text-primary transition-colors">Categories</Link></li>
              <li><Link href={`/${locale}/booking`} className="hover:text-primary transition-colors">Book Appointment</Link></li>
              <li><Link href={`/${locale}/about`} className="hover:text-primary transition-colors">About Us</Link></li>
            </ul>
          </div>
 
          {/* Support */}
          <div className="space-y-4">
            <h4 className="font-semibold">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href={`/${locale}/faq`} className="hover:text-primary transition-colors">FAQ</Link></li>
              <li><Link href={`/${locale}/shipping`} className="hover:text-primary transition-colors">Shipping & Returns</Link></li>
              <li><Link href={`/${locale}/contact`} className="hover:text-primary transition-colors">Contact Us</Link></li>
              <li><Link href={`/${locale}/terms`} className="hover:text-primary transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
 
          {/* Contact Details */}
          <div className="space-y-4">
            <h4 className="font-semibold">Contact</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>123 Beauty Lane, Glamour City</li>
              <li>support@beautyparle.com</li>
              <li>+1 (234) 567-890</li>
            </ul>
          </div>
        </div>
 
        <div className="border-t border-border/40 mt-12 pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-muted-foreground gap-4">
          <p>&copy; {new Date().getFullYear()} Beauty Parlé. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Made with <Heart size={12} className="text-primary fill-primary" /> for beauty lovers
          </p>
        </div>
      </div>
    </footer>
  );
}
