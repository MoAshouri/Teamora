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

export function formatDayNumber(value: Date, locale: Locale) {
  return new Intl.DateTimeFormat(localeTag(locale), {
    day: 'numeric',
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

function toAsciiDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));
}

function calendarYmd(date: Date, locale: Locale) {
  const parts = new Intl.DateTimeFormat('en-US', {
    calendar: calendarFor(locale),
    timeZone: 'UTC',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(date);
  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== 'literal') map[part.type] = part.value;
  }
  return {
    year: Number(toAsciiDigits(map.year ?? '')),
    month: Number(toAsciiDigits(map.month ?? '')),
    day: Number(toAsciiDigits(map.day ?? '')),
  };
}

function utcNoon(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12));
}

function shiftUtcDays(date: Date, days: number) {
  const next = utcNoon(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function isoDateUtc(date: Date) {
  return utcNoon(date).toISOString().slice(0, 10);
}

export function startOfCalendarMonth(anchor: Date, locale: Locale) {
  let cursor = utcNoon(anchor);
  const start = calendarYmd(cursor, locale);
  while (true) {
    const prev = shiftUtcDays(cursor, -1);
    const ymd = calendarYmd(prev, locale);
    if (ymd.year !== start.year || ymd.month !== start.month) return cursor;
    cursor = prev;
  }
}

export function endOfCalendarMonth(anchor: Date, locale: Locale) {
  let cursor = startOfCalendarMonth(anchor, locale);
  const start = calendarYmd(cursor, locale);
  while (true) {
    const next = shiftUtcDays(cursor, 1);
    const ymd = calendarYmd(next, locale);
    if (ymd.year !== start.year || ymd.month !== start.month) return cursor;
    cursor = next;
  }
}

export function shiftCalendarMonth(anchor: Date, locale: Locale, delta: number) {
  if (delta === 0) return startOfCalendarMonth(anchor, locale);
  if (delta < 0) {
    let cursor = startOfCalendarMonth(anchor, locale);
    for (let i = 0; i < -delta; i += 1) {
      cursor = startOfCalendarMonth(shiftUtcDays(cursor, -1), locale);
    }
    return cursor;
  }
  let cursor = startOfCalendarMonth(anchor, locale);
  for (let i = 0; i < delta; i += 1) {
    cursor = startOfCalendarMonth(shiftUtcDays(endOfCalendarMonth(cursor, locale), 1), locale);
  }
  return cursor;
}

export function daysOfCalendarMonth(anchor: Date, locale: Locale) {
  const start = startOfCalendarMonth(anchor, locale);
  const end = endOfCalendarMonth(anchor, locale);
  const days: Date[] = [];
  for (let cursor = start; cursor.getTime() <= end.getTime(); cursor = shiftUtcDays(cursor, 1)) {
    days.push(cursor);
  }
  return days;
}

export function formatMonthTitle(anchor: Date, locale: Locale) {
  return new Intl.DateTimeFormat(localeTag(locale), {
    calendar: calendarFor(locale),
    timeZone: 'UTC',
    month: 'long',
    year: 'numeric',
  }).format(startOfCalendarMonth(anchor, locale));
}

export function monthQueryRange(anchor: Date, locale: Locale) {
  const start = startOfCalendarMonth(anchor, locale);
  const end = endOfCalendarMonth(anchor, locale);
  return { from: isoDateUtc(start), to: isoDateUtc(end), start, end };
}
