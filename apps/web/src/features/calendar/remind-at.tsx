'use client';

import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';

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
}) {
  if (!input.remindAt) return;
  await api.post('/reminders', {
    targetKind: input.targetKind,
    targetId: input.targetId,
    title: input.title,
    fireAt: new Date(input.remindAt).toISOString(),
  });
}
