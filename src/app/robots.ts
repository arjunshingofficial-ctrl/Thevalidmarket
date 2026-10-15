import { MetadataRoute } from 'next';
import { getBaseUrl } from '@/lib/siteUrl';

export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/dashboard/', '/checkout/', '/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
