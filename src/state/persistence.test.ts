import { describe, expect, it } from 'vitest';
import { defaultState, parseState } from './persistence';

describe('parseState', () => {
  it('пусто или битый JSON → значения по умолчанию', () => {
    expect(parseState(null)).toEqual(defaultState());
    expect(parseState('{oops')).toEqual(defaultState());
    expect(parseState('{"version":2}')).toEqual(defaultState());
  });

  it('сохраняет корректные данные и чинит некорректные поля', () => {
    const raw = JSON.stringify({
      version: 1,
      progress: {
        a: { mastery: 9, attempts: 3, mistakes: 1, avgReactionMs: 900, lastSeenAt: 5, isProblematic: true },
        b: 'x',
      },
      settings: { soundEnabled: false, keyPreset: 'WASD' },
      highScores: { survival: 1200, sprint: 'x' },
      levelFilter: 'B1-B2',
    });
    const s = parseState(raw);
    expect(s.progress.a).toMatchObject({
      wordId: 'a',
      mastery: 5,
      avgReactionMs: 900,
      isProblematic: true,
      lastAnswerCorrect: null,
    });
    expect(s.progress.b).toBeUndefined();
    expect(s.settings).toEqual({
      soundEnabled: false,
      showTranslationBeforeAnswer: false,
      keyPreset: 'ASD',
      dailyGoal: 50,
      speech: 'mistakes',
    });
    expect(s.highScores).toEqual({ survival: 1200, sprint: 0 });
    expect(s.levelFilter).toBe('B1-B2');
  });

  it('туда-обратно без потерь', () => {
    const s = defaultState();
    s.highScores.sprint = 4200;
    s.settings.keyPreset = 'ARROWS';
    expect(parseState(JSON.stringify(s))).toEqual(s);
  });

  it('старое сохранение без daily / cases / новых настроек читается', () => {
    const s = parseState(JSON.stringify({ version: 1, progress: {}, settings: { soundEnabled: true } }));
    expect(s.daily).toEqual({});
    expect(s.cases.dat).toEqual({ attempts: 0, correct: 0 });
    expect(s.settings.dailyGoal).toBe(50);
    expect(s.settings.speech).toBe('mistakes');
  });

  it('daily: битые ключи отбрасываются, correct не больше answers', () => {
    const s = parseState(
      JSON.stringify({
        version: 1,
        daily: { '2026-11-20': { answers: 10, correct: 99 }, 'вчера': { answers: 5 }, '2026-11-19': 'x' },
        cases: { akk: { attempts: 4, correct: 3 }, gen: 'x' },
        settings: { dailyGoal: 7, speech: 'loud' },
      }),
    );
    expect(s.daily).toEqual({ '2026-11-20': { answers: 10, correct: 10 } });
    expect(s.cases.akk).toEqual({ attempts: 4, correct: 3 });
    expect(s.cases.gen).toEqual({ attempts: 0, correct: 0 });
    expect(s.settings.dailyGoal).toBe(50);
    expect(s.settings.speech).toBe('mistakes');
  });
});
