import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { defaultLocale, locales, type Locale } from './src/lib/i18n/config';

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
  const locale = localeFromPath(request.nextUrl.pathname);
  request.headers.set('x-teamora-locale', locale);

  if (request.nextUrl.pathname.startsWith('/app')) {
    return NextResponse.next({
      request: { headers: request.headers },
    });
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/', '/(fa|hy|en)/:path*', '/app/:path*'],
};
