import type { WordItem, WordProgress } from '../types/game';

/**
 * weighted: бесконечная выдача по корзинам (survival / sprint / zen);
 * cover: каждое слово пула нужно один раз ответить верно (mistakes);
 * fifo: мини-очередь, ошибка отправляет слово в конец (round_review).
 */
export type QueueStrategy = 'weighted' | 'cover' | 'fifo';

export type Rng = () => number;
export type ProgressLookup = (wordId: string) => WordProgress | undefined;

interface Scheduled {
  dueAt: number;
  stage: 'retry' | 'control';
}

const BUCKET_WEIGHTS = [0.6, 0.25, 0.15] as const;
const HOUR = 3_600_000;
const STALE_CAP_HOURS = 24;

/** «Через 3–4 карточки» = 3–4 других карточки между показами. */
export const RETRY_GAP: readonly [number, number] = [3, 4];
/** Контрольная проверка через 10–12 других карточек. */
export const CONTROL_GAP: readonly [number, number] = [10, 12];

function randInt(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

function weightedPick<T>(items: readonly T[], weights: readonly number[], rng: Rng): T | undefined {
  const total = weights.reduce((a, b) => a + b, 0);
  if (items.length === 0 || total <= 0) return items[0];
  let r = rng() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i] ?? 0;
    if (r < 0) return items[i];
  }
  return items[items.length - 1];
}

export function bucketOf(p: WordProgress | undefined): 0 | 1 | 2 {
  const m = p?.mastery ?? 0;
  if (m < 2) return 0;
  if (m < 4) return 1;
  return 2;
}

/** Минимальное число других карточек между двумя показами одного слова. */
export function minGapFor(poolSize: number): number {
  if (poolSize <= 1) return 0;
  if (poolSize <= 3) return 1;
  return 2;
}

export class WordQueue {
  readonly strategy: QueueStrategy;
  private readonly pool: WordItem[];
  private readonly byId: Map<string, WordItem>;
  private readonly progress: ProgressLookup;
  private readonly rng: Rng;
  private readonly minGap: number;

  /** Порядковый номер следующей выдаваемой карточки. */
  private issued = 0;
  private history: string[] = [];
  private scheduled = new Map<string, Scheduled>();
  /** cover: ещё не закрытые слова; fifo: очередь. */
  private open: string[];

  constructor(pool: WordItem[], strategy: QueueStrategy, progress: ProgressLookup, rng: Rng = Math.random) {
    const unique = new Map(pool.map((w) => [w.id, w]));
    this.pool = [...unique.values()];
    this.byId = unique;
    this.strategy = strategy;
    this.progress = progress;
    this.rng = rng;
    this.minGap = minGapFor(this.pool.length);
    this.open = this.pool.map((w) => w.id);
  }

  get size(): number {
    return this.pool.length;
  }

  /** Сколько слов осталось закрыть (cover / fifo). Для weighted всегда размер пула. */
  get remaining(): number {
    return this.strategy === 'weighted' ? this.pool.length : this.open.length;
  }

  isDone(): boolean {
    return this.strategy !== 'weighted' && this.open.length === 0;
  }

  /** Номер карточки, когда слово запланировано к возврату (для тестов и отладки). */
  scheduledFor(wordId: string): Scheduled | undefined {
    return this.scheduled.get(wordId);
  }

  private recent(gap: number): Set<string> {
    return new Set(gap > 0 ? this.history.slice(-gap) : []);
  }

  /** Выдать следующую карточку. null, если очередь пуста или завершена. */
  next(now: number): WordItem | null {
    if (this.pool.length === 0 || this.isDone()) return null;
    const id = this.strategy === 'fifo' ? this.pickFifo() : this.pickScheduledOrFresh(now);
    if (id === undefined) return null;
    this.issued += 1;
    this.history.push(id);
    if (this.history.length > 16) this.history.shift();
    return this.byId.get(id) ?? null;
  }

  /** Сообщить результат первой попытки по выданной карточке. */
  report(wordId: string, correct: boolean): void {
    const position = this.issued - 1; // номер только что выданной карточки
    if (this.strategy === 'fifo') {
      const i = this.open.indexOf(wordId);
      if (i === -1) return;
      this.open.splice(i, 1);
      if (!correct) this.open.push(wordId);
      return;
    }

    const entry = this.scheduled.get(wordId);
    if (!correct) {
      this.scheduled.set(wordId, {
        stage: 'retry',
        dueAt: position + randInt(this.rng, RETRY_GAP[0], RETRY_GAP[1]) + 1,
      });
      return;
    }

    if (this.strategy === 'cover') {
      this.scheduled.delete(wordId);
      this.open = this.open.filter((id) => id !== wordId);
      return;
    }

    if (entry?.stage === 'retry') {
      this.scheduled.set(wordId, {
        stage: 'control',
        dueAt: position + randInt(this.rng, CONTROL_GAP[0], CONTROL_GAP[1]) + 1,
      });
    } else if (entry) {
      this.scheduled.delete(wordId);
    }
  }

  private pickFifo(): string | undefined {
    const last = this.history[this.history.length - 1];
    const first = this.open[0];
    if (first === last && this.open.length > 1) {
      // не показываем одно слово дважды подряд: берём второе
      const [a, b, ...rest] = this.open;
      this.open = [b!, a!, ...rest];
    }
    return this.open[0];
  }

  private pickScheduledOrFresh(now: number): string | undefined {
    // Ослабляем защиту от повторов, только если иначе выдать нечего.
    for (let gap = this.minGap; gap >= 0; gap--) {
      const blocked = this.recent(gap);
      const due = this.earliestScheduled(blocked, true);
      if (due) return due;
      const fresh = this.pickFresh(blocked, now);
      if (fresh) return fresh;
      const early = this.earliestScheduled(blocked, false);
      if (early) return early;
    }
    return undefined;
  }

  private earliestScheduled(blocked: Set<string>, onlyDue: boolean): string | undefined {
    let best: string | undefined;
    let bestDue = Infinity;
    for (const [id, s] of this.scheduled) {
      if (blocked.has(id)) continue;
      if (onlyDue && s.dueAt > this.issued) continue;
      if (this.strategy === 'cover' && !this.open.includes(id)) continue;
      if (s.dueAt < bestDue) {
        best = id;
        bestDue = s.dueAt;
      }
    }
    return best;
  }

  private pickFresh(blocked: Set<string>, now: number): string | undefined {
    const source = this.strategy === 'cover' ? this.open : this.pool.map((w) => w.id);
    const candidates = source.filter((id) => !blocked.has(id) && !this.scheduled.has(id));
    if (candidates.length === 0) return undefined;

    if (this.strategy === 'cover') {
      return candidates[Math.floor(this.rng() * candidates.length)];
    }

    const buckets: string[][] = [[], [], []];
    for (const id of candidates) buckets[bucketOf(this.progress(id))]!.push(id);
    const bucketIdx = weightedPick(
      [0, 1, 2],
      BUCKET_WEIGHTS.map((w, i) => (buckets[i]!.length > 0 ? w : 0)),
      this.rng,
    )!;
    const bucket = buckets[bucketIdx]!;
    const weights = bucket.map((id) => this.staleness(id, now));
    return weightedPick(bucket, weights, this.rng);
  }

  private staleness(id: string, now: number): number {
    const p = this.progress(id);
    if (!p || p.lastSeenAt === 0) return 1 + STALE_CAP_HOURS;
    const hours = Math.min(STALE_CAP_HOURS, Math.max(0, now - p.lastSeenAt) / HOUR);
    return 1 + hours;
  }
}
