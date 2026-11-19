import { describe, expect, it } from 'vitest';
import type { DayStat } from '../types/game';
import { addAnswer, dayKey, daysBefore, lastDays, streak } from './daily';

const today = new Date(2026, 10, 20, 15, 0); // 20 ноября 2026, 15:00 по местному времени

function days(...answers: number[]): Record<string, DayStat> {
  // answers[0] — сегодня, answers[1] — вчера, …
  const out: Record<string, DayStat> = {};
  answers.forEach((a, i) => {
    if (a > 0) out[dayKey(daysBefore(today, i))] = { answers: a, correct: a };
  });
  return out;
}

describe('daily', () => {
  it('dayKey: локальная дата', () => {
    expect(dayKey(today)).toBe('2026-11-20');
    expect(dayKey(daysBefore(today, 20))).toBe('2026-10-31');
    expect(dayKey(daysBefore(new Date(2026, 2, 1), 1))).toBe('2026-02-28');
  });

  it('addAnswer копит ответы дня', () => {
    let d = addAnswer({}, '2026-11-20', true);
    d = addAnswer(d, '2026-11-20', false);
    expect(d['2026-11-20']).toEqual({ answers: 2, correct: 1 });
  });

  it('серия: сегодня цель ещё не выполнена — серия от вчера не обрывается', () => {
    expect(streak(days(10, 50, 60, 55), 50, today)).toBe(3);
  });

  it('серия: сегодня выполнена — считается вместе с сегодня', () => {
    expect(streak(days(50, 50, 60), 50, today)).toBe(3);
  });

  it('серия: пропущенный день обрывает', () => {
    expect(streak(days(50, 0, 60, 70), 50, today)).toBe(1);
    expect(streak(days(0, 0, 60), 50, today)).toBe(0);
  });

  it('lastDays: последние n дней, сегодня в конце', () => {
    const cells = lastDays(days(5, 0, 70), 3, 50, today);
    expect(cells.map((c) => c.key)).toEqual(['2026-11-18', '2026-11-19', '2026-11-20']);
    expect(cells.map((c) => c.goalMet)).toEqual([true, false, false]);
    expect(cells[2]!.answers).toBe(5);
  });
});
