'use client';

import { FormEvent, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { authApi, type AuthUser } from '@/lib/api';
import { VerifyEmailGate } from '@/features/auth/verify-email-gate';
import { TodayHeading } from '@/features/app-shell/today-heading';
import { AppHeaderActions } from '@/features/app-shell/header-actions';
import { LanguageSwitch } from '@/features/app-shell/language-switch';
import { EmployeeChrome } from '@/features/app-shell/employee-chrome';
import { appLoginPath } from '@/lib/i18n/app-locale';
import { Modal } from '@/features/ui/modal';

function noop() {}

function SetPasswordModal({ onDone }: { onDone: () => void }) {
  const tAuth = useTranslations('auth');
  const tCommon = useTranslations('common');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError(tAuth('passwordMin'));
      return;
    }
    setBusy(true);
    try {
      await authApi.setPassword(password);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon('error'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={noop} title={tAuth('setPasswordTitle')} dismissible={false}>
      <form onSubmit={onSubmit}>
        <p className="muted">{tAuth('setPasswordBody')}</p>
        <label className="field">
          <span>{tAuth('password')}</span>
          <input
            type="password"
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error ? <p className="muted" style={{ color: '#9e3d1c' }}>{error}</p> : null}
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {tAuth('setPasswordSubmit')}
        </button>
      </form>
    </Modal>
  );
}

const adminLinks = [
  { href: '/app/admin/dashboard', key: 'dashboard' },
  { href: '/app/admin/people', key: 'people' },
  { href: '/app/admin/work-time', key: 'workTime' },
  { href: '/app/admin/leaves', key: 'leaves' },
  { href: '/app/admin/calendar', key: 'calendar' },
] as const;

export function AppShell({
  role,
  children,
}: {
  role: 'ADMIN' | 'EMPLOYEE';
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('app');
  const tRoot = useTranslations();
  const tCommon = useTranslations('common');

  useEffect(() => {
    authApi
      .me()
      .then((u) => {
        if (u.role !== role) {
          router.replace(`/app/${u.role === 'ADMIN' ? 'admin' : 'employee'}/dashboard`);
          return;
        }
        setUser(u);
      })
      .catch(() => router.replace(appLoginPath()));

    const onMe = () => {
      authApi.me().then(setUser).catch(() => undefined);
    };
    window.addEventListener('teamora-me', onMe);
    return () => window.removeEventListener('teamora-me', onMe);
  }, [role, router]);

  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7869/ingest/c694b7eb-dcc2-4100-9c19-d4aca06d483e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a506d6'},body:JSON.stringify({sessionId:'a506d6',runId:'post-fix',hypothesisId:'HY3',location:'app-shell.tsx:render',message:'app shell auth gate',data:{role,hasUser:Boolean(user),pathname},timestamp:Date.now()})}).catch(()=>{});
  }, [role, user, pathname]);
  // #endregion

  async function logout() {
    await authApi.logout();
    router.replace(appLoginPath());
  }

  if (!user) {
    if (role === 'EMPLOYEE') {
      return <EmployeeChrome onLogout={logout}>{tCommon('loading')}</EmployeeChrome>;
    }
    return (
      <main className="container" style={{ padding: '3rem 0' }}>
        <header className="app-panel-header">
          <TodayHeading />
          <AppHeaderActions />
        </header>
        {tCommon('loading')}
      </main>
    );
  }

  if (user.role === 'ADMIN' && user.mustVerifyEmail) {
    return (
      <VerifyEmailGate
        email={user.email}
        onVerified={setUser}
        onLogout={logout}
      />
    );
  }

  if (role === 'EMPLOYEE') {
    return (
      <>
        {user.mustSetPassword ? <SetPasswordModal onDone={() => setUser({ ...user, mustSetPassword: false })} /> : null}
        <EmployeeChrome onLogout={logout}>{children}</EmployeeChrome>
      </>
    );
  }

  return (
    <div className="sidebar-layout">
      {user.mustSetPassword ? <SetPasswordModal onDone={() => setUser({ ...user, mustSetPassword: false })} /> : null}
      <aside className="side-nav" style={{ order: 2 }}>
        <strong style={{ padding: '0.5rem 0.9rem', marginBottom: '0.5rem' }}>{tRoot('brand')}</strong>
        {adminLinks.map((l) => (
          <Link key={l.href} href={l.href} data-active={pathname === l.href}>
            {t(`nav.${l.key}`)}
          </Link>
        ))}
        <div className="side-nav-foot">
          <Link href="/app/admin/settings" data-active={pathname === '/app/admin/settings'}>
            {t('nav.settings')}
          </Link>
          <LanguageSwitch />
          <button className="btn btn-ghost" type="button" onClick={logout}>
            {t('nav.logout')}
          </button>
        </div>
      </aside>
      <div className="main-pane" style={{ order: 1 }}>
        <header className="app-panel-header">
          <TodayHeading />
          <AppHeaderActions />
        </header>
        {children}
      </div>
    </div>
  );
}
