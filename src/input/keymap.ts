import type { Article, KeyPreset } from '../types/game';

/** Только event.code: не зависит от раскладки ОС. Оба пресета активны всегда. */
const CODE_TO_ARTICLE: Record<string, Article> = {
  KeyA: 'der',
  KeyS: 'die',
  KeyD: 'das',
  ArrowLeft: 'der',
  ArrowDown: 'die',
  ArrowUp: 'die',
  ArrowRight: 'das',
};

export function articleForCode(code: string): Article | null {
  return CODE_TO_ARTICLE[code] ?? null;
}

export const KEY_HINTS: Record<KeyPreset, Record<Article, string>> = {
  ASD: { der: 'A', die: 'S', das: 'D' },
  ARROWS: { der: '←', die: '↓', das: '→' },
};
