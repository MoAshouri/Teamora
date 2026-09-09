import { FormEvent, useEffect, useMemo, useState } from 'react';
import { authApi, type AuthUser } from '@/lib/api';
import { authBrand, authBrick } from '@/features/auth/brand';
import { BrickCodeInput } from '@/features/auth/brick-code-input';
import type { Locale } from '@/lib/i18n/config';
import './verify-email-gate.css';
import '@/features/auth/auth.css';

const VERIFY_COPY: Record<
  Locale,
  {
    title: string;
    lede: string;
    send: string;
    resend: string;
    code: string;
    submit: string;
    logout: string;
  }
> = {
  en: {
    title: 'Confirm your email',
    lede: 'A six-brick code will land on {email}. The hall stays closed until then.',
    send: 'Send code',
    resend: 'Resend',
    code: 'Email code',
    submit: 'Enter',
    logout: 'Logout',
  },
  fa: {
    title: 'تأیید ایمیل',
    lede: 'کد شش‌آجری به {email} می‌رسد. تا آن لحظه تالار بسته است.',
    send: 'ارسال کد',
    resend: 'ارسال دوباره',
    code: 'کد ایمیل',
    submit: 'ورود',
    logout: 'خروج',
  },
  hy: {
    title: 'Հաստատեք էլ․ փոստը',
    lede: 'Վեց աղյուսանոց կոդը կհասնի {email}։ Մինչև այն սրահը փակ է։',
    send: 'Ուղարկել կոդը',
    resend: 'Նորից ուղարկել',
    code: 'Էլ․ կոդ',
    submit: 'Մտնել',
    logout: 'Ելք',
  },
};

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function readLocale(): Locale {
  const raw = readCookie('teamora-locale');
  if (raw === 'fa' || raw === 'hy' || raw === 'en') return raw;
  return 'fa';
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
  const locale = readLocale();
  const copy = VERIFY_COPY[locale];
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
      setError(err instanceof Error ? err.message : 'Error');
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
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  const lede = copy.lede.replace('{email}', maskEmail(email));

  return (
    <div className="verify-gate" data-theme={theme} data-accent={brand.accent}>
      <form className="card modal-panel verify-gate__well" onSubmit={onSubmit}>
        <h1 className="verify-gate__title">{copy.title}</h1>
        <p className="muted">{lede}</p>
        {error ? <p className="verify-gate__error">{error}</p> : null}
        <label className="field">
          <span>{copy.code}</span>
          <BrickCodeInput
            value={code}
            onChange={setCode}
            brickSrc={brickSrc}
            aria-label={copy.code}
            disabled={busy}
          />
        </label>
        <div className="verify-gate__actions">
          <button className="btn btn-primary" type="submit" disabled={busy || code.length !== 6}>
            {copy.submit}
          </button>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={sendCode}
            disabled={busy || cooldown > 0}
          >
            {cooldown > 0 ? `${copy.resend} (${cooldown})` : copy.send}
          </button>
          <button className="btn btn-ghost" type="button" onClick={onLogout}>
            {copy.logout}
          </button>
        </div>
      </form>
    </div>
  );
}
