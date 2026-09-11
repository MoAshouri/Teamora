'use client';

import { useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { BrickWeekChart, saturdayWeekKeys } from '@/features/ui/brick-week-chart';
import { dateKeyInZone } from '@/lib/dates';

const DEFAULT_WORK_DAYS = [6, 0, 1, 2, 3];

export function AdminWeekHours({
  hoursByDay,
  workDays = DEFAULT_WORK_DAYS,
  timezone = 'Asia/Tehran',
}: {
  hoursByDay: Record<string, number>;
  workDays?: number[];
  timezone?: string;
}) {
  const t = useTranslations('app');

  const filled = useMemo(() => {
    const keys =
      Object.keys(hoursByDay).length === 7
        ? Object.keys(hoursByDay).sort()
        : saturdayWeekKeys(new Date(), timezone);
    const next: Record<string, number> = {};
    for (const key of keys) next[key] = hoursByDay[key] ?? 0;
    return next;
  }, [hoursByDay, timezone]);

  const yMax = Math.max(8, ...Object.values(filled));
  const today = dateKeyInZone(new Date().toISOString(), timezone);
  // #region agent log
  useEffect(() => {
    const keys = Object.keys(filled);
    fetch('http://127.0.0.1:7869/ingest/c694b7eb-dcc2-4100-9c19-d4aca06d483e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a506d6'},body:JSON.stringify({sessionId:'a506d6',runId:'post-fix',hypothesisId:'P',location:'week-hours.tsx:admin',message:'week highlight vs timezone',data:{timezone,todayUtc:new Date().toISOString().slice(0,10),today,keys,highlightHit:keys.includes(today)},timestamp:Date.now()})}).catch(()=>{});
  }, [timezone, today, filled]);
  // #endregion

  return (
    <div className="card">
      <h2>{t('dashboard.hoursThisWeek')}</h2>
      <BrickWeekChart
        hoursByDay={filled}
        workDays={workDays.length ? workDays : DEFAULT_WORK_DAYS}
        timezone={timezone}
        yMax={yMax}
        highlightDate={today}
      />
    </div>
  );
}
