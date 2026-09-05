import { locales, type Locale } from '@/lib/i18n/config';

/** Public origin used for canonical URLs, hreflang, Open Graph and the sitemap. Set NEXT_PUBLIC_SITE_URL in production. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/+$/, '');

export const SITE_NAME = 'Teamora';

/** Open Graph locale codes per route locale. */
export const OG_LOCALE: Record<Locale, string> = {
  en: 'en_US',
  fa: 'fa_IR',
  hy: 'hy_AM',
};

export const OG_IMAGE = {
  url: '/og/teamora-og.jpg',
  width: 1200,
  height: 630,
} as const;

export function absoluteUrl(path: string) {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

/** hreflang map for a path that exists under every locale (e.g. '' for the landing page). */
export function languageAlternates(path = '') {
  const map: Record<string, string> = {};
  for (const l of locales) map[l] = `/${l}${path}`;
  map['x-default'] = `/en${path}`;
  return map;
}
