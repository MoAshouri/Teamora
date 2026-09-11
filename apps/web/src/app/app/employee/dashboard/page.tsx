'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { api, authApi, type AuthUser } from '@/lib/api';
import { DayTimer } from '@/features/employee-home/day-timer';
import { EmployeeWeekHours } from '@/features/employee-home/week-hours';
import { LeaveStatusCard } from '@/features/leaves';
import type { WorkPolicy } from '@/features/work-time';

export default function EmployeeDashboardPage() {
  const t = useTranslations('app');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<{ startedAt: string } | null>(null);
  const [weekly, setWeekly] = useState<Record<string, number>>({});
  const [policy, setPolicy] = useState<WorkPolicy | null>(null);

  async function load() {
    const me = await authApi.me();
    setUser(me);
    const [s, w, p] = await Promise.all([
      api.get<{ startedAt: string } | null>('/work-time/session/me'),
      api.get<{ hoursByDay: Record<string, number> }>('/work-time/weekly'),
      api.get<WorkPolicy | null>('/companies/work-policy'),
    ]);
    setSession(s);
    setWeekly(w.hoursByDay);
    setPolicy(p);
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  async function startDay() {
    await api.post('/work-time/session/start');
    await load();
  }

  async function endDay() {
    await api.post('/work-time/session/end');
    await load();
  }

  return (
    <div className="stack">
      <header>
        <h1 style={{ marginBottom: 0 }}>{t('greet.morning', { name: user?.fullName ?? '' })}</h1>
        <p className="muted">{session ? t('dashboard.presentNow') : t('people.away')}</p>
      </header>

      <DayTimer session={session} policy={policy} onStart={startDay} onEnd={endDay} />

      <div className="grid-2">
        <EmployeeWeekHours
          hoursByDay={weekly}
          workDays={policy?.workDays}
          dailyMinutes={policy?.dailyMinutes}
        />
        <LeaveStatusCard variant="home" />
      </div>
    </div>
  );
}
