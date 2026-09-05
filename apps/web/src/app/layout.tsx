import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Teamora',
    template: '%s · Teamora',
  },
  description: 'Teamora Human Resource Management',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ebe3d4' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0e0f' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

/** HTML/lang live in [locale]/layout and app/layout so each tree can set the document language. */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
