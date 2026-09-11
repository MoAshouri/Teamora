'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { brandTatil, type AuthFamily, type AuthTheme } from '@/features/auth/brand';
import { formatPanelDate, utcInstantRangeForYmd } from '@/lib/dates';
import type { Locale } from '@/lib/i18n/config';
import { DayAgendaModal, type AgendaRow } from './day-agenda-modal';
import './meetings-preview.css';
import './tasks-preview.css';

export type HomeTask = {
  id: string;
  title: string;
  dueAt: string | null;
  starred: boolean;
  assigneeId?: string | null;
};

function ymdInZone(value: Date, timeZone: string) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(value);
}

function shiftYmd(ymd: string, days: number) {
  const [year, month, day] = ymd.split('-').map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days, 12));
  return next.toISOString().slice(0, 10);
}

function clockInZone(iso: string, locale: Locale, timeZone: string) {
  const tag = locale === 'fa' ? 'fa-IR' : locale === 'hy' ? 'hy-AM' : 'en-US';
  return new Intl.DateTimeFormat(tag, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  }).format(new Date(iso));
}

function familyFromDom(): AuthFamily {
  return document.documentElement.dataset.family === 'hayat' ? 'hayat' : 'gavit';
}

function themeFromDom(): AuthTheme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

function toRow(task: HomeTask, locale: Locale, timeZone: string): AgendaRow {
  return {
    id: task.id,
    time: task.dueAt ? clockInZone(task.dueAt, locale, timeZone) : '',
    title: task.title,
    starred: task.starred,
  };
}

export function TasksPreview({ timezone = 'Asia/Tehran' }: { timezone?: string }) {
  const t = useTranslations('app');
  const locale = useLocale() as Locale;
  const [tasks, setTasks] = useState<HomeTask[]>([]);
  const [open, setOpen] = useState(false);
  const [day, setDay] = useState(() => ymdInZone(new Date(), timezone));
  const [starSrc, setStarSrc] = useState(() => brandTatil('gavit', 'light'));
  const today = ymdInZone(new Date(), timezone);

  useEffect(() => {
    const apply = () => setStarSrc(brandTatil(familyFromDom(), themeFromDom()));
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-family'],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const { from, to } = utcInstantRangeForYmd(shiftYmd(today, -8), shiftYmd(today, 8));
    api
      .get<HomeTask[]>(`/tasks?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
      .then(setTasks)
      .catch(console.error);
  }, [today]);

  const todayTasks = useMemo(
    () =>
      tasks
        .filter((row) => row.dueAt && ymdInZone(new Date(row.dueAt), timezone) === today)
        .slice()
        .sort((a, b) => (a.dueAt ?? '').localeCompare(b.dueAt ?? '')),
    [tasks, today, timezone],
  );

  const onDay = useMemo(
    () =>
      tasks
        .filter((row) => row.dueAt && ymdInZone(new Date(row.dueAt), timezone) === day)
        .slice()
        .sort((a, b) => (a.dueAt ?? '').localeCompare(b.dueAt ?? '')),
    [tasks, day, timezone],
  );

  const preview = todayTasks.slice(0, 3);

  const openToday = () => {
    setDay(today);
    setOpen(true);
  };

  const onPrev = useCallback(() => setDay((value) => shiftYmd(value, -1)), []);
  const onNext = useCallback(() => setDay((value) => shiftYmd(value, 1)), []);

  return (
    <section className="card meetings-preview">
      <h2>{t('employee.tasksToday')}</h2>
      <button className="meetings-preview__open" type="button" onClick={openToday}>
        {todayTasks.length === 0 ? (
          <p className="muted">{t('employee.noTasks')}</p>
        ) : (
          <ul className="meetings-preview__list">
            {preview.map((row) => (
              <li key={row.id}>
                <time>{row.dueAt ? clockInZone(row.dueAt, locale, timezone) : ''}</time>
                <strong>
                  {row.title}
                  {row.starred ? <img className="tasks-preview__star" src={starSrc} alt="" /> : null}
                </strong>
              </li>
            ))}
          </ul>
        )}
      </button>
      <DayAgendaModal
        open={open}
        heading={t('employee.allTasks')}
        dateLabel={formatPanelDate(new Date(`${day}T12:00:00.000Z`), locale, timezone)}
        empty={t('employee.noTasks')}
        prevLabel={t('employee.prevDay')}
        nextLabel={t('employee.nextDay')}
        rows={onDay.map((row) => toRow(row, locale, timezone))}
        starSrc={starSrc}
        onPrev={onPrev}
        onNext={onNext}
        onClose={() => setOpen(false)}
      />
    </section>
  );
}
