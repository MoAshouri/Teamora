/**
 * Brand kit used by the 3D scene. Everything lives in `public/brand`.
 * Hayat = public courtyard (warm plaster). Gavit = inner hall (basalt/tufa).
 */
export const BRAND = {
  // Wall / floor material
  plasterLight: '/brand/gavit/gavit-banner-light.avif',
  basaltDark: '/brand/gavit/gavit-banner-dark.avif',
  tealPanel: '/brand/hayat/hayat-banner-light.avif',

  // Hayat niches (opaque square tiles with a recessed pointed arch)
  nicheLight: '/brand/hayat/hayat-gunbad-light.avif',
  nicheDark: '/brand/hayat/hayat-gunbad-dark.avif',

  // Gavit round arches (alpha cut-outs)
  archLight: '/brand/gavit/gavit-iwan-light.avif',
  archDark: '/brand/gavit/gavit-iwan-dark.avif',

  // Gavit plaques (church silhouette + pomegranate)
  plaqueLight: '/brand/gavit/gavit-gunbad-light.avif',
  plaqueDark: '/brand/gavit/gavit-gunbad-dark.avif',

  // Bricks
  brickBeige: '/brand/hayat/hayat-brick-light-beige.avif',
  brickTerracotta: '/brand/hayat/hayat-brick-light-terracotta.avif',
  brickSlate: '/brand/hayat/hayat-brick-dark-slate.avif',
  stoneBeige: '/brand/gavit/gavit-brick-light-beige.avif',
  stoneRed: '/brand/gavit/gavit-brick-light-terracotta.avif',
  stoneSlate: '/brand/gavit/gavit-brick-dark-slate.avif',

  // Wax seals
  waxHourglass: '/brand/hayat/hayat-wax-light.avif',
  waxHourglassSilver: '/brand/hayat/hayat-wax-dark.avif',
  waxEternity: '/brand/gavit/gavit-wax-light.avif',
  waxEternitySilver: '/brand/gavit/gavit-wax-dark.avif',

  // Marks
  tatilLight: '/brand/hayat/hayat-tatil-light.avif',
  tatilDark: '/brand/hayat/hayat-tatil-dark.avif',
  eternityDark: '/brand/gavit/gavit-tatil-dark.avif',
  eternityLight: '/brand/gavit/gavit-tatil-light.avif',
} as const;

export type BrandKey = keyof typeof BRAND;

/** Pixel aspect ratios (w / h) so planes keep the artwork proportions. */
export const ASPECT: Record<BrandKey, number> = {
  plasterLight: 802 / 1399,
  basaltDark: 802 / 1399,
  tealPanel: 756 / 1400,
  nicheLight: 1,
  nicheDark: 1,
  archLight: 437 / 720,
  archDark: 437 / 720,
  plaqueLight: 896 / 609,
  plaqueDark: 896 / 666,
  brickBeige: 640 / 332,
  brickTerracotta: 639 / 305,
  brickSlate: 640 / 319,
  stoneBeige: 640 / 365,
  stoneRed: 640 / 345,
  stoneSlate: 640 / 350,
  waxHourglass: 500 / 512,
  waxHourglassSilver: 491 / 512,
  waxEternity: 507 / 512,
  waxEternitySilver: 506 / 512,
  tatilLight: 1,
  tatilDark: 1,
  eternityDark: 1,
  eternityLight: 1,
};
