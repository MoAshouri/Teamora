import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'landing' });
  return {
    title: `Teamora — ${t('headline')}`,
    description: t('sub'),
    openGraph: {
      title: 'Teamora',
      description: t('sub'),
      locale,
    },
  };
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const brand = t('brand');

  return (
    <main className="app-shell">
      <header className="container" style={{ paddingTop: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong style={{ fontSize: '1.35rem' }}>{brand}</strong>
          <nav style={{ display: 'flex', gap: '0.5rem' }}>
            {(['fa', 'hy', 'en'] as const).map((l) => (
              <Link key={l} className="btn btn-ghost" href={`/${l}`} style={{ padding: '0.4rem 0.7rem' }}>
                {l.toUpperCase()}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <section className="hero container">
        <p className="muted">{t('tagline')}</p>
        <h1>{t('landing.headline')}</h1>
        <p>{t('landing.sub')}</p>
        <div className="cta-row">
          <Link className="btn btn-primary" href={`/${locale}/login`}>
            {t('landing.ctaLogin')}
          </Link>
          <Link className="btn btn-ghost" href={`/${locale}/join`}>
            {t('landing.ctaJoin')}
          </Link>
          <Link className="btn btn-ghost" href={`/${locale}/login?mode=register`}>
            {t('landing.ctaRegister')}
          </Link>
        </div>
      </section>
    </main>
  );
}
