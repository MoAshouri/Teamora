import type { Locale } from '@/lib/i18n/config';

/** Load one locale font. Do not import en/fa/hy loaders together in the same module. */
export async function fontClassForLocale(locale: Locale): Promise<string> {
  if (locale === 'en') {
    const { inter } = await import('./en');
    return inter.className;
  }
  if (locale === 'hy') {
    const { notoSansArmenian } = await import('./hy');
    return notoSansArmenian.className;
  }
  const { estedad } = await import('./fa');
  return estedad.className;
}
