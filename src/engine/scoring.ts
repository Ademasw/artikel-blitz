export const BASE_POINTS = 100;
export const FEVER_COMBO = 25;

export function comboMultiplier(combo: number): number {
  if (combo >= FEVER_COMBO) return 4;
  if (combo >= 15) return 3;
  if (combo >= 5) return 2;
  return 1;
}

export function isFever(combo: number): boolean {
  return combo >= FEVER_COMBO;
}

/** До +50 при ≤1000 мс, линейно до 0 к 2500 мс. */
export function speedBonus(reactionMs: number): number {
  if (reactionMs <= 1000) return 50;
  if (reactionMs >= 2500) return 0;
  return (50 * (2500 - reactionMs)) / 1500;
}

/** comboAfter: значение комбо уже с учётом текущего верного ответа. */
export function scoreFor(reactionMs: number, comboAfter: number): number {
  return Math.round((BASE_POINTS + speedBonus(reactionMs)) * comboMultiplier(comboAfter));
}
