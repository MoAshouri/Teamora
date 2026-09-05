'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi, type AuthUser } from '@/lib/api';

const adminLinks = [
  { href: '/app/admin/dashboard', key: 'dashboard', label: 'داشبورد' },
  { href: '/app/admin/people', key: 'people', label: 'افراد' },
  { href: '/app/admin/work-time', key: 'workTime', label: 'ساعات کاری' },
  { href: '/app/admin/leaves', key: 'leaves', label: 'مرخصی‌ها' },
  { href: '/app/admin/calendar', key: 'calendar', label: 'تقویم' },
] as const;

const employeeLinks = [
  { href: '/app/employee/dashboard', key: 'dashboard', label: 'امروز' },
  { href: '/app/employee/work-time', key: 'workTime', label: 'ساعات' },
  { href: '/app/employee/leaves', key: 'leaves', label: 'مرخصی' },
  { href: '/app/employee/calendar', key: 'calendar', label: 'جلسات' },
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
  const links = role === 'ADMIN' ? adminLinks : employeeLinks;

  useEffect(() => {
    document.documentElement.lang = 'fa';
    document.documentElement.dir = 'rtl';
    document.documentElement.dataset.theme = role === 'EMPLOYEE' ? 'dark' : 'light';
  }, [role]);

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

  return (
    <div className="sidebar-layout">
      {role === 'ADMIN' ? (
        <aside className="side-nav" style={{ order: 2 }}>
          <strong style={{ padding: '0.5rem 0.9rem', marginBottom: '0.5rem' }}>تیمورا</strong>
          {links.map((l) => (
            <Link key={l.href} href={l.href} data-active={pathname === l.href}>
              {l.label}
            </Link>
          ))}
          <button className="btn btn-ghost" style={{ marginTop: 'auto', color: '#fff' }} onClick={logout}>
            خروج
          </button>
        </aside>
      ) : null}
      <div className="main-pane" style={{ order: 1 }}>
        {children}
        {role === 'EMPLOYEE' ? (
          <nav className="bottom-nav">
            {links.map((l) => (
              <Link key={l.href} href={l.href} data-active={pathname === l.href}>
                {l.label}
              </Link>
            ))}
            <button className="btn btn-ghost" onClick={logout} style={{ fontSize: '0.75rem' }}>
              خروج
            </button>
          </nav>
        ) : null}
      </div>
    </div>
  );
}
