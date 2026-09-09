'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { WaxSeal } from '@/features/ui/wax-seal';
import './invite-panel.css';

type Invite = {
  id: string;
  code: string;
  usedCount: number;
  maxUses: number;
  expiresAt: string | null;
};

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function remainingClock(expiresAt: string | null, now: number) {
  if (!expiresAt) return '00:00:00';
  const ms = Math.max(0, new Date(expiresAt).getTime() - now);
  const hours = Math.floor(ms / 3_600_000);
  const mins = Math.floor((ms % 3_600_000) / 60_000);
  const secs = Math.floor((ms % 60_000) / 1000);
  return `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
}

function inviteState(invite: Invite, now: number): 'active' | 'expired' | 'used' {
  if (invite.usedCount >= invite.maxUses) return 'used';
  if (invite.expiresAt && new Date(invite.expiresAt).getTime() <= now) return 'expired';
  return 'active';
}

export function InvitePanel() {
  const t = useTranslations('app');
  const [invites, setInvites] = useState<Invite[]>([]);
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  async function load() {
    const rows = await api.get<Invite[]>('/invites');
    setInvites(rows);
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const featured = useMemo(
    () => invites.find((invite) => inviteState(invite, now) === 'active') ?? null,
    [invites, now],
  );

  async function createInvite() {
    await api.post('/invites', {});
    setCopied(false);
    await load();
  }

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="card invite-panel">
      <div className="invite-panel__head">
        <h2>{t('people.inviteTitle')}</h2>
        <button className="btn btn-primary" type="button" onClick={() => createInvite()}>
          {t('people.createInvite')}
        </button>
      </div>

      {featured ? (
        <div className="invite-token">
          <p className="invite-token__code">{featured.code}</p>
          <div className="invite-token__meta">
            <WaxSeal status="pending" label={t('people.remaining')} />
            <p className="invite-token__clock">
              {t('people.remaining')}: {remainingClock(featured.expiresAt, now)}
            </p>
          </div>
          <button className="btn btn-ghost" type="button" onClick={() => copyCode(featured.code)}>
            {copied ? t('people.copied') : t('people.copyCode')}
          </button>
        </div>
      ) : null}

      <div className="invite-list">
        {invites.map((invite) => {
          const state = inviteState(invite, now);
          return (
            <div className="invite-row" data-state={state} key={invite.id}>
              <span className="invite-row__code">{invite.code}</span>
              <span className="invite-row__state">
                {state === 'used'
                  ? t('people.used')
                  : state === 'expired'
                    ? t('people.expired')
                    : remainingClock(invite.expiresAt, now)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
