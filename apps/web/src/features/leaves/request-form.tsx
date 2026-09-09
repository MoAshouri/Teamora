'use client';

import { FormEvent, useState } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import './request-form.css';

const TYPES = ['ANNUAL', 'SICK', 'UNPAID', 'OTHER'] as const;

export function LeaveRequestForm({ onSaved }: { onSaved: () => void }) {
  const t = useTranslations('app');
  const [kind, setKind] = useState<'DAILY' | 'HOURLY'>('DAILY');
  const [error, setError] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const startDate = String(fd.get('startDate'));
    const endDate = kind === 'HOURLY' ? startDate : String(fd.get('endDate'));
    const hours = kind === 'HOURLY' ? Number(fd.get('hours')) : undefined;
    try {
      await api.post('/leaves', {
        type: String(fd.get('type')),
        kind,
        startDate,
        endDate,
        ...(kind === 'HOURLY' ? { hours } : {}),
        reason: String(fd.get('reason') || '') || undefined,
      });
      setError('');
      event.currentTarget.reset();
      setKind('DAILY');
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('leave.request'));
    }
  }

  return (
    <form className="card leave-request" onSubmit={onSubmit}>
      <h2>{t('leave.request')}</h2>
      <h3 className="muted">{t('leave.kind')}</h3>
      <div className="leave-request__kinds">
        <button
          className="leave-request__kind"
          type="button"
          data-on={kind === 'DAILY'}
          aria-pressed={kind === 'DAILY'}
          onClick={() => setKind('DAILY')}
        >
          {t('leave.kindDaily')}
        </button>
        <button
          className="leave-request__kind"
          type="button"
          data-on={kind === 'HOURLY'}
          aria-pressed={kind === 'HOURLY'}
          onClick={() => setKind('HOURLY')}
        >
          {t('leave.kindHourly')}
        </button>
      </div>
      <label className="field">
        <span>{t('leave.type')}</span>
        <select name="type" defaultValue="ANNUAL">
          {TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </label>
      <div className="leave-request__dates">
        <label className="field">
          <span>{t('leave.from')}</span>
          <input name="startDate" type="date" required />
        </label>
        {kind === 'DAILY' ? (
          <label className="field">
            <span>{t('leave.to')}</span>
            <input name="endDate" type="date" required />
          </label>
        ) : (
          <label className="field">
            <span>{t('leave.hours')}</span>
            <input name="hours" type="number" min={0.5} max={12} step={0.5} defaultValue={1} required />
          </label>
        )}
      </div>
      <label className="field">
        <span>{t('leave.reason')}</span>
        <input name="reason" maxLength={500} />
      </label>
      {error ? <p className="leave-request__error">{error}</p> : null}
      <button className="btn btn-primary" type="submit">
        {t('leave.request')}
      </button>
    </form>
  );
}
