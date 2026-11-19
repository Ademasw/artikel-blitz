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
    soft: 'bg-der/15',
    hex: '#3b82f6',
  },
  die: {
    label: 'die',
    gender: 'женский',
    text: 'text-die',
    bg: 'bg-die',
    border: 'border-die',
    soft: 'bg-die/15',
    hex: '#f43f5e',
  },
  das: {
    label: 'das',
    gender: 'средний',
    text: 'text-das',
    bg: 'bg-das',
    border: 'border-das',
    soft: 'bg-das/15',
    hex: '#10b981',
  },
};

/** Направление вылета/свайпа: совпадает с позицией кнопки. */
export const ART_DIRECTION: Record<Article, { x: number; y: number }> = {
  der: { x: -1, y: 0 },
  die: { x: 0, y: -1 },
  das: { x: 1, y: 0 },
};
