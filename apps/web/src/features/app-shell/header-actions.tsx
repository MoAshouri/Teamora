'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AppThemeToggle } from '@/components/app-theme-toggle';
import './header-actions.css';

const REMINDER_COUNT = 0;

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
        strokeLinecap="round"
        d="M6.2 9.2a5.8 5.8 0 0 1 11.6 0c0 3.4 1.4 5.2 1.9 6.3H4.3c.5-1.1 1.9-2.9 1.9-6.3Z"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        d="M10 18.2a2 2 0 0 0 4 0"
      />
    </svg>
  );
}

function RemindersEmptyModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations('app');

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="card modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reminders-empty-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="reminders-empty-title" style={{ marginTop: 0 }}>
          {t('header.reminders')}
        </h2>
        <p className="muted" style={{ marginBottom: 0 }}>
          {t('header.remindersEmpty')}
        </p>
      </div>
    </div>
  );
}

export function AppHeaderActions() {
  const t = useTranslations('app');
  const [open, setOpen] = useState(false);

  return (
    <div className="app-header-actions">
      <button
        type="button"
        className="app-header-icon"
        data-due={REMINDER_COUNT > 0}
        aria-label={t('header.reminders')}
        onClick={() => setOpen(true)}
      >
        <BellIcon />
        {REMINDER_COUNT > 0 ? <span className="app-header-badge">{REMINDER_COUNT}</span> : null}
      </button>
      <AppThemeToggle />
      {open ? <RemindersEmptyModal onClose={() => setOpen(false)} /> : null}
    </div>
  );
}
