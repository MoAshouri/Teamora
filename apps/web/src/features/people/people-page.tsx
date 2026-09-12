'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { usePresence } from '@/hooks/use-presence';
import { BrickWeekChart } from '@/features/ui/brick-week-chart';
import type { WorkPolicy } from '@/features/work-time';
import { ComposeLetter } from './compose-letter';
import { GrantLeave } from './grant-leave';
import { InvitePanel } from './invite-panel';
import './people-page.css';

type Member = {
  user: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
    activeSession: { startedAt: string } | null;
    role: 'ADMIN' | 'EMPLOYEE';
  };
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('') || '•';
}

const DEFAULT_WORK_DAYS = [6, 0, 1, 2, 3];

export default function PeoplePage() {
  const t = useTranslations('app');
  const [people, setPeople] = useState<Member[]>([]);
  const [weekly, setWeekly] = useState<Record<string, Record<string, number>>>({});
  const [workDays, setWorkDays] = useState<number[]>(DEFAULT_WORK_DAYS);
  const [timezone, setTimezone] = useState('Asia/Tehran');
  const [dailyMinutes, setDailyMinutes] = useState(480);
  const { events } = usePresence(true);

  async function load() {
    const [roster, hours, policy] = await Promise.all([
      api.get<Member[]>('/users'),
      api.get<{ people: { userId: string; hoursByDay: Record<string, number> }[] }>(
        '/work-time/weekly/company',
      ),
      api.get<WorkPolicy | null>('/companies/work-policy'),
    ]);
    setPeople(roster);
    const map: Record<string, Record<string, number>> = {};
    for (const row of hours.people) map[row.userId] = row.hoursByDay;
    setWeekly(map);
    if (policy?.workDays?.length) setWorkDays(policy.workDays);
    if (policy?.timezone) setTimezone(policy.timezone);
    if (policy?.dailyMinutes) setDailyMinutes(policy.dailyMinutes);
    // #region agent log
    fetch('http://127.0.0.1:7869/ingest/c694b7eb-dcc2-4100-9c19-d4aca06d483e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a506d6'},body:JSON.stringify({sessionId:'a506d6',runId:'post-fix',hypothesisId:'PP',location:'people-page.tsx:load',message:'people week chart uses work policy',data:{workDays:policy?.workDays??null,timezone:policy?.timezone??null,dailyMinutes:policy?.dailyMinutes??null,present:roster.filter((row)=>Boolean(row.user.activeSession)).length},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  useEffect(() => {
    if (events.length === 0) return;
    api
      .get<Member[]>('/users')
      .then((roster) => {
        setPeople(roster);
        // #region agent log
        fetch('http://127.0.0.1:7869/ingest/c694b7eb-dcc2-4100-9c19-d4aca06d483e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a506d6'},body:JSON.stringify({sessionId:'a506d6',runId:'post-fix',hypothesisId:'PP',location:'people-page.tsx:presence',message:'people roster refreshes on presence',data:{present:roster.filter((row)=>Boolean(row.user.activeSession)).length,events:events.length},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
      })
      .catch(console.error);
  }, [events.length]);

  return (
    <div className="stack">
      <h1>{t('people.title')}</h1>
      <InvitePanel />
      <div className="stack">
        {people.map((m) => {
          const hoursByDay = weekly[m.user.id] ?? {};
          const total = Object.values(hoursByDay).reduce((sum, hours) => sum + hours, 0);
          const present = Boolean(m.user.activeSession);
          return (
            <article className="people-row" key={m.user.id}>
              <div className="people-row__top">
                {m.user.avatarUrl ? (
                  <img className="people-avatar" src={m.user.avatarUrl} alt="" />
                ) : (
                  <div className="people-avatar" aria-hidden="true">
                    {initials(m.user.fullName)}
                  </div>
                )}
                <div className="people-row__meta">
                  <h2 className="people-row__name">{m.user.fullName}</h2>
                  <p className="people-row__email muted">{m.user.email}</p>
                  <p className="people-row__hours">
                    {t('people.weekHours')}: {t('hours.hoursShort', { n: total.toFixed(1) })}
                  </p>
                </div>
                <div className="people-row__actions">
                  <span className="people-row__status">
                    <span className="people-pulse" data-on={present} />
                    {present ? t('people.present') : t('people.away')}
                  </span>
                  {m.user.role === 'EMPLOYEE' ? (
                    <>
                      <ComposeLetter recipientId={m.user.id} recipientName={m.user.fullName} />
                      <GrantLeave userId={m.user.id} recipientName={m.user.fullName} />
                    </>
                  ) : null}
                </div>
              </div>
              <BrickWeekChart
                hoursByDay={hoursByDay}
                workDays={workDays.length ? workDays : DEFAULT_WORK_DAYS}
                timezone={timezone}
                yMax={Math.max(1, dailyMinutes / 60)}
                size="compact"
              />
            </article>
          );
        })}
      </div>
    </div>
  );
}
