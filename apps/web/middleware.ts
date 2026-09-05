import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { defaultLocale, locales } from './src/lib/i18n/config';

const intlMiddleware = createMiddleware({
  locales: [...locales],
  defaultLocale,
  localePrefix: 'always',
});

export default function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/app')) {
    return NextResponse.next();
  }
  return intlMiddleware(request);
}

export const config = {
  matcher: ['/', '/(fa|hy|en)/:path*', '/app/:path*'],
};
