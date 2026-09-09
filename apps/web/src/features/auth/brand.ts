/** Auth stage uses both houses at once: Hayat courtyard + Gavit hall. */
export type AuthTheme = 'light' | 'dark';
export type AuthFamily = 'hayat' | 'gavit';

export type AuthKit = {
  iwan: Record<AuthTheme, string>;
  brick: Record<AuthTheme, string>;
  brickAccent: Record<AuthTheme, string>;
  wall: Record<AuthTheme, string>;
  wax: Record<AuthTheme, string>;
  mark: Record<AuthTheme, string>;
  plaque: Record<AuthTheme, string>;
};

export type AuthBrand = {
  /** Locale leans the composition: FA toward the niche, EN/HY toward the iwan. */
  accent: AuthFamily;
  hayat: AuthKit;
  gavit: AuthKit;
};

const HAYAT: AuthKit = {
  iwan: {
    light: '/brand/hayat/hayat-gunbad-light.avif',
    dark: '/brand/hayat/hayat-gunbad-dark.avif',
  },
  brick: {
    light: '/brand/hayat/hayat-brick-light-beige.avif',
    dark: '/brand/hayat/hayat-brick-dark-slate.avif',
  },
  brickAccent: {
    light: '/brand/hayat/hayat-brick-light-terracotta.avif',
    dark: '/brand/hayat/hayat-brick-dark-terracotta.avif',
  },
  wall: {
    light: '/brand/hayat/hayat-banner-light.avif',
    dark: '/brand/hayat/hayat-banner-dark.avif',
  },
  wax: {
    light: '/brand/hayat/hayat-wax-light.avif',
    dark: '/brand/hayat/hayat-wax-dark.avif',
  },
  mark: {
    light: '/brand/hayat/hayat-tatil-dark.avif',
    dark: '/brand/hayat/hayat-tatil-light.avif',
  },
  plaque: {
    light: '/brand/hayat/hayat-gunbad-light.avif',
    dark: '/brand/hayat/hayat-gunbad-dark.avif',
  },
};

const GAVIT: AuthKit = {
  iwan: {
    light: '/brand/gavit/gavit-iwan-light.avif',
    dark: '/brand/gavit/gavit-iwan-dark.avif',
  },
  brick: {
    light: '/brand/gavit/gavit-brick-light-beige.avif',
    dark: '/brand/gavit/gavit-brick-dark-slate.avif',
  },
  brickAccent: {
    light: '/brand/gavit/gavit-brick-light-terracotta.avif',
    dark: '/brand/gavit/gavit-brick-dark-terracotta.avif',
  },
  wall: {
    light: '/brand/gavit/gavit-banner-light.avif',
    dark: '/brand/gavit/gavit-banner-dark.avif',
  },
  wax: {
    light: '/brand/gavit/gavit-wax-light.avif',
    dark: '/brand/gavit/gavit-wax-dark.avif',
  },
  mark: {
    light: '/brand/gavit/gavit-tatil-dark.avif',
    dark: '/brand/gavit/gavit-tatil-light.avif',
  },
  plaque: {
    light: '/brand/gavit/gavit-gunbad-light.avif',
    dark: '/brand/gavit/gavit-gunbad-dark.avif',
  },
};

export function familyFromLocale(locale: string): AuthFamily {
  return locale === 'fa' ? 'hayat' : 'gavit';
}

export function authBrand(locale: string): AuthBrand {
  return {
    accent: familyFromLocale(locale),
    hayat: HAYAT,
    gavit: GAVIT,
  };
}

export function authBrick(brand: AuthBrand, theme: AuthTheme) {
  const kit = brand.accent === 'hayat' ? brand.hayat : brand.gavit;
  return kit.brickAccent[theme];
}
