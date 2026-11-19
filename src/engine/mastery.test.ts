import { describe, expect, it } from 'vitest';
import { applyAnswer, emptyProgress, isReflex } from './mastery';

describe('applyAnswer', () => {
  const base = emptyProgress('w');

  it('быстрый верный ответ: +1', () => {
    expect(applyAnswer(base, true, 1999, 1).mastery).toBe(1);
  });

  it('медленный верный ответ: +0.5', () => {
    expect(applyAnswer(base, true, 2000, 1).mastery).toBe(0.5);
  });

  it('потолок 5', () => {
    expect(applyAnswer({ ...base, mastery: 4.5 }, true, 100, 1).mastery).toBe(5);
  });

  it('первая ошибка: −2 и isProblematic', () => {
    const p = applyAnswer({ ...base, mastery: 3, lastAnswerCorrect: true }, false, 900, 1);
    expect(p.mastery).toBe(1);
    expect(p.isProblematic).toBe(true);
    expect(p.mistakes).toBe(1);
  });

  it('повторная ошибка подряд: сброс в 0', () => {
    const p = applyAnswer({ ...base, mastery: 4, lastAnswerCorrect: false }, false, 900, 1);
    expect(p.mastery).toBe(0);
  });

  it('пол 0', () => {
    expect(applyAnswer({ ...base, mastery: 1 }, false, 1, 1).mastery).toBe(0);
  });

  it('isProblematic снимается при mastery ≥ 3', () => {
    const p = applyAnswer({ ...base, mastery: 2, isProblematic: true }, true, 500, 1);
    expect(p.mastery).toBe(3);
    expect(p.isProblematic).toBe(false);
    const q = applyAnswer({ ...base, mastery: 1.5, isProblematic: true }, true, 500, 1);
    expect(q.isProblematic).toBe(true);
  });

  it('EMA реакции только по верным', () => {
    let p = applyAnswer(base, true, 1000, 1);
    expect(p.avgReactionMs).toBe(1000);
    p = applyAnswer(p, true, 2000, 2);
    expect(p.avgReactionMs).toBeCloseTo(1300);
    p = applyAnswer(p, false, 4000, 3);
    expect(p.avgReactionMs).toBeCloseTo(1300);
    expect(p.attempts).toBe(3);
    expect(p.lastSeenAt).toBe(3);
  });

  it('рефлекс: mastery ≥ 4 и реакция < 1500', () => {
    expect(isReflex({ ...base, mastery: 4, avgReactionMs: 1499 })).toBe(true);
    expect(isReflex({ ...base, mastery: 4, avgReactionMs: 1500 })).toBe(false);
    expect(isReflex({ ...base, mastery: 3.5, avgReactionMs: 800 })).toBe(false);
    expect(isReflex(undefined)).toBe(false);
  });
});
