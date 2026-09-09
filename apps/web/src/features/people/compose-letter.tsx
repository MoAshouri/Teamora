'use client';

import { FormEvent, useState } from 'react';
import { useTranslations } from 'next-intl';
import { lettersApi } from '@/lib/api';
import { Modal } from '@/features/ui/modal';
import './compose-letter.css';

export function ComposeLetter({
  recipientId,
  recipientName,
}: {
  recipientId: string;
  recipientName: string;
}) {
  const t = useTranslations('app');
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  function close() {
    setOpen(false);
    setError('');
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const nextSubject = subject.trim();
    const nextBody = body.trim();
    if (!nextSubject || !nextBody) {
      setError(t('letter.body'));
      return;
    }
    try {
      await lettersApi.create({ recipientId, subject: nextSubject, body: nextBody });
      setSubject('');
      setBody('');
      setError('');
      setSent(true);
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('letter.body'));
    }
  }

  return (
    <div>
      <button className="btn btn-ghost" type="button" onClick={() => setOpen(true)}>
        {t('people.writeLetter')}
      </button>
      {sent ? <p className="letter-compose__sent">{t('letter.sent')}</p> : null}
      <Modal open={open} onClose={close} title={t('people.writeLetter')}>
        <form className="letter-compose" onSubmit={onSubmit}>
          <p className="letter-compose__lede muted">{recipientName}</p>
          <div className="letter-field">
            <label htmlFor={`letter-subject-${recipientId}`}>{t('letter.subject')}</label>
            <input
              id={`letter-subject-${recipientId}`}
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              required
              maxLength={200}
            />
          </div>
          <div className="letter-field">
            <label htmlFor={`letter-body-${recipientId}`}>{t('letter.body')}</label>
            <textarea
              id={`letter-body-${recipientId}`}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              required
              maxLength={8000}
            />
          </div>
          {error ? <p className="letter-compose__error">{error}</p> : null}
          <button className="btn btn-primary" type="submit">
            {t('letter.send')}
          </button>
        </form>
      </Modal>
    </div>
  );
}
