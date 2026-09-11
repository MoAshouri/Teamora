'use client';

import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { zonedDateTimeLocalToIso } from '@/lib/dates';

export function RemindAtField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const t = useTranslations('app');
  return (
    <label className="field">
      <span>{t('reminders.remindAt')}</span>
      <input type="datetime-local" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

export async function saveReminder(input: {
  targetKind: 'TASK' | 'NOTE' | 'MEETING';
  targetId: string;
  title: string;
  remindAt: string;
  timeZone?: string;
}) {
  if (!input.remindAt) return;
  await api.post('/reminders', {
    targetKind: input.targetKind,
    targetId: input.targetId,
    title: input.title,
    fireAt: zonedDateTimeLocalToIso(input.remindAt, input.timeZone ?? 'Asia/Tehran'),
  });
}
