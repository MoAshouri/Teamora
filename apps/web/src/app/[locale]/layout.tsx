import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, localeDirection, type Locale } from '@/lib/i18n/config';
import { inter } from '@/lib/fonts/en';
import { estedad } from '@/lib/fonts/fa';
import { notoSansArmenian } from '@/lib/fonts/hy';
import { ApiErrorToasts } from '@/features/app-shell/api-error-toasts';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const fontClass: Record<Locale, string> = {
  en: inter.className,
  fa: estedad.className,
  hy: notoSansArmenian.className,
};

/** Login / join / create-company. Landing lives at /en /fa /hy. */
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
    <html
      lang={locale}
      dir={dir}
      className={fontClass[locale as Locale]}
      data-font={locale}
      suppressHydrationWarning
    >
      <body data-theme="light">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ApiErrorToasts />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
