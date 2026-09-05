'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatDate, formatTime } from '@/lib/dates';

type EventItem = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  location?: string | null;
  conflicts?: { leaveId: string; userId: string }[];
};

type Holiday = {
  id: string;
  name: string;
  nameFa?: string | null;
  date: string;
  calendarType: 'JALALI' | 'GREGORIAN';
  countryCode: string;
};

export default function AdminCalendarPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [calendarType, setCalendarType] = useState<'jalali' | 'gregorian'>('jalali');

  async function load() {
    const [e, h] = await Promise.all([
      api.get<EventItem[]>('/calendar/events'),
      api.get<Holiday[]>('/holidays'),
    ]);
    setEvents(e);
    setHolidays(h);
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  async function createEvent(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const startsAt = new Date(String(fd.get('startsAt'))).toISOString();
    const endsAt = new Date(String(fd.get('endsAt'))).toISOString();
    await api.post('/calendar/events', {
      title: String(fd.get('title')),
      location: String(fd.get('location') || ''),
      startsAt,
      endsAt,
      attendeeIds: [],
    });
    e.currentTarget.reset();
    await load();
  }

  return (
    <div className="stack">
      <header style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>تقویم</h1>
        <select
          value={calendarType}
          onChange={(e) => setCalendarType(e.target.value as 'jalali' | 'gregorian')}
        >
          <option value="jalali">جلالی</option>
          <option value="gregorian">میلادی</option>
        </select>
      </header>

      <div className="card">
        <h2>جلسه تازه</h2>
        <form onSubmit={createEvent}>
          <label className="field">
            <span>عنوان</span>
            <input name="title" required />
          </label>
          <label className="field">
            <span>مکان</span>
            <input name="location" />
          </label>
          <label className="field">
            <span>شروع</span>
            <input name="startsAt" type="datetime-local" required />
          </label>
          <label className="field">
            <span>پایان</span>
            <input name="endsAt" type="datetime-local" required />
          </label>
          <button className="btn btn-primary" type="submit">
            ایجاد
          </button>
        </form>
      </div>

      <div className="card">
        <h2>رویدادها</h2>
        {events.map((ev) => (
          <div className="list-row" key={ev.id}>
            <div>
              <strong>{ev.title}</strong>
              <div className="muted">
                {formatDate(ev.startsAt, 'fa', calendarType)} · {formatTime(ev.startsAt, 'fa')}
                {ev.location ? ` · ${ev.location}` : ''}
              </div>
              {ev.conflicts && ev.conflicts.length > 0 ? (
                <div className="error">تداخل با مرخصی ({ev.conflicts.length})</div>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2>تعطیلات ملی</h2>
        {holidays
          .filter((h) =>
            calendarType === 'jalali'
              ? h.calendarType === 'JALALI' || h.countryCode === 'IR'
              : h.calendarType === 'GREGORIAN',
          )
          .map((h) => (
            <div className="list-row" key={h.id}>
              <strong>{h.nameFa || h.name}</strong>
              <span className="muted">{formatDate(h.date, 'fa', calendarType)}</span>
            </div>
          ))}
      </div>
    </div>
  );
}
