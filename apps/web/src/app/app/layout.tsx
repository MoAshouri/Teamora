import type { Metadata } from 'next';
import { estedad } from '@/lib/fonts/fa';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'App',
};

export default function AuthenticatedRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" className={estedad.className} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
