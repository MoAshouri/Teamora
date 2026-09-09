import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { defaultLocale, locales, type Locale } from './src/lib/i18n/config';
import { APP_LOCALE_COOKIE, parseAppLocale } from './src/lib/i18n/app-locale';

const intlMiddleware = createMiddleware({
  locales: [...locales],
  defaultLocale,
  localePrefix: 'always',
});

function localeFromPath(pathname: string): Locale {
  const first = pathname.split('/').filter(Boolean)[0];
  if (first && locales.includes(first as Locale)) {
    return first as Locale;
  }
  return defaultLocale;
}

export default function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/app')) {
    const headers = new Headers(request.headers);
    headers.set('x-teamora-locale', parseAppLocale(request.cookies.get(APP_LOCALE_COOKIE)?.value));
    return NextResponse.next({
      request: { headers },
    });
  }

  const locale = localeFromPath(request.nextUrl.pathname);
  request.headers.set('x-teamora-locale', locale);
  return intlMiddleware(request);
}

export const config = {
  matcher: ['/', '/(fa|hy|en)/:path*', '/app/:path*'],
};
