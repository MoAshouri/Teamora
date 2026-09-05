'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api } from '@/lib/api';

type Entry = {
  id: string;
  date: string;
  startedAt: string;
  endedAt: string;
  status: string;
  note?: string | null;
};

export default function EmployeeWorkTimePage() {
  const [entries, setEntries] = useState<Entry[]>([]);

  async function load() {
    setEntries(await api.get<Entry[]>('/work-time/entries'));
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const date = String(fd.get('date'));
    const startedAt = new Date(`${date}T${String(fd.get('startedAt'))}:00`).toISOString();
    const endedAt = new Date(`${date}T${String(fd.get('endedAt'))}:00`).toISOString();
    await api.post('/work-time/entries', {
      date,
      startedAt,
      endedAt,
      note: String(fd.get('note') || ''),
    });
    e.currentTarget.reset();
    await load();
  }

  return (
    <div className="stack">
      <h1>ساعات من</h1>
      <div className="card">
        <h2>ارسال کارکرد</h2>
        <form onSubmit={submit}>
          <label className="field">
            <span>تاریخ (میلادی YYYY-MM-DD)</span>
            <input name="date" type="date" required />
          </label>
          <label className="field">
            <span>شروع</span>
            <input name="startedAt" type="time" required />
          </label>
          <label className="field">
            <span>پایان</span>
            <input name="endedAt" type="time" required />
          </label>
          <label className="field">
            <span>یادداشت</span>
            <input name="note" />
          </label>
          <button className="btn btn-primary" type="submit">
            ارسال برای تأیید
          </button>
        </form>
      </div>
      <div className="card">
        {entries.map((e) => (
          <div className="list-row" key={e.id}>
            <div>
              <strong>{e.date.slice(0, 10)}</strong>
              <div className="muted">
                {new Date(e.startedAt).toLocaleTimeString()} – {new Date(e.endedAt).toLocaleTimeString()}
              </div>
            </div>
            <span className="muted">{e.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
