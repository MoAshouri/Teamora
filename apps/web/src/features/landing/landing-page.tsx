import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { localeDirection, locales, type Locale } from '@/lib/i18n/config';
import { OG_IMAGE, OG_LOCALE, SITE_NAME, SITE_URL, absoluteUrl, languageAlternates } from '@/lib/site';
import { LandingExperience } from '@/features/landing/landing-experience';
import type { LandingCopy } from '@/features/landing/types';

export async function generateLandingMetadata(locale: Locale): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'landing' });
  const title = `${SITE_NAME} — ${t('headline')}`;
  const description = t('sub');

  return {
    metadataBase: new URL(SITE_URL),
    title: { absolute: title },
    description,
    applicationName: SITE_NAME,
    alternates: {
      canonical: `/${locale}`,
      languages: languageAlternates(),
    },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      url: `/${locale}`,
      title,
      description,
      locale: OG_LOCALE[locale],
      alternateLocale: locales.filter((l) => l !== locale).map((l) => OG_LOCALE[l]),
      images: [{ url: OG_IMAGE.url, width: OG_IMAGE.width, height: OG_IMAGE.height, alt: SITE_NAME }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [OG_IMAGE.url],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
    category: 'business',
  };
}

function jsonLd(locale: Locale, copy: LandingCopy) {
  const url = absoluteUrl(`/${locale}`);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: absoluteUrl('/brand/hayat/hayat-tatil-dark.avif'),
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: SITE_NAME,
        url: SITE_URL,
        inLanguage: locales,
        publisher: { '@id': `${SITE_URL}/#organization` },
      },
      {
        '@type': 'WebPage',
        '@id': url,
        url,
        name: copy.headline,
        description: copy.sub,
        inLanguage: locale,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        primaryImageOfPage: absoluteUrl(OG_IMAGE.url),
      },
      {
        '@type': 'SoftwareApplication',
        name: SITE_NAME,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        url,
        description: copy.sub,
        inLanguage: locale,
        featureList: [copy.hoursTitle, copy.leaveTitle, copy.calendarTitle, copy.companyTitle],
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      },
    ],
  };
}

export async function LandingRoute({ locale }: { locale: Locale }) {
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const landing = await getTranslations({ locale, namespace: 'landing' });

  const copy: LandingCopy = {
    brand: t('brand'),
    tagline: t('tagline'),
    headline: landing('headline'),
    sub: landing('sub'),
    ctaLogin: landing('ctaLogin'),
    ctaJoin: landing('ctaJoin'),
    ctaRegister: landing('ctaRegister'),
    skip: landing('skip'),
    hoursTitle: landing('hoursTitle'),
    hoursBody: landing('hoursBody'),
    leaveTitle: landing('leaveTitle'),
    leaveBody: landing('leaveBody'),
    calendarTitle: landing('calendarTitle'),
    calendarBody: landing('calendarBody'),
    companyTitle: landing('companyTitle'),
    companyBody: landing('companyBody'),
    adminTitle: landing('adminTitle'),
    adminBody: landing('adminBody'),
    employeeTitle: landing('employeeTitle'),
    employeeBody: landing('employeeBody'),
    trustTitle: landing('trustTitle'),
    trustBody: landing('trustBody'),
    sealTitle: landing('sealTitle'),
    sealBody: landing('sealBody'),
    progressLabel: landing('progressLabel'),
  };

  return (
    <>
      <script
        type="application/ld+json"
        // JSON-LD is generated from our own translated copy; the replace guards against `</script>` injection.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(locale, copy)).replace(/</g, '\\u003c') }}
      />
      <LandingExperience locale={locale} rtl={localeDirection[locale] === 'rtl'} copy={copy} />
    </>
  );
}
