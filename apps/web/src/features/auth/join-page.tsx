'use client';

import { FormEvent, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { authBrick } from './brand';
import { AuthShell, useAuthUi } from './auth-shell';
import { BrickCodeInput } from './brick-code-input';

function JoinFormFields() {
  const t = useTranslations('auth');
  const { theme, brand } = useAuthUi();
  const brickSrc = authBrick(brand, theme);
  const [inviteCode, setInviteCode] = useState('');

  return (
    <>
      <label className="auth-field auth-field--bricks">
        <span>{t('inviteCode')}</span>
        <BrickCodeInput
          value={inviteCode}
          onChange={setInviteCode}
          brickSrc={brickSrc}
          aria-label={t('inviteCode')}
        />
      </label>
      <label className="auth-field">
        <span>{t('fullName')}</span>
        <input name="fullName" autoComplete="name" required />
      </label>
      <label className="auth-field">
        <span>{t('email')}</span>
        <input name="email" type="email" autoComplete="email" required />
      </label>
    </>
  );
}

export default function JoinPage() {
  const t = useTranslations('auth');
  const params = useParams<{ locale: string }>();
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.currentTarget);
    const inviteCode = String(fd.get('inviteCode') ?? '');
    if (inviteCode.length !== 6) {
      setError(t('inviteCode'));
      return;
    }
    setBusy(true);
    try {
      const result = await authApi.join({
        inviteCode,
        email: String(fd.get('email') ?? ''),
        fullName: String(fd.get('fullName') ?? ''),
      });
      router.push(`/app/${result.user.role === 'ADMIN' ? 'admin' : 'employee'}/dashboard`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell locale={params.locale} method="join">
      {error ? <p className="auth-error">{error}</p> : null}
      <form className="auth-form auth-form--join" onSubmit={onSubmit}>
        <JoinFormFields />
        <button className="auth-submit" type="submit" disabled={busy}>
          {t('submit')}
        </button>
      </form>
    </AuthShell>
  );
}
