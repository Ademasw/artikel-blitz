/**
 * Пауза-устойчивый обратный таймер на дельтах монотонного времени.
 * Время передаётся снаружи (performance.now()), поэтому таймер детерминирован в тестах.
 */
export interface CountdownTimer {
  /** Остаток в мс на момент последнего пересчёта. */
  remainingMs: number;
  /** Отметка начала текущего отрезка хода; null, когда таймер на паузе. */
  runningSince: number | null;
}

export function createTimer(durationMs: number, now: number, running = true): CountdownTimer {
  return { remainingMs: durationMs, runningSince: running ? now : null };
}

export function remaining(t: CountdownTimer, now: number): number {
  if (t.runningSince === null) return Math.max(0, t.remainingMs);
  // runningSince может быть в будущем (старт после анимации входа карточки)
  return Math.max(0, t.remainingMs - Math.max(0, now - t.runningSince));
}

export function pauseTimer(t: CountdownTimer, now: number): CountdownTimer {
  if (t.runningSince === null) return t;
  return { remainingMs: remaining(t, now), runningSince: null };
}

/** Отметка «сейчас» для возобновления: не раньше запланированного старта. */
function resumeAt(t: CountdownTimer, now: number): number {
  return t.runningSince === null ? now : Math.max(now, t.runningSince);
}

export function resumeTimer(t: CountdownTimer, now: number): CountdownTimer {
  if (t.runningSince !== null) return t;
  return { remainingMs: t.remainingMs, runningSince: now };
}

/** Добавить (или отнять, если delta < 0) время, не меняя состояния хода. */
export function addTime(t: CountdownTimer, deltaMs: number, now: number): CountdownTimer {
  const rem = Math.max(0, remaining(t, now) + deltaMs);
  return { remainingMs: rem, runningSince: t.runningSince === null ? null : resumeAt(t, now) };
}

export function isRunning(t: CountdownTimer): boolean {
  return t.runningSince !== null;
}
