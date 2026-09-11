'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  brandBrick,
  brandBrickAccent,
  brandTatil,
  type AuthFamily,
  type AuthTheme,
} from '@/features/auth/brand';
import { formatWeekday, formatWeekdayShort, todayKeyInZone } from '@/lib/dates';
import type { Locale } from '@/lib/i18n/config';
import './brick-week-chart.css';

const DEFAULT_WORK_DAYS = [6, 0, 1, 2, 3];

function familyFromDom(): AuthFamily {
  return document.documentElement.dataset.family === 'hayat' ? 'hayat' : 'gavit';
}

function themeFromDom(): AuthTheme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

function isoFromUtcDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function saturdayWeekKeys(from = new Date(), timeZone = 'Asia/Tehran'): string[] {
  const today = todayKeyInZone(timeZone, from);
  const weekday = new Date(`${today}T12:00:00.000Z`).getUTCDay();
  const diffToSat = (weekday + 1) % 7;
  const start = new Date(`${today}T12:00:00.000Z`);
  start.setUTCDate(start.getUTCDate() - diffToSat);
  const keys = Array.from({ length: 7 }, (_, i) => {
    const next = new Date(start);
    next.setUTCDate(start.getUTCDate() + i);
    return isoFromUtcDate(next);
  });
  // #region agent log
  fetch('http://127.0.0.1:7869/ingest/c694b7eb-dcc2-4100-9c19-d4aca06d483e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a506d6'},body:JSON.stringify({sessionId:'a506d6',runId:'post-fix',hypothesisId:'Q',location:'brick-week-chart.tsx:saturdayWeekKeys',message:'saturday week keys',data:{timeZone,today,keys,utcToday:from.toISOString().slice(0,10)},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  return keys;
}

export function weekKeys(hoursByDay: Record<string, number>, timeZone = 'Asia/Tehran'): string[] {
  const keys = Object.keys(hoursByDay).sort();
  if (keys.length === 7) return keys;
  return saturdayWeekKeys(new Date(), timeZone);
}

function dateFromIso(iso: string) {
  return new Date(`${iso}T12:00:00.000Z`);
}

function brickCount(hours: number, yMax: number) {
  if (hours <= 0) return 0;
  const cap = Math.min(12, Math.max(1, Math.round(yMax)));
  return Math.min(cap, Math.max(1, Math.round(hours)));
}

export function BrickWeekChart({
  hoursByDay,
  workDays = DEFAULT_WORK_DAYS,
  highlightDate,
  timezone = 'Asia/Tehran',
  yMax = 8,
  size = 'default',
}: {
  hoursByDay: Record<string, number>;
  workDays?: number[];
  highlightDate?: string;
  timezone?: string;
  yMax?: number;
  size?: 'default' | 'compact';
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations('app');
  const [kit, setKit] = useState(() => ({
    brick: brandBrick('gavit', 'light'),
    accent: brandBrickAccent('gavit', 'light'),
    tatil: brandTatil('gavit', 'light'),
  }));

  useEffect(() => {
    const apply = () => {
      const family = familyFromDom();
      const theme = themeFromDom();
      setKit({
        brick: brandBrick(family, theme),
        accent: brandBrickAccent(family, theme),
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

  const days = useMemo(() => weekKeys(hoursByDay, timezone), [hoursByDay, timezone]);
  const today = highlightDate ?? todayKeyInZone(timezone);

  return (
    <div className="brick-chart brick-week" data-size={size}>
      {days.map((iso) => {
        const date = dateFromIso(iso);
        const hours = hoursByDay[iso] ?? 0;
        const rest = !workDays.includes(date.getUTCDay());
        const highlight = iso === today;
        const weekday = formatWeekday(date, locale);
        const short = formatWeekdayShort(date, locale);
        const hoursLabel = t('hours.hoursShort', { n: hours.toFixed(1) });
        const label = rest ? `${weekday} · ${t('hours.restDay')}` : `${weekday} ${hoursLabel}`;
        const count = rest ? 0 : brickCount(hours, yMax);

        return (
          <div key={iso} className="brick-week__col" title={label} aria-label={label}>
            {rest ? (
              <div className="brick-week__rest">
                <img className="brick-week__tatil" src={kit.tatil} alt="" />
              </div>
            ) : (
              <div className="brick-week__stack">
                {Array.from({ length: count }, (_, i) => (
                  <span
                    key={i}
                    className="brick-week__brick"
                    style={{
                      backgroundImage: `url(${highlight ? kit.accent : kit.brick})`,
                    }}
                  />
                ))}
              </div>
            )}
            <div className="brick-week__meta">
              <span className="brick-week__hours">{rest ? t('hours.restDay') : hoursLabel}</span>
              <span className="brick-week__day">{short}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}