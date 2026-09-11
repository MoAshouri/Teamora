'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { PendingLeaves } from '@/features/admin-dashboard/pending-leaves';
import {
  daysOfCalendarMonth,
  formatDayNumber,
  formatMonthTitle,
  formatWeekdayShort,
  isoDateUtc,
  monthQueryRange,
  shiftCalendarMonth,
} from '@/lib/dates';
import type { Locale } from '@/lib/i18n/config';
import './admin-month.css';

type LeaveItem = {
  id: string;
  type: string;
  kind?: 'DAILY' | 'HOURLY';
  hours?: string | number | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  startDate: string;
  endDate: string;
  user: { fullName: string };
};

const WEEK_ORDER = [6, 0, 1, 2, 3, 4, 5];
const DEFAULT_WORK_DAYS = [6, 0, 1, 2, 3];

function leaveIso(value: string) {
  return value.slice(0, 10);
}

function inclusiveDays(startIso: string, endIso: string, from: string, to: string) {
  const start = startIso > from ? startIso : from;
  const end = endIso < to ? endIso : to;
  if (end < start) return 0;
  const a = Date.parse(`${start}T00:00:00.000Z`);
  const b = Date.parse(`${end}T00:00:00.000Z`);
  return Math.floor((b - a) / 86_400_000) + 1;
}

function weekdayPad(start: Date) {
  return (start.getUTCDay() + 1) % 7;
}

export function AdminLeaveMonth() {
  const t = useTranslations('app');
  const locale = useLocale() as Locale;
  const [anchor, setAnchor] = useState(() => new Date());
  const [items, setItems] = useState<LeaveItem[]>([]);
  const [pending, setPending] = useState<LeaveItem[]>([]);
  const [workDays, setWorkDays] = useState<number[]>(DEFAULT_WORK_DAYS);

  const range = useMemo(() => monthQueryRange(anchor, locale), [anchor, locale]);
  const days = useMemo(() => daysOfCalendarMonth(anchor, locale), [anchor, locale]);
  const title = useMemo(() => formatMonthTitle(anchor, locale), [anchor, locale]);
  const weekdayLabels = useMemo(() => {
    const start = days[0];
    if (!start) return [];
    const saturday = new Date(start);
    saturday.setUTCDate(start.getUTCDate() - weekdayPad(start));
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(saturday);
      date.setUTCDate(saturday.getUTCDate() + index);
      return formatWeekdayShort(date, locale);
    });
  }, [days, locale]);

  async function load() {
    const [monthLeaves, pendingLeaves, policy] = await Promise.all([
      api.get<LeaveItem[]>(`/leaves?from=${range.from}&to=${range.to}`),
      api.get<LeaveItem[]>('/leaves/pending'),
      api.get<{ workDays?: number[] } | null>('/companies/work-policy'),
    ]);
    setItems(monthLeaves);
    setPending(pendingLeaves);
    if (policy?.workDays?.length) setWorkDays(policy.workDays);
  }

  useEffect(() => {
    load().catch(console.error);
  }, [range.from, range.to]);

  const pendingCount = pending.length;
  const approvedDays = items
    .filter((item) => item.status === 'APPROVED' && item.kind !== 'HOURLY')
    .reduce(
      (sum, item) =>
        sum + inclusiveDays(leaveIso(item.startDate), leaveIso(item.endDate), range.from, range.to),
      0,
    );
  const approvedHours = items
    .filter((item) => item.status === 'APPROVED' && item.kind === 'HOURLY')
    .reduce((sum, item) => sum + Number(item.hours ?? 0), 0);

  const pad = days.length ? weekdayPad(days[0]) : 0;
  const cells: Array<Date | null> = [...Array.from({ length: pad }, () => null), ...days];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="stack leave-month">
      <div className="leave-month__nav">
        <button className="btn btn-ghost" type="button" onClick={() => setAnchor(shiftCalendarMonth(anchor, locale, -1))}>
          {t('leaves.prevMonth')}
        </button>
        <h1>
          {t('leaves.monthTitle')}
          <div className="muted">{title}</div>
        </h1>
        <button className="btn btn-ghost" type="button" onClick={() => setAnchor(shiftCalendarMonth(anchor, locale, 1))}>
          {t('leaves.nextMonth')}
        </button>
      </div>
      <div className="leave-month__totals">
        <div className="card">
          <p className="leave-month__stat">{t('leaves.pendingCount', { n: pendingCount })}</p>
        </div>
        <div className="card">
          <p className="leave-month__stat">{t('leaves.approvedDays', { n: approvedDays })}</p>
        </div>
        <div className="card">
          <p className="leave-month__stat">{t('leaves.approvedHours', { n: approvedHours })}</p>
        </div>
      </div>
      <div className="leave-month__weekdays">
        {weekdayLabels.map((label, index) => (
          <span className="leave-month__weekday" key={index}>
            {label}
          </span>
        ))}
      </div>
      <div className="leave-month__grid">
        {cells.map((date, index) => {
          if (!date) {
            return <div className="leave-day" data-empty="true" key={`empty-${index}`} />;
          }
          const iso = isoDateUtc(date);
          const dayLeaves = items.filter(
            (item) => leaveIso(item.startDate) <= iso && leaveIso(item.endDate) >= iso,
          );
          return (
            <article className="leave-day" data-rest={!workDays.includes(date.getUTCDay())} key={iso}>
              <span className="leave-day__num">{formatDayNumber(date, locale)}</span>
              <div className="leave-day__list">
                {dayLeaves.map((item) => (
                  <span className="leave-chip" data-status={item.status.toLowerCase()} key={item.id}>
                    {item.user.fullName}
                    {item.kind === 'HOURLY' ? ` · ${item.hours}` : ''}
                  </span>
                ))}
              </div>
            </article>
          );
        })}
      </div>
      <PendingLeaves items={pending} onReload={load} />
    </div>
  );
}
