'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Modal } from '@/features/ui/modal';
import './review-leave-modal.css';

export function ReviewLeaveModal({
  open,
  title,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  onConfirm: (note: string) => Promise<void>;
}) {
  const t = useTranslations('app');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      setNote('');
      setError('');
    }
  }, [open]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = note.trim();
    if (!trimmed) {
      setError(t('leave.reasonRequired'));
      return;
    }
    try {
      await onConfirm(trimmed);
      setNote('');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('leave.reasonRequired'));
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form className="leave-review" onSubmit={onSubmit}>
        <label className="field">
          <span>{t('leave.reasonLabel')}</span>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={500}
            required
            rows={4}
          />
        </label>
        {error ? <p className="leave-review__error">{error}</p> : null}
        <div className="leave-review__actions">
          <button className="btn btn-primary" type="submit">
            {title}
          </button>
        </div>
      </form>
    </Modal>
  );
}
