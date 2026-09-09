'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ThemeToggle } from '@/components/theme-toggle';
import { persistAppTheme, readClientTheme, type AppTheme } from '@/lib/theme';

export function AppThemeToggle() {
  const t = useTranslations('app');
  const [theme, setTheme] = useState<AppTheme>('light');

  useEffect(() => {
    const next = readClientTheme();
    persistAppTheme(next);
    setTheme(next);
  }, []);

  function onToggle() {
    const next = theme === 'light' ? 'dark' : 'light';
    persistAppTheme(next);
    setTheme(next);
  }

  return (
    <ThemeToggle
      theme={theme}
      onToggle={onToggle}
      label={theme === 'light' ? t('theme.dark') : t('theme.light')}
    />
  );
}
