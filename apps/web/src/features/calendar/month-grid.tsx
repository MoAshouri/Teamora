'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { GunbadDay } from '@/features/ui/gunbad-day';
import {
  calendarYearMonth,
  formatMonthTitle,
  formatWeekdayShort,
  getMonthGrid,
  isoDateUtc,
  shiftCalendarMonth,
} from '@/lib/dates';
import type { Locale } from '@/lib/i18n/config';
import './month-grid.css';

const DEFAULT_WORK_DAYS = [6, 0, 1, 2, 3];

type EventItem = {
  id: string;
  title: string;
  startsAt: string;
};

type Holiday = {
  id: string;
  name: string;
  nameFa?: string | null;
  date: string;
};

function eventIso(value: string) {
  return value.slice(0, 10);
}

export function CalendarMonthGrid() {
  const t = useTranslations('app');
  const locale = useLocale() as Locale;
  const [anchor, setAnchor] = useState(() => new Date());
  const [events, setEvents] = useState<EventItem[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [workDays, setWorkDays] = useState<number[]>(DEFAULT_WORK_DAYS);

  const { year, month } = useMemo(() => calendarYearMonth(anchor, locale), [anchor, locale]);
  const cells = useMemo(() => getMonthGrid(locale, year, month), [locale, year, month]);
  const title = useMemo(() => formatMonthTitle(anchor, locale), [anchor, locale]);
  const weekdayLabels = useMemo(() => {
    const first = cells[0];
    if (!first) return [];
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(first.date);
      date.setUTCDate(first.date.getUTCDate() + index);
      return formatWeekdayShort(date, locale);
    });
  }, [cells, locale]);

  const todayIso = isoDateUtc(new Date());
  const range = useMemo(() => {
    const start = cells[0]?.date;
    const end = cells[cells.length - 1]?.date;
    if (!start || !end) return null;
    return {
      from: `${isoDateUtc(start)}T00:00:00.000Z`,
      to: `${isoDateUtc(end)}T23:59:59.999Z`,
    };
  }, [cells]);

  async function load() {
    const [monthEvents, holidayRows, policy] = await Promise.all([
      range
        ? api.get<EventItem[]>(
            `/calendar/events?from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}`,
          )
        : Promise.resolve([]),
      api.get<Holiday[]>('/holidays'),
      api.get<{ workDays?: number[] } | null>('/companies/work-policy'),
    ]);
    setEvents(monthEvents);
    setHolidays(holidayRows);
    if (policy?.workDays?.length) setWorkDays(policy.workDays);
  }

  useEffect(() => {
    load().catch(console.error);
  }, [range?.from, range?.to]);

  return (
    <div className="stack cal-month">
      <div className="cal-month__nav">
        <button className="btn btn-ghost" type="button" onClick={() => setAnchor(shiftCalendarMonth(anchor, locale, -1))}>
          {t('calendar.prev')}
        </button>
        <h1>
          {t('calendar.title')}
          <div className="muted">{title}</div>
        </h1>
        <div className="cal-month__nav-end">
          <button className="btn btn-ghost" type="button" onClick={() => setAnchor(new Date())}>
            {t('calendar.today')}
          </button>
          <button className="btn btn-ghost" type="button" onClick={() => setAnchor(shiftCalendarMonth(anchor, locale, 1))}>
            {t('calendar.next')}
          </button>
        </div>
      </div>
      <div className="cal-month__weekdays">
        {weekdayLabels.map((label, index) => (
          <span className="cal-month__weekday" key={index}>
            {label}
          </span>
        ))}
      </div>
      <div className="cal-month__grid">
        {cells.map((cell) => {
          const iso = isoDateUtc(cell.date);
          const dayEvents = events.filter((item) => eventIso(item.startsAt) === iso);
          const holiday = holidays.find((item) => eventIso(item.date) === iso);
          return (
            <div
              className="cal-month__tile"
              data-in-month={cell.inMonth}
              data-today={iso === todayIso}
              key={iso}
            >
              <GunbadDay date={cell.date} locale={locale} rest={!workDays.includes(cell.date.getUTCDay())} size="month">
                {holiday ? (
                  <span className="cal-month__holiday">{holiday.nameFa || holiday.name}</span>
                ) : null}
                {dayEvents.map((item) => (
                  <span className="cal-month__chip" key={item.id}>
                    {item.title}
                  </span>
                ))}
              </GunbadDay>
            </div>
          );
        })}
      </div>
    </div>
  );
}
