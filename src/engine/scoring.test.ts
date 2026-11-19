import { describe, expect, it } from 'vitest';
import { comboMultiplier, isFever, scoreFor, speedBonus } from './scoring';
import { sprintBonusEarned, survivalCardLimitMs } from './modes';

describe('scoring', () => {
  it('множитель комбо', () => {
    expect([0, 4, 5, 14, 15, 24, 25, 99].map(comboMultiplier)).toEqual([1, 1, 2, 2, 3, 3, 4, 4]);
    expect(isFever(24)).toBe(false);
    expect(isFever(25)).toBe(true);
  });

  it('бонус скорости линейный 1000→2500', () => {
    expect(speedBonus(500)).toBe(50);
    expect(speedBonus(1000)).toBe(50);
    expect(speedBonus(1750)).toBe(25);
    expect(speedBonus(2500)).toBe(0);
    expect(speedBonus(4000)).toBe(0);
  });

  it('очки = (100 + бонус) × множитель', () => {
    expect(scoreFor(800, 1)).toBe(150);
    expect(scoreFor(1750, 5)).toBe(250);
    expect(scoreFor(3000, 25)).toBe(400);
  });
});

describe('modes', () => {
  it('лимит выживания 4.0 → пол 1.7', () => {
    expect(survivalCardLimitMs(0)).toBe(4000);
    expect(survivalCardLimitMs(10)).toBe(3400);
    expect(survivalCardLimitMs(1000)).toBe(1700);
  });

  it('бонус спринта каждые 10 подряд', () => {
    expect(sprintBonusEarned(0)).toBe(false);
    expect(sprintBonusEarned(9)).toBe(false);
    expect(sprintBonusEarned(10)).toBe(true);
    expect(sprintBonusEarned(20)).toBe(true);
  });
});
