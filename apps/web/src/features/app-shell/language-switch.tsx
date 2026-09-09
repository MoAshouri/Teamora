'use client';

import { useLocale, useTranslations } from 'next-intl';
import { locales, type Locale } from '@/lib/i18n/config';
import { setAppLocale } from '@/lib/i18n/app-locale';
import './language-switch.css';

export function LanguageSwitch({ variant = 'nav' }: { variant?: 'nav' | 'panel' }) {
  const t = useTranslations('app');
  const current = useLocale() as Locale;

  function pick(locale: Locale) {
    if (locale === current) return;
    setAppLocale(locale);
    window.location.reload();
  }

  return (
    <div
      className={variant === 'panel' ? 'lang-switch lang-switch--panel' : 'lang-switch'}
      role="group"
      aria-label={t('nav.language')}
    >
      {locales.map((locale) => (
        <button
          key={locale}
          type="button"
          className="lang-switch__btn"
          lang={locale}
          aria-pressed={current === locale}
          onClick={() => pick(locale)}
        >
          {t(`locale.${locale}`)}
        </button>
      ))}
    </div>
  );
}