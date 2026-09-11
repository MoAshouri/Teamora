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
  const overtime = policy?.overtimeAfterMinutes;
  const daily = policy?.dailyMinutes;
  const minutes = overtime && overtime > 0 ? overtime : daily ?? 480;
  // #region agent log
  if (overtime === 0) {
    fetch('http://127.0.0.1:7869/ingest/c694b7eb-dcc2-4100-9c19-d4aca06d483e',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a506d6'},body:JSON.stringify({sessionId:'a506d6',runId:'post-fix',hypothesisId:'I',location:'day-timer-math.ts:thresholdSeconds',message:'overtime 0 uses daily minutes',data:{overtime,daily,minutes,seconds:Math.max(1,minutes)*60},timestamp:Date.now()})}).catch(()=>{});
  }
  // #endregion
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
