'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { formatPanelDate, utcInstantRangeForYmd } from '@/lib/dates';
import type { Locale } from '@/lib/i18n/config';
import { DayAgendaModal, type AgendaRow } from './day-agenda-modal';
import './meetings-preview.css';

export type HomeMeeting = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  attendees?: Array<{
    user?: { id: string; fullName: string; avatarUrl?: string | null };
  }>;
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

function toRow(meeting: HomeMeeting, locale: Locale, timeZone: string): AgendaRow {
  return {
    id: meeting.id,
    time: clockInZone(meeting.startsAt, locale, timeZone),
    title: meeting.title,
    people: meeting.attendees
      ?.map((row) => row.user)
      .filter((person): person is NonNullable<typeof person> => Boolean(person))
      .map((person) => ({
        id: person.id,
        fullName: person.fullName,
        avatarUrl: person.avatarUrl,
      })),
  };
}

export function MeetingsPreview({ timezone = 'Asia/Tehran' }: { timezone?: string }) {
  const t = useTranslations('app');
  const locale = useLocale() as Locale;
  const [meetings, setMeetings] = useState<HomeMeeting[]>([]);
  const [open, setOpen] = useState(false);
  const [day, setDay] = useState(() => ymdInZone(new Date(), timezone));

  const today = ymdInZone(new Date(), timezone);

  useEffect(() => {
    const { from, to } = utcInstantRangeForYmd(shiftYmd(today, -8), shiftYmd(today, 8));
    api
      .get<HomeMeeting[]>(`/calendar/events?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
      .then(setMeetings)
      .catch(console.error);
  }, [today]);

  const todayMeetings = useMemo(
    () =>
      meetings
        .filter((row) => ymdInZone(new Date(row.startsAt), timezone) === today)
        .slice()
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    [meetings, today, timezone],
  );

  const onDay = useMemo(
    () =>
      meetings
        .filter((row) => ymdInZone(new Date(row.startsAt), timezone) === day)
        .slice()
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    [meetings, day, timezone],
  );

  const preview = todayMeetings.slice(0, 3);

  const openToday = () => {
    setDay(today);
    setOpen(true);
  };

  const onPrev = useCallback(() => setDay((value) => shiftYmd(value, -1)), []);
  const onNext = useCallback(() => setDay((value) => shiftYmd(value, 1)), []);

  return (
    <section className="card meetings-preview">
      <h2>{t('employee.meetingsToday')}</h2>
      <button className="meetings-preview__open" type="button" onClick={openToday}>
        {todayMeetings.length === 0 ? (
          <p className="muted">{t('employee.noMeetings')}</p>
        ) : (
          <ul className="meetings-preview__list">
            {preview.map((row) => (
              <li key={row.id}>
                <time>{clockInZone(row.startsAt, locale, timezone)}</time>
                <strong>{row.title}</strong>
              </li>
            ))}
          </ul>
        )}
      </button>
      <DayAgendaModal
        open={open}
        heading={t('employee.allMeetings')}
        dateLabel={formatPanelDate(new Date(`${day}T12:00:00.000Z`), locale)}
        empty={t('employee.noMeetings')}
        prevLabel={t('employee.prevDay')}
        nextLabel={t('employee.nextDay')}
        rows={onDay.map((row) => toRow(row, locale, timezone))}
        onPrev={onPrev}
        onNext={onNext}
        onClose={() => setOpen(false)}
      />
    </section>
  );
}
