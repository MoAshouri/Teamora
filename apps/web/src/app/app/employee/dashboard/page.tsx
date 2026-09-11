'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { api, authApi, type AuthUser } from '@/lib/api';
import { DayTimer } from '@/features/employee-home/day-timer';
import { EmployeeWeekHours } from '@/features/employee-home/week-hours';
import { LeaveStatusCard } from '@/features/leaves';
import { MeetingsPreview } from '@/features/employee-home/meetings-preview';
import { TasksPreview } from '@/features/employee-home/tasks-preview';
import { LettersBox } from '@/features/employee-home/letters-box';
import type { WorkPolicy } from '@/features/work-time';
import { greetKey, hourInZone } from '@/lib/dates';

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

  const timezone = policy?.timezone ?? 'Asia/Tehran';
  const hour = hourInZone(timezone);
  const hello = greetKey(hour);
  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7869/ingest/c694b7eb-dcc2-4100-9c19-d4aca06d483e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a506d6'},body:JSON.stringify({sessionId:'a506d6',runId:'post-fix',hypothesisId:'AC',location:'employee/dashboard/page.tsx',message:'greeting bucket',data:{timezone,hour,hello},timestamp:Date.now()})}).catch(()=>{});
  }, [timezone, hour, hello]);
  // #endregion

  return (
    <div className="stack">
      <header>
        <h1 style={{ marginBottom: 0 }}>{t(`greet.${hello}`, { name: user?.fullName ?? '' })}</h1>
        <p className="muted">{session ? t('dashboard.presentNow') : t('people.away')}</p>
      </header>

      <DayTimer session={session} policy={policy} onStart={startDay} onEnd={endDay} />

      <div className="grid-2">
        <EmployeeWeekHours
          hoursByDay={weekly}
          workDays={policy?.workDays}
          dailyMinutes={policy?.dailyMinutes}
          timezone={policy?.timezone ?? 'Asia/Tehran'}
        />
        <LeaveStatusCard variant="home" />
      </div>
      <MeetingsPreview timezone={policy?.timezone ?? 'Asia/Tehran'} />
      <TasksPreview timezone={policy?.timezone ?? 'Asia/Tehran'} />
      <LettersBox />
    </div>
  );
}
