'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { usePresence } from '@/hooks/use-presence';
import { PolicyForm, type WorkPolicy } from '@/features/work-time';

type Session = { id: string; startedAt: string; user: { fullName: string } };
type Entry = {
  id: string;
  status: string;
  startedAt: string;
  endedAt: string;
  user: { fullName: string };
};

export default function AdminWorkTimePage() {
  const t = useTranslations('app');
  const [policy, setPolicy] = useState<WorkPolicy | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const { events } = usePresence(true);

  async function load() {
    const [p, s, e] = await Promise.all([
      api.get<WorkPolicy | null>('/companies/work-policy'),
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

  async function review(id: string, status: 'APPROVED' | 'REJECTED') {
    await api.patch(`/work-time/entries/${id}`, { status });
    await load();
  }

  return (
    <div className="stack">
      <h1>{t('workTime.title')}</h1>
      <PolicyForm policy={policy} onSaved={load} />
      <div className="card">
        <h2>{t('workTime.live')}</h2>
        {sessions.map((s) => (
          <div className="list-row" key={s.id}>
            <strong>{s.user.fullName}</strong>
            <span className="muted">{new Date(s.startedAt).toLocaleTimeString()}</span>
          </div>
        ))}
      </div>
      <div className="card">
        <h2>{t('workTime.entries')}</h2>
        {entries.map((e) => (
          <div className="list-row" key={e.id}>
            <div>
              <strong>{e.user.fullName}</strong>
              <div className="muted">{e.status}</div>
            </div>
            {e.status === 'PENDING' ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" onClick={() => review(e.id, 'APPROVED')}>
                  {t('status.approved')}
                </button>
                <button className="btn btn-ghost" onClick={() => review(e.id, 'REJECTED')}>
                  {t('status.rejected')}
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
