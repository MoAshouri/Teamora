import { Noto_Sans_Armenian } from 'next/font/google';

/** Armenian only. Do not import from en/fa routes. */
export const notoSansArmenian = Noto_Sans_Armenian({
  subsets: ['armenian'],
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
  fallback: ['Sylfaen', 'Segoe UI', 'Arial', 'sans-serif'],
});
