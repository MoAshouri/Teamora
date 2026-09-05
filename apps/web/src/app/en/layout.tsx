import { inter } from '@/lib/fonts/en';
import { MarketingShell } from '@/features/i18n/marketing-shell';

export default async function EnLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={inter.className} data-font="en" suppressHydrationWarning>
      <body data-theme="light">
        <MarketingShell locale="en">{children}</MarketingShell>
      </body>
    </html>
  );
}
