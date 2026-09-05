import type { Locale } from './i18n/config';

/** Format an ISO/UTC date for display. Storage remains UTC; UI chooses calendar. */
export function formatDate(
  value: string | Date,
  locale: Locale,
  calendar: 'jalali' | 'gregorian' = locale === 'fa' ? 'jalali' : 'gregorian',
) {
  const date = typeof value === 'string' ? new Date(value) : value;
  const localeTag = locale === 'fa' ? 'fa-IR' : locale === 'hy' ? 'hy-AM' : 'en-US';
  return new Intl.DateTimeFormat(localeTag, {
    calendar: calendar === 'jalali' ? 'persian' : 'gregory',
    dateStyle: 'medium',
  }).format(date);
}

export function formatTime(value: string | Date, locale: Locale) {
  const date = typeof value === 'string' ? new Date(value) : value;
  const localeTag = locale === 'fa' ? 'fa-IR' : locale === 'hy' ? 'hy-AM' : 'en-US';
  return new Intl.DateTimeFormat(localeTag, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
