import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // A list of all locales that are supported
  locales: ['en', 'hi', 'bn', 'ta', 'te', 'mr', 'gu', 'kn', 'ml', 'pa'],
  
  // Used when no locale matches
  defaultLocale: 'en',
  localePrefix: 'always',
});

export const config = {
  // Match only internationalized pathnames
  matcher: [
    // Match all pathnames except for
    // - API routes
    // - Static files (_next/static, _next/image, favicon.ico, etc.)
    // - Media assets (images, fonts, etc.)
    '/((?!api|_next/static|_next/image|favicon.ico|images|.*\\..*).*)'
  ],
};
