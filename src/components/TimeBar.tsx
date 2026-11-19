import { useRef } from 'react';
import { remaining, type CountdownTimer } from '../engine/timer';
import { useFrame } from './useFrame';

/** Полоска времени карточки (выживание). Обновляется в rAF напрямую через стиль, без ререндеров. */
export function TimeBar({ timer, totalMs }: { timer: CountdownTimer | null; totalMs: number }) {
  const bar = useRef<HTMLDivElement>(null);
  useFrame((now) => {
    const el = bar.current;
    if (!el || !timer || totalMs <= 0) return;
    const frac = Math.min(1, remaining(timer, now) / totalMs);
    el.style.transform = `scaleX(${frac})`;
    el.style.backgroundColor = frac < 0.15 ? '#ef4444' : frac < 0.3 ? '#f59e0b' : '#cbd5e1';
  });
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2" aria-hidden>
      <div ref={bar} className="h-full w-full origin-left rounded-full bg-slate-300" />
    </div>
  );
}

/** Таймер спринта: секунды с десятыми. */
export function SprintClock({ timer }: { timer: CountdownTimer | null }) {
  const el = useRef<HTMLSpanElement>(null);
  useFrame((now) => {
    if (!el.current || !timer) return;
    const ms = remaining(timer, now);
    el.current.textContent = (ms / 1000).toFixed(1);
    el.current.style.color = ms < 10_000 ? '#f59e0b' : '';
  });
  return (
    <span ref={el} className="tabular-nums">
      60.0
    </span>
  );
}
