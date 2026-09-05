'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatDate, formatTime } from '@/lib/dates';

type EventItem = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  location?: string | null;
};

type Holiday = {
  id: string;
  name: string;
  nameFa?: string | null;
  date: string;
  calendarType: string;
};

export default function EmployeeCalendarPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);

  useEffect(() => {
    Promise.all([
      api.get<EventItem[]>('/calendar/events'),
      api.get<Holiday[]>('/holidays'),
    ]).then(([e, h]) => {
      setEvents(e);
      setHolidays(h);
    });
  }, []);

  return (
    <div className="stack">
      <h1>جلسات و تقویم</h1>
      <div className="card">
        <h2>رویدادها</h2>
        {events.map((ev) => (
          <div className="list-row" key={ev.id}>
            <div>
              <strong>{ev.title}</strong>
              <div className="muted">
                {formatDate(ev.startsAt, 'fa')} · {formatTime(ev.startsAt, 'fa')}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="card">
        <h2>تعطیلات</h2>
        {holidays.map((h) => (
          <div className="list-row" key={h.id}>
            <strong>{h.nameFa || h.name}</strong>
            <span className="muted">{formatDate(h.date, 'fa')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
