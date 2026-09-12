import type { Locale } from './i18n/config';

function localeTag(locale: Locale) {
  return locale === 'fa' ? 'fa-IR' : locale === 'hy' ? 'hy-AM' : 'en-US';
}

const HY_WEEKDAY_LONG = ['կիրակի', 'երկուշաբթի', 'երեքշաբթի', 'չորեքշաբթի', 'հինգշաբթի', 'ուրբաթ', 'շաբաթ'] as const;
const HY_WEEKDAY_SHORT = ['կիր', 'երկ', 'երք', 'չրք', 'հնգ', 'ուրբ', 'շբթ'] as const;
const HY_MONTH_LONG = [
  'հունվարի',
  'փետրվարի',
  'մարտի',
  'ապրիլի',
  'մայիսի',
  'հունիսի',
  'հուլիսի',
  'օգոստոսի',
  'սեպտեմբերի',
  'հոկտեմբերի',
  'նոյեմբերի',
  'դեկտեմբերի',
] as const;
const HY_MONTH_TITLE = [
  'հունվար',
  'փետրվար',
  'մարտ',
  'ապրիլ',
  'մայիս',
  'հունիս',
  'հուլիս',
  'օգոստոս',
  'սեպտեմբեր',
  'հոկտեմբեր',
  'նոյեմբեր',
  'դեկտեմբեր',
] as const;

let hyDateIntl: boolean | null = null;

function hyDateIntlAvailable() {
  if (hyDateIntl != null) return hyDateIntl;
  try {
    hyDateIntl = new Intl.DateTimeFormat('hy-AM').resolvedOptions().locale.toLowerCase().startsWith('hy');
  } catch {
    hyDateIntl = false;
  }
  return hyDateIntl;
}

function needsHyDateFallback(locale: Locale) {
  return locale === 'hy' && !hyDateIntlAvailable();
}

function calendarFor(locale: Locale): 'persian' | 'gregory' {
  return locale === 'fa' ? 'persian' : 'gregory';
}

function timeZoneFor(locale: Locale) {
  return locale === 'fa' ? 'Asia/Tehran' : undefined;
}

function resolveTimeZone(locale: Locale, timeZone?: string) {
  return timeZone || timeZoneFor(locale);
}

function displayWeekdayIndex(value: Date, locale: Locale, timeZone?: string) {
  const zone = resolveTimeZone(locale, timeZone);
  if (zone) return jsWeekdayInZone(zone, value);
  return value.getUTCDay();
}

function displayYmd(value: Date, locale: Locale, timeZone?: string) {
  const zone = resolveTimeZone(locale, timeZone);
  if (zone) {
    const [year, month, day] = todayKeyInZone(zone, value).split('-').map(Number);
    return { year, month, day };
  }
  return {
    year: value.getUTCFullYear(),
    month: value.getUTCMonth() + 1,
    day: value.getUTCDate(),
  };
}

/** Format an ISO/UTC date for display. Storage remains UTC; UI chooses calendar. */
export function formatDate(
  value: string | Date,
  locale: Locale,
  calendar: 'jalali' | 'gregorian' = locale === 'fa' ? 'jalali' : 'gregorian',
  timeZone?: string,
) {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (needsHyDateFallback(locale) && calendar !== 'jalali') {
    return formatPanelDate(date, locale, timeZone);
  }
  return new Intl.DateTimeFormat(localeTag(locale), {
    calendar: calendar === 'jalali' ? 'persian' : 'gregory',
    dateStyle: 'medium',
    timeZone: resolveTimeZone(locale, timeZone),
  }).format(date);
}

export function formatTime(value: string | Date, locale: Locale, timeZone?: string) {
  const date = typeof value === 'string' ? new Date(value) : value;
  const zone = resolveTimeZone(locale, timeZone);
  if (needsHyDateFallback(locale)) {
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      timeZone: zone,
    }).format(date);
  }
  return new Intl.DateTimeFormat(localeTag(locale), {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: zone,
  }).format(date);
}

export function formatWeekday(value: Date, locale: Locale, timeZone?: string) {
  if (needsHyDateFallback(locale)) {
    return HY_WEEKDAY_LONG[displayWeekdayIndex(value, locale, timeZone)];
  }
  return new Intl.DateTimeFormat(localeTag(locale), {
    weekday: 'long',
    calendar: calendarFor(locale),
    timeZone: resolveTimeZone(locale, timeZone),
  }).format(value);
}

export function formatWeekdayShort(value: Date, locale: Locale, timeZone?: string) {
  if (needsHyDateFallback(locale)) {
    return HY_WEEKDAY_SHORT[displayWeekdayIndex(value, locale, timeZone)];
  }
  return new Intl.DateTimeFormat(localeTag(locale), {
    weekday: 'short',
    calendar: calendarFor(locale),
    timeZone: resolveTimeZone(locale, timeZone),
  }).format(value);
}

export function formatPanelDate(value: Date, locale: Locale, timeZone?: string) {
  if (needsHyDateFallback(locale)) {
    const { year, month, day } = displayYmd(value, locale, timeZone);
    return `${day} ${HY_MONTH_LONG[month - 1]} ${year}`;
  }
  return new Intl.DateTimeFormat(localeTag(locale), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    calendar: calendarFor(locale),
    timeZone: resolveTimeZone(locale, timeZone),
  }).format(value);
}

export function formatDayNumber(value: Date, locale: Locale, timeZone?: string) {
  if (needsHyDateFallback(locale)) {
    return String(displayYmd(value, locale, timeZone).day);
  }
  return new Intl.DateTimeFormat(localeTag(locale), {
    day: 'numeric',
    calendar: calendarFor(locale),
    timeZone: resolveTimeZone(locale, timeZone),
  }).format(value);
}

export function formatPanelDay(value: Date, locale: Locale, timeZone?: string) {
  const weekday = formatWeekday(value, locale, timeZone);
  const date = formatPanelDate(value, locale, timeZone);
  // #region agent log
  if (locale === 'hy') {
    fetch('http://127.0.0.1:7869/ingest/c694b7eb-dcc2-4100-9c19-d4aca06d483e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a506d6'},body:JSON.stringify({sessionId:'a506d6',runId:'post-fix',hypothesisId:'HY1',location:'dates.ts:formatPanelDay',message:'armenian date intl fallback',data:{requested:'hy-AM',resolved:new Intl.DateTimeFormat('hy-AM').resolvedOptions().locale,fallback:needsHyDateFallback(locale),weekday,date},timestamp:Date.now()})}).catch(()=>{});
  }
  // #endregion
  return { weekday, date };
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

/** Calendar-day key in a company timezone. Date-only values stay as YYYY-MM-DD. */
export function dateKeyInZone(iso: string, timeZone = 'UTC') {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

export function todayKeyInZone(timeZone = 'UTC', now = new Date()) {
  return dateKeyInZone(now.toISOString(), timeZone);
}

/** JS weekday (0 = Sunday … 6 = Saturday) for an instant in a named timezone. */
export function jsWeekdayInZone(timeZone: string, now = new Date()) {
  const ymd = todayKeyInZone(timeZone, now);
  return new Date(`${ymd}T12:00:00.000Z`).getUTCDay();
}

export function overlapsZonedYmd(startIso: string, endIso: string, ymd: string, timeZone: string) {
  const start = dateKeyInZone(startIso, timeZone);
  const end = dateKeyInZone(endIso, timeZone);
  return start <= ymd && end >= ymd;
}

export function addUtcDaysYmd(ymd: string, days: number) {
  const date = new Date(`${ymd}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Widen a YMD window so UTC timestamp queries still include early/late company-local hours. */
export function utcInstantRangeForYmd(fromYmd: string, toYmd: string) {
  return {
    from: `${addUtcDaysYmd(fromYmd, -1)}T00:00:00.000Z`,
    to: `${addUtcDaysYmd(toYmd, 1)}T23:59:59.999Z`,
  };
}

function zonedOffsetMs(date: Date, timeZone: string) {
  try {
    const parts: Record<string, string> = {};
    for (const part of new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).formatToParts(date)) {
      if (part.type !== 'literal') parts[part.type] = part.value;
    }
    const asUtc = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour) % 24,
      Number(parts.minute),
      Number(parts.second),
    );
    return asUtc - date.getTime();
  } catch {
    return 0;
  }
}

/** datetime-local value for an instant in a company timezone. */
export function isoToZonedDateTimeLocal(iso: string, timeZone = 'UTC') {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date(iso));
    const get = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((part) => part.type === type)?.value ?? '00';
    return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
  } catch {
    return iso.slice(0, 16);
  }
}

/** Interpret a datetime-local string as company wall time and return UTC ISO. */
export function zonedDateTimeLocalToIso(value: string, timeZone = 'UTC') {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!match) return new Date(value).toISOString();
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  let utc = Date.UTC(year, month - 1, day, hour, minute, 0);
  const first = zonedOffsetMs(new Date(utc), timeZone);
  utc -= first;
  const second = zonedOffsetMs(new Date(utc), timeZone);
  if (second !== first) utc = Date.UTC(year, month - 1, day, hour, minute, 0) - second;
  return new Date(utc).toISOString();
}

export function hourInZone(timeZone = 'UTC', now = new Date()) {
  try {
    const hour = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      hour: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(now)
      .find((part) => part.type === 'hour')?.value;
    return Number(hour);
  } catch {
    return now.getUTCHours();
  }
}

export function greetKey(hour: number): 'morning' | 'afternoon' | 'evening' | 'night' {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
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
  const start = startOfCalendarMonth(anchor, locale);
  if (needsHyDateFallback(locale)) {
    const { year, month } = displayYmd(start, locale, 'UTC');
    return `${HY_MONTH_TITLE[month - 1]} ${year}`;
  }
  return new Intl.DateTimeFormat(localeTag(locale), {
    calendar: calendarFor(locale),
    timeZone: 'UTC',
    month: 'long',
    year: 'numeric',
  }).format(start);
}

export function monthQueryRange(anchor: Date, locale: Locale) {
  const start = startOfCalendarMonth(anchor, locale);
  const end = endOfCalendarMonth(anchor, locale);
  return { from: isoDateUtc(start), to: isoDateUtc(end), start, end };
}

export function calendarYearMonth(date: Date, locale: Locale) {
  return calendarYmd(utcNoon(date), locale);
}

export function getMonthGrid(locale: Locale, year: number, month: number) {
  const origin =
    calendarFor(locale) === 'persian'
      ? new Date(Date.UTC(year + 621, Math.max(0, month - 1), 15, 12))
      : new Date(Date.UTC(year, month - 1, 15, 12));
  let cursor = utcNoon(origin);
  for (let step = 0; step < 48; step += 1) {
    const ymd = calendarYmd(cursor, locale);
    const delta = (year - ymd.year) * 12 + (month - ymd.month);
    if (delta === 0) break;
    cursor = shiftCalendarMonth(cursor, locale, Math.max(-8, Math.min(8, delta)));
  }
  const start = startOfCalendarMonth(cursor, locale);
  const inMonth = daysOfCalendarMonth(cursor, locale);
  const pad = (start.getUTCDay() + 1) % 7;
  const cells: Array<{ date: Date; inMonth: boolean }> = [];
  for (let i = pad; i > 0; i -= 1) {
    cells.push({ date: shiftUtcDays(start, -i), inMonth: false });
  }
  for (const date of inMonth) cells.push({ date, inMonth: true });
  while (cells.length < 42) {
    const last = cells[cells.length - 1]?.date ?? start;
    cells.push({ date: shiftUtcDays(last, 1), inMonth: false });
  }
  return cells.slice(0, 42);
}
