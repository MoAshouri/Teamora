'use client';

import { useEffect } from 'react';
import type { AppTheme } from '@/lib/theme';
import './theme-toggle.css';

const RAYS = [0, 45, 90, 135, 180, 225, 270, 315];
const MASK_ID = 'theme-moon-mask';

export function ThemeToggle({
  theme,
  onToggle,
  label,
}: {
  theme: AppTheme;
  onToggle: () => void;
  label: string;
}) {
  const maskId = MASK_ID;
  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7869/ingest/c694b7eb-dcc2-4100-9c19-d4aca06d483e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a506d6'},body:JSON.stringify({sessionId:'a506d6',runId:'post-fix',hypothesisId:'HY1',location:'theme-toggle.tsx:render',message:'theme toggle attrs',data:{theme,maskId,htmlTheme:document.documentElement.getAttribute('data-theme'),htmlFamily:document.documentElement.getAttribute('data-family')},timestamp:Date.now()})}).catch(()=>{});
  }, [theme, maskId, label]);
  // #endregion

  return (
    <button
      type="button"
      className="theme-toggle auth-theme-btn"
      data-mode={theme}
      onClick={onToggle}
      aria-label={label}
      aria-pressed={theme === 'dark'}
    >
      <svg className="theme-toggle__icon auth-theme-icon" viewBox="0 0 24 24" aria-hidden="true">
        <defs>
          <mask id={maskId}>
            <rect x="0" y="0" width="24" height="24" fill="white" />
            <circle className="theme-toggle__cut auth-theme-icon__cut" cx="12" cy="12" r="8" fill="black" />
          </mask>
        </defs>
        <circle
          className="theme-toggle__core auth-theme-icon__core"
          cx="12"
          cy="12"
          r="5"
          mask={`url(#${maskId})`}
        />
        <g className="theme-toggle__rays auth-theme-icon__rays">
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
