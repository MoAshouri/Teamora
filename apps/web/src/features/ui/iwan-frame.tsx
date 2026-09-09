'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { brandIwan, type AuthFamily, type AuthTheme } from '@/features/auth/brand';
import './iwan-frame.css';

const RING = 2 * Math.PI * 42;

function familyFromDom(): AuthFamily {
  return document.documentElement.dataset.family === 'hayat' ? 'hayat' : 'gavit';
}

function themeFromDom(): AuthTheme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

export function IwanFrame({
  children,
  footer,
  progress = 1,
}: {
  children: ReactNode;
  footer?: ReactNode;
  progress?: number;
}) {
  const clamped = Math.min(1, Math.max(0, progress));
  const [kit, setKit] = useState(() => ({
    family: 'gavit' as AuthFamily,
    src: brandIwan('gavit', 'light'),
  }));

  useEffect(() => {
    const apply = () => {
      const family = familyFromDom();
      const theme = themeFromDom();
      setKit({ family, src: brandIwan(family, theme) });
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-family'],
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="iwan-frame" data-family={kit.family}>
      <div className="iwan-frame__vault">
        <img className="iwan-frame__stone" src={kit.src} alt="" />
        <div className="iwan-frame__well">
          <svg className="iwan-frame__ring" viewBox="0 0 100 100" aria-hidden="true">
            <circle className="iwan-frame__track" cx="50" cy="50" r="42" />
            <circle
              className="iwan-frame__progress"
              cx="50"
              cy="50"
              r="42"
              strokeDasharray={`${clamped * RING} ${RING}`}
            />
          </svg>
          <div className="iwan-frame__body">{children}</div>
        </div>
      </div>
      {footer ? <div className="iwan-frame__footer">{footer}</div> : null}
    </div>
  );
}