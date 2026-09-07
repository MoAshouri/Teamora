export type LandingCopy = {
  brand: string;
  tagline: string;
  headline: string;
  sub: string;
  ctaLogin: string;
  ctaJoin: string;
  ctaRegister: string;
  skip: string;
  hoursTitle: string;
  hoursBody: string;
  leaveTitle: string;
  leaveBody: string;
  calendarTitle: string;
  calendarBody: string;
  companyTitle: string;
  companyBody: string;
  adminTitle: string;
  adminBody: string;
  employeeTitle: string;
  employeeBody: string;
  trustTitle: string;
  trustBody: string;
  sealTitle: string;
  sealBody: string;
  progressLabel: string;
};

export type Vec3 = [number, number, number];

export type PathSample = {
  cam: Vec3;
  look: Vec3;
  /** 0 = Hayat daylight, 1 = Gavit basalt dark. */
  dark: number;
  /** HTML veil opacity over the canvas. */
  fade: number;
};

/** Height of the invisible native scroll track. */
export const STORY_HEIGHT_VH = 760;

/**
 * Scroll windows (0..1) in which each copy panel is visible.
 * The camera holds still inside each window so the reader is never racing the text.
 */
export const WINDOWS = {
  hero: [0, 0.17],
  hours: [0.245, 0.325],
  leave: [0.335, 0.415],
  calendar: [0.425, 0.505],
  company: [0.515, 0.68],
  roles: [0.7, 0.78],
  trust: [0.8, 0.89],
  seal: [0.91, 1.05],
} as const satisfies Record<string, readonly [number, number]>;

export type WindowId = keyof typeof WINDOWS;

/** Progress-dot targets. `copyKey` maps to a `LandingCopy` title used for the aria-label. */
export const CHAPTERS = [
  { id: 'hero', at: 0, copyKey: 'headline' },
  { id: 'hours', at: 0.285, copyKey: 'hoursTitle' },
  { id: 'leave', at: 0.375, copyKey: 'leaveTitle' },
  { id: 'calendar', at: 0.465, copyKey: 'calendarTitle' },
  { id: 'company', at: 0.555, copyKey: 'companyTitle' },
  { id: 'roles', at: 0.74, copyKey: 'adminTitle' },
  { id: 'trust', at: 0.84, copyKey: 'trustTitle' },
  { id: 'seal', at: 0.95, copyKey: 'sealTitle' },
] as const satisfies ReadonlyArray<{ id: string; at: number; copyKey: keyof LandingCopy }>;

export type ChapterId = (typeof CHAPTERS)[number]['id'];
