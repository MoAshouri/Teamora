'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { lettersApi, type InboxLetter } from '@/lib/api';
import { formatDate } from '@/lib/dates';
import { Modal } from '@/features/ui/modal';
import type { Locale } from '@/lib/i18n/config';
import './letters-box.css';

function sortInbox(rows: InboxLetter[]) {
  return rows.slice().sort((a, b) => {
    const unread = Number(!b.readAt) - Number(!a.readAt);
    if (unread !== 0) return unread;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export function LettersBox() {
  const t = useTranslations('app');
  const locale = useLocale() as Locale;
  const [letters, setLetters] = useState<InboxLetter[]>([]);
  const [open, setOpen] = useState<InboxLetter | null>(null);
  const [listOpen, setListOpen] = useState(false);

  async function load() {
    const rows = await lettersApi.inbox();
    setLetters(sortInbox(rows));
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const unread = letters.filter((row) => !row.readAt).length;
  const preview = letters.slice(0, 3);

  async function openLetter(letter: InboxLetter) {
    setListOpen(false);
    setOpen(letter);
    if (letter.readAt) return;
    try {
      const saved = await lettersApi.markRead(letter.id);
      setLetters((rows) => sortInbox(rows.map((row) => (row.id === saved.id ? saved : row))));
      setOpen(saved);
    } catch (err) {
      console.error(err);
    }
  }

  const title = useMemo(() => open?.subject ?? t('employee.letters'), [open, t]);

  return (
    <section className="card letters-box">
      <header className="letters-box__head">
        <h2>{t('employee.letters')}</h2>
        {unread > 0 ? <span className="letters-box__badge">{unread}</span> : null}
      </header>
      {letters.length === 0 ? (
        <p className="muted">{t('employee.noLetters')}</p>
      ) : (
        <ul className="letters-box__list">
          {preview.map((letter) => (
            <li key={letter.id}>
              <button
                className="letters-box__row"
                type="button"
                data-unread={letter.readAt ? 'false' : 'true'}
                onClick={() => void openLetter(letter)}
              >
                <strong>{letter.subject}</strong>
                <span className="muted">{formatDate(letter.createdAt, locale)}</span>
                {!letter.readAt ? <span className="letters-box__unread">{t('employee.unread')}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      )}
      {letters.length > 3 ? (
        <button className="btn btn-ghost" type="button" onClick={() => setListOpen(true)}>
          {t('employee.letters')}
        </button>
      ) : null}
      <Modal open={listOpen} onClose={() => setListOpen(false)} title={t('employee.letters')}>
        <ul className="letters-box__list">
          {letters.map((letter) => (
            <li key={letter.id}>
              <button
                className="letters-box__row"
                type="button"
                data-unread={letter.readAt ? 'false' : 'true'}
                onClick={() => void openLetter(letter)}
              >
                <strong>{letter.subject}</strong>
                <span className="muted">{formatDate(letter.createdAt, locale)}</span>
              </button>
            </li>
          ))}
        </ul>
      </Modal>
      <Modal open={!!open} onClose={() => setOpen(null)} title={title}>
        {open ? <p className="letters-box__body">{open.body}</p> : null}
      </Modal>
    </section>
  );
}
