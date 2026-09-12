'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { AppHeaderActions } from '@/features/app-shell/header-actions';
import { LanguageSwitch } from '@/features/app-shell/language-switch';
import { TodayHeading } from '@/features/app-shell/today-heading';
import './header-actions.css';
import './employee-chrome.css';

function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="6" cy="12" r="1.7" fill="currentColor" />
      <circle cx="12" cy="12" r="1.7" fill="currentColor" />
      <circle cx="18" cy="12" r="1.7" fill="currentColor" />
    </svg>
  );
}

export function EmployeeChrome({
  children,
  onLogout,
}: {
  children: React.ReactNode;
  onLogout: () => void;
}) {
  const t = useTranslations('app');
  const tRoot = useTranslations();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuId = 'employee-more-menu';
  const rootRef = useRef<HTMLDivElement>(null);
  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7869/ingest/c694b7eb-dcc2-4100-9c19-d4aca06d483e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a506d6'},body:JSON.stringify({sessionId:'a506d6',runId:'post-fix',hypothesisId:'HY4',location:'employee-chrome.tsx:render',message:'employee chrome render',data:{menuId,pathname,open,hasWindow:true},timestamp:Date.now()})}).catch(()=>{});
  }, [menuId, pathname, open]);
  // #endregion

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="employee-shell">
      <header className="employee-chrome">
        <Link className="employee-chrome__brand" href="/app/employee/dashboard">
          {tRoot('brand')}
        </Link>
        <TodayHeading />
        <div className="employee-chrome__end">
          <AppHeaderActions />
          <div className="employee-more" ref={rootRef}>
            <button
              type="button"
              className="app-header-icon"
              aria-expanded={open}
              aria-controls={menuId}
              aria-label={t('nav.more')}
              onClick={() => setOpen((value) => !value)}
            >
              <MoreIcon />
            </button>
            {open ? (
              <div className="employee-more__panel" id={menuId} role="menu">
                <LanguageSwitch variant="panel" />
                <Link
                  href="/app/employee/settings"
                  role="menuitem"
                  data-active={pathname === '/app/employee/settings'}
                  onClick={() => setOpen(false)}
                >
                  {t('nav.settings')}
                </Link>
                <button className="btn btn-ghost" type="button" role="menuitem" onClick={onLogout}>
                  {t('nav.logout')}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>
      <div className="main-pane employee-main">{children}</div>
    </div>
  );
}