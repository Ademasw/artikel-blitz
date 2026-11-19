import type { WordProgress } from '../types/game';

export const FAST_ANSWER_MS = 2000;
export const REFLEX_MASTERY = 4;
export const REFLEX_REACTION_MS = 1500;
export const PROBLEM_CLEAR_MASTERY = 3;
const EMA_ALPHA = 0.3;

export function emptyProgress(wordId: string): WordProgress {
  return {
    wordId,
    mastery: 0,
    attempts: 0,
    mistakes: 0,
    avgReactionMs: null,
    lastSeenAt: 0,
    isProblematic: false,
    lastAnswerCorrect: null,
  };
}

/**
 * Применяет ответ к прогрессу слова (§5.1 п.1). Чистая функция.
 * Вызывается только для первой попытки по карточке, не для закрепления в ERROR_LOCK.
 */
export function applyAnswer(
  prev: WordProgress,
  correct: boolean,
  reactionMs: number,
  now: number,
): WordProgress {
  let mastery: number;
  let avgReactionMs = prev.avgReactionMs;
  let isProblematic = prev.isProblematic;

  if (correct) {
    mastery = Math.min(5, prev.mastery + (reactionMs < FAST_ANSWER_MS ? 1 : 0.5));
    avgReactionMs =
      avgReactionMs === null ? reactionMs : EMA_ALPHA * reactionMs + (1 - EMA_ALPHA) * avgReactionMs;
    if (mastery >= PROBLEM_CLEAR_MASTERY) isProblematic = false;
  } else {
    mastery = prev.lastAnswerCorrect === false ? 0 : Math.max(0, prev.mastery - 2);
    isProblematic = true;
  }

  return {
    ...prev,
    mastery,
    avgReactionMs,
    isProblematic,
    attempts: prev.attempts + 1,
    mistakes: prev.mistakes + (correct ? 0 : 1),
    lastSeenAt: now,
    lastAnswerCorrect: correct,
  };
}

export function isReflex(p: WordProgress | undefined): boolean {
  return (
    !!p &&
    p.mastery >= REFLEX_MASTERY &&
    p.avgReactionMs !== null &&
    p.avgReactionMs < REFLEX_REACTION_MS
  );
}
