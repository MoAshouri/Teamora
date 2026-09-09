'use client';

import { FormEvent, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { authApi, type AuthUser } from '@/lib/api';
import { VerifyEmailGate } from '@/features/auth/verify-email-gate';
import { AppThemeToggle } from '@/components/app-theme-toggle';

function SetPasswordModal({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('رمز دست‌کم ۸ نویسه باشد.');
      return;
    }
    setBusy(true);
    try {
      await authApi.setPassword(password);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="set-password-title">
      <form className="card modal-panel" onSubmit={onSubmit}>
        <h2 id="set-password-title" style={{ marginTop: 0 }}>
          گذاشتن رمز
        </h2>
        <p className="muted">برای ورودهای بعد، یک رمز روی در بگذارید.</p>
        <label className="field">
          <span>رمز عبور</span>
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
          مهر کردن
        </button>
      </form>
    </div>
  );
}

const adminLinks = [
  { href: '/app/admin/dashboard', key: 'dashboard' },
  { href: '/app/admin/people', key: 'people' },
  { href: '/app/admin/work-time', key: 'workTime' },
  { href: '/app/admin/leaves', key: 'leaves' },
  { href: '/app/admin/calendar', key: 'calendar' },
] as const;

const employeeLinks = [
  { href: '/app/employee/dashboard', key: 'today' },
  { href: '/app/employee/work-time', key: 'workTime' },
  { href: '/app/employee/leaves', key: 'leaves' },
  { href: '/app/employee/calendar', key: 'calendar' },
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
  const links = role === 'ADMIN' ? adminLinks : employeeLinks;

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
      .catch(() => router.replace('/fa/login'));
  }, [role, router]);

  async function logout() {
    await authApi.logout();
    router.replace('/fa/login');
  }

  if (!user) {
    return <main className="container" style={{ padding: '3rem 0' }}>Loading…</main>;
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

  return (
    <div className="sidebar-layout">
      {user.mustSetPassword ? <SetPasswordModal onDone={() => setUser({ ...user, mustSetPassword: false })} /> : null}
      {role === 'ADMIN' ? (
        <aside className="side-nav" style={{ order: 2 }}>
          <strong style={{ padding: '0.5rem 0.9rem', marginBottom: '0.5rem' }}>{tRoot('brand')}</strong>
          {links.map((l) => (
            <Link key={l.href} href={l.href} data-active={pathname === l.href}>
              {t(`nav.${l.key}`)}
            </Link>
          ))}
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <AppThemeToggle />
            <button className="btn btn-ghost" style={{ color: '#fff' }} onClick={logout}>
              {t('nav.logout')}
            </button>
          </div>
        </aside>
      ) : null}
      <div className="main-pane" style={{ order: 1 }}>
        {children}
        {role === 'EMPLOYEE' ? (
          <nav className="bottom-nav">
            {links.map((l) => (
              <Link key={l.href} href={l.href} data-active={pathname === l.href}>
                {t(`nav.${l.key}`)}
              </Link>
            ))}
            <AppThemeToggle />
            <button className="btn btn-ghost" onClick={logout} style={{ fontSize: '0.75rem' }}>
              {t('nav.logout')}
            </button>
          </nav>
        ) : null}
      </div>
    </div>
  );
}
