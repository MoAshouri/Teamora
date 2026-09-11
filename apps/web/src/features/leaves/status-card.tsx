'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { Modal } from '@/features/ui/modal';
import { WaxSeal, type WaxStatus } from '@/features/ui/wax-seal';
import { LeaveRequestForm } from './request-form';
import './status-card.css';

export type LeaveStatusItem = {
  id: string;
  type: string;
  kind?: 'DAILY' | 'HOURLY';
  hours?: string | number | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  startDate: string;
  endDate: string;
  reviewNote?: string | null;
};

type LeaveBalance = {
  remainingDays?: number;
  remainingHours?: number;
  remaining: number;
};

function leaveIso(value: string) {
  return value.slice(0, 10);
}

function waxStatus(status: string): WaxStatus {
  if (status === 'APPROVED') return 'approved';
  if (status === 'REJECTED') return 'rejected';
  return 'pending';
}

export function LeaveStatusCard({ variant = 'page' }: { variant?: 'page' | 'home' }) {
  const t = useTranslations('app');
  const tCommon = useTranslations('common');
  const [items, setItems] = useState<LeaveStatusItem[]>([]);
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [open, setOpen] = useState<LeaveStatusItem | null>(null);
  const [requestOpen, setRequestOpen] = useState(false);

  async function load() {
    const [list, nextBalance] = await Promise.all([
      api.get<LeaveStatusItem[]>('/leaves'),
      api.get<LeaveBalance>('/leaves/balance/me'),
    ]);
    setItems(list);
    setBalance(nextBalance);
  }

  useEffect(() => {
    load().catch(console.error);
    const onFocus = () => {
      load().catch(console.error);
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const pending = items.some((item) => item.status === 'PENDING');
  useEffect(() => {
    if (!pending) return;
    const id = window.setInterval(() => {
      load().catch(console.error);
    }, 30_000);
    return () => window.clearInterval(id);
  }, [pending]);

  const latest = items[0];
  const rest = items.slice(1);

  function statusLabel(status: string) {
    if (status === 'APPROVED') return t('leave.statusApproved');
    if (status === 'REJECTED') return t('leave.statusRejected');
    return t('leave.statusPending');
  }

  function detail(item: LeaveStatusItem) {
    const hourly = item.kind === 'HOURLY';
    const kind = hourly ? t('leave.hourly') : t('leave.daily');
    if (hourly && item.hours != null) return `${item.type} · ${kind} · ${item.hours}`;
    return `${item.type} · ${kind} · ${leaveIso(item.startDate)} → ${leaveIso(item.endDate)}`;
  }

  function reasonCopy(item: LeaveStatusItem) {
    if (item.status === 'PENDING' || !item.reviewNote) return t('leave.waitingReview');
    return item.reviewNote;
  }

  return (
    <div className={variant === 'home' ? 'leave-status leave-status--home' : 'stack leave-status'}>
      {variant === 'page' ? <h1>{t('nav.leaves')}</h1> : null}
      <div className="card">
        <div className="leave-status__balance">
          <div>
            <p className="muted">{t('leave.remainingDays')}</p>
            <p className="leave-status__stat">{balance?.remainingDays ?? balance?.remaining ?? '—'}</p>
          </div>
          <div>
            <p className="muted">{t('leave.remainingHours')}</p>
            <p className="leave-status__stat">{balance?.remainingHours ?? 0}</p>
          </div>
        </div>
        {latest ? (
          <button className="leave-status__latest" type="button" onClick={() => setOpen(latest)}>
            <WaxSeal size="md" status={waxStatus(latest.status)} label={statusLabel(latest.status)} />
            <span>
              <strong className="leave-status__name">{detail(latest)}</strong>
              <span className="muted">{t('leave.viewReason')}</span>
            </span>
          </button>
        ) : (
          <p className="muted">{tCommon('empty')}</p>
        )}
        {rest.map((item) => (
          <button className="leave-status__row" type="button" key={item.id} onClick={() => setOpen(item)}>
            <WaxSeal status={waxStatus(item.status)} label={statusLabel(item.status)} />
            <span className="muted">{detail(item)}</span>
            <span className="muted">{t('leave.viewReason')}</span>
          </button>
        ))}
        {variant === 'home' ? (
          <button className="btn btn-primary leave-status__request" type="button" onClick={() => setRequestOpen(true)}>
            {t('leave.request')}
          </button>
        ) : null}
      </div>
      {variant === 'page' ? (
        <LeaveRequestForm onSaved={load} />
      ) : (
        <Modal open={requestOpen} onClose={() => setRequestOpen(false)} title={t('leave.request')}>
          <LeaveRequestForm
            onSaved={() => {
              setRequestOpen(false);
              load().catch(console.error);
            }}
          />
        </Modal>
      )}
      <Modal
        open={!!open}
        onClose={() => setOpen(null)}
        title={open ? statusLabel(open.status) : t('leave.viewReason')}
      >
        {open ? <p className="leave-status__reason">{reasonCopy(open)}</p> : null}
      </Modal>
    </div>
  );
}
