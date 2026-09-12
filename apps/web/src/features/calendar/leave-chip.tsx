'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Modal } from '@/features/ui/modal';
import { WaxSeal } from '@/features/ui/wax-seal';
import { leaveTypeMessageKey } from '@/features/leaves/type-label';
import './leave-chip.css';

export type CalendarLeave = {
  id: string;
  type?: string;
  kind?: 'DAILY' | 'HOURLY';
  hours?: string | number | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  startDate: string;
  endDate: string;
  user: { fullName: string };
};

export function leaveOnDay(leave: CalendarLeave, iso: string) {
  return leave.startDate.slice(0, 10) <= iso && leave.endDate.slice(0, 10) >= iso;
}

export function overlayLeaves(items: CalendarLeave[]) {
  return items.filter((item) => item.status === 'PENDING' || item.status === 'APPROVED');
}

function leaveIso(value: string) {
  return value.slice(0, 10);
}

export function LeavePreview({
  open,
  leave,
  onClose,
}: {
  open: boolean;
  leave: CalendarLeave | null;
  onClose: () => void;
}) {
  const t = useTranslations('app');
  const hourly = leave?.kind === 'HOURLY';
  const start = leave ? leaveIso(leave.startDate) : '';
  const end = leave ? leaveIso(leave.endDate) : '';
  const typeLabel = leave ? t(leaveTypeMessageKey(leave.type ?? '')) : '';
  const kindLabel = hourly ? t('leave.hourly') : t('leave.kindDaily');
  const hoursLabel =
    hourly && leave?.hours != null ? t('calendar.hourlyLeave', { hours: String(Number(leave.hours)) }) : '';
  const detail = leave
    ? hourly
      ? `${typeLabel} · ${kindLabel} · ${start}${hoursLabel ? ` · ${hoursLabel}` : ''}`
      : `${typeLabel} · ${kindLabel} · ${start} → ${end}`
    : '';
  // #region agent log
  useEffect(() => {
    if (!open || !leave) return;
    fetch('http://127.0.0.1:7869/ingest/c694b7eb-dcc2-4100-9c19-d4aca06d483e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a506d6'},body:JSON.stringify({sessionId:'a506d6',runId:'post-fix',hypothesisId:'LP',location:'leave-chip.tsx:preview',message:'leave preview includes type and day',data:{id:leave.id,type:leave.type??null,kind:leave.kind??null,start,detail},timestamp:Date.now()})}).catch(()=>{});
  }, [open, leave, start, detail]);
  // #endregion
  if (!leave) return null;
  const wax = leave.status.toLowerCase() as 'pending' | 'approved' | 'rejected';
  return (
    <Modal open={open} onClose={onClose} title={t('calendar.leaveChip', { name: leave.user.fullName })}>
      <div className="cal-leave-preview">
        <WaxSeal
          status={wax}
          label={t(leave.status === 'PENDING' ? 'leave.statusPending' : 'leave.statusApproved')}
        />
        <p>{detail}</p>
      </div>
    </Modal>
  );
}
