import { useRef } from 'react';
import { remaining, type CountdownTimer } from '../engine/timer';
import { useFrame } from './useFrame';

/** Полоска времени карточки (выживание): меловая черта, к концу желтеет и краснеет. */
export function TimeBar({ timer, totalMs }: { timer: CountdownTimer | null; totalMs: number }) {
  const bar = useRef<HTMLDivElement>(null);
  useFrame((now) => {
    const el = bar.current;
    if (!el || !timer || totalMs <= 0) return;
    const frac = Math.min(1, remaining(timer, now) / totalMs);
    el.style.transform = `scaleX(${frac})`;
    el.style.backgroundColor = frac < 0.15 ? '#e2564a' : frac < 0.3 ? '#f0c649' : '#edf0ea';
  });
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink/10" aria-hidden>
      <div ref={bar} className="h-full w-full origin-left rounded-full bg-ink" />
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
    el.current.style.color = ms < 10_000 ? '#f0c649' : '';
  });
  return (
    <span ref={el} className="tabular-nums">
      60.0
    </span>
  );
}
