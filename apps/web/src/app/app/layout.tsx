import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'App',
};

export default function AuthenticatedRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
