'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Modal } from '@/features/ui/modal';
import { remindersApi, type DueReminder } from '@/lib/api';
import { formatDate, formatTime } from '@/lib/dates';
import type { Locale } from '@/lib/i18n/config';
import './reminders-modal.css';

export function RemindersModal({
  open,
  items,
  onClose,
  onChanged,
}: {
  open: boolean;
  items: DueReminder[];
  onClose: () => void;
  onChanged: () => Promise<void> | void;
}) {
  const t = useTranslations('app');
  const locale = useLocale() as Locale;
  const [busyId, setBusyId] = useState<string | null>(null);

  async function act(id: string, run: () => Promise<unknown>) {
    setBusyId(id);
    try {
      await run();
      await onChanged();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={items.length ? t('reminders.dueTitle') : t('header.reminders')}
    >
      {items.length === 0 ? (
        <p className="muted remind-empty">{t('header.remindersEmpty')}</p>
      ) : (
        <ul className="remind-list">
          {items.map((item) => (
            <li className="remind-item" key={item.id}>
              <strong>{item.title}</strong>
              <span className="remind-item__when">
                {formatDate(item.fireAt, locale)} · {formatTime(item.fireAt, locale)}
              </span>
              <div className="remind-item__actions">
                <button
                  className="btn btn-primary"
                  type="button"
                  disabled={busyId === item.id}
                  onClick={() => act(item.id, () => remindersApi.ack(item.id))}
                >
                  {t('reminders.ack')}
                </button>
                <button
                  className="btn btn-ghost"
                  type="button"
                  disabled={busyId === item.id}
                  onClick={() => act(item.id, () => remindersApi.extend(item.id, 60))}
                >
                  {t('reminders.extend1h')}
                </button>
                <button
                  className="btn btn-ghost"
                  type="button"
                  disabled={busyId === item.id}
                  onClick={() => act(item.id, () => remindersApi.extend(item.id, 1440))}
                >
                  {t('reminders.extend1d')}
                </button>
                <button
                  className="btn btn-ghost"
                  type="button"
                  disabled={busyId === item.id}
                  onClick={() => act(item.id, () => remindersApi.disable(item.id))}
                >
                  {t('reminders.disable')}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
