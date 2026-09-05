import type { MetadataRoute } from 'next';
import { locales } from '@/lib/i18n/config';
import { absoluteUrl } from '@/lib/site';

/** Public marketing routes only; each entry carries hreflang alternates for the other locales. */
const PUBLIC_PATHS = [
  { path: '', priority: 1, changeFrequency: 'weekly' as const },
  { path: '/login', priority: 0.5, changeFrequency: 'monthly' as const },
  { path: '/join', priority: 0.5, changeFrequency: 'monthly' as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const { path, priority, changeFrequency } of PUBLIC_PATHS) {
    const languages: Record<string, string> = {};
    for (const l of locales) languages[l] = absoluteUrl(`/${l}${path}`);
    languages['x-default'] = absoluteUrl(`/en${path}`);

    for (const l of locales) {
      entries.push({
        url: absoluteUrl(`/${l}${path}`),
        lastModified,
        changeFrequency,
        priority,
        alternates: { languages },
      });
    }
  }

  return entries;
}
