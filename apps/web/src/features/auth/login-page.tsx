'use client';

import { FormEvent, Suspense, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/lib/api';
import { authBrick } from './brand';
import { AuthShell, AuthStageFallback, useAuthUi } from './auth-shell';
import { BrickCodeInput } from './brick-code-input';

function GoogleMark() {
  return (
    <svg className="auth-google__mark" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function LoginFields() {
  const t = useTranslations('auth');
  const router = useRouter();
  const { theme, brand } = useAuthUi();
  const brickSrc = authBrick(brand, theme);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'email' | 'password' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [busy, setBusy] = useState(false);

  function goDashboard(role: 'ADMIN' | 'EMPLOYEE') {
    router.push(`/app/${role === 'ADMIN' ? 'admin' : 'employee'}/dashboard`);
  }

  function onContinue(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    if (!email) {
      setError(t('email'));
      return;
    }
    setStep('password');
  }

  async function onLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    try {
      const result = await authApi.login({
        email,
        password: String(fd.get('password') ?? ''),
      });
      goDashboard(result.user.role);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  async function onRequestOtp() {
    setError('');
    if (!email) {
      setError(t('email'));
      return;
    }
    setBusy(true);
    try {
      await authApi.requestOtp(email);
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  async function onVerifyOtp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const result = await authApi.verifyOtp(email, otpCode);
      goDashboard(result.user.role);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  const altRow = (
    <div className="auth-alt">
      <a className="auth-ghost" href={authApi.googleUrl}>
        <GoogleMark />
        {t('google')}
      </a>
      <button className="auth-ghost" type="button" onClick={onRequestOtp} disabled={busy}>
        {t('otpRequest')}
      </button>
    </div>
  );

  if (step === 'otp') {
    return (
      <>
        {error ? <p className="auth-error">{error}</p> : null}
        <form className="auth-form" onSubmit={onVerifyOtp}>
          <p className="auth-hint">{t('otpHint')}</p>
          <label className="auth-field">
            <span>{t('otpCode')}</span>
            <BrickCodeInput
              value={otpCode}
              onChange={setOtpCode}
              brickSrc={brickSrc}
              aria-label={t('otpCode')}
            />
          </label>
          <button className="auth-submit" type="submit" disabled={busy || otpCode.length !== 6}>
            {t('otpVerify')}
          </button>
        </form>
      </>
    );
  }

  return (
    <>
      {error ? <p className="auth-error">{error}</p> : null}
      <form className="auth-form" onSubmit={step === 'email' ? onContinue : onLogin}>
        <label className="auth-field">
          <span>{t('email')}</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            readOnly={step === 'password'}
          />
        </label>
        {step === 'password' ? (
          <label className="auth-field">
            <span>{t('password')}</span>
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
        ) : null}
        <button className="auth-submit" type="submit" disabled={busy}>
          {step === 'email' ? t('submit') : t('loginSubmit')}
        </button>
      </form>
      {altRow}
    </>
  );
}

function CreateFields() {
  const t = useTranslations('auth');
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    try {
      const result = await authApi.registerAdmin({
        email: String(fd.get('email') ?? ''),
        password: String(fd.get('password') ?? ''),
        fullName: String(fd.get('fullName') ?? ''),
        companyName: String(fd.get('companyName') ?? ''),
      });
      router.push(`/app/${result.user.role === 'ADMIN' ? 'admin' : 'employee'}/dashboard`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {error ? <p className="auth-error">{error}</p> : null}
      <form className="auth-form auth-form--create" onSubmit={onRegister}>
        <label className="auth-field">
          <span>{t('fullName')}</span>
          <input name="fullName" autoComplete="name" required />
        </label>
        <label className="auth-field">
          <span>{t('companyName')}</span>
          <input name="companyName" required />
        </label>
        <label className="auth-field">
          <span>{t('email')}</span>
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label className="auth-field">
          <span>{t('password')}</span>
          <input name="password" type="password" minLength={8} autoComplete="new-password" required />
        </label>
        <button className="auth-submit" type="submit" disabled={busy}>
          {t('submit')}
        </button>
      </form>
    </>
  );
}

function LoginScreen() {
  const params = useParams<{ locale: string }>();
  const search = useSearchParams();
  const modeParam = search.get('mode');
  const mode = modeParam === 'create' || modeParam === 'register' ? 'create' : 'login';

  return (
    <AuthShell locale={params.locale} method={mode}>
      {mode === 'create' ? <CreateFields /> : <LoginFields />}
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthStageFallback />}>
      <LoginScreen />
    </Suspense>
  );
}
