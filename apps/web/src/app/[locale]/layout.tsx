import '../globals.css';
import { Toaster } from 'sonner';
import { ErrorBoundaryProvider } from '@/components/providers/ErrorBoundaryProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { ABTestProvider } from '@/components/ab-testing/abTestContext';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { JarvisChat } from '@/components/ai/JarvisChat';
import { SocialProof } from '@/components/social/SocialProof';

const locales = ['en', 'hi', 'bn', 'ta', 'te', 'mr', 'gu', 'kn', 'ml', 'pa'];

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  if (!locales.includes(locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          rel="preload" 
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@400;500;600;700&display=swap" 
          as="style" 
        />
        <link 
          rel="stylesheet" 
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@400;500;600;700&display=swap" 
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#db2777" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(reg) {
                    console.log('PWA Service Worker registered successfully:', reg.scope);
                  }).catch(function(err) {
                    console.warn('PWA Service Worker registration failed:', err);
                  });
                });
              }
            `
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ErrorBoundaryProvider>
            <ThemeProvider>
              <ABTestProvider>
                {children}
                <JarvisChat />
                <SocialProof />
              </ABTestProvider>
            </ThemeProvider>
          </ErrorBoundaryProvider>
        </NextIntlClientProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
