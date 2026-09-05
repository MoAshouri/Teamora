import { estedad } from '@/lib/fonts/fa';
import { MarketingShell } from '@/features/i18n/marketing-shell';

export default async function FaLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className={estedad.className} data-font="fa" suppressHydrationWarning>
      <body data-theme="light">
        <MarketingShell locale="fa">{children}</MarketingShell>
      </body>
    </html>
  );
}
