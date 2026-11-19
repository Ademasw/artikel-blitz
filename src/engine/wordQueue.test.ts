import { describe, expect, it } from 'vitest';
import type { WordItem, WordProgress } from '../types/game';
import { emptyProgress } from './mastery';
import { WordQueue, bucketOf } from './wordQueue';

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function words(n: number): WordItem[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `w${i}`,
    word: `Wort${i}`,
    article: 'das',
    plural: null,
    translation: 'слово',
    level: 'A1',
    ruleType: 'none',
  }));
}

const noProgress = () => undefined;

function gapsBetweenRepeats(seq: string[]): number[] {
  const last = new Map<string, number>();
  const gaps: number[] = [];
  seq.forEach((id, i) => {
    const prev = last.get(id);
    if (prev !== undefined) gaps.push(i - prev - 1);
    last.set(id, i);
  });
  return gaps;
}

describe('WordQueue: защита от повторов', () => {
  it.each([4, 5, 10, 50])('пул %i: минимум 2 других карточки между повторами', (n) => {
    const q = new WordQueue(words(n), 'weighted', noProgress, mulberry32(n));
    const rng = mulberry32(99);
    const seq: string[] = [];
    for (let i = 0; i < 3000; i++) {
      const w = q.next(i)!;
      seq.push(w.id);
      q.report(w.id, rng() > 0.3);
    }
    expect(Math.min(...gapsBetweenRepeats(seq))).toBeGreaterThanOrEqual(2);
  });

  it.each([2, 3])('пул %i: никогда дважды подряд', (n) => {
    const q = new WordQueue(words(n), 'weighted', noProgress, mulberry32(7));
    const seq: string[] = [];
    for (let i = 0; i < 500; i++) {
      const w = q.next(i)!;
      seq.push(w.id);
      q.report(w.id, i % 3 !== 0);
    }
    expect(Math.min(...gapsBetweenRepeats(seq))).toBeGreaterThanOrEqual(1);
  });

  it('пул из 1 слова: повтор разрешён', () => {
    const q = new WordQueue(words(1), 'weighted', noProgress, mulberry32(1));
    expect(q.next(0)?.id).toBe('w0');
    q.report('w0', false);
    expect(q.next(1)?.id).toBe('w0');
  });

  it('пустой пул: null', () => {
    expect(new WordQueue([], 'weighted', noProgress).next(0)).toBeNull();
  });
});

describe('WordQueue: быстрый возврат', () => {
  it('ошибка: возврат через 3–4 карточки; верно на возврате: контроль через 10–12', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const q = new WordQueue(words(30), 'weighted', noProgress, mulberry32(seed));
      const first = q.next(0)!;
      q.report(first.id, false);
      const seq: string[] = [];
      for (let i = 1; i <= 30; i++) {
        const w = q.next(i)!;
        seq.push(w.id);
        // все остальные отвечаем верно; целевое слово: верно на возврате
        q.report(w.id, true);
      }
      const hits = seq.map((id, i) => (id === first.id ? i : -1)).filter((i) => i >= 0);
      expect(hits.length).toBeGreaterThanOrEqual(2);
      const [retry, control] = hits as [number, number];
      expect(retry).toBeGreaterThanOrEqual(3);
      expect(retry).toBeLessThanOrEqual(4);
      expect(control - retry - 1).toBeGreaterThanOrEqual(10);
      expect(control - retry - 1).toBeLessThanOrEqual(12);
    }
  });

  it('ошибка на возврате: снова через 3–4', () => {
    const q = new WordQueue(words(30), 'weighted', noProgress, mulberry32(5));
    const target = q.next(0)!.id;
    q.report(target, false);
    const positions: number[] = [];
    for (let i = 1; i <= 40; i++) {
      const w = q.next(i)!;
      if (w.id === target) positions.push(i);
      q.report(w.id, w.id !== target || positions.length >= 3);
    }
    const gaps = [positions[0]! - 0, positions[1]! - positions[0]!, positions[2]! - positions[1]!].map(
      (d) => d - 1,
    );
    gaps.forEach((g) => {
      expect(g).toBeGreaterThanOrEqual(3);
      expect(g).toBeLessThanOrEqual(4);
    });
  });

  it('запланированное слово не выпадает случайно раньше срока', () => {
    const q = new WordQueue(words(6), 'weighted', noProgress, mulberry32(3));
    const target = q.next(0)!.id;
    q.report(target, false);
    for (let i = 1; i <= 2; i++) {
      const w = q.next(i)!;
      expect(w.id).not.toBe(target);
      q.report(w.id, true);
    }
  });
});

describe('WordQueue: корзины', () => {
  it('веса 60 / 25 / 15', () => {
    const pool = words(30);
    const progress: Record<string, WordProgress> = {};
    pool.forEach((w, i) => {
      progress[w.id] = { ...emptyProgress(w.id), mastery: i < 10 ? 0 : i < 20 ? 3 : 5, lastSeenAt: 0 };
    });
    const q = new WordQueue(pool, 'weighted', (id) => progress[id], mulberry32(42));
    const counts = [0, 0, 0];
    const N = 20_000;
    for (let i = 0; i < N; i++) {
      const w = q.next(0)!;
      counts[bucketOf(progress[w.id])]! += 1;
      q.report(w.id, true);
    }
    expect(counts[0]! / N).toBeCloseTo(0.6, 1);
    expect(counts[1]! / N).toBeCloseTo(0.25, 1);
    expect(counts[2]! / N).toBeCloseTo(0.15, 1);
  });

  it('внутри корзины давно не виденные слова выпадают чаще', () => {
    const HOUR = 3_600_000;
    const now = 1_700_000_000_000;
    const pool = words(10);
    const progress: Record<string, WordProgress> = {};
    pool.forEach((w, i) => {
      // w0..w4 видели минуту назад, w5..w9 — сутки назад; все в одной корзине
      progress[w.id] = { ...emptyProgress(w.id), mastery: 1, lastSeenAt: i < 5 ? now - 60_000 : now - 24 * HOUR };
    });
    const q = new WordQueue(pool, 'weighted', (id) => progress[id], mulberry32(9));
    let stale = 0;
    const N = 5000;
    for (let i = 0; i < N; i++) {
      const w = q.next(now)!;
      if (Number(w.id.slice(1)) >= 5) stale++;
      q.report(w.id, true);
    }
    expect(stale / N).toBeGreaterThan(0.75);
  });

  it('пустая корзина: вес перераспределяется', () => {
    const pool = words(10);
    const progress: Record<string, WordProgress> = {};
    pool.forEach((w) => (progress[w.id] = { ...emptyProgress(w.id), mastery: 5 }));
    const q = new WordQueue(pool, 'weighted', (id) => progress[id], mulberry32(1));
    for (let i = 0; i < 100; i++) expect(q.next(i)).not.toBeNull();
  });
});

describe('WordQueue: cover (Разбор завалов)', () => {
  it('завершается, когда каждое слово отвечено верно; ошибки возвращаются', () => {
    const q = new WordQueue(words(5), 'cover', noProgress, mulberry32(11));
    const wrongOnce = new Set<string>();
    let steps = 0;
    while (!q.isDone() && steps < 100) {
      const w = q.next(steps)!;
      const correct = wrongOnce.has(w.id);
      wrongOnce.add(w.id);
      q.report(w.id, correct);
      steps++;
    }
    expect(q.isDone()).toBe(true);
    expect(steps).toBe(10);
    expect(q.next(steps)).toBeNull();
  });

  it('последнее слово с ошибкой: повтор разрешён', () => {
    const q = new WordQueue(words(1), 'cover', noProgress);
    q.report(q.next(0)!.id, false);
    expect(q.next(1)?.id).toBe('w0');
    q.report('w0', true);
    expect(q.isDone()).toBe(true);
  });
});

describe('WordQueue: fifo (Ошибки раунда)', () => {
  it('ошибка отправляет слово в конец мини-очереди', () => {
    const q = new WordQueue(words(3), 'fifo', noProgress);
    expect(q.next(0)?.id).toBe('w0');
    q.report('w0', false);
    expect(q.next(1)?.id).toBe('w1');
    q.report('w1', true);
    expect(q.next(2)?.id).toBe('w2');
    q.report('w2', true);
    expect(q.next(3)?.id).toBe('w0');
    q.report('w0', true);
    expect(q.isDone()).toBe(true);
  });

  it('не подаёт одно слово дважды подряд, если есть другое', () => {
    const q = new WordQueue(words(2), 'fifo', noProgress);
    q.next(0);
    q.report('w0', true);
    q.next(1);
    q.report('w1', false); // очередь: [w1]
    expect(q.next(2)?.id).toBe('w1'); // других нет, повтор допустим
  });
});
