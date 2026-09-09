'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { api, authApi, type AuthUser } from '@/lib/api';
import { usePresence } from '@/hooks/use-presence';
import { WaxSeal } from '@/features/ui/wax-seal';
import { AdminWeekHours } from './week-hours';
import { AdminStarredWeek } from './starred-week';
import './admin-dashboard.css';

type Leave = {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  user: { fullName: string };
};

export default function AdminDashboard() {
  const t = useTranslations('app');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [pending, setPending] = useState<Leave[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [weekly, setWeekly] = useState<Record<string, number>>({});
  const [workDays, setWorkDays] = useState<number[]>([6, 0, 1, 2, 3]);
  const [timezone, setTimezone] = useState('Asia/Tehran');
  const { events } = usePresence(true);

  async function load() {
    const me = await authApi.me();
    setUser(me);
    const [leaves, sessions, hours, policy] = await Promise.all([
      api.get<Leave[]>('/leaves/pending'),
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

  async function review(id: string, status: 'APPROVED' | 'REJECTED') {
    await api.patch(`/leaves/${id}`, { status });
    await load();
  }

  const weekHours = useMemo(
    () => Object.values(weekly).reduce((sum, hours) => sum + hours, 0),
    [weekly],
  );

  return (
    <div className="stack">
      <header>
        <h1 className="admin-dash__greet">
          {t('greet.morning', { name: user?.fullName ?? '' })}
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

      <AdminWeekHours hoursByDay={weekly} workDays={workDays} />

      <AdminStarredWeek workDays={workDays} timezone={timezone} />

      <div className="card">
        <h2>{t('dashboard.pendingLeaves')}</h2>
        <div className="wax-legend">
          <WaxSeal status="pending" label={t('status.pending')} />
          <WaxSeal status="approved" label={t('status.approved')} />
          <WaxSeal status="rejected" label={t('status.rejected')} />
        </div>
        {pending.length === 0 ? <p className="muted">—</p> : null}
        {pending.map((l) => (
          <div className="list-row" key={l.id}>
            <div>
              <strong>{l.user.fullName}</strong>
              <div className="muted">
                {l.type} · {l.startDate.slice(0, 10)} → {l.endDate.slice(0, 10)}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button className="btn btn-primary" onClick={() => review(l.id, 'APPROVED')}>
                {t('status.approved')}
              </button>
              <button className="btn btn-ghost" onClick={() => review(l.id, 'REJECTED')}>
                {t('status.rejected')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}