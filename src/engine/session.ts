import type { Article, GameMode, GamePhase, RoundMistake, WordItem } from '../types/game';
import {
  MODE_STRATEGY,
  SPRINT_BONUS_MS,
  SPRINT_DURATION_MS,
  SPRINT_PENALTY_MS,
  SURVIVAL_LIVES,
  sprintBonusEarned,
  survivalCardLimitMs,
} from './modes';
import { FEVER_COMBO, scoreFor } from './scoring';
import { addTime, createTimer, pauseTimer, remaining, resumeTimer, type CountdownTimer } from './timer';
import { WordQueue, type ProgressLookup, type Rng } from './wordQueue';

/** Время анимации входа карточки: реакция и таймер карточки стартуют после неё. */
export const CARD_ENTER_MS = 140;

export interface SessionSnapshot {
  mode: GameMode;
  phase: GamePhase;
  current: WordItem | null;
  /** Номер карточки (для ключа анимации). */
  cardSeq: number;
  lives: number;
  score: number;
  combo: number;
  maxCombo: number;
  cardsAnswered: number;
  correctFirstTry: number;
  reactionSumMs: number;
  mistakes: RoundMistake[];
  /** survival: таймер карточки; sprint: таймер раунда; иначе null. */
  timer: CountdownTimer | null;
  /** Полная длительность текущего таймера (для полоски). */
  timerTotalMs: number;
  /** Ответ, вызвавший ERROR_LOCK. */
  lockAnswer: Article | 'timeout' | null;
  /** Предыдущее верно отвеченное слово (микро-строка). */
  previous: WordItem | null;
  /** Счётчики событий для одноразовых анимаций. */
  bonusSeq: number;
  lockShakeSeq: number;
  /** Сколько слов осталось закрыть (mistakes / round_review). */
  remainingWords: number;
  poolSize: number;
}

export type AnswerOutcome =
  | { kind: 'ignored' }
  | { kind: 'correct'; combo: number; points: number; bonusTime: boolean; feverStart: boolean; finished: boolean }
  | { kind: 'wrong'; finishedAfterLock: boolean }
  | { kind: 'lock_wrong' }
  | { kind: 'lock_release'; finished: boolean };

export interface SessionDeps {
  mode: GameMode;
  pool: WordItem[];
  progress: ProgressLookup;
  /** Вызывается на каждую первую попытку по карточке (обновление mastery). */
  onAnswer?: (wordId: string, correct: boolean, reactionMs: number) => void;
  rng?: Rng;
  /** Настенные часы (как lastSeenAt в прогрессе) для приоритета давно не виденных слов. */
  wallClock?: () => number;
}

type Listener = () => void;

export class GameSession {
  private readonly queue: WordQueue;
  private readonly onAnswer: SessionDeps['onAnswer'];
  private readonly wallClock: () => number;
  private state: SessionSnapshot;
  private listeners = new Set<Listener>();
  private cardShownAt = 0;
  private pausedAt = 0;
  private pausedFrom: 'playing' | 'error_lock' = 'playing';
  private endAfterLock = false;

  constructor(deps: SessionDeps, now: number) {
    this.queue = new WordQueue(deps.pool, MODE_STRATEGY[deps.mode], deps.progress, deps.rng);
    this.onAnswer = deps.onAnswer;
    this.wallClock = deps.wallClock ?? Date.now;
    const isSprint = deps.mode === 'sprint';
    this.state = {
      mode: deps.mode,
      phase: 'playing',
      current: null,
      cardSeq: 0,
      lives: deps.mode === 'survival' ? SURVIVAL_LIVES : 0,
      score: 0,
      combo: 0,
      maxCombo: 0,
      cardsAnswered: 0,
      correctFirstTry: 0,
      reactionSumMs: 0,
      mistakes: [],
      timer: isSprint ? createTimer(SPRINT_DURATION_MS, now) : null,
      timerTotalMs: isSprint ? SPRINT_DURATION_MS : 0,
      lockAnswer: null,
      previous: null,
      bonusSeq: 0,
      lockShakeSeq: 0,
      remainingWords: this.queue.remaining,
      poolSize: this.queue.size,
    };
    this.advance(now);
  }

  getSnapshot = (): SessionSnapshot => this.state;

  subscribe = (fn: Listener): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  private set(patch: Partial<SessionSnapshot>): void {
    this.state = { ...this.state, ...patch, remainingWords: this.queue.remaining };
    this.listeners.forEach((l) => l());
  }

  /** Выдать следующую карточку или завершить сессию. */
  private advance(now: number): void {
    // now — монотонное время (performance.now) для таймеров; давность слов считается по настенным часам
    const next = this.queue.isDone() ? null : this.queue.next(this.wallClock());
    if (!next) {
      this.finish(now);
      return;
    }
    this.cardShownAt = now + CARD_ENTER_MS;
    const patch: Partial<SessionSnapshot> = {
      current: next,
      cardSeq: this.state.cardSeq + 1,
      phase: 'playing',
      lockAnswer: null,
    };
    if (this.state.mode === 'survival') {
      const limit = survivalCardLimitMs(this.state.correctFirstTry);
      patch.timer = createTimer(limit, this.cardShownAt);
      patch.timerTotalMs = limit;
    }
    this.set(patch);
  }

  answer(article: Article, now: number): AnswerOutcome {
    const s = this.state;
    if (!s.current) return { kind: 'ignored' };

    if (s.phase === 'error_lock') {
      if (article !== s.current.article) {
        this.set({ lockShakeSeq: s.lockShakeSeq + 1 });
        return { kind: 'lock_wrong' };
      }
      if (this.endAfterLock) {
        this.finish(now);
        return { kind: 'lock_release', finished: true };
      }
      if (s.mode === 'sprint' && s.timer) this.set({ timer: resumeTimer(s.timer, now) });
      this.advance(now);
      return { kind: 'lock_release', finished: this.state.phase === 'finished' };
    }

    if (s.phase !== 'playing') return { kind: 'ignored' };
    const reactionMs = Math.max(0, now - this.cardShownAt);
    return article === s.current.article
      ? this.handleCorrect(reactionMs, now)
      : this.handleWrong(article, reactionMs, now);
  }

  private handleCorrect(reactionMs: number, now: number): AnswerOutcome {
    const s = this.state;
    const word = s.current!;
    this.onAnswer?.(word.id, true, reactionMs);
    this.queue.report(word.id, true);

    const combo = s.combo + 1;
    const points = scoreFor(reactionMs, combo);
    let timer = s.timer;
    let bonusSeq = s.bonusSeq;
    const bonusTime = s.mode === 'sprint' && sprintBonusEarned(combo);
    if (bonusTime && timer) {
      timer = addTime(timer, SPRINT_BONUS_MS, now);
      bonusSeq += 1;
    }
    this.set({
      combo,
      maxCombo: Math.max(s.maxCombo, combo),
      score: s.score + points,
      cardsAnswered: s.cardsAnswered + 1,
      correctFirstTry: s.correctFirstTry + 1,
      reactionSumMs: s.reactionSumMs + reactionMs,
      previous: word,
      timer,
      bonusSeq,
    });
    this.advance(now);
    return {
      kind: 'correct',
      combo,
      points,
      bonusTime,
      feverStart: combo === FEVER_COMBO,
      finished: this.state.phase === 'finished',
    };
  }

  private handleWrong(answer: Article | 'timeout', reactionMs: number, now: number): AnswerOutcome {
    const s = this.state;
    const word = s.current!;
    this.onAnswer?.(word.id, false, reactionMs);
    this.queue.report(word.id, false);

    let timer = s.timer ? pauseTimer(s.timer, now) : null;
    let lives = s.lives;
    if (s.mode === 'survival') {
      lives -= 1;
      this.endAfterLock = lives <= 0;
    } else if (s.mode === 'sprint' && timer) {
      timer = addTime(timer, -SPRINT_PENALTY_MS, now);
      this.endAfterLock = remaining(timer, now) <= 0;
    }
    this.set({
      phase: 'error_lock',
      lockAnswer: answer,
      combo: 0,
      lives,
      timer,
      cardsAnswered: s.cardsAnswered + 1,
      mistakes: [...s.mistakes, { word, userAnswer: answer, reactionMs }],
    });
    return { kind: 'wrong', finishedAfterLock: this.endAfterLock };
  }

  /** Вызывается каждый кадр: таймаут карточки (survival) и конец раунда (sprint). */
  tick(now: number): AnswerOutcome | null {
    const s = this.state;
    if (s.phase !== 'playing' || !s.timer || remaining(s.timer, now) > 0) return null;
    if (s.mode === 'sprint') {
      this.finish(now);
      return null;
    }
    if (s.mode === 'survival') {
      return this.handleWrong('timeout', s.timerTotalMs, now);
    }
    return null;
  }

  pause(now: number): void {
    const s = this.state;
    if (s.phase !== 'playing' && s.phase !== 'error_lock') return;
    this.pausedFrom = s.phase;
    this.pausedAt = now;
    this.set({ phase: 'paused', timer: s.timer ? pauseTimer(s.timer, now) : null });
  }

  resume(now: number): void {
    const s = this.state;
    if (s.phase !== 'paused') return;
    if (this.pausedFrom === 'playing') {
      // время на паузе не входит ни в таймер, ни во время реакции
      this.cardShownAt += now - this.pausedAt;
      this.set({ phase: 'playing', timer: s.timer ? resumeTimer(s.timer, now) : null });
    } else {
      this.set({ phase: 'error_lock' });
    }
  }

  finish(now: number): void {
    const s = this.state;
    if (s.phase === 'finished') return;
    this.set({ phase: 'finished', timer: s.timer ? pauseTimer(s.timer, now) : null });
  }
}

export interface SessionSummary {
  score: number;
  cards: number;
  accuracy: number;
  avgReactionMs: number | null;
  maxCombo: number;
  uniqueMistakes: RoundMistake[];
}

export function summarize(s: SessionSnapshot): SessionSummary {
  const seen = new Set<string>();
  const uniqueMistakes = s.mistakes.filter((m) => (seen.has(m.word.id) ? false : (seen.add(m.word.id), true)));
  return {
    score: s.score,
    cards: s.cardsAnswered,
    accuracy: s.cardsAnswered === 0 ? 0 : s.correctFirstTry / s.cardsAnswered,
    avgReactionMs: s.correctFirstTry === 0 ? null : s.reactionSumMs / s.correctFirstTry,
    maxCombo: s.maxCombo,
    uniqueMistakes,
  };
}
