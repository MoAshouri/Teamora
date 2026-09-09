import { locales, type Locale } from './config';

/** Cookie name for authenticated `/app` locale. Not used on `/{locale}` marketing routes. */
export const APP_LOCALE_COOKIE = 'teamora-locale';

/**
 * `/app` defaults to `fa` when the cookie is missing so existing Persian-first
 * admins do not flash English. Marketing routes keep `defaultLocale` (`en`).
 */
export const APP_DEFAULT_LOCALE: Locale = 'fa';

export function parseAppLocale(raw: string | undefined | null): Locale {
  const value = raw?.trim();
  if (value && locales.includes(value as Locale)) {
    return value as Locale;
  }
  return APP_DEFAULT_LOCALE;
}

export function getAppLocale(cookieHeader: string | null | undefined): Locale {
  if (!cookieHeader) return APP_DEFAULT_LOCALE;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${APP_LOCALE_COOKIE}=([^;]*)`));
  const raw = match?.[1] ? decodeURIComponent(match[1]) : undefined;
  return parseAppLocale(raw);
}
