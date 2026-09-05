import { headers } from 'next/headers';
import { defaultLocale, locales, type Locale } from './config';

export async function getHtmlLocale(): Promise<Locale> {
  const headerList = await headers();
  const raw =
    headerList.get('x-next-intl-locale') ??
    headerList.get('X-NEXT-INTL-LOCALE') ??
    headerList.get('x-teamora-locale');
  if (raw && locales.includes(raw as Locale)) {
    return raw as Locale;
  }
  return defaultLocale;
}
