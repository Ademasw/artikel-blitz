export type Article = 'der' | 'die' | 'das';
export type Level = 'A1' | 'A2' | 'B1' | 'B2';
export type RuleType = 'suffix' | 'semantic' | 'exception' | 'none';

export const ARTICLES: readonly Article[] = ['der', 'die', 'das'];

export interface WordItem {
  /** Уникален; у омонимов разные id ('see-m', 'see-f'). */
  id: string;
  /** Существительное с заглавной буквы, напр. "Möglichkeit". */
  word: string;
  article: Article;
  /** Полная форма мн. числа ("Möglichkeiten"); null, если мн. ч. нет. */
  plural: string | null;
  /** Перевод на русский; у омонимов различает значения. */
  translation: string;
  level: Level;
  ruleType: RuleType;
  /** Конец слова для подсветки: word.endsWith(highlight). */
  highlight?: string;
  /** Короткое пояснение в 1 строку. */
  ruleHint?: string;
  /** true для омонимов: перевод виден до ответа всегда. */
  alwaysShowTranslation?: boolean;
}

export interface WordProgress {
  wordId: string;
  /** 0..5, шаг 0.5 */
  mastery: number;
  attempts: number;
  mistakes: number;
  /** EMA (α=0.3) времени верного ответа; null, пока верных не было. */
  avgReactionMs: number | null;
  lastSeenAt: number;
  isProblematic: boolean;
  lastAnswerCorrect: boolean | null;
}

export type GameMode = 'survival' | 'sprint' | 'zen' | 'mistakes' | 'round_review';
export type LevelFilter = 'A1-A2' | 'B1-B2' | 'ALL';
export type RuleFilter = 'ALL' | 'suffix' | 'semantic' | 'exception';
export type KeyPreset = 'ASD' | 'ARROWS';

/** Озвучка слова: выключена / только при ошибке / после каждого ответа. */
export type SpeechMode = 'off' | 'mistakes' | 'always';

export interface GameSettings {
  soundEnabled: boolean;
  showTranslationBeforeAnswer: boolean;
  keyPreset: KeyPreset;
  /** Цель на день: сколько ответов дать. */
  dailyGoal: number;
  speech: SpeechMode;
}

/** Статистика одного дня (ключ — локальная дата YYYY-MM-DD). */
export interface DayStat {
  answers: number;
  correct: number;
}

export type GrammarCase = 'nom' | 'akk' | 'dat' | 'gen';

export interface CaseStat {
  attempts: number;
  correct: number;
}

export interface HighScores {
  survival: number;
  sprint: number;
}

export interface RoundMistake {
  word: WordItem;
  userAnswer: Article | 'timeout';
  reactionMs: number;
}

export type GamePhase = 'playing' | 'error_lock' | 'paused' | 'finished';

export interface PersistedState {
  version: 1;
  progress: Record<string, WordProgress>;
  settings: GameSettings;
  highScores: HighScores;
  levelFilter: LevelFilter;
  /** Ответы по дням: цель дня, серия, активность. */
  daily: Record<string, DayStat>;
  /** Режим «Падежи»: первые попытки по каждому падежу. */
  cases: Record<GrammarCase, CaseStat>;
}
