'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { BrickWeekChart } from '@/features/ui/brick-week-chart';
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

export default function PeoplePage() {
  const t = useTranslations('app');
  const [people, setPeople] = useState<Member[]>([]);
  const [weekly, setWeekly] = useState<Record<string, Record<string, number>>>({});

  async function load() {
    const [roster, hours] = await Promise.all([
      api.get<Member[]>('/users'),
      api.get<{ people: { userId: string; hoursByDay: Record<string, number> }[] }>(
        '/work-time/weekly/company',
      ),
    ]);
    setPeople(roster);
    const map: Record<string, Record<string, number>> = {};
    for (const row of hours.people) map[row.userId] = row.hoursByDay;
    setWeekly(map);
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

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
              <BrickWeekChart hoursByDay={hoursByDay} yMax={8} size="compact" />
            </article>
          );
        })}
      </div>
    </div>
  );
}
