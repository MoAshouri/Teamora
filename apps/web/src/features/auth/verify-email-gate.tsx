import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { authApi, type AuthUser } from '@/lib/api';
import { authBrand, authBrick } from '@/features/auth/brand';
import { BrickCodeInput } from '@/features/auth/brick-code-input';
import type { Locale } from '@/lib/i18n/config';
import './verify-email-gate.css';
import '@/features/auth/auth.css';

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function maskEmail(email: string) {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  return `${local.slice(0, 1)}***@${domain}`;
}

export function VerifyEmailGate({
  email,
  onVerified,
  onLogout,
}: {
  email: string;
  onVerified: (user: AuthUser) => void;
  onLogout: () => void;
}) {
  const t = useTranslations('app.verifyEmail');
  const tCommon = useTranslations('common');
  const locale = useLocale() as Locale;
  const brand = useMemo(() => authBrand(locale), [locale]);
  const theme = (readCookie('teamora-theme') === 'dark' ? 'dark' : 'light') as 'light' | 'dark';
  const brickSrc = authBrick(brand, theme);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [cooldown]);

  useEffect(() => {
    void sendCode();
    // send once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function sendCode() {
    if (cooldown > 0 || busy) return;
    setError('');
    setBusy(true);
    try {
      await authApi.requestEmailVerify();
      setCooldown(30);
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon('error'));
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (code.length !== 6) return;
    setBusy(true);
    try {
      const user = await authApi.confirmEmailVerify(code);
      onVerified(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon('error'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="verify-gate" data-theme={theme} data-accent={brand.accent}>
      <form className="card modal-panel verify-gate__well" onSubmit={onSubmit}>
        <h1 className="verify-gate__title">{t('title')}</h1>
        <p className="muted">{t('lede', { email: maskEmail(email) })}</p>
        {error ? <p className="verify-gate__error">{error}</p> : null}
        <label className="field">
          <span>{t('code')}</span>
          <BrickCodeInput
            value={code}
            onChange={setCode}
            brickSrc={brickSrc}
            aria-label={t('code')}
            disabled={busy}
          />
        </label>
        <div className="verify-gate__actions">
          <button className="btn btn-primary" type="submit" disabled={busy || code.length !== 6}>
            {t('submit')}
          </button>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={sendCode}
            disabled={busy || cooldown > 0}
          >
            {cooldown > 0 ? `${t('resend')} (${cooldown})` : t('send')}
          </button>
          <button className="btn btn-ghost" type="button" onClick={onLogout}>
            {t('logout')}
          </button>
        </div>
      </form>
    </div>
  );
}
