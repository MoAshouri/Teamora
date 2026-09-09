import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import { NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { estedad } from '@/lib/fonts/fa';
import { localeDirection } from '@/lib/i18n/config';
import { parseAppLocale } from '@/lib/i18n/app-locale';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'App',
};

export default async function AuthenticatedRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerList = await headers();
  const cookieStore = await cookies();
  const locale = parseAppLocale(
    headerList.get('x-teamora-locale') ?? cookieStore.get('teamora-locale')?.value,
  );
  setRequestLocale(locale);
  const messages = (await import(`../../../messages/${locale}.json`)).default;
  const dir = localeDirection[locale];

  return (
    <html lang={locale} dir={dir} className={estedad.className} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
