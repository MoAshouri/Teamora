import type { Locale } from './i18n/config';

function localeTag(locale: Locale) {
  return locale === 'fa' ? 'fa-IR' : locale === 'hy' ? 'hy-AM' : 'en-US';
}

function calendarFor(locale: Locale): 'persian' | 'gregory' {
  return locale === 'fa' ? 'persian' : 'gregory';
}

function timeZoneFor(locale: Locale) {
  return locale === 'fa' ? 'Asia/Tehran' : undefined;
}

/** Format an ISO/UTC date for display. Storage remains UTC; UI chooses calendar. */
export function formatDate(
  value: string | Date,
  locale: Locale,
  calendar: 'jalali' | 'gregorian' = locale === 'fa' ? 'jalali' : 'gregorian',
) {
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat(localeTag(locale), {
    calendar: calendar === 'jalali' ? 'persian' : 'gregory',
    dateStyle: 'medium',
  }).format(date);
}

export function formatTime(value: string | Date, locale: Locale) {
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat(localeTag(locale), {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatWeekday(value: Date, locale: Locale) {
  return new Intl.DateTimeFormat(localeTag(locale), {
    weekday: 'long',
    calendar: calendarFor(locale),
    timeZone: timeZoneFor(locale),
  }).format(value);
}

export function formatWeekdayShort(value: Date, locale: Locale) {
  return new Intl.DateTimeFormat(localeTag(locale), {
    weekday: 'short',
    calendar: calendarFor(locale),
    timeZone: timeZoneFor(locale),
  }).format(value);
}

export function formatPanelDate(value: Date, locale: Locale) {
  return new Intl.DateTimeFormat(localeTag(locale), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    calendar: calendarFor(locale),
    timeZone: timeZoneFor(locale),
  }).format(value);
}

export function formatPanelDay(value: Date, locale: Locale) {
  return {
    weekday: formatWeekday(value, locale),
    date: formatPanelDate(value, locale),
  };
}
