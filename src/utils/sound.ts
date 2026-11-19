/** Процедурный звук на Web Audio API, без внешних файлов. */
let ctx: AudioContext | null = null;
let enabled = true;

export function setSoundEnabled(v: boolean): void {
  enabled = v;
}

/** Вызывать из обработчика действия пользователя: браузеры разрешают звук только после жеста. */
export function unlockAudio(): void {
  if (!enabled) return;
  try {
    if (!ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      ctx = new Ctor();
    }
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    ctx = null;
  }
}

interface Note {
  freq: number;
  start?: number;
  duration?: number;
  type?: OscillatorType;
  gain?: number;
}

function play(notes: Note[]): void {
  if (!enabled) return;
  unlockAudio();
  if (!ctx) return;
  try {
    const t0 = ctx.currentTime + 0.005;
    for (const n of notes) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      const start = t0 + (n.start ?? 0);
      const dur = n.duration ?? 0.09;
      osc.type = n.type ?? 'sine';
      osc.frequency.setValueAtTime(n.freq, start);
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(n.gain ?? 0.16, start + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      osc.connect(g).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + dur + 0.02);
    }
  } catch {
    // звук не критичен для игры
  }
}

/** Верный ответ: тон растёт с комбо (кап на 15+). В Fever звук ярче. */
export function playCorrect(combo: number, fever: boolean): void {
  const freq = 660 * Math.pow(2, Math.min(combo, 15) / 24);
  play(
    fever
      ? [
          { freq, type: 'triangle', duration: 0.1, gain: 0.16 },
          { freq: freq * 2, duration: 0.08, gain: 0.06 },
        ]
      : [{ freq, duration: 0.08, gain: 0.16 }],
  );
}

/** Ошибка или таймаут: мягкий низкий двойной тон. */
export function playError(): void {
  play([
    { freq: 220, duration: 0.14, gain: 0.16 },
    { freq: 185, start: 0.13, duration: 0.18, gain: 0.14 },
  ]);
}

/** Бонус времени / вход в Fever: восходящий аккорд. */
export function playBonus(): void {
  play(
    [523.25, 659.25, 783.99].map((freq, i) => ({
      freq,
      start: i * 0.05,
      duration: 0.16,
      type: 'triangle' as const,
      gain: 0.12,
    })),
  );
}

/** Новый рекорд: победная отбивка. */
export function playRecord(): void {
  play(
    [523.25, 659.25, 783.99, 1046.5].map((freq, i) => ({
      freq,
      start: i * 0.09,
      duration: i === 3 ? 0.35 : 0.12,
      type: 'triangle' as const,
      gain: 0.14,
    })),
  );
}

/** Неверная клавиша во время закрепления: короткий тихий тик. */
export function playNudge(): void {
  play([{ freq: 150, duration: 0.05, gain: 0.08 }]);
}
