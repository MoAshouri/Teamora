'use client';

import { FormEvent, useState } from 'react';
import { useTranslations } from 'next-intl';
import { leavesApi } from '@/lib/api';
import { Modal } from '@/features/ui/modal';
import './grant-leave.css';

type Kind = 'DAILY' | 'HOURLY';

export function GrantLeave({
  userId,
  recipientName,
}: {
  userId: string;
  recipientName: string;
}) {
  const t = useTranslations('app');
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Kind>('DAILY');
  const [amount, setAmount] = useState('1');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  function close() {
    setOpen(false);
    setError('');
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError(t('leave.amount'));
      return;
    }
    try {
      await leavesApi.grant({
        userId,
        kind,
        amount: value,
        note: note.trim() || undefined,
      });
      setNote('');
      setAmount('1');
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('leave.amount'));
    }
  }

  return (
    <div>
      <button className="btn btn-ghost" type="button" onClick={() => setOpen(true)}>
        {t('people.grantLeave')}
      </button>
      <Modal open={open} onClose={close} title={t('people.grantLeave')}>
        <form className="grant-leave" onSubmit={onSubmit}>
          <p className="muted">{recipientName}</p>
          <div className="grant-leave__kinds">
            <button
              className="grant-leave__kind"
              type="button"
              data-on={kind === 'DAILY'}
              onClick={() => setKind('DAILY')}
            >
              {t('leave.kindDaily')}
            </button>
            <button
              className="grant-leave__kind"
              type="button"
              data-on={kind === 'HOURLY'}
              onClick={() => setKind('HOURLY')}
            >
              {t('leave.kindHourly')}
            </button>
          </div>
          <div className="letter-field">
            <label htmlFor={`grant-amount-${userId}`}>{t('leave.amount')}</label>
            <input
              id={`grant-amount-${userId}`}
              type="number"
              min={0.5}
              step="0.5"
              max={kind === 'DAILY' ? 30 : 40}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              required
            />
          </div>
          <div className="letter-field">
            <label htmlFor={`grant-note-${userId}`}>{t('letter.body')}</label>
            <input
              id={`grant-note-${userId}`}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={500}
            />
          </div>
          {error ? <p className="grant-leave__error">{error}</p> : null}
          <button className="btn btn-primary" type="submit">
            {t('leave.grant')}
          </button>
        </form>
      </Modal>
    </div>
  );
}
