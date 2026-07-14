import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  const locales = ['en'];
  const routes = [
    '',
    '/products',
    '/categories',
    '/about',
    '/contact',
    '/auth/login',
    '/auth/register',
  ];
  
  const entries: MetadataRoute.Sitemap = [];
  
  for (const locale of locales) {
    for (const route of routes) {
      entries.push({
        url: `${baseUrl}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: route === '' ? 1.0 : 0.8,
      });
    }
  }
  
  return entries;
}
