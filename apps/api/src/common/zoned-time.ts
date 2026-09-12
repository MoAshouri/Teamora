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

export function addDaysYmd(ymd: string, days: number) {
  const date = new Date(`${ymd}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function ymdUtc(value: Date) {
  return value.toISOString().slice(0, 10);
}

/** Inclusive company-local days as a half-open UTC instant range. */
export function zonedInclusiveDayRange(fromYmd: string, toYmd: string, timeZone: string) {
  const start = new Date(zonedDateTimeLocalToIso(`${fromYmd}T00:00`, timeZone));
  const end = new Date(zonedDateTimeLocalToIso(`${addDaysYmd(toYmd, 1)}T00:00`, timeZone));
  return { start, end };
}
