'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatDate, formatTime } from '@/lib/dates';
import type { Locale } from '@/lib/i18n/config';

type Member = {
  user: { id: string; fullName: string; email: string; activeSession: { startedAt: string } | null };
};

type Invite = {
  id: string;
  code: string;
  usedCount: number;
  maxUses: number;
  expiresAt: string | null;
};

const PEOPLE_COPY: Record<Locale, { inviteCreate: string; expiresIn: string }> = {
  en: { inviteCreate: 'Create 6-digit invite', expiresIn: 'Expires' },
  fa: { inviteCreate: 'ساخت کد دعوت ۶ رقمی', expiresIn: 'انقضا' },
  hy: { inviteCreate: 'Ստեղծել 6 նիշ հրավեր', expiresIn: 'Սպառվում է' },
};

function readLocale(): Locale {
  if (typeof document === 'undefined') return 'fa';
  const match = document.cookie.match(/(?:^|; )teamora-locale=([^;]*)/);
  const raw = match?.[1];
  if (raw === 'fa' || raw === 'hy' || raw === 'en') return raw;
  return 'fa';
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

export default function AdminPeoplePage() {
  const locale = readLocale();
  const copy = PEOPLE_COPY[locale];
  const [people, setPeople] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);

  async function load() {
    const [p, i] = await Promise.all([
      api.get<Member[]>('/users'),
      api.get<Invite[]>('/invites'),
    ]);
    setPeople(p);
    setInvites(i);
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
      <h1>افراد</h1>
      <div className="card">
        <form onSubmit={createInvite} style={{ marginBottom: '1rem' }}>
          <button className="btn btn-primary" type="submit">
            {copy.inviteCreate}
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
                  {copy.expiresIn}: {remainingLabel(inv.expiresAt, locale)}
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
      <div className="card">
        {people.map((m) => (
          <div className="list-row" key={m.user.id}>
            <div>
              <strong>{m.user.fullName}</strong>
              <div className="muted">{m.user.email}</div>
            </div>
            <span className="muted">{m.user.activeSession ? 'آنلاین' : 'آفلاین'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
