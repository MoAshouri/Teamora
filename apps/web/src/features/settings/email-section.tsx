'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { BrickCodeInput } from '@/features/auth/brick-code-input';
import { brandBrickAccent, type AuthFamily, type AuthTheme } from '@/features/auth/brand';
import { authApi, type AuthUser } from '@/lib/api';
import { readClientTheme, type AppTheme } from '@/lib/theme';
import './email-section.css';

function isEmailTaken(err: unknown) {
  const message = err instanceof Error ? err.message : '';
  return /already used/i.test(message);
}

function familyFromDom(): AuthFamily {
  return document.documentElement.dataset.family === 'hayat' ? 'hayat' : 'gavit';
}

export function EmailSection() {
  const t = useTranslations('app');
  const [theme, setTheme] = useState<AppTheme>('light');
  const [family, setFamily] = useState<AuthFamily>('gavit');
  const [me, setMe] = useState<AuthUser | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);
  const brickSrc = brandBrickAccent(family, theme as AuthTheme);

  useEffect(() => {
    setTheme(readClientTheme());
    setFamily(familyFromDom());
    const root = document.documentElement;
    const sync = () => {
      setTheme(readClientTheme());
      setFamily(familyFromDom());
    };
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme', 'data-family'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    authApi.me().then((row) => {
      setMe(row);
      if (row.pendingEmail) setNewEmail(row.pendingEmail);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [cooldown]);

  async function sendCode() {
    if (cooldown > 0 || busy) return;
    setError('');
    setOk(false);
    setBusy(true);
    try {
      await authApi.requestEmailChange(newEmail.trim());
      setSent(true);
      setCooldown(30);
      setMe(await authApi.me());
    } catch (err) {
      setError(isEmailTaken(err) ? t('settings.emailTaken') : err instanceof Error ? err.message : t('settings.sendCode'));
    } finally {
      setBusy(false);
    }
  }

  async function onConfirm(event: FormEvent) {
    event.preventDefault();
    if (code.length !== 6) return;
    setError('');
    setOk(false);
    setBusy(true);
    try {
      const user = await authApi.confirmEmailChange(newEmail.trim(), code);
      setMe(user);
      setCode('');
      setSent(false);
      setNewEmail('');
      setOk(true);
      window.dispatchEvent(new Event('teamora-me'));
    } catch (err) {
      setError(isEmailTaken(err) ? t('settings.emailTaken') : err instanceof Error ? err.message : t('settings.confirmCode'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card settings-well settings-email" data-theme={theme}>
      <h2>{t('settings.email')}</h2>
      <p className="settings-email__current">
        <strong>{me?.email ?? ''}</strong>
        <span className="muted">
          {me?.emailVerified ? t('settings.verified') : t('settings.unverified')}
        </span>
      </p>
      <p className="muted">{t('settings.lede')}</p>
      <div className="settings-form">
        <label className="field">
          <span>{t('settings.newEmail')}</span>
          <input
            type="email"
            value={newEmail}
            onChange={(event) => setNewEmail(event.target.value)}
            required
            autoComplete="email"
          />
        </label>
        <button
          className="btn btn-ghost"
          type="button"
          onClick={() => void sendCode()}
          disabled={busy || cooldown > 0 || !newEmail.trim()}
        >
          {cooldown > 0 ? `${t('settings.sendCode')} (${cooldown})` : t('settings.sendCode')}
        </button>
      </div>
      {sent ? (
        <form className="settings-form" onSubmit={onConfirm}>
          <label className="field">
            <span>{t('settings.confirmCode')}</span>
            <BrickCodeInput
              value={code}
              onChange={setCode}
              brickSrc={brickSrc}
              aria-label={t('settings.confirmCode')}
              disabled={busy}
            />
          </label>
          <button className="btn btn-primary" type="submit" disabled={busy || code.length !== 6}>
            {t('settings.save')}
          </button>
        </form>
      ) : null}
      {error ? <p className="settings-form__error">{error}</p> : null}
      {ok ? <p className="settings-form__ok">{t('settings.emailUpdated')}</p> : null}
    </section>
  );
}
