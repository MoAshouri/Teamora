'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { GunbadDay } from '@/features/ui/gunbad-day';
import { saturdayWeekKeys } from '@/features/ui/brick-week-chart';
import { dateKeyInZone, formatTime, todayKeyInZone, utcInstantRangeForYmd } from '@/lib/dates';
import type { Locale } from '@/lib/i18n/config';
import './starred-week.css';

const DEFAULT_WORK_DAYS = [6, 0, 1, 2, 3];
const VISIBLE = 3;

type StarredTask = {
  id: string;
  title: string;
  dueAt: string | null;
  assignee?: { fullName: string; avatarUrl: string | null };
};

function dueHasClock(iso: string | null | undefined, timeZone: string) {
  if (!iso) return false;
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date(iso));
    const hour = parts.find((part) => part.type === 'hour')?.value;
    const minute = parts.find((part) => part.type === 'minute')?.value;
    return !(hour === '00' && minute === '00');
  } catch {
    const date = new Date(iso);
    return date.getUTCHours() !== 0 || date.getUTCMinutes() !== 0;
  }
}

export function AdminStarredWeek({
  workDays = DEFAULT_WORK_DAYS,
  timezone = 'UTC',
}: {
  workDays?: number[];
  timezone?: string;
}) {
  const t = useTranslations('app');
  const locale = useLocale() as Locale;
  const [tasks, setTasks] = useState<StarredTask[]>([]);
  const keys = useMemo(() => saturdayWeekKeys(new Date(), timezone), [timezone]);

  useEffect(() => {
    const { from, to } = utcInstantRangeForYmd(keys[0], keys[6]);
    // #region agent log
    fetch('http://127.0.0.1:7869/ingest/c694b7eb-dcc2-4100-9c19-d4aca06d483e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a506d6'},body:JSON.stringify({sessionId:'a506d6',runId:'post-fix',hypothesisId:'AI',location:'starred-week.tsx:load',message:'starred week fetch range',data:{fromYmd:keys[0],toYmd:keys[6],from,to},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    api
      .get<StarredTask[]>(`/tasks?starred=1&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
      .then((rows) => {
        setTasks(rows);
        // #region agent log
        fetch('http://127.0.0.1:7869/ingest/c694b7eb-dcc2-4100-9c19-d4aca06d483e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a506d6'},body:JSON.stringify({sessionId:'a506d6',runId:'post-fix',hypothesisId:'UT',location:'starred-week.tsx:load',message:'undated starred skip epoch clock',data:{total:rows.length,undated:rows.filter((row)=>!row.dueAt).length,nullHasClock:dueHasClock(null, timezone)},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
      })
      .catch(console.error);
  }, [keys]);

  const byDay = useMemo(() => {
    const map: Record<string, StarredTask[]> = {};
    for (const key of keys) map[key] = [];
    for (const task of tasks) {
      const key = task.dueAt
        ? dateKeyInZone(task.dueAt, timezone || 'UTC')
        : todayKeyInZone(timezone || 'Asia/Tehran');
      if (!map[key]) continue;
      map[key].push(task);
    }
    return map;
  }, [keys, tasks, timezone]);

  return (
    <div className="card">
      <h2>{t('dashboard.starredWeek')}</h2>
      <div className="gunbad-week">
        {keys.map((iso) => {
          const date = new Date(`${iso}T12:00:00.000Z`);
          const rest = !workDays.includes(date.getUTCDay());
          const dayTasks = byDay[iso] ?? [];
          const visible = dayTasks.slice(0, VISIBLE);
          const extra = dayTasks.length - visible.length;

          return (
            <GunbadDay key={iso} date={date} locale={locale} rest={rest}>
              {visible.length ? (
                <div className="starred-week__chips">
                  {visible.map((task) => (
                    <div className="star-chip" key={task.id} title={task.title}>
                      <span className="star-chip__title">{task.title}</span>
                      {task.dueAt && dueHasClock(task.dueAt, timezone) ? (
                        <span className="star-chip__time">{formatTime(task.dueAt, locale, timezone)}</span>
                      ) : null}
                    </div>
                  ))}
                  {extra > 0 ? (
                    <span className="starred-week__more">{t('dashboard.moreCount', { n: extra })}</span>
                  ) : null}
                </div>
              ) : null}
            </GunbadDay>
          );
        })}
      </div>
    </div>
  );
}
