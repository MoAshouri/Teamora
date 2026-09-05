'use client';

import { FormEvent, Suspense, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';

function LoginForm() {
  const t = useTranslations('auth');
  const params = useParams<{ locale: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const mode = search.get('mode') === 'register' ? 'register' : 'login';
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [email, setEmail] = useState('');

  const title = useMemo(
    () => (mode === 'register' ? t('registerTitle') : t('loginTitle')),
    [mode, t],
  );

  async function onLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.currentTarget);
    try {
      const result = await authApi.login({
        identifier: String(fd.get('identifier') ?? ''),
        password: String(fd.get('password') ?? ''),
      });
      router.push(`/app/${result.user.role === 'ADMIN' ? 'admin' : 'employee'}/dashboard`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  }

  async function onRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.currentTarget);
    try {
      const result = await authApi.registerAdmin({
        email: String(fd.get('email') ?? ''),
        password: String(fd.get('password') ?? ''),
        username: String(fd.get('username') ?? ''),
        fullName: String(fd.get('fullName') ?? ''),
        companyName: String(fd.get('companyName') ?? ''),
      });
      router.push(`/app/${result.user.role === 'ADMIN' ? 'admin' : 'employee'}/dashboard`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  }

  async function onRequestOtp() {
    setError('');
    try {
      await authApi.requestOtp(email);
      setOtpSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  }

  async function onVerifyOtp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.currentTarget);
    try {
      const result = await authApi.verifyOtp(email, String(fd.get('code') ?? ''));
      router.push(`/app/${result.user.role === 'ADMIN' ? 'admin' : 'employee'}/dashboard`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  }

  return (
    <main className="container" style={{ padding: '2rem 0', maxWidth: 480 }}>
      <Link href={`/${params.locale}`} className="muted">
        ← Teamora
      </Link>
      <div className="card stack" style={{ marginTop: '1rem' }}>
        <h1 style={{ margin: 0 }}>{title}</h1>
        {error ? <p className="error">{error}</p> : null}

        {mode === 'login' ? (
          <form onSubmit={onLogin}>
            <label className="field">
              <span>{t('identifier')}</span>
              <input name="identifier" required />
            </label>
            <label className="field">
              <span>{t('password')}</span>
              <input name="password" type="password" required />
            </label>
            <button className="btn btn-primary" type="submit">
              {t('submit')}
            </button>
          </form>
        ) : (
          <form onSubmit={onRegister}>
            <label className="field">
              <span>{t('fullName')}</span>
              <input name="fullName" required />
            </label>
            <label className="field">
              <span>{t('companyName')}</span>
              <input name="companyName" required />
            </label>
            <label className="field">
              <span>{t('username')}</span>
              <input name="username" required />
            </label>
            <label className="field">
              <span>{t('email')}</span>
              <input name="email" type="email" required />
            </label>
            <label className="field">
              <span>{t('password')}</span>
              <input name="password" type="password" minLength={8} required />
            </label>
            <button className="btn btn-primary" type="submit">
              {t('submit')}
            </button>
          </form>
        )}

        <hr style={{ border: 0, borderTop: '1px solid var(--line)' }} />

        <div className="stack">
          <label className="field">
            <span>{t('email')}</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
          </label>
          {!otpSent ? (
            <button className="btn btn-ghost" type="button" onClick={onRequestOtp}>
              {t('otpRequest')}
            </button>
          ) : (
            <form onSubmit={onVerifyOtp}>
              <label className="field">
                <span>{t('otpCode')}</span>
                <input name="code" maxLength={6} required />
              </label>
              <button className="btn btn-primary" type="submit">
                {t('otpVerify')}
              </button>
            </form>
          )}
          <a className="btn btn-ghost" href={authApi.googleUrl}>
            {t('google')}
          </a>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="container" style={{ padding: '2rem 0' }}>Loading…</main>}>
      <LoginForm />
    </Suspense>
  );
}
