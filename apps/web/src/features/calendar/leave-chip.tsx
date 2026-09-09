'use client';

import { useTranslations } from 'next-intl';
import { Modal } from '@/features/ui/modal';
import { WaxSeal } from '@/features/ui/wax-seal';
import './leave-chip.css';

export type CalendarLeave = {
  id: string;
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
  if (!leave) return null;
  const hourly = leave.kind === 'HOURLY';
  const wax = leave.status.toLowerCase() as 'pending' | 'approved' | 'rejected';
  return (
    <Modal open={open} onClose={onClose} title={t('calendar.leaveChip', { name: leave.user.fullName })}>
      <div className="cal-leave-preview">
        <WaxSeal
          status={wax}
          label={t(leave.status === 'PENDING' ? 'leave.statusPending' : 'leave.statusApproved')}
        />
        <p>
          {hourly
            ? t('calendar.hourlyLeave', { hours: String(leave.hours ?? 0) })
            : t('leave.kindDaily')}
        </p>
      </div>
    </Modal>
  );
}
