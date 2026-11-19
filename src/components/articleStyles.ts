import type { Article } from '../types/game';

/** Полные имена классов (Tailwind не видит динамически собранные строки). */
export const ART: Record<
  Article,
  { label: string; gender: string; text: string; bg: string; border: string; soft: string; hex: string }
> = {
  der: {
    label: 'der',
    gender: 'мужской',
    text: 'text-der',
    bg: 'bg-der',
    border: 'border-der',
    soft: 'bg-der/10',
    hex: '#2f5ad8',
  },
  die: {
    label: 'die',
    gender: 'женский',
    text: 'text-die',
    bg: 'bg-die',
    border: 'border-die',
    soft: 'bg-die/10',
    hex: '#d7382b',
  },
  das: {
    label: 'das',
    gender: 'средний',
    text: 'text-das',
    bg: 'bg-das',
    border: 'border-das',
    soft: 'bg-das/10',
    hex: '#148a52',
  },
};

/** Цвет текста артикля на тёмной доске: чуть светлее, чтобы читался. */
export const ART_ON_BOARD: Record<Article, string> = {
  der: 'text-[#7d9bf0]',
  die: 'text-[#f07b6f]',
  das: 'text-[#4cc488]',
};

/** Направление вылета/свайпа: совпадает с позицией кнопки. */
export const ART_DIRECTION: Record<Article, { x: number; y: number }> = {
  der: { x: -1, y: 0 },
  die: { x: 0, y: -1 },
  das: { x: 1, y: 0 },
};
