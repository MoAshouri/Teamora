'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { BrickWeekChart } from '@/features/ui/brick-week-chart';
import { formatDate, formatTime } from '@/lib/dates';
import type { Locale } from '@/lib/i18n/config';
import './people-page.css';

type Member = {
  user: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
    activeSession: { startedAt: string } | null;
  };
};

type Invite = {
  id: string;
  code: string;
  usedCount: number;
  maxUses: number;
  expiresAt: string | null;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('') || '•';
}

function remainingLabel(expiresAt: string | null, locale: Locale) {
  if (!expiresAt) return '';
  const end = new Date(expiresAt);
  const ms = end.getTime() - Date.now();
  const when = `${formatDate(end, locale)} ${formatTime(end, locale)}`;
  if (ms <= 0) return when;
  const hours = Math.floor(ms / 3600_000);
  const mins = Math.max(0, Math.floor((ms % 3600_000) / 60_000));
  return `${when} · ${hours}h ${mins}m`;
}

export default function PeoplePage() {
  const t = useTranslations('app');
  const locale = useLocale() as Locale;
  const [people, setPeople] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [weekly, setWeekly] = useState<Record<string, Record<string, number>>>({});

  async function load() {
    const [roster, codes, hours] = await Promise.all([
      api.get<Member[]>('/users'),
      api.get<Invite[]>('/invites'),
      api.get<{ people: { userId: string; hoursByDay: Record<string, number> }[] }>(
        '/work-time/weekly/company',
      ),
    ]);
    setPeople(roster);
    setInvites(codes);
    const map: Record<string, Record<string, number>> = {};
    for (const row of hours.people) map[row.userId] = row.hoursByDay;
    setWeekly(map);
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  async function createInvite(e: FormEvent) {
    e.preventDefault();
    await api.post('/invites', { maxUses: 1, expiresInHours: 3 });
    await load();
  }

  return (
    <div className="stack">
      <h1>{t('people.title')}</h1>
      <div className="card">
        <form onSubmit={createInvite} style={{ marginBottom: '1rem' }}>
          <button className="btn btn-primary" type="submit">
            {t('people.inviteCreate')}
          </button>
        </form>
        {invites.map((inv) => {
          const expired = inv.expiresAt ? new Date(inv.expiresAt).getTime() <= Date.now() : false;
          const spent = inv.usedCount >= inv.maxUses;
          return (
            <div className="list-row" key={inv.id}>
              <div>
                <strong style={{ letterSpacing: '0.2em' }}>{inv.code}</strong>
                <div className="muted">
                  {t('people.expiresIn')}: {remainingLabel(inv.expiresAt, locale)}
                </div>
              </div>
              <span className="muted">
                {inv.usedCount}/{inv.maxUses}
                {expired || spent ? ' · —' : ''}
              </span>
            </div>
          );
        })}
      </div>
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
                <span className="people-row__status">
                  <span className="people-pulse" data-on={present} />
                  {present ? t('people.present') : t('people.away')}
                </span>
              </div>
              <BrickWeekChart hoursByDay={hoursByDay} yMax={8} size="compact" />
            </article>
          );
        })}
      </div>
    </div>
  );
}
