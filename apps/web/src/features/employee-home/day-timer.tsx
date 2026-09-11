'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { IwanFrame } from '@/features/ui/iwan-frame';
import type { WorkPolicy } from '@/features/work-time';
import { formatTime } from '@/lib/dates';
import type { Locale } from '@/lib/i18n/config';
import { thresholdSeconds, workDayClock, formatHms } from './day-timer-math';
import './day-timer.css';

export function DayTimer({
  session,
  policy,
  onStart,
  onEnd,
}: {
  session: { startedAt: string } | null;
  policy: WorkPolicy | null;
  onStart: () => void;
  onEnd: () => void;
}) {
  const t = useTranslations('app');
  const locale = useLocale() as Locale;
  const [now, setNow] = useState(() => Date.now());
  const maxSec = thresholdSeconds(policy);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    const onFocus = () => setNow(Date.now());
    window.addEventListener('focus', onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  // #region agent log
  useEffect(() => {
    const instant = new Date();
    const zone = policy?.timezone;
    const formatted = formatTime(instant, locale, zone);
    const utc = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    }).format(instant);
    fetch('http://127.0.0.1:7869/ingest/c694b7eb-dcc2-4100-9c19-d4aca06d483e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a506d6'},body:JSON.stringify({sessionId:'a506d6',runId:'post-fix',hypothesisId:'AF',location:'day-timer.tsx:clock',message:'day timer clock timezone',data:{locale,zone,formatted,utc,iso:instant.toISOString()},timestamp:Date.now()})}).catch(()=>{});
  }, [locale, policy?.timezone]);
  // #endregion

  const elapsedSec = session
    ? Math.max(0, Math.floor((now - new Date(session.startedAt).getTime()) / 1000))
    : null;
  const clock = workDayClock(elapsedSec, maxSec);
  const liveMinute = Math.floor(clock.seconds / 60);
  const liveLabel = useMemo(() => {
    if (clock.mode === 'overtime') return `${t('employee.overtime')} +${formatHms(liveMinute * 60)}`;
    if (clock.mode === 'countdown') return `${t('employee.remaining')} ${formatHms(liveMinute * 60)}`;
    return `${t('employee.idleMax')} ${clock.text}`;
  }, [clock.mode, clock.text, liveMinute, t]);

  return (
    <IwanFrame
      progress={clock.progress}
      footer={
        !session ? (
          <button className="btn btn-primary" type="button" onClick={onStart}>
            {t('employee.start')}
          </button>
        ) : (
          <button className="btn btn-primary" type="button" onClick={onEnd}>
            {t('employee.endDay')}
          </button>
        )
      }
    >
      <div className="day-timer">
        <div className="day-timer__clock" aria-hidden="true">
          {clock.text}
        </div>
        <p className="muted day-timer__live" aria-live="polite">
          {liveLabel}
        </p>
        <p className="muted day-timer__now">{formatTime(new Date(now), locale, policy?.timezone)}</p>
      </div>
    </IwanFrame>
  );
}
