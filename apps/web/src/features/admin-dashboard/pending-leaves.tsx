'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { WaxSeal } from '@/features/ui/wax-seal';
import { ReviewLeaveModal } from '@/features/leaves';
import { leaveTypeMessageKey } from '@/features/leaves/type-label';
import './pending-leaves.css';

export type PendingLeave = {
  id: string;
  type: string;
  kind?: 'DAILY' | 'HOURLY';
  hours?: string | number | null;
  startDate: string;
  endDate: string;
  user: { fullName: string; avatarUrl?: string | null };
};

function leaveIso(value: string) {
  return value.slice(0, 10);
}

export function PendingLeaves({
  items,
  onReload,
}: {
  items: PendingLeave[];
  onReload: () => Promise<void> | void;
}) {
  const t = useTranslations('app');
  const [draft, setDraft] = useState<{ id: string; status: 'APPROVED' | 'REJECTED' } | null>(null);

  async function confirmReview(note: string) {
    if (!draft) return;
    await api.patch(`/leaves/${draft.id}`, { status: draft.status, note });
    setDraft(null);
    await onReload();
  }

  return (
    <div className="card pending-leaves">
      <h2>{t('leave.pendingTitle')}</h2>
      <div className="wax-legend pending-leaves__legend">
        <WaxSeal status="pending" label={t('status.pending')} />
        <WaxSeal status="approved" label={t('status.approved')} />
        <WaxSeal status="rejected" label={t('status.rejected')} />
      </div>
      {items.length === 0 ? <p className="muted">{t('leave.nonePending')}</p> : null}
      {items.map((item) => {
        const hourly = item.kind === 'HOURLY';
        return (
          <div className="pending-leaves__row" key={item.id}>
            <WaxSeal status="pending" label={t('status.pending')} />
            <div className="pending-leaves__meta">
              <strong className="pending-leaves__name">{item.user.fullName}</strong>
              <div className="muted pending-leaves__detail">
                {t(leaveTypeMessageKey(item.type))} · {hourly ? t('leave.hourly') : t('leave.daily')}
                {hourly && item.hours != null ? ` · ${item.hours}` : ` · ${leaveIso(item.startDate)} → ${leaveIso(item.endDate)}`}
              </div>
            </div>
            <div className="pending-leaves__actions">
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => setDraft({ id: item.id, status: 'APPROVED' })}
              >
                {t('leave.approve')}
              </button>
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => setDraft({ id: item.id, status: 'REJECTED' })}
              >
                {t('leave.reject')}
              </button>
            </div>
          </div>
        );
      })}
      <ReviewLeaveModal
        open={!!draft}
        title={draft?.status === 'REJECTED' ? t('leave.reject') : t('leave.approve')}
        onClose={() => setDraft(null)}
        onConfirm={confirmReview}
      />
    </div>
  );
}
