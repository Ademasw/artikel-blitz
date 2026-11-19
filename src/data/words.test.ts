import { describe, expect, it } from 'vitest';
import type { Article, Level } from '../types/game';
import { WORDS } from './words';

const REQUIRED_SUFFIXES: Record<Article, string[]> = {
  der: ['ling', 'ismus', 'or', 'ant', 'ist', 'ich', 'ig'],
  die: ['ung', 'heit', 'keit', 'schaft', 'tion', 'tät', 'ik', 'ei', 'in', 'e'],
  das: ['chen', 'lein', 'ment', 'um', 'tum', 'nis'],
};

const HOMONYMS = [
  ['see-m', 'see-f'],
  ['teil-m', 'teil-n'],
  ['leiter-m', 'leiter-f'],
  ['band-m', 'band-n'],
];

describe('словарь', () => {
  it('размер 200–220', () => {
    expect(WORDS.length).toBeGreaterThanOrEqual(200);
    expect(WORDS.length).toBeLessThanOrEqual(220);
  });

  it('уникальные id', () => {
    const ids = WORDS.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('пары (слово, артикль) не повторяются', () => {
    const keys = WORDS.map((w) => `${w.article} ${w.word}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('highlight совпадает с концом слова', () => {
    for (const w of WORDS) {
      if (w.highlight) expect(w.word.endsWith(w.highlight), w.word).toBe(true);
      if (w.ruleType === 'suffix') expect(w.highlight, w.word).toBeTruthy();
    }
  });

  it('слова с заглавной буквы, перевод не пустой', () => {
    for (const w of WORDS) {
      expect(w.word[0], w.word).toBe(w.word[0]!.toUpperCase());
      expect(w.translation.trim().length, w.word).toBeGreaterThan(0);
      if (w.plural !== null) expect(w.plural.length, w.word).toBeGreaterThan(0);
    }
  });

  it('у исключений и групп есть пояснение', () => {
    for (const w of WORDS) {
      if (w.ruleType !== 'none') expect(w.ruleHint, w.word).toBeTruthy();
    }
  });

  it('доля каждого артикля 30–36 %', () => {
    for (const a of ['der', 'die', 'das'] as Article[]) {
      const share = WORDS.filter((w) => w.article === a).length / WORDS.length;
      expect(share, a).toBeGreaterThanOrEqual(0.3);
      expect(share, a).toBeLessThanOrEqual(0.36);
    }
  });

  it('доля каждого уровня ≥ 20 %', () => {
    for (const l of ['A1', 'A2', 'B1', 'B2'] as Level[]) {
      const share = WORDS.filter((w) => w.level === l).length / WORDS.length;
      expect(share, l).toBeGreaterThanOrEqual(0.2);
    }
  });

  it('все суффиксы из ТЗ покрыты', () => {
    for (const [article, list] of Object.entries(REQUIRED_SUFFIXES)) {
      for (const s of list) {
        const found = WORDS.some((w) => w.article === article && w.ruleType === 'suffix' && w.highlight === s);
        expect(found, `${article} -${s}`).toBe(true);
      }
    }
  });

  it('омонимы на месте и всегда показывают перевод', () => {
    const byId = new Map(WORDS.map((w) => [w.id, w]));
    for (const pair of HOMONYMS) {
      const [a, b] = pair.map((id) => byId.get(id));
      expect(a, pair[0]).toBeDefined();
      expect(b, pair[1]).toBeDefined();
      expect(a!.word).toBe(b!.word);
      expect(a!.article).not.toBe(b!.article);
      expect(a!.translation).not.toBe(b!.translation);
      expect(a!.alwaysShowTranslation && b!.alwaysShowTranslation).toBe(true);
    }
    // любое слово, у которого есть «двойник» с другим артиклем, обязано быть помечено
    for (const w of WORDS) {
      const twins = WORDS.filter((o) => o.word === w.word);
      if (twins.length > 1) expect(w.alwaysShowTranslation, w.id).toBe(true);
    }
  });

  it('das Mädchen размечено по правилу -chen', () => {
    const m = WORDS.find((w) => w.word === 'Mädchen')!;
    expect(m.ruleType).toBe('suffix');
    expect(m.highlight).toBe('chen');
  });
});
