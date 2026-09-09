'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AppThemeToggle } from '@/components/app-theme-toggle';
import { RemindersModal } from '@/features/reminders/reminders-modal';
import { useDueReminders } from '@/hooks/use-due-reminders';
import './header-actions.css';

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

export function AppHeaderActions() {
  const t = useTranslations('app');
  const { items, count, reload } = useDueReminders();
  const [open, setOpen] = useState(false);

  return (
    <div className="app-header-actions">
      <button
        type="button"
        className="app-header-icon"
        data-due={count > 0 ? 'true' : 'false'}
        aria-label={t('header.reminders')}
        onClick={() => {
          setOpen(true);
          void reload();
        }}
      >
        <BellIcon />
        {count > 0 ? <span className="app-header-badge">{count}</span> : null}
      </button>
      <AppThemeToggle />
      <RemindersModal
        open={open}
        items={items}
        onClose={() => setOpen(false)}
        onChanged={reload}
      />
    </div>
  );
}
