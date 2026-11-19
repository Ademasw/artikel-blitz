import { describe, expect, it } from 'vitest';
import { addTime, createTimer, pauseTimer, remaining, resumeTimer } from './timer';

describe('timer', () => {
  it('считает по дельтам', () => {
    const t = createTimer(1000, 100);
    expect(remaining(t, 400)).toBe(700);
    expect(remaining(t, 5000)).toBe(0);
  });

  it('пауза замораживает остаток, без дрейфа', () => {
    let t = createTimer(1000, 0);
    t = pauseTimer(t, 300);
    expect(remaining(t, 99_999)).toBe(700);
    t = pauseTimer(t, 500); // повторная пауза не меняет ничего
    expect(remaining(t, 0)).toBe(700);
    t = resumeTimer(t, 10_000);
    expect(remaining(t, 10_200)).toBe(500);
    t = resumeTimer(t, 10_300); // повторный resume не сбрасывает отсчёт
    expect(remaining(t, 10_300)).toBe(400);
  });

  it('штраф и бонус', () => {
    let t = createTimer(5000, 0);
    t = addTime(t, -2000, 1000);
    expect(remaining(t, 1000)).toBe(2000);
    t = addTime(t, 3000, 1500);
    expect(remaining(t, 1500)).toBe(4500);
    t = addTime(pauseTimer(t, 1500), -9000, 2000);
    expect(remaining(t, 3000)).toBe(0);
  });
});

describe('timer: отложенный старт', () => {
  it('не тикает до runningSince', () => {
    const t = createTimer(1000, 500);
    expect(remaining(t, 100)).toBe(1000);
    expect(remaining(t, 700)).toBe(800);
  });
});
