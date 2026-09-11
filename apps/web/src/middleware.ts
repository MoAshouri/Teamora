import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { defaultLocale, locales, type Locale } from './lib/i18n/config';
import { APP_LOCALE_COOKIE, parseAppLocale } from './lib/i18n/app-locale';

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
  const response = intlMiddleware(request);
  response.cookies.set({
    name: APP_LOCALE_COOKIE,
    value: locale,
    path: '/',
    maxAge: 31536000,
    sameSite: 'lax',
  });
  response.headers.set('x-teamora-mw', locale);
  return response;
}

export const config = {
  matcher: ['/', '/fa/:path*', '/en/:path*', '/hy/:path*', '/app/:path*'],
};
