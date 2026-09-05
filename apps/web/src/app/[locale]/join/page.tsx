'use client';

import { FormEvent, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';

export default function JoinPage() {
  const t = useTranslations('auth');
  const params = useParams<{ locale: string }>();
  const router = useRouter();
  const [error, setError] = useState('');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.currentTarget);
    try {
      const result = await authApi.join({
        inviteCode: String(fd.get('inviteCode') ?? ''),
        email: String(fd.get('email') ?? ''),
        password: String(fd.get('password') ?? ''),
        username: String(fd.get('username') ?? ''),
        fullName: String(fd.get('fullName') ?? ''),
      });
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
      <div className="card" style={{ marginTop: '1rem' }}>
        <h1>{t('joinTitle')}</h1>
        {error ? <p className="error">{error}</p> : null}
        <form onSubmit={onSubmit}>
          <label className="field">
            <span>{t('inviteCode')}</span>
            <input name="inviteCode" maxLength={6} required />
          </label>
          <label className="field">
            <span>{t('fullName')}</span>
            <input name="fullName" required />
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
      </div>
    </main>
  );
}
