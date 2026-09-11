'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { usePresence } from '@/hooks/use-presence';
import { PolicyForm, type WorkPolicy } from '@/features/work-time';
import { formatTime } from '@/lib/dates';
import type { Locale } from '@/lib/i18n/config';

type Session = { id: string; startedAt: string; user: { fullName: string } };
type Entry = {
  id: string;
  status: string;
  date: string;
  startedAt: string;
  endedAt: string;
  user: { fullName: string };
};

function statusLabel(t: (key: 'status.pending' | 'status.approved' | 'status.rejected') => string, status: string) {
  if (status === 'APPROVED') return t('status.approved');
  if (status === 'REJECTED') return t('status.rejected');
  return t('status.pending');
}

export default function AdminWorkTimePage() {
  const t = useTranslations('app');
  const locale = useLocale() as Locale;
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
    // #region agent log
    fetch('http://127.0.0.1:7869/ingest/c694b7eb-dcc2-4100-9c19-d4aca06d483e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a506d6'},body:JSON.stringify({sessionId:'a506d6',runId:'post-fix',hypothesisId:'AF',location:'work-time/page.tsx:live',message:'admin live clock timezone',data:{zone:p?.timezone,live:s[0]?formatTime(s[0].startedAt,locale,p?.timezone):null,utc:s[0]?new Intl.DateTimeFormat('en-US',{hour:'2-digit',minute:'2-digit',timeZone:'UTC'}).format(new Date(s[0].startedAt)):null},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
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
            <span className="muted">{formatTime(s.startedAt, locale, policy?.timezone)}</span>
          </div>
        ))}
      </div>
      <div className="card">
        <h2>{t('workTime.entries')}</h2>
        {entries.map((e) => (
          <div className="list-row" key={e.id}>
            <div>
              <strong>{e.user.fullName}</strong>
              <div className="muted">{statusLabel(t, e.status)}</div>
              <div className="muted">
                {e.date.slice(0, 10)} · {formatTime(e.startedAt, locale, policy?.timezone)} –{' '}
                {formatTime(e.endedAt, locale, policy?.timezone)}
              </div>
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
