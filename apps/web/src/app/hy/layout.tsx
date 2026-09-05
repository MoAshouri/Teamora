import { notoSansArmenian } from '@/lib/fonts/hy';
import { MarketingShell } from '@/features/i18n/marketing-shell';

export default async function HyLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hy" dir="ltr" className={notoSansArmenian.className} data-font="hy" suppressHydrationWarning>
      <body data-theme="light">
        <MarketingShell locale="hy">{children}</MarketingShell>
      </body>
    </html>
  );
}
