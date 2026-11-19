import type { Level, WordItem, WordProgress } from '../types/game';
import { isReflex } from './mastery';

export type MasteryStage = 'new' | 'learning' | 'good' | 'mastered';

export function stageOf(p: WordProgress | undefined): MasteryStage {
  if (!p || p.attempts === 0) return 'new';
  if (p.mastery >= 4) return 'mastered';
  if (p.mastery >= 2) return 'good';
  return 'learning';
}

export interface LevelBreakdown {
  level: Level;
  total: number;
  stages: Record<MasteryStage, number>;
  reflex: number;
}

export function levelBreakdown(words: readonly WordItem[], progress: Record<string, WordProgress>): LevelBreakdown[] {
  const levels: Level[] = ['A1', 'A2', 'B1', 'B2'];
  return levels.map((level) => {
    const inLevel = words.filter((w) => w.level === level);
    const stages: Record<MasteryStage, number> = { new: 0, learning: 0, good: 0, mastered: 0 };
    let reflex = 0;
    for (const w of inLevel) {
      const p = progress[w.id];
      stages[stageOf(p)]++;
      if (isReflex(p)) reflex++;
    }
    return { level, total: inLevel.length, stages, reflex };
  });
}

export interface RuleGroup {
  key: string;
  /** Как правило звучит для игрока: «-ung → die», «Дни недели → der», «Исключения». */
  label: string;
  words: WordItem[];
  attempts: number;
  mistakes: number;
  errorRate: number;
}

function groupOf(w: WordItem): { key: string; label: string } {
  switch (w.ruleType) {
    case 'suffix':
      return { key: `sfx:${w.article}:${w.highlight}`, label: `-${w.highlight} → ${w.article}` };
    case 'semantic':
      return { key: `sem:${w.ruleHint}`, label: w.ruleHint ?? 'Смысловая группа' };
    case 'exception':
      return { key: 'exception', label: 'Исключения из правил' };
    default:
      return { key: 'none', label: 'Слова без правила' };
  }
}

/** Правила, отсортированные от самых «больных»; группы с малым числом ответов не ранжируются. */
export function ruleGroups(
  words: readonly WordItem[],
  progress: Record<string, WordProgress>,
  minAttempts = 5,
): RuleGroup[] {
  const map = new Map<string, RuleGroup>();
  for (const w of words) {
    const { key, label } = groupOf(w);
    const g = map.get(key) ?? { key, label, words: [], attempts: 0, mistakes: 0, errorRate: 0 };
    g.words.push(w);
    const p = progress[w.id];
    if (p) {
      g.attempts += p.attempts;
      g.mistakes += p.mistakes;
    }
    map.set(key, g);
  }
  return [...map.values()]
    .filter((g) => g.attempts >= minAttempts)
    .map((g) => ({ ...g, errorRate: g.mistakes / g.attempts }))
    .sort((a, b) => b.errorRate - a.errorRate || b.attempts - a.attempts);
}
