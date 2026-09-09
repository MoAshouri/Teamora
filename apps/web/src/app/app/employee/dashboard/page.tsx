'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { api, authApi, type AuthUser } from '@/lib/api';
import { BrickWeekChart } from '@/features/ui/brick-week-chart';
import { IwanFrame } from '@/features/ui/iwan-frame';
import type { WorkPolicy } from '@/features/work-time';
import { formatTime } from '@/lib/dates';
import type { Locale } from '@/lib/i18n/config';

function hoursFromMinutes(minutes: number) {
  const hours = minutes / 60;
  return Number.isInteger(hours) ? String(hours) : String(Math.round(hours * 10) / 10);
}

export default function EmployeeDashboardPage() {
  const t = useTranslations('app');
  const tDash = useTranslations('dashboard');
  const locale = useLocale() as Locale;
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<{ startedAt: string } | null>(null);
  const [balance, setBalance] = useState<{ remaining: number } | null>(null);
  const [weekly, setWeekly] = useState<Record<string, number>>({});
  const [policy, setPolicy] = useState<WorkPolicy | null>(null);
  const [now, setNow] = useState(() => new Date());

  async function load() {
    const me = await authApi.me();
    setUser(me);
    const [s, b, w, p] = await Promise.all([
      api.get<{ startedAt: string } | null>('/work-time/session/me'),
      api.get<{ remaining: number }>('/leaves/balance/me'),
      api.get<{ hoursByDay: Record<string, number> }>('/work-time/weekly'),
      api.get<WorkPolicy | null>('/companies/work-policy'),
    ]);
    setSession(s);
    setBalance(b);
    setWeekly(w.hoursByDay);
    setPolicy(p);
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
  const dayHours =
    policy?.dailyMinutes != null ? hoursFromMinutes(policy.dailyMinutes) : null;

  return (
    <div className="stack">
      <header>
        <h1 style={{ marginBottom: 0 }}>{t('greet.morning', { name: user?.fullName ?? '' })}</h1>
        <p className="muted">{session ? t('dashboard.presentNow') : t('people.away')}</p>
      </header>

      <IwanFrame
        progress={1}
        footer={
          !session ? (
            <button className="btn btn-primary" onClick={startDay}>
              {tDash('startDay')}
            </button>
          ) : (
            <button className="btn btn-primary" onClick={endDay}>
              {tDash('endDay')}
            </button>
          )
        }
      >
        <div className="stat" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {formatTime(now, locale)}
        </div>
        {session ? (
          <p className="muted" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {hh}:{mm}:{ss}
          </p>
        ) : null}
        {dayHours ? (
          <p className="muted">{t('employee.dayLengthHours', { hours: dayHours })}</p>
        ) : null}
      </IwanFrame>

      <div className="grid-2">
        <div className="card">
          <p className="muted">{tDash('remainingLeave')}</p>
          <div className="stat">{balance?.remaining ?? '—'}</div>
        </div>
        <div className="card">
          <p className="muted">{tDash('weeklyHours')}</p>
          <BrickWeekChart hoursByDay={weekly} />
        </div>
      </div>
    </div>
  );
}
