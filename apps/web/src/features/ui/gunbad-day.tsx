'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { brandPlaque, brandTatil, type AuthFamily, type AuthTheme } from '@/features/auth/brand';
import { saturdayWeekKeys } from '@/features/ui/brick-week-chart';
import { formatDayNumber, formatWeekdayShort } from '@/lib/dates';
import type { Locale } from '@/lib/i18n/config';
import './gunbad-day.css';

const DEFAULT_WORK_DAYS = [6, 0, 1, 2, 3];

function familyFromDom(): AuthFamily {
  return document.documentElement.dataset.family === 'hayat' ? 'hayat' : 'gavit';
}

function themeFromDom(): AuthTheme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

export function GunbadDay({
  date,
  locale: localeProp,
  rest = false,
  children,
  size = 'weekStrip',
}: {
  date: Date;
  locale?: Locale;
  rest?: boolean;
  children?: ReactNode;
  size?: 'weekStrip' | 'month';
}) {
  const localeFromIntl = useLocale() as Locale;
  const locale = localeProp ?? localeFromIntl;
  const t = useTranslations('app');
  const [kit, setKit] = useState(() => ({
    family: 'gavit' as AuthFamily,
    plaque: brandPlaque('gavit', 'light'),
    tatil: brandTatil('gavit', 'light'),
  }));

  useEffect(() => {
    const apply = () => {
      const family = familyFromDom();
      const theme = themeFromDom();
      setKit({
        family,
        plaque: brandPlaque(family, theme),
        tatil: brandTatil(family, theme),
      });
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-family'],
    });
    return () => observer.disconnect();
  }, []);

  const weekday = formatWeekdayShort(date, locale);
  const day = formatDayNumber(date, locale);
  const label = rest ? `${weekday} ${day} · ${t('calendar.rest')}` : `${weekday} ${day}`;

  return (
    <article
      className="gunbad-day"
      data-size={size}
      data-family={kit.family}
      data-rest={rest}
      aria-label={label}
    >
      <img className="gunbad-day__frame" src={kit.plaque} alt="" />
      <div className="gunbad-day__well">
        <header className="gunbad-day__head">
          <span className="gunbad-day__weekday">{weekday}</span>
          <span className="gunbad-day__num">{day}</span>
        </header>
        <div className="gunbad-day__slot">
          {rest ? <img className="gunbad-day__tatil" src={kit.tatil} alt="" /> : null}
          {children}
        </div>
      </div>
    </article>
  );
}

export function GunbadWeekRow({
  workDays = DEFAULT_WORK_DAYS,
}: {
  workDays?: number[];
}) {
  const locale = useLocale() as Locale;
  const days = useMemo(
    () => saturdayWeekKeys().map((iso) => new Date(`${iso}T12:00:00.000Z`)),
    [],
  );

  return (
    <div className="gunbad-week">
      {days.map((date) => (
        <GunbadDay
          key={date.toISOString()}
          date={date}
          locale={locale}
          rest={!workDays.includes(date.getUTCDay())}
        />
      ))}
    </div>
  );
}