'use client';

import { useEffect, useState } from 'react';
import { brandSeal, type AuthFamily, type AuthTheme } from '@/features/auth/brand';
import './wax-seal.css';

export type WaxStatus = 'pending' | 'approved' | 'rejected';

function familyFromDom(): AuthFamily {
  return document.documentElement.dataset.family === 'hayat' ? 'hayat' : 'gavit';
}

function themeFromDom(): AuthTheme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

function StatusGlyph({ status }: { status: WaxStatus }) {
  if (status === 'approved') {
    return (
      <svg className="wax-seal__glyph" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 12.5 10.2 17 18 7.5"
        />
      </svg>
    );
  }
  if (status === 'rejected') {
    return (
      <svg className="wax-seal__glyph" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          d="M7 7 17 17M17 7 7 17"
        />
      </svg>
    );
  }
  return (
    <svg className="wax-seal__glyph" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        d="M8 4.8h8M8 19.2h8M9.2 4.8c0 3.4 5.6 3.6 5.6 7.2S9.2 15.8 9.2 19.2"
      />
    </svg>
  );
}

export function WaxSeal({
  status,
  label,
  size = 'sm',
  family,
  theme,
}: {
  status: WaxStatus;
  label: string;
  size?: 'sm' | 'md';
  family?: AuthFamily;
  theme?: AuthTheme;
}) {
  const [src, setSrc] = useState(() => brandSeal(family ?? 'gavit', theme ?? 'light'));

  useEffect(() => {
    setSrc(brandSeal(family ?? familyFromDom(), theme ?? themeFromDom()));
  }, [family, theme]);

  return (
    <span className="wax-seal" data-status={status} data-size={size}>
      <span className="wax-seal__face">
        <img src={src} alt="" />
        <StatusGlyph status={status} />
      </span>
      <span className="wax-seal__label">{label}</span>
    </span>
  );
}