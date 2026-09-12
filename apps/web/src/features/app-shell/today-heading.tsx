'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { api } from '@/lib/api';
import { formatPanelDay, todayKeyInZone } from '@/lib/dates';
import type { Locale } from '@/lib/i18n/config';
import './today-heading.css';

export function TodayHeading() {
  const locale = useLocale() as Locale;
  const [now, setNow] = useState<Date | null>(null);
  const [timeZone, setTimeZone] = useState('Asia/Tehran');

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = window.setInterval(tick, 60_000);
    window.addEventListener('focus', tick);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('focus', tick);
    };
  }, []);

  useEffect(() => {
    api
      .get<{ timezone?: string } | null>('/companies/work-policy')
      .then((policy) => {
        if (policy?.timezone) setTimeZone(policy.timezone);
      })
      .catch(() => undefined);
  }, []);

  const { weekday, date } = now ? formatPanelDay(now, locale, timeZone) : { weekday: '', date: '' };
  const dateTime = now ? todayKeyInZone(timeZone, now) : '';
  // #region agent log
  useEffect(() => {
    if (!now) return;
    fetch('http://127.0.0.1:7869/ingest/c694b7eb-dcc2-4100-9c19-d4aca06d483e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a506d6'},body:JSON.stringify({sessionId:'a506d6',runId:'post-fix',hypothesisId:'R',location:'today-heading.tsx',message:'header date timezone',data:{locale,timeZone,weekday,date,dateTime,utc:now.toISOString(),hasNow:true},timestamp:Date.now()})}).catch(()=>{});
  }, [locale, timeZone, weekday, date, dateTime, now]);
  // #endregion

  if (!now) {
    return <time className="today-heading" />;
  }

  return (
    <time className="today-heading" dateTime={dateTime}>
      <span className="today-heading__weekday">{weekday}</span>
      <span className="today-heading__date">{date}</span>
    </time>
  );
}
