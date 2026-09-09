export const APP_THEME_COOKIE = 'teamora-theme';
export const APP_THEME_MAX_AGE = 60 * 60 * 24 * 365;
const LEGACY_THEME_KEY = 'teamora-auth-theme';

export type AppTheme = 'light' | 'dark';

export function parseAppTheme(raw: string | undefined | null): AppTheme {
  return raw === 'dark' ? 'dark' : 'light';
}

export function persistAppTheme(theme: AppTheme) {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = theme;
  document.cookie = `${APP_THEME_COOKIE}=${theme}; Path=/; SameSite=Lax; Max-Age=${APP_THEME_MAX_AGE}`;
  try {
    window.localStorage.setItem(APP_THEME_COOKIE, theme);
  } catch {
    /* private mode */
  }
}

export function readClientTheme(): AppTheme {
  if (typeof document === 'undefined') return 'light';
  const cookie = document.cookie.match(/(?:^|; )teamora-theme=(dark|light)/)?.[1];
  if (cookie === 'dark' || cookie === 'light') return cookie;
  try {
    const stored =
      window.localStorage.getItem(APP_THEME_COOKIE) || window.localStorage.getItem(LEGACY_THEME_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {
    /* private mode */
  }
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  return 'light';
}

/** Runs before paint so `/app` does not flash the wrong theme when the cookie is missing. */
export const APP_THEME_BOOT_SCRIPT = `(function(){try{var m=document.cookie.match(/(?:^|; )teamora-theme=(dark|light)/);var t=m?m[1]:null;if(!t){t=localStorage.getItem('teamora-theme')||localStorage.getItem('teamora-auth-theme');}if(t!=='dark'&&t!=='light'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;
