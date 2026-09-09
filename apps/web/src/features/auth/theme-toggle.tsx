'use client';

import { useId } from 'react';
import type { AuthTheme } from './brand';

const RAYS = [0, 45, 90, 135, 180, 225, 270, 315];

export function ThemeToggle({
  theme,
  onToggle,
  label,
}: {
  theme: AuthTheme;
  onToggle: () => void;
  label: string;
}) {
  const raw = useId().replace(/:/g, '');
  const maskId = `auth-moon-${raw}`;

  return (
    <button
      type="button"
      className="auth-theme-btn"
      data-mode={theme}
      onClick={onToggle}
      aria-label={label}
      aria-pressed={theme === 'dark'}
    >
      <svg className="auth-theme-icon" viewBox="0 0 24 24" aria-hidden="true">
        <defs>
          <mask id={maskId}>
            <rect x="0" y="0" width="24" height="24" fill="white" />
            <circle className="auth-theme-icon__cut" cx="12" cy="12" r="8" fill="black" />
          </mask>
        </defs>
        <circle
          className="auth-theme-icon__core"
          cx="12"
          cy="12"
          r="5"
          mask={`url(#${maskId})`}
        />
        <g className="auth-theme-icon__rays">
          {RAYS.map((deg) => (
            <line
              key={deg}
              x1="12"
              y1="2.6"
              x2="12"
              y2="5.4"
              transform={`rotate(${deg} 12 12)`}
            />
          ))}
        </g>
      </svg>
    </button>
  );
}
