'use client';

import { useTranslations } from 'next-intl';

export default function SettingsPage() {
  const t = useTranslations('app');

  return (
    <div className="stack">
      <h1 style={{ marginBottom: 0 }}>{t('settings.title')}</h1>
      <p className="muted">{t('settings.lede')}</p>
    </div>
  );
}