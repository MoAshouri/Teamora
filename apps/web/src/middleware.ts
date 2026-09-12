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
  const cookieLocale = request.cookies.get(APP_LOCALE_COOKIE)?.value ?? null;
  if (request.nextUrl.pathname.startsWith('/app')) {
    const headers = new Headers(request.headers);
    const parsed = parseAppLocale(cookieLocale);
    headers.set('x-teamora-locale', parsed);
    // #region agent log
    fetch('http://127.0.0.1:7869/ingest/c694b7eb-dcc2-4100-9c19-d4aca06d483e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a506d6'},body:JSON.stringify({sessionId:'a506d6',runId:'post-fix',hypothesisId:'ML',location:'middleware.ts:app',message:'app locale from cookie only',data:{path:request.nextUrl.pathname,cookie:cookieLocale,parsed},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    return NextResponse.next({
      request: { headers },
    });
  }

  const locale = localeFromPath(request.nextUrl.pathname);
  request.headers.set('x-teamora-locale', locale);
  const response = intlMiddleware(request);
  // Marketing URL is the locale. Do not overwrite the authenticated /app cookie.
  // #region agent log
  fetch('http://127.0.0.1:7869/ingest/c694b7eb-dcc2-4100-9c19-d4aca06d483e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a506d6'},body:JSON.stringify({sessionId:'a506d6',runId:'post-fix',hypothesisId:'ML',location:'middleware.ts:marketing',message:'marketing skips app locale cookie',data:{path:request.nextUrl.pathname,pathLocale:locale,existingCookie:cookieLocale},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  response.headers.set('x-teamora-mw', locale);
  return response;
}

export const config = {
  matcher: ['/', '/fa/:path*', '/en/:path*', '/hy/:path*', '/app/:path*'],
};
