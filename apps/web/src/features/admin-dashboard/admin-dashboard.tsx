'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { api, authApi, type AuthUser } from '@/lib/api';
import { greetKey, hourInZone } from '@/lib/dates';
import { usePresence } from '@/hooks/use-presence';
import { PendingLeaves, type PendingLeave } from './pending-leaves';
import { AdminWeekHours } from './week-hours';
import { AdminStarredWeek } from './starred-week';
import './admin-dashboard.css';

export default function AdminDashboard() {
  const t = useTranslations('app');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [pending, setPending] = useState<PendingLeave[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [weekly, setWeekly] = useState<Record<string, number>>({});
  const [workDays, setWorkDays] = useState<number[]>([6, 0, 1, 2, 3]);
  const [timezone, setTimezone] = useState('Asia/Tehran');
  const { events } = usePresence(true);

  async function load() {
    const me = await authApi.me();
    setUser(me);
    const [leaves, sessions, hours, policy] = await Promise.all([
      api.get<PendingLeave[]>('/leaves/pending'),
      api.get<unknown[]>('/work-time/sessions/active'),
      api.get<{ hoursByDay: Record<string, number> }>('/work-time/weekly'),
      api.get<{ workDays: number[]; timezone?: string } | null>('/companies/work-policy'),
    ]);
    setPending(leaves);
    setActiveCount(sessions.length);
    setWeekly(hours.hoursByDay);
    if (policy?.workDays?.length) setWorkDays(policy.workDays);
    if (policy?.timezone) setTimezone(policy.timezone);
  }

  useEffect(() => {
    load().catch(console.error);
  }, [events.length]);

  const weekHours = useMemo(
    () => Object.values(weekly).reduce((sum, hours) => sum + hours, 0),
    [weekly],
  );
  const hour = hourInZone(timezone);
  const hello = greetKey(hour);
  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7869/ingest/c694b7eb-dcc2-4100-9c19-d4aca06d483e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a506d6'},body:JSON.stringify({sessionId:'a506d6',runId:'post-fix',hypothesisId:'AC',location:'admin-dashboard.tsx',message:'greeting bucket',data:{timezone,hour,hello},timestamp:Date.now()})}).catch(()=>{});
  }, [timezone, hour, hello]);
  // #endregion

  return (
    <div className="stack">
      <header>
        <h1 className="admin-dash__greet">
          {t(`greet.${hello}`, { name: user?.fullName ?? '' })}
        </h1>
      </header>

      <div className="kpi-strip">
        <div className="kpi-well">
          <p className="kpi-well__label">{t('dashboard.presentNow')}</p>
          <p className="kpi-well__value">{activeCount}</p>
        </div>
        <div className="kpi-well">
          <p className="kpi-well__label">{t('dashboard.pendingLeaves')}</p>
          <p className="kpi-well__value">{pending.length}</p>
        </div>
        <div className="kpi-well">
          <p className="kpi-well__label">{t('dashboard.weekHours')}</p>
          <p className="kpi-well__value">{weekHours.toFixed(1)}</p>
        </div>
      </div>

      <AdminWeekHours hoursByDay={weekly} workDays={workDays} timezone={timezone} />

      <AdminStarredWeek workDays={workDays} timezone={timezone} />

      <PendingLeaves items={pending} onReload={load} />
    </div>
  );
}
