'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { LeaveRequestForm } from '@/features/leaves';

type Leave = {
  id: string;
  type: string;
  kind?: 'DAILY' | 'HOURLY';
  hours?: string | number | null;
  status: string;
  startDate: string;
  endDate: string;
};

export default function EmployeeLeavesPage() {
  const t = useTranslations('app');
  const tDash = useTranslations('dashboard');
  const [items, setItems] = useState<Leave[]>([]);
  const [balance, setBalance] = useState<{
    remainingDays?: number;
    remainingHours?: number;
    remaining: number;
    used: number;
    annualAllowance: number;
  } | null>(null);

  async function load() {
    const [list, b] = await Promise.all([
      api.get<Leave[]>('/leaves'),
      api.get<{
        remainingDays?: number;
        remainingHours?: number;
        remaining: number;
        used: number;
        annualAllowance: number;
      }>('/leaves/balance/me'),
    ]);
    setItems(list);
    setBalance(b);
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  return (
    <div className="stack">
      <h1>{t('nav.leaves')}</h1>
      <div className="card">
        <p className="muted">{tDash('remainingLeave')}</p>
        <div className="stat">{balance?.remainingDays ?? balance?.remaining ?? '—'}</div>
        <p className="muted">
          {t('leave.hours')} {balance?.remainingHours ?? 0}
        </p>
      </div>
      <LeaveRequestForm onSaved={load} />
      <div className="card">
        {items.map((item) => (
          <div className="list-row" key={item.id}>
            <div>
              <strong>{item.type}</strong>
              <div className="muted">
                {item.kind === 'HOURLY' ? t('leave.kindHourly') : t('leave.kindDaily')}
                {item.kind === 'HOURLY' && item.hours != null ? ` · ${item.hours}` : ''}
                {' · '}
                {item.startDate.slice(0, 10)}
                {item.kind === 'DAILY' || !item.kind ? ` → ${item.endDate.slice(0, 10)}` : ''}
              </div>
            </div>
            <span className="muted">{item.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
