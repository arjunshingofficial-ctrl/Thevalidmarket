import { MetadataRoute } from 'next';
import { getBaseUrl } from '@/lib/siteUrl';

export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  const sensitiveDisallows = [
    '/admin/',
    '/dashboard/',
    '/checkout/',
    '/cart',
    '/payment/',
    '/download/',
    '/api/',
  ];

  return {
    rules: [
      // 1. General search engines: allow crawling public pages, block sensitive routes
      {
        userAgent: '*',
        allow: '/',
        disallow: sensitiveDisallows,
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: sensitiveDisallows,
      },
      {
        userAgent: 'bingbot',
        allow: '/',
        disallow: sensitiveDisallows,
      },
      {
        userAgent: 'msnbot',
        allow: '/',
        disallow: sensitiveDisallows,
      },
      {
        userAgent: 'DuckDuckBot',
        allow: '/',
        disallow: sensitiveDisallows,
      },
      // 2. AI Search Discovery Crawlers (OpenAI search & Perplexity search citations)
      // These bots drive search discovery and user citations to the marketplace
      {
        userAgent: 'OAI-SearchBot',
        allow: '/',
        disallow: sensitiveDisallows,
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: sensitiveDisallows,
      },
      // 3. AI Bulk Scrapers & Model-Training Bots
      // Disallow scraping and model training to protect digital assets, courses, and catalog data
      {
        userAgent: 'GPTBot',
        disallow: '/',
      },
      {
        userAgent: 'ClaudeBot',
        disallow: '/',
      },
      {
        userAgent: 'anthropic-ai',
        disallow: '/',
      },
      {
        userAgent: 'CCBot',
        disallow: '/',
      },
      {
        userAgent: 'Bytespider',
        disallow: '/',
      },
      {
        userAgent: 'FacebookBot',
        disallow: '/',
      },
      {
        userAgent: 'Diffbot',
        disallow: '/',
      },
    ],
    sitemap: [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/sitemap_index.xml`,
    ],
  };
}
