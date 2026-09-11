import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import type { Locale } from '@/lib/i18n/config';

export async function MarketingShell({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  setRequestLocale(locale);
  const messages = await getMessages();
  return <NextIntlClientProvider locale={locale} messages={messages}>{children}</NextIntlClientProvider>;
}
