'use client';

import { useEffect, useState } from 'react';
import { api, authApi, type AuthUser } from '@/lib/api';
import { BrickWeekChart } from '@/features/ui/brick-week-chart';
import { IwanFrame } from '@/features/ui/iwan-frame';

export default function EmployeeDashboardPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<{ startedAt: string } | null>(null);
  const [balance, setBalance] = useState<{ remaining: number } | null>(null);
  const [weekly, setWeekly] = useState<Record<string, number>>({});
  const [now, setNow] = useState(() => new Date());

  async function load() {
    const me = await authApi.me();
    setUser(me);
    const [s, b, w] = await Promise.all([
      api.get<{ startedAt: string } | null>('/work-time/session/me'),
      api.get<{ remaining: number }>('/leaves/balance/me'),
      api.get<{ hoursByDay: Record<string, number> }>('/work-time/weekly'),
    ]);
    setSession(s);
    setBalance(b);
    setWeekly(w.hoursByDay);
  }

  useEffect(() => {
    load().catch(console.error);
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  async function startDay() {
    await api.post('/work-time/session/start');
    await load();
  }

  async function endDay() {
    await api.post('/work-time/session/end');
    await load();
  }

  const elapsed =
    session && now
      ? Math.max(0, Math.floor((now.getTime() - new Date(session.startedAt).getTime()) / 1000))
      : 0;
  const hh = String(Math.floor(elapsed / 3600)).padStart(2, '0');
  const mm = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  return (
    <div className="stack">
      <header>
        <h1 style={{ marginBottom: 0 }}>صبح بخیر{user ? `، ${user.fullName}` : ''}</h1>
        <p className="muted">{session ? 'الان سر کار' : 'خارج از شیفت'}</p>
      </header>

      <IwanFrame
        progress={1}
        footer={
          !session ? (
            <button className="btn btn-primary" onClick={startDay}>
              شروع روز
            </button>
          ) : (
            <button className="btn btn-primary" onClick={endDay}>
              پایان روز
            </button>
          )
        }
      >
        <div className="stat" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
        </div>
        <p className="muted">{session ? `گذشته ${hh}:${mm}:${ss}` : 'ساعت ثبت نمی‌شود'}</p>
      </IwanFrame>

      <div className="grid-2">
        <div className="card">
          <p className="muted">مانده مرخصی</p>
          <div className="stat">{balance?.remaining ?? '—'}</div>
        </div>
        <div className="card">
          <p className="muted">ساعات این هفته</p>
          <BrickWeekChart hoursByDay={weekly} />
        </div>
      </div>
    </div>
  );
}
