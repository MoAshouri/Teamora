import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import { NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { localeDirection } from '@/lib/i18n/config';
import { parseAppLocale } from '@/lib/i18n/app-locale';
import { fontClassForLocale } from '@/lib/fonts/for-locale';
import { APP_THEME_BOOT_SCRIPT, APP_THEME_COOKIE, parseAppTheme } from '@/lib/theme';
import { familyFromLocale } from '@/features/auth/brand';
import { ApiErrorToasts } from '@/features/app-shell/api-error-toasts';
import '@/styles/app-family.css';

export async function generateMetadata(): Promise<Metadata> {
  const headerList = await headers();
  const cookieStore = await cookies();
  const locale = parseAppLocale(
    headerList.get('x-teamora-locale') ?? cookieStore.get('teamora-locale')?.value,
  );
  const messages = (await import(`../../../messages/${locale}.json`)).default as {
    app: { meta: { title: string } };
  };
  return {
    robots: { index: false, follow: false },
    title: messages.app.meta.title,
  };
}

export default async function AuthenticatedRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerList = await headers();
  const cookieStore = await cookies();
  const locale = parseAppLocale(
    headerList.get('x-teamora-locale') ?? cookieStore.get('teamora-locale')?.value,
  );
  setRequestLocale(locale);
  const messages = (await import(`../../../messages/${locale}.json`)).default;
  const dir = localeDirection[locale];
  const family = familyFromLocale(locale);
  const fontClass = await fontClassForLocale(locale);
  const theme = parseAppTheme(cookieStore.get(APP_THEME_COOKIE)?.value);

  return (
    <html
      lang={locale}
      dir={dir}
      className={fontClass}
      data-family={family}
      data-theme={theme}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: APP_THEME_BOOT_SCRIPT }} />
      </head>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ApiErrorToasts />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
