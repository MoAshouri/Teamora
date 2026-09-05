'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { usePresence } from '@/hooks/use-presence';

type Policy = { workStart: string; workEnd: string; workDays: number[]; timezone: string };
type Session = { id: string; startedAt: string; user: { fullName: string } };
type Entry = {
  id: string;
  status: string;
  startedAt: string;
  endedAt: string;
  user: { fullName: string };
};

export default function AdminWorkTimePage() {
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const { events } = usePresence(true);

  async function load() {
    const [p, s, e] = await Promise.all([
      api.get<Policy | null>('/companies/work-policy'),
      api.get<Session[]>('/work-time/sessions/active'),
      api.get<Entry[]>('/work-time/entries'),
    ]);
    setPolicy(p);
    setSessions(s);
    setEntries(e);
  }

  useEffect(() => {
    load().catch(console.error);
  }, [events.length]);

  async function savePolicy(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await api.put('/companies/work-policy', {
      workStart: String(fd.get('workStart')),
      workEnd: String(fd.get('workEnd')),
      workDays: String(fd.get('workDays'))
        .split(',')
        .map((n) => Number(n.trim()))
        .filter((n) => !Number.isNaN(n)),
      timezone: String(fd.get('timezone') || 'Asia/Tehran'),
    });
    await load();
  }

  async function review(id: string, status: 'APPROVED' | 'REJECTED') {
    await api.patch(`/work-time/entries/${id}`, { status });
    await load();
  }

  return (
    <div className="stack">
      <h1>ساعات کاری</h1>
      <div className="card">
        <h2>سیاست ساعات شرکت</h2>
        <form onSubmit={savePolicy}>
          <label className="field">
            <span>شروع</span>
            <input name="workStart" defaultValue={policy?.workStart ?? '09:00'} required />
          </label>
          <label className="field">
            <span>پایان</span>
            <input name="workEnd" defaultValue={policy?.workEnd ?? '18:00'} required />
          </label>
          <label className="field">
            <span>روزهای کاری (۰=یکشنبه … ۶=شنبه)</span>
            <input name="workDays" defaultValue={(policy?.workDays ?? [6, 0, 1, 2, 3]).join(',')} />
          </label>
          <label className="field">
            <span>منطقه زمانی</span>
            <input name="timezone" defaultValue={policy?.timezone ?? 'Asia/Tehran'} />
          </label>
          <button className="btn btn-primary" type="submit">
            ذخیره
          </button>
        </form>
      </div>
      <div className="card">
        <h2>حضور زنده</h2>
        {sessions.map((s) => (
          <div className="list-row" key={s.id}>
            <strong>{s.user.fullName}</strong>
            <span className="muted">{new Date(s.startedAt).toLocaleTimeString()}</span>
          </div>
        ))}
      </div>
      <div className="card">
        <h2>ارسال‌های کارکرد</h2>
        {entries.map((e) => (
          <div className="list-row" key={e.id}>
            <div>
              <strong>{e.user.fullName}</strong>
              <div className="muted">{e.status}</div>
            </div>
            {e.status === 'PENDING' ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" onClick={() => review(e.id, 'APPROVED')}>
                  تأیید
                </button>
                <button className="btn btn-ghost" onClick={() => review(e.id, 'REJECTED')}>
                  رد
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
