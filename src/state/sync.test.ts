import { describe, expect, it } from 'vitest';
import { emptyProgress } from '../engine/mastery';
import type { PersistedState } from '../types/game';
import { defaultState } from './persistence';
import { buildExport, decodeImport, encodeCode, ImportError, mergeStates } from './sync';

function state(patch: Partial<PersistedState>): PersistedState {
  return { ...defaultState(), ...patch };
}

describe('перенос прогресса', () => {
  it('объединение: свежая запись слова побеждает, рекорды — максимум, настройки локальные', () => {
    const local = state({
      progress: {
        a: { ...emptyProgress('a'), mastery: 4, attempts: 9, lastSeenAt: 200 },
        b: { ...emptyProgress('b'), mastery: 1, attempts: 2, lastSeenAt: 100 },
      },
      highScores: { survival: 5000, sprint: 100 },
      daily: { '2026-11-20': { answers: 30, correct: 25 } },
    });
    local.settings.dailyGoal = 100;
    const incoming = state({
      progress: {
        a: { ...emptyProgress('a'), mastery: 0, attempts: 3, lastSeenAt: 150 },
        b: { ...emptyProgress('b'), mastery: 3, attempts: 5, lastSeenAt: 300 },
        c: { ...emptyProgress('c'), mastery: 2, attempts: 1, lastSeenAt: 50 },
      },
      highScores: { survival: 10, sprint: 900 },
      daily: { '2026-11-20': { answers: 10, correct: 10 }, '2026-11-19': { answers: 60, correct: 50 } },
    });
    const { state: m, wordsUpdated } = mergeStates(local, incoming);
    expect(m.progress.a!.mastery).toBe(4);
    expect(m.progress.b!.mastery).toBe(3);
    expect(m.progress.c!.mastery).toBe(2);
    expect(wordsUpdated).toBe(2);
    expect(m.highScores).toEqual({ survival: 5000, sprint: 900 });
    expect(m.daily['2026-11-20']).toEqual({ answers: 30, correct: 25 });
    expect(m.daily['2026-11-19']).toEqual({ answers: 60, correct: 50 });
    expect(m.settings.dailyGoal).toBe(100);
  });

  it('повторный импорт ничего не меняет', () => {
    const a = state({ progress: { x: { ...emptyProgress('x'), attempts: 2, lastSeenAt: 5 } } });
    const once = mergeStates(defaultState(), a).state;
    const twice = mergeStates(once, a);
    expect(twice.wordsUpdated).toBe(0);
    expect(twice.state).toEqual(once);
  });

  it('код: туда-обратно', async () => {
    const s = state({
      progress: { haus: { ...emptyProgress('haus'), mastery: 3.5, attempts: 7, lastSeenAt: 123, avgReactionMs: 900 } },
      highScores: { survival: 42, sprint: 7 },
      cases: { nom: { attempts: 1, correct: 1 }, akk: { attempts: 5, correct: 4 }, dat: { attempts: 0, correct: 0 }, gen: { attempts: 2, correct: 0 } },
    });
    const code = await encodeCode(buildExport(s));
    expect(code.startsWith('AB1.') || code.startsWith('AB0.')).toBe(true);
    const back = await decodeImport(`  ${code.slice(0, 10)}\n${code.slice(10)}  `);
    expect(back.progress.haus).toEqual(s.progress.haus);
    expect(back.highScores).toEqual(s.highScores);
    expect(back.cases).toEqual(s.cases);
  });

  it('JSON-файл тоже принимается; непрошенные слова без попыток не экспортируются', async () => {
    const s = state({ progress: { a: emptyProgress('a'), b: { ...emptyProgress('b'), attempts: 1 } } });
    const file = buildExport(s);
    expect(Object.keys(file.progress)).toEqual(['b']);
    const back = await decodeImport(JSON.stringify(file));
    expect(Object.keys(back.progress)).toEqual(['b']);
  });

  it('мусор → понятная ошибка', async () => {
    await expect(decodeImport('привет')).rejects.toBeInstanceOf(ImportError);
    await expect(decodeImport('{"version":1}')).rejects.toBeInstanceOf(ImportError);
    await expect(decodeImport('AB1.@@@')).rejects.toBeInstanceOf(ImportError);
  });
});
