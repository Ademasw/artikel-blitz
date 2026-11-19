import { describe, expect, it } from 'vitest';
import type { Article, WordItem } from '../types/game';
import { CARD_ENTER_MS, GameSession, summarize } from './session';
import { remaining } from './timer';

const ARTS: Article[] = ['der', 'die', 'das'];
function words(n: number): WordItem[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `w${i}`,
    word: `Wort${i}`,
    article: ARTS[i % 3]!,
    plural: null,
    translation: 'слово',
    level: 'A1',
    ruleType: 'none',
  }));
}
const wrongFor = (a: Article): Article => (a === 'der' ? 'die' : 'der');

function make(mode: 'survival' | 'sprint' | 'zen' | 'mistakes' | 'round_review', n = 10) {
  const answers: [string, boolean, number][] = [];
  const s = new GameSession(
    { mode, pool: words(n), progress: () => undefined, onAnswer: (...a) => answers.push(a), rng: () => 0.5 },
    0,
  );
  return { s, answers };
}

describe('GameSession: ERROR_LOCK', () => {
  it('ошибка ставит таймер на паузу и выпускает только по правильному артиклю', () => {
    const { s, answers } = make('survival');
    let t = CARD_ENTER_MS + 500;
    const word = s.getSnapshot().current!;
    expect(s.answer(wrongFor(word.article), t).kind).toBe('wrong');
    let snap = s.getSnapshot();
    expect(snap.phase).toBe('error_lock');
    expect(snap.lives).toBe(2);
    const frozen = remaining(snap.timer!, t);
    t += 60_000;
    expect(remaining(s.getSnapshot().timer!, t)).toBe(frozen);
    expect(s.tick(t)).toBeNull(); // таймаут во время lock не срабатывает

    // повторная неверная клавиша: тряска, без штрафа
    expect(s.answer(wrongFor(word.article), t).kind).toBe('lock_wrong');
    snap = s.getSnapshot();
    expect(snap.lives).toBe(2);
    expect(snap.lockShakeSeq).toBe(1);
    expect(snap.current!.id).toBe(word.id);

    expect(s.answer(word.article, t).kind).toBe('lock_release');
    snap = s.getSnapshot();
    expect(snap.phase).toBe('playing');
    expect(snap.current!.id).not.toBe(word.id);
    // закрепление не считается попыткой
    expect(answers).toHaveLength(1);
    expect(answers[0]![1]).toBe(false);
  });

  it('выживание: таймаут = ошибка; последняя жизнь → итоги после закрепления', () => {
    const { s } = make('survival');
    let t = 0;
    for (let life = 3; life >= 1; life--) {
      t += CARD_ENTER_MS + 4001;
      const out = s.tick(t);
      expect(out?.kind).toBe('wrong');
      const snap = s.getSnapshot();
      expect(snap.lockAnswer).toBe('timeout');
      expect(snap.lives).toBe(life - 1);
      const r = s.answer(snap.current!.article, t);
      expect(r.kind).toBe('lock_release');
      if (life === 1) expect(s.getSnapshot().phase).toBe('finished');
      else expect(s.getSnapshot().phase).toBe('playing');
    }
  });

  it('выживание: лимит карточки уменьшается с каждым верным ответом', () => {
    const { s } = make('survival');
    expect(s.getSnapshot().timerTotalMs).toBe(4000);
    s.answer(s.getSnapshot().current!.article, 500);
    expect(s.getSnapshot().timerTotalMs).toBe(3940);
  });
});

describe('GameSession: спринт', () => {
  it('ошибка −2 с и пауза; +3 с за каждые 10 подряд', () => {
    const { s } = make('sprint');
    let t = 1000;
    s.answer(wrongFor(s.getSnapshot().current!.article), t);
    expect(remaining(s.getSnapshot().timer!, t)).toBe(57_000);
    t += 10_000;
    expect(remaining(s.getSnapshot().timer!, t)).toBe(57_000);
    s.answer(s.getSnapshot().current!.article, t); // release
    for (let i = 0; i < 10; i++) {
      t += 100;
      const r = s.answer(s.getSnapshot().current!.article, t);
      if (i === 9) expect(r).toMatchObject({ kind: 'correct', bonusTime: true });
    }
    expect(remaining(s.getSnapshot().timer!, t)).toBe(57_000 - 1000 + 3000);
    expect(s.getSnapshot().bonusSeq).toBe(1);
  });

  it('заканчивается по таймеру', () => {
    const { s } = make('sprint');
    s.tick(60_001);
    expect(s.getSnapshot().phase).toBe('finished');
  });

  it('штраф до нуля: сначала закрепление, потом итоги', () => {
    const { s } = make('sprint');
    const t = 59_000;
    const out = s.answer(wrongFor(s.getSnapshot().current!.article), t);
    expect(out).toEqual({ kind: 'wrong', finishedAfterLock: true });
    expect(s.getSnapshot().phase).toBe('error_lock');
    s.answer(s.getSnapshot().current!.article, t + 5000);
    expect(s.getSnapshot().phase).toBe('finished');
  });
});

describe('GameSession: пауза', () => {
  it('пауза не идёт в таймер и в реакцию', () => {
    const answers: number[] = [];
    const s = new GameSession(
      { mode: 'survival', pool: words(10), progress: () => undefined, onAnswer: (_i, _c, ms) => answers.push(ms) },
      0,
    );
    const start = CARD_ENTER_MS;
    s.pause(start + 300);
    s.resume(start + 10_300);
    expect(remaining(s.getSnapshot().timer!, start + 10_300)).toBe(3700);
    s.answer(s.getSnapshot().current!.article, start + 10_500);
    expect(answers[0]).toBe(500);
  });

  it('во время паузы ввод игнорируется', () => {
    const { s } = make('zen');
    s.pause(0);
    expect(s.answer('der', 10).kind).toBe('ignored');
  });
});

describe('GameSession: конечные режимы и итоги', () => {
  it('round_review завершается, когда все слова отвечены верно', () => {
    const { s } = make('round_review', 3);
    let t = 0;
    s.answer(wrongFor(s.getSnapshot().current!.article), (t += 500));
    s.answer(s.getSnapshot().current!.article, (t += 500));
    let guard = 0;
    while (s.getSnapshot().phase !== 'finished' && guard++ < 20) {
      s.answer(s.getSnapshot().current!.article, (t += 500));
    }
    expect(s.getSnapshot().phase).toBe('finished');
    const sum = summarize(s.getSnapshot());
    expect(sum.cards).toBe(4);
    expect(sum.accuracy).toBeCloseTo(0.75);
    expect(sum.uniqueMistakes).toHaveLength(1);
  });

  it('очки и комбо', () => {
    const { s } = make('zen');
    for (let i = 0; i < 5; i++) s.answer(s.getSnapshot().current!.article, CARD_ENTER_MS * (i + 1) + 800 * (i + 1));
    const snap = s.getSnapshot();
    expect(snap.combo).toBe(5);
    expect(snap.score).toBe(150 * 4 + 300);
  });
});
