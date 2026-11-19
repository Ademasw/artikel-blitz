import { describe, expect, it } from 'vitest';
import { WORDS } from '../data/words';
import type { WordItem } from '../types/game';
import { CASE_TABLE, buildCaseRound, genitiveNoun, isCaseFriendly, isWeakMasculine } from './cases';

const byWord = (word: string, article?: string) =>
  WORDS.find((w) => w.word === word && (!article || w.article === article)) as WordItem;

function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

describe('падежи', () => {
  it('таблица артиклей', () => {
    expect(CASE_TABLE.akk.der).toBe('den');
    expect(CASE_TABLE.dat.die).toBe('der');
    expect(CASE_TABLE.dat.das).toBe('dem');
    expect(CASE_TABLE.gen.das).toBe('des');
  });

  it('слабое склонение исключено', () => {
    for (const w of ['Student', 'Junge', 'Name', 'Nachbar', 'Mensch', 'Präsident', 'Bär', 'Kollege']) {
      expect(isWeakMasculine(byWord(w)), w).toBe(true);
      expect(isCaseFriendly(byWord(w)), w).toBe(false);
    }
    for (const w of ['Tisch', 'Hund', 'Computer', 'Bahnhof']) expect(isWeakMasculine(byWord(w)), w).toBe(false);
  });

  it('родительный: -s только там, где это надёжно', () => {
    expect(genitiveNoun(byWord('Computer'))).toBe('Computers');
    expect(genitiveNoun(byWord('Fenster'))).toBe('Fensters');
    expect(genitiveNoun(byWord('Zeitung'))).toBe('Zeitung');
    expect(genitiveNoun(byWord('Tisch'))).toBeNull(); // des Tisches
    expect(genitiveNoun(byWord('Haus'))).toBeNull(); // des Hauses
    expect(genitiveNoun(byWord('Ergebnis'))).toBeNull(); // des Ergebnisses
  });

  it('раунд: нужное число заданий, без повторов слов, ответ по таблице', () => {
    const round = buildCaseRound(WORDS, 20, seeded(7));
    expect(round).toHaveLength(20);
    expect(new Set(round.map((t) => t.word.id)).size).toBe(20);
    for (const t of round) {
      expect(t.answer).toBe(CASE_TABLE[t.template.grammarCase][t.word.article]);
      expect(isCaseFriendly(t.word)).toBe(true);
    }
  });

  it('в словаре хватает слов для режима', () => {
    expect(WORDS.filter(isCaseFriendly).length).toBeGreaterThan(400);
  });
});
