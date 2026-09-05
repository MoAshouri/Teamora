import { Inter } from 'next/font/google';

/** English only. Do not import from fa/hy routes. */
export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
  fallback: ['Helvetica Neue', 'Arial', 'sans-serif'],
});
