import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, localeDirection, type Locale } from '@/lib/i18n/config';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

/** Login/join only. Landing lives at /en /fa /hy so those routes do not load this layout's CSS. */
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();
  const dir = localeDirection[locale as Locale];

  return (
    <html lang={locale} dir={dir} data-font={locale} suppressHydrationWarning>
      <body data-theme="light" style={{ fontFamily: 'Tahoma, Arial, sans-serif' }}>
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
