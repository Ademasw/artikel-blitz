import type {
  CaseStat,
  DayStat,
  GameSettings,
  GrammarCase,
  HighScores,
  KeyPreset,
  LevelFilter,
  PersistedState,
  SpeechMode,
  WordProgress,
} from '../types/game';

export const STORAGE_KEY = 'artikel_blitz_v1';

export const DAILY_GOALS = [20, 50, 100, 200] as const;
export const GRAMMAR_CASES: readonly GrammarCase[] = ['nom', 'akk', 'dat', 'gen'];
/** Сколько последних дней активности храним. */
export const DAILY_KEEP_DAYS = 400;

export const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  showTranslationBeforeAnswer: false,
  keyPreset: 'ASD',
  dailyGoal: 50,
  speech: 'mistakes',
};

export function emptyCases(): Record<GrammarCase, CaseStat> {
  return { nom: { attempts: 0, correct: 0 }, akk: { attempts: 0, correct: 0 }, dat: { attempts: 0, correct: 0 }, gen: { attempts: 0, correct: 0 } };
}

export function defaultState(): PersistedState {
  return {
    version: 1,
    progress: {},
    settings: { ...DEFAULT_SETTINGS },
    highScores: { survival: 0, sprint: 0 },
    levelFilter: 'ALL',
    daily: {},
    cases: emptyCases(),
  };
}

const LEVEL_FILTERS: LevelFilter[] = ['A1-A2', 'B1-B2', 'ALL'];
const KEY_PRESETS: KeyPreset[] = ['ASD', 'ARROWS'];
const SPEECH_MODES: SpeechMode[] = ['off', 'mistakes', 'always'];
const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const bool = (v: unknown, d: boolean) => (typeof v === 'boolean' ? v : d);
const count = (v: unknown) => Math.max(0, Math.floor(num(v, 0)));

function sanitizeProgress(id: string, v: unknown): WordProgress | null {
  if (!isObj(v)) return null;
  const avg = v.avgReactionMs;
  const last = v.lastAnswerCorrect;
  return {
    wordId: id,
    mastery: Math.min(5, Math.max(0, num(v.mastery, 0))),
    attempts: Math.max(0, num(v.attempts, 0)),
    mistakes: Math.max(0, num(v.mistakes, 0)),
    avgReactionMs: typeof avg === 'number' && Number.isFinite(avg) ? avg : null,
    lastSeenAt: num(v.lastSeenAt, 0),
    isProblematic: bool(v.isProblematic, false),
    lastAnswerCorrect: typeof last === 'boolean' ? last : null,
  };
}

/** Оставляет только последние DAILY_KEEP_DAYS дней с корректными ключами. */
export function sanitizeDaily(v: unknown): Record<string, DayStat> {
  if (!isObj(v)) return {};
  const entries = Object.entries(v)
    .filter(([k, d]) => DAY_KEY.test(k) && isObj(d))
    .map(([k, d]) => {
      const o = d as Record<string, unknown>;
      const answers = count(o.answers);
      return [k, { answers, correct: Math.min(answers, count(o.correct)) }] as const;
    })
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .slice(-DAILY_KEEP_DAYS);
  return Object.fromEntries(entries);
}

function sanitizeCases(v: unknown): Record<GrammarCase, CaseStat> {
  const out = emptyCases();
  if (!isObj(v)) return out;
  for (const c of GRAMMAR_CASES) {
    const o = v[c];
    if (!isObj(o)) continue;
    const attempts = count(o.attempts);
    out[c] = { attempts, correct: Math.min(attempts, count(o.correct)) };
  }
  return out;
}

/** Разбирает сохранённое состояние; всё неизвестное или битое заменяется значениями по умолчанию. */
export function parseState(raw: string | null): PersistedState {
  const base = defaultState();
  if (!raw) return base;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return base;
  }
  if (!isObj(data) || data.version !== 1) return base;

  const progress: Record<string, WordProgress> = {};
  if (isObj(data.progress)) {
    for (const [id, v] of Object.entries(data.progress)) {
      const p = sanitizeProgress(id, v);
      if (p) progress[id] = p;
    }
  }
  const s = isObj(data.settings) ? data.settings : {};
  const goal = num(s.dailyGoal, DEFAULT_SETTINGS.dailyGoal);
  const settings: GameSettings = {
    soundEnabled: bool(s.soundEnabled, DEFAULT_SETTINGS.soundEnabled),
    showTranslationBeforeAnswer: bool(s.showTranslationBeforeAnswer, DEFAULT_SETTINGS.showTranslationBeforeAnswer),
    keyPreset: KEY_PRESETS.includes(s.keyPreset as KeyPreset)
      ? (s.keyPreset as KeyPreset)
      : DEFAULT_SETTINGS.keyPreset,
    dailyGoal: (DAILY_GOALS as readonly number[]).includes(goal) ? goal : DEFAULT_SETTINGS.dailyGoal,
    speech: SPEECH_MODES.includes(s.speech as SpeechMode) ? (s.speech as SpeechMode) : DEFAULT_SETTINGS.speech,
  };
  const h = isObj(data.highScores) ? data.highScores : {};
  const highScores: HighScores = {
    survival: Math.max(0, num(h.survival, 0)),
    sprint: Math.max(0, num(h.sprint, 0)),
  };
  const levelFilter = LEVEL_FILTERS.includes(data.levelFilter as LevelFilter)
    ? (data.levelFilter as LevelFilter)
    : base.levelFilter;
  return {
    version: 1,
    progress,
    settings,
    highScores,
    levelFilter,
    daily: sanitizeDaily(data.daily),
    cases: sanitizeCases(data.cases),
  };
}

/** localStorage может быть недоступен (приватный режим, квота): тогда работаем в памяти. */
export function loadState(): PersistedState {
  try {
    return parseState(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return defaultState();
  }
}

export function saveState(state: PersistedState): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
