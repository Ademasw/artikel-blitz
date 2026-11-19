import type { GameMode, LevelFilter, RuleFilter, WordItem, WordProgress } from '../types/game';
import type { QueueStrategy } from './wordQueue';

export const SURVIVAL_LIVES = 3;
export const SURVIVAL_START_MS = 4000;
export const SURVIVAL_STEP_MS = 60;
export const SURVIVAL_FLOOR_MS = 1700;

export const SPRINT_DURATION_MS = 60_000;
export const SPRINT_PENALTY_MS = 2000;
export const SPRINT_BONUS_MS = 3000;
export const SPRINT_BONUS_EVERY = 10;

/** Лимит карточки в выживании; correctCount — верных ответов в сессии. */
export function survivalCardLimitMs(correctCount: number): number {
  return Math.max(SURVIVAL_FLOOR_MS, SURVIVAL_START_MS - SURVIVAL_STEP_MS * correctCount);
}

/** Бонус спринта: при комбо 10, 20, 30… */
export function sprintBonusEarned(comboAfter: number): boolean {
  return comboAfter > 0 && comboAfter % SPRINT_BONUS_EVERY === 0;
}

export const MODE_STRATEGY: Record<GameMode, QueueStrategy> = {
  survival: 'weighted',
  sprint: 'weighted',
  zen: 'weighted',
  mistakes: 'cover',
  round_review: 'fifo',
};

export const MODE_TITLES: Record<GameMode, string> = {
  survival: 'Выживание',
  sprint: 'Спринт',
  zen: 'Дзен',
  mistakes: 'Разбор завалов',
  round_review: 'Ошибки раунда',
};

export const LEVEL_FILTER_LABELS: Record<LevelFilter, string> = {
  'A1-A2': 'A1–A2',
  'B1-B2': 'B1–B2',
  ALL: 'Все',
};

export const RULE_FILTER_LABELS: Record<RuleFilter, string> = {
  ALL: 'Все',
  suffix: 'Окончания',
  semantic: 'Группы',
  exception: 'Исключения',
};

export function matchesLevel(word: WordItem, filter: LevelFilter): boolean {
  if (filter === 'ALL') return true;
  if (filter === 'A1-A2') return word.level === 'A1' || word.level === 'A2';
  return word.level === 'B1' || word.level === 'B2';
}

export function matchesRule(word: WordItem, filter: RuleFilter): boolean {
  return filter === 'ALL' || word.ruleType === filter;
}

/** Пул слов для режима (§5.1 п.5). round_review получает пул напрямую из итогов. */
export function buildPool(
  mode: Exclude<GameMode, 'round_review'>,
  words: readonly WordItem[],
  progress: Record<string, WordProgress>,
  levelFilter: LevelFilter,
  ruleFilter: RuleFilter,
): WordItem[] {
  if (mode === 'mistakes') return words.filter((w) => progress[w.id]?.isProblematic);
  return words.filter(
    (w) => matchesLevel(w, levelFilter) && (mode !== 'zen' || matchesRule(w, ruleFilter)),
  );
}
