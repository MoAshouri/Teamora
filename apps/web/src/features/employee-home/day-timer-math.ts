export type WorkDayMode = 'idle' | 'countdown' | 'overtime';

export type WorkDayClock = {
  mode: WorkDayMode;
  seconds: number;
  progress: number;
  text: string;
};

export function formatHms(totalSec: number) {
  const s = Math.max(0, Math.floor(totalSec));
  const hh = String(Math.floor(s / 3600)).padStart(2, '0');
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

export function thresholdSeconds(policy: {
  dailyMinutes?: number;
  overtimeAfterMinutes?: number;
} | null) {
  const minutes = policy?.overtimeAfterMinutes ?? policy?.dailyMinutes ?? 480;
  return Math.max(1, minutes) * 60;
}

export function workDayClock(elapsedSec: number | null, thresholdSec: number): WorkDayClock {
  const max = Math.max(1, thresholdSec);
  if (elapsedSec == null) {
    return { mode: 'idle', seconds: max, progress: 1, text: formatHms(max) };
  }
  const elapsed = Math.max(0, Math.floor(elapsedSec));
  if (elapsed >= max) {
    const over = elapsed - max;
    return { mode: 'overtime', seconds: over, progress: 0, text: `+${formatHms(over)}` };
  }
  const remaining = max - elapsed;
  return {
    mode: 'countdown',
    seconds: remaining,
    progress: remaining / max,
    text: formatHms(remaining),
  };
}
