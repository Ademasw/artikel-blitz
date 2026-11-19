import type {
  GameSettings,
  HighScores,
  KeyPreset,
  LevelFilter,
  PersistedState,
  WordProgress,
} from '../types/game';

export const STORAGE_KEY = 'artikel_blitz_v1';

export const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  showTranslationBeforeAnswer: false,
  keyPreset: 'ASD',
};

export function defaultState(): PersistedState {
  return {
    version: 1,
    progress: {},
    settings: { ...DEFAULT_SETTINGS },
    highScores: { survival: 0, sprint: 0 },
    levelFilter: 'ALL',
  };
}

const LEVEL_FILTERS: LevelFilter[] = ['A1-A2', 'B1-B2', 'ALL'];
const KEY_PRESETS: KeyPreset[] = ['ASD', 'ARROWS'];

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const bool = (v: unknown, d: boolean) => (typeof v === 'boolean' ? v : d);

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
  const settings: GameSettings = {
    soundEnabled: bool(s.soundEnabled, DEFAULT_SETTINGS.soundEnabled),
    showTranslationBeforeAnswer: bool(s.showTranslationBeforeAnswer, DEFAULT_SETTINGS.showTranslationBeforeAnswer),
    keyPreset: KEY_PRESETS.includes(s.keyPreset as KeyPreset)
      ? (s.keyPreset as KeyPreset)
      : DEFAULT_SETTINGS.keyPreset,
  };
  const h = isObj(data.highScores) ? data.highScores : {};
  const highScores: HighScores = {
    survival: Math.max(0, num(h.survival, 0)),
    sprint: Math.max(0, num(h.sprint, 0)),
  };
  const levelFilter = LEVEL_FILTERS.includes(data.levelFilter as LevelFilter)
    ? (data.levelFilter as LevelFilter)
    : base.levelFilter;
  return { version: 1, progress, settings, highScores, levelFilter };
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
