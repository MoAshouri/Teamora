'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  brandPlaque,
  type AuthFamily,
  type AuthTheme,
} from '@/features/auth/brand';
import { api } from '@/lib/api';
import { formatWeekday, formatWeekdayShort } from '@/lib/dates';
import type { Locale } from '@/lib/i18n/config';
import './policy-form.css';

export type WorkPolicy = {
  workStart: string;
  workEnd: string;
  workDays: number[];
  timezone: string;
};

const WEEK_ORDER = [6, 0, 1, 2, 3, 4, 5];
const ZONES = ['Asia/Tehran', 'Asia/Yerevan', 'UTC'];
const DEFAULT_DAYS = [6, 0, 1, 2, 3];

function dateForWeekday(day: number) {
  const saturday = new Date(Date.UTC(2026, 8, 5, 12));
  const offset = (day + 1) % 7;
  const next = new Date(saturday);
  next.setUTCDate(saturday.getUTCDate() + offset);
  return next;
}

function toClock(value: string) {
  const match = value.match(/^(\d{2}:\d{2})/);
  return match ? match[1] : '09:00';
}

function familyFromDom(): AuthFamily {
  return document.documentElement.dataset.family === 'hayat' ? 'hayat' : 'gavit';
}

function themeFromDom(): AuthTheme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

export function PolicyForm({
  policy,
  onSaved,
}: {
  policy: WorkPolicy | null;
  onSaved: () => void;
}) {
  const t = useTranslations('app');
  const locale = useLocale() as Locale;
  const [workDays, setWorkDays] = useState<number[]>(policy?.workDays ?? DEFAULT_DAYS);
  const [workStart, setWorkStart] = useState(toClock(policy?.workStart ?? '09:00'));
  const [workEnd, setWorkEnd] = useState(toClock(policy?.workEnd ?? '18:00'));
  const [timezone, setTimezone] = useState(policy?.timezone ?? 'Asia/Tehran');
  const [error, setError] = useState('');
  const [plaque, setPlaque] = useState(() => brandPlaque('gavit', 'light'));

  useEffect(() => {
    setWorkDays(policy?.workDays?.length ? policy.workDays : DEFAULT_DAYS);
    setWorkStart(toClock(policy?.workStart ?? '09:00'));
    setWorkEnd(toClock(policy?.workEnd ?? '18:00'));
    setTimezone(policy?.timezone ?? 'Asia/Tehran');
  }, [policy]);

  useEffect(() => {
    const apply = () => setPlaque(brandPlaque(familyFromDom(), themeFromDom()));
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-family'],
    });
    return () => observer.disconnect();
  }, []);

  const labels = useMemo(
    () =>
      WEEK_ORDER.map((day) => {
        const date = dateForWeekday(day);
        return {
          day,
          label: formatWeekdayShort(date, locale),
          longLabel: formatWeekday(date, locale),
        };
      }),
    [locale],
  );

  function toggleDay(day: number) {
    setWorkDays((current) => {
      if (current.includes(day)) {
        if (current.length === 1) return current;
        return current.filter((item) => item !== day);
      }
      return [...current, day].sort((a, b) => a - b);
    });
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const start = toClock(workStart);
    const end = toClock(workEnd);
    if (workDays.length < 1) {
      setError(t('workTime.workDays'));
      return;
    }
    if (end <= start) {
      setError(t('workTime.workEnd'));
      return;
    }
    try {
      await api.put('/companies/work-policy', {
        workStart: start,
        workEnd: end,
        workDays,
        timezone,
      });
      setError('');
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('workTime.savePolicy'));
    }
  }

  return (
    <form className="card" onSubmit={onSubmit}>
      <h2>{t('workTime.workDays')}</h2>
      <div className="day-plaques">
        {labels.map(({ day, label, longLabel }) => (
          <button
            className="day-plaque"
            type="button"
            key={day}
            data-on={workDays.includes(day)}
            aria-pressed={workDays.includes(day)}
            aria-label={longLabel}
            onClick={() => toggleDay(day)}
          >
            <img className="day-plaque__frame" src={plaque} alt="" />
            <span className="day-plaque__label">{label}</span>
          </button>
        ))}
      </div>
      <div className="policy-form__times">
        <label className="field">
          <span>{t('workTime.workStart')}</span>
          <input
            type="time"
            value={workStart}
            onChange={(event) => setWorkStart(toClock(event.target.value))}
            required
          />
        </label>
        <label className="field">
          <span>{t('workTime.workEnd')}</span>
          <input
            type="time"
            value={workEnd}
            onChange={(event) => setWorkEnd(toClock(event.target.value))}
            required
          />
        </label>
      </div>
      <label className="field">
        <span>{t('workTime.timezone')}</span>
        <select value={timezone} onChange={(event) => setTimezone(event.target.value)}>
          {ZONES.map((zone) => (
            <option key={zone} value={zone}>
              {zone}
            </option>
          ))}
        </select>
      </label>
      {error ? <p className="policy-form__error">{error}</p> : null}
      <button className="btn btn-primary" type="submit">
        {t('workTime.savePolicy')}
      </button>
    </form>
  );
}
