'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api } from '@/lib/api';

type Member = {
  user: { id: string; fullName: string; email: string; activeSession: { startedAt: string } | null };
};

type Invite = { id: string; code: string; usedCount: number; maxUses: number };

export default function AdminPeoplePage() {
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
    await api.post('/invites', { maxUses: 5, expiresInHours: 72 });
    await load();
  }

  return (
    <div className="stack">
      <h1>افراد</h1>
      <div className="card">
        <form onSubmit={createInvite} style={{ marginBottom: '1rem' }}>
          <button className="btn btn-primary" type="submit">
            ساخت کد دعوت ۶ رقمی
          </button>
        </form>
        {invites.map((inv) => (
          <div className="list-row" key={inv.id}>
            <strong style={{ letterSpacing: '0.2em' }}>{inv.code}</strong>
            <span className="muted">
              {inv.usedCount}/{inv.maxUses}
            </span>
          </div>
        ))}
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
