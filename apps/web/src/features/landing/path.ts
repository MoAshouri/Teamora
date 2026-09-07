import type { PathSample, Vec3 } from './types';

/**
 * World layout (LTR). X is mirrored for RTL so the arcade still reads start → end.
 * One unit ≈ one metre.
 */
/** One niche size for the whole arcade (hero + hours/leave/calendar/company). */
export const NICHE_SIZE = 4.6;
/** Tiny overlap so neighbouring slab edges never show a hairline of wall. */
const NICHE_OVERLAP = 0.04;

const arcadePitch = NICHE_SIZE - NICHE_OVERLAP;
const firstArcadeX = NICHE_SIZE - NICHE_OVERLAP;

const companyX = firstArcadeX + arcadePitch * 3;

export const WORLD = {
  heroX: 0,
  nicheSize: NICHE_SIZE,
  /** Slab centres sit on the floor: bottom edge at y = 0. */
  nicheY: NICHE_SIZE / 2,
  /** Four niches of the arcade: hours, leave, calendar, company — abutting the hero and each other. */
  arcadeX: [
    firstArcadeX,
    firstArcadeX + arcadePitch,
    firstArcadeX + arcadePitch * 2,
    companyX,
  ] as const,
  /** Company chapter — Gavit light iwan on the arcade wall. */
  companyArchWidth: 3.2,
  /**
   * Inner hall centre = company iwan X, so the dolly walks straight into depth
   * and every following Gavit arch stays on the same axis.
   */
  hallX: companyX,
  doorWallZ: -6.4,
  hallHalfWidth: 2.7,
  hallArchWidth: 5.0,
  hallArchZ: [-9.6, -13.2, -16.8, -20.4] as const,
  hallEndZ: -24.2,
} as const;

type Keyframe = {
  at: number;
  /** Camera position. `x` is the focus x — the desktop lateral offset is applied separately. */
  cam: Vec3;
  look: Vec3;
  /** Lateral offset (desktop only) so the object sits beside the copy panel instead of under it. */
  off: number;
  dark: number;
  fade: number;
};

const A = WORLD.arcadeX;
/** Vertical centre of the company Gavit light iwan (width / aspect / 2). */
const COMPANY_ARCH_Y = WORLD.companyArchWidth / (437 / 720) / 2;

const KEYFRAMES: Keyframe[] = [
  { at: 0, cam: [0, 1.8, 12.6], look: [0, 2.6, 0], off: 1.4, dark: 0, fade: 0 },
  { at: 0.17, cam: [0, 1.9, 7.0], look: [0, 2.5, 0], off: 1.4, dark: 0.02, fade: 0 },

  { at: 0.245, cam: [A[0], 1.9, 5.4], look: [A[0], 2.35, 0], off: 1.3, dark: 0.03, fade: 0 },
  { at: 0.325, cam: [A[0], 1.9, 5.4], look: [A[0], 2.35, 0], off: 1.3, dark: 0.03, fade: 0 },
  { at: 0.335, cam: [A[1], 1.9, 5.4], look: [A[1], 2.35, 0], off: 1.3, dark: 0.04, fade: 0 },
  { at: 0.415, cam: [A[1], 1.9, 5.4], look: [A[1], 2.35, 0], off: 1.3, dark: 0.04, fade: 0 },
  { at: 0.425, cam: [A[2], 1.9, 5.4], look: [A[2], 2.35, 0], off: 1.3, dark: 0.05, fade: 0 },
  { at: 0.505, cam: [A[2], 1.9, 5.4], look: [A[2], 2.35, 0], off: 1.3, dark: 0.05, fade: 0 },

  // Company — arrive, centre, then dolly straight into the iwan (same X forever after)
  { at: 0.515, cam: [A[3], 2.0, 5.4], look: [A[3], COMPANY_ARCH_Y, 0.2], off: 1.2, dark: 0.07, fade: 0 },
  { at: 0.555, cam: [A[3], 2.15, 4.0], look: [A[3], COMPANY_ARCH_Y, 0.15], off: 0.35, dark: 0.08, fade: 0 },
  { at: 0.595, cam: [A[3], 2.25, 2.8], look: [A[3], COMPANY_ARCH_Y, 0.1], off: 0, dark: 0.1, fade: 0 },
  { at: 0.64, cam: [A[3], 2.35, 1.2], look: [A[3], COMPANY_ARCH_Y, -2.5], off: 0, dark: 0.2, fade: 0 },
  { at: 0.68, cam: [A[3], 2.2, -1.2], look: [A[3], 2.5, -8], off: 0, dark: 0.35, fade: 0.02 },

  // Roles / trust — keep walking the same centre line through the Gavit hall
  { at: 0.72, cam: [A[3], 2.0, -4.5], look: [A[3], 2.4, -12], off: 0, dark: 0.55, fade: 0.04 },
  { at: 0.78, cam: [A[3], 1.75, -8.6], look: [A[3], 2.2, -16], off: 0, dark: 0.7, fade: 0.08 },
  { at: 0.86, cam: [A[3], 1.7, -11.5], look: [A[3], 2.2, -18], off: 0, dark: 0.78, fade: 0.12 },

  { at: 0.91, cam: [A[3], 1.8, -18.2], look: [A[3], 2.3, WORLD.hallEndZ], off: 0, dark: 0.85, fade: 0.18 },
  { at: 1, cam: [A[3], 1.85, -19.6], look: [A[3], 2.3, WORLD.hallEndZ], off: 0, dark: 0.9, fade: 0.62 },
];

function smoothstep(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function clamp01(t: number) {
  return Math.min(1, Math.max(0, t));
}

/** Local progress inside a window, eased. */
export function local(progress: number, start: number, end: number) {
  return smoothstep((progress - start) / (end - start || 1));
}

/** Framerate-independent exponential damping. */
export function damp(current: number, target: number, lambda: number, dt: number) {
  return lerp(current, target, 1 - Math.exp(-lambda * dt));
}

export function samplePath(progress: number, rtl: boolean, compact: boolean): PathSample {
  const p = clamp01(progress);
  let i = 0;
  while (i < KEYFRAMES.length - 1 && KEYFRAMES[i + 1].at < p) i += 1;
  const a = KEYFRAMES[i];
  const b = KEYFRAMES[Math.min(i + 1, KEYFRAMES.length - 1)];
  const t = smoothstep((p - a.at) / (b.at - a.at || 1));
  const s = rtl ? -1 : 1;

  const off = compact ? 0 : lerp(a.off, b.off, t);
  const lookDrop = compact ? 0.55 : 0;
  const zoomOut = compact ? 0.6 : 0;

  const cam: Vec3 = [
    (lerp(a.cam[0], b.cam[0], t) - off) * s,
    lerp(a.cam[1], b.cam[1], t),
    lerp(a.cam[2], b.cam[2], t) + zoomOut,
  ];
  const look: Vec3 = [
    (lerp(a.look[0], b.look[0], t) - off) * s,
    lerp(a.look[1], b.look[1], t) - lookDrop,
    lerp(a.look[2], b.look[2], t),
  ];

  return {
    cam,
    look,
    dark: lerp(a.dark, b.dark, t),
    fade: lerp(a.fade, b.fade, t),
  };
}

/** Opacity of a copy panel for a given window, with a short ease on both ends. */
export function windowOpacity(progress: number, start: number, end: number, ease = 0.035) {
  if (progress < start) return clamp01(1 - (start - progress) / ease);
  if (progress > end) return clamp01(1 - (progress - end) / ease);
  return 1;
}
