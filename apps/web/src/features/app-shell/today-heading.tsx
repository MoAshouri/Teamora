'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { formatPanelDay } from '@/lib/dates';
import type { Locale } from '@/lib/i18n/config';
import './today-heading.css';

export function TodayHeading() {
  const locale = useLocale() as Locale;
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const tick = () => setNow(new Date());
    const id = window.setInterval(tick, 60_000);
    window.addEventListener('focus', tick);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('focus', tick);
    };
  }, []);

  const { weekday, date } = formatPanelDay(now, locale);

  return (
    <time className="today-heading" dateTime={now.toISOString()}>
      <span className="today-heading__weekday">{weekday}</span>
      <span className="today-heading__date">{date}</span>
    </time>
  );
}
