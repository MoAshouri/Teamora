'use client';

import { useEffect, useState } from 'react';
import { api, authApi, type AuthUser } from '@/lib/api';
import { usePresence } from '@/hooks/use-presence';
import { WaxSeal } from '@/features/ui/wax-seal';
import { BrickWeekChart } from '@/features/ui/brick-week-chart';
import { useTranslations } from 'next-intl';

type Leave = {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  user: { fullName: string };
};

export default function AdminDashboardPage() {
  const t = useTranslations('app');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [pending, setPending] = useState<Leave[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [weekly, setWeekly] = useState<Record<string, number>>({});
  const { connected, events } = usePresence(true);

  async function load() {
    const me = await authApi.me();
    setUser(me);
    const [leaves, sessions, hours] = await Promise.all([
      api.get<Leave[]>('/leaves/pending'),
      api.get<unknown[]>('/work-time/sessions/active'),
      api.get<{ hoursByDay: Record<string, number> }>(`/work-time/weekly?userId=${me.id}`),
    ]);
    setPending(leaves);
    setActiveCount(sessions.length);
    setWeekly(hours.hoursByDay);
  }

  useEffect(() => {
    load().catch(console.error);
  }, [events.length]);

  async function review(id: string, status: 'APPROVED' | 'REJECTED') {
    await api.patch(`/leaves/${id}`, { status });
    await load();
  }

  return (
    <div className="stack">
      <header>
        <h1 style={{ marginBottom: 0 }}>صبح بخیر{user ? `، ${user.fullName}` : ''}</h1>
        <p className="muted">Presence {connected ? 'live' : 'offline'} · pending {pending.length}</p>
      </header>

      <div className="grid-2">
        <div className="card">
          <p className="muted">الان سر کار</p>
          <div className="stat">{activeCount}</div>
        </div>
        <div className="card">
          <p className="muted">مرخصی در انتظار</p>
          <div className="stat">{pending.length}</div>
        </div>
      </div>

      <div className="card">
        <h2>ساعات این هفته</h2>
        <BrickWeekChart hoursByDay={weekly} />
      </div>

      <div className="card">
        <h2>در انتظار تأیید</h2>
        <div className="wax-legend">
          <WaxSeal status="pending" label={t('status.pending')} />
          <WaxSeal status="approved" label={t('status.approved')} />
          <WaxSeal status="rejected" label={t('status.rejected')} />
        </div>
        {pending.length === 0 ? <p className="muted">موردی نیست</p> : null}
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
                تأیید
              </button>
              <button className="btn btn-ghost" onClick={() => review(l.id, 'REJECTED')}>
                رد
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
