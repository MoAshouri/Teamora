import localFont from 'next/font/local';

/** Persian only. Arabic-subset variable Estedad. Do not import from en/hy routes. */
export const estedad = localFont({
  src: '../../fonts/Estedad-VF.woff2',
  display: 'swap',
  weight: '100 900',
  preload: true,
  fallback: ['Tahoma', 'Arial', 'sans-serif'],
  adjustFontFallback: 'Arial',
  declarations: [
    {
      prop: 'unicode-range',
      value:
        'U+0600-06FF, U+0750-077F, U+0870-089F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF, U+200C-200F, U+064B-065F',
    },
  ],
});
