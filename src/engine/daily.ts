import type { DayStat } from '../types/game';

/** Локальная дата YYYY-MM-DD: «день» начинается в полночь по часам игрока. */
export function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Дата на n дней раньше (n может быть 0). Через setDate, чтобы не ломаться на переводе часов. */
export function daysBefore(date: Date, n: number): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - n);
  return d;
}

export function addAnswer(daily: Record<string, DayStat>, key: string, correct: boolean): Record<string, DayStat> {
  const prev = daily[key] ?? { answers: 0, correct: 0 };
  return { ...daily, [key]: { answers: prev.answers + 1, correct: prev.correct + (correct ? 1 : 0) } };
}

function met(daily: Record<string, DayStat>, key: string, goal: number): boolean {
  return (daily[key]?.answers ?? 0) >= goal;
}

/**
 * Серия: сколько дней подряд выполнена цель.
 * Сегодняшний день ещё не закончился, поэтому серия не обрывается, пока цель сегодня не выполнена:
 * считаем от вчера, а сегодня добавляем, только если цель уже выполнена.
 */
export function streak(daily: Record<string, DayStat>, goal: number, today: Date): number {
  let n = met(daily, dayKey(today), goal) ? 1 : 0;
  for (let i = 1; i < 10_000; i++) {
    if (!met(daily, dayKey(daysBefore(today, i)), goal)) break;
    n++;
  }
  return n;
}

export interface DayCell {
  key: string;
  date: Date;
  answers: number;
  correct: number;
  goalMet: boolean;
}

/** Последние n дней, от старых к новым (последний — сегодня). */
export function lastDays(daily: Record<string, DayStat>, n: number, goal: number, today: Date): DayCell[] {
  return Array.from({ length: n }, (_, i) => {
    const date = daysBefore(today, n - 1 - i);
    const key = dayKey(date);
    const s = daily[key] ?? { answers: 0, correct: 0 };
    return { key, date, answers: s.answers, correct: s.correct, goalMet: s.answers >= goal };
  });
}
