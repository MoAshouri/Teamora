'use client';

import {
  createContext,
  Suspense,
  useContext,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { locales } from '@/lib/i18n/config';
import { persistAppTheme, readClientTheme } from '@/lib/theme';
import { authBrand, type AuthBrand, type AuthTheme } from './brand';
import { ThemeToggle } from './theme-toggle';
import './auth.css';

const LOCALE_LABEL: Record<string, string> = { en: 'EN', fa: 'فا', hy: 'ՀՀ' };

type AuthUiContextValue = {
  theme: AuthTheme;
  setTheme: (theme: AuthTheme) => void;
  brand: AuthBrand;
};

const AuthUiContext = createContext<AuthUiContextValue | null>(null);

function readTheme(): AuthTheme {
  if (typeof window === 'undefined') return 'light';
  return readClientTheme();
}

export function useAuthUi() {
  const ctx = useContext(AuthUiContext);
  if (!ctx) throw new Error('useAuthUi must be used inside AuthShell');
  return ctx;
}

function AuthLangs({ locale }: { locale: string }) {
  const pathname = usePathname();
  const search = useSearchParams();
  const rest = pathname.replace(/^\/(en|fa|hy)/, '') || '';
  const query = search.toString();

  return (
    <nav className="auth-langs" aria-label="Language">
      {locales.map((l) => (
        <Link
          key={l}
          href={`/${l}${rest}${query ? `?${query}` : ''}`}
          hrefLang={l}
          lang={l}
          aria-current={l === locale ? 'page' : undefined}
        >
          {LOCALE_LABEL[l]}
        </Link>
      ))}
    </nav>
  );
}

function Atmosphere() {
  return (
    <div className="auth-atmosphere" aria-hidden="true">
      <div className="auth-atmosphere__sky" />
      <div className="auth-atmosphere__wall" />
      <div className="auth-atmosphere__shaft" />
      <div className="auth-atmosphere__floor" />
      <div className="auth-atmosphere__grain" />
      <div className="auth-atmosphere__vignette" />
    </div>
  );
}

export function AuthStageFallback() {
  return (
    <main className="auth-stage" data-theme="light" data-accent="gavit" data-method="login">
      <div className="auth-gunbad">
        <div className="auth-gunbad__well">
          <p className="muted">…</p>
        </div>
      </div>
    </main>
  );
}

export function AuthShell({
  locale,
  children,
  method,
}: {
  locale: string;
  children: ReactNode;
  method: 'login' | 'join' | 'create';
}) {
  const t = useTranslations('auth');
  const brandName = useTranslations()('brand');
  const brand = useMemo(() => authBrand(locale), [locale]);
  const [theme, setTheme] = useState<AuthTheme>('light');

  useEffect(() => {
    setTheme(readTheme());
  }, []);

  useEffect(() => {
    document.documentElement.classList.add('auth-lock');
    persistAppTheme(theme);
    document.body.dataset.theme = theme;
    return () => {
      document.documentElement.classList.remove('auth-lock');
    };
  }, [theme]);

  const value = useMemo(() => ({ theme, setTheme, brand }), [theme, brand]);
  const kit = brand.accent === 'hayat' ? brand.hayat : brand.gavit;
  const title =
    method === 'join' ? t('joinTitle') : method === 'create' ? t('registerTitle') : t('loginTitle');
  const lede =
    method === 'join' ? t('ledeJoin') : method === 'create' ? t('ledeCreate') : t('ledeLogin');
  const seal = method === 'login' ? brand.hayat.wax[theme] : brand.gavit.wax[theme];
  const gunbad = kit.plaque[theme];
  const brick = kit.brickAccent[theme];

  const stageStyle = {
    '--auth-wall': `url(${kit.wall[theme]})`,
    '--auth-brick': `url(${brick})`,
  } as CSSProperties;

  return (
    <AuthUiContext.Provider value={value}>
      <main
        className="auth-stage"
        data-theme={theme}
        data-accent={brand.accent}
        data-method={method}
        style={stageStyle}
      >
        <Atmosphere />

        <header className="auth-chrome">
          <Link className="auth-chrome__brand" href={`/${locale}`}>
            <img src={kit.mark[theme]} alt="" width={22} height={22} />
            <span>{brandName}</span>
          </Link>
          <div className="auth-chrome__actions">
            <Suspense fallback={<nav className="auth-langs" aria-hidden="true" />}>
              <AuthLangs locale={locale} />
            </Suspense>
            <ThemeToggle
              theme={theme}
              onToggle={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              label={theme === 'light' ? t('themeDark') : t('themeLight')}
            />
          </div>
        </header>

        <div className="auth-layout">
          <div className="auth-gunbad">
            <img className="auth-gunbad__stone" src={gunbad} alt="" draggable={false} />
            <div className="auth-gunbad__well">
              <div className="auth-gunbad__head">
                <img className="auth-gunbad__seal" src={seal} alt="" draggable={false} />
                <h1 className="auth-gunbad__title">{title}</h1>
                <p className="auth-gunbad__lede">{lede}</p>
              </div>
              {children}
              <nav className="auth-methods" aria-label={t('methodsLabel')}>
                <Link href={`/${locale}/login`} aria-current={method === 'login' ? 'page' : undefined}>
                  {t('methodLogin')}
                </Link>
                <Link href={`/${locale}/join`} aria-current={method === 'join' ? 'page' : undefined}>
                  {t('methodJoin')}
                </Link>
                <Link
                  href={`/${locale}/login?mode=create`}
                  aria-current={method === 'create' ? 'page' : undefined}
                >
                  {t('methodCreate')}
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </main>
    </AuthUiContext.Provider>
  );
}
