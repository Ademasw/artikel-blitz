import { describe, expect, it } from 'vitest';
import type { WordItem, WordProgress } from '../types/game';
import { emptyProgress } from './mastery';
import { levelBreakdown, ruleGroups, stageOf } from './stats';

const w = (id: string, patch: Partial<WordItem>): WordItem => ({
  id,
  word: id,
  article: 'die',
  plural: null,
  translation: '—',
  level: 'A1',
  ruleType: 'none',
  ...patch,
});

const p = (id: string, patch: Partial<WordProgress>): WordProgress => ({ ...emptyProgress(id), ...patch });

describe('статистика', () => {
  it('стадии слова', () => {
    expect(stageOf(undefined)).toBe('new');
    expect(stageOf(p('a', { attempts: 2, mastery: 1 }))).toBe('learning');
    expect(stageOf(p('a', { attempts: 2, mastery: 2.5 }))).toBe('good');
    expect(stageOf(p('a', { attempts: 6, mastery: 5 }))).toBe('mastered');
  });

  it('разбивка по уровням', () => {
    const words = [w('a', {}), w('b', {}), w('c', { level: 'B2' })];
    const [a1, , , b2] = levelBreakdown(words, { a: p('a', { attempts: 3, mastery: 5, avgReactionMs: 900 }) });
    expect(a1).toMatchObject({ total: 2, reflex: 1, stages: { new: 1, mastered: 1 } });
    expect(b2!.total).toBe(1);
  });

  it('правила: сортировка по доле ошибок, мало ответов — не ранжируется', () => {
    const words = [
      w('wohnung', { ruleType: 'suffix', highlight: 'ung' }),
      w('zeitung', { ruleType: 'suffix', highlight: 'ung' }),
      w('kaese', { article: 'der', ruleType: 'exception' }),
      w('tisch', { article: 'der' }),
    ];
    const groups = ruleGroups(words, {
      wohnung: p('wohnung', { attempts: 5, mistakes: 1 }),
      zeitung: p('zeitung', { attempts: 5, mistakes: 0 }),
      kaese: p('kaese', { attempts: 6, mistakes: 4 }),
      tisch: p('tisch', { attempts: 2, mistakes: 2 }),
    });
    expect(groups.map((g) => g.label)).toEqual(['Исключения из правил', '-ung → die']);
    expect(groups[1]!.errorRate).toBeCloseTo(0.1);
    expect(groups[1]!.words).toHaveLength(2);
  });
});
