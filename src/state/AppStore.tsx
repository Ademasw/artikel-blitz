import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { addAnswer, dayKey } from '../engine/daily';
import { applyAnswer, emptyProgress } from '../engine/mastery';
import type {
  CaseStat,
  DayStat,
  GameSettings,
  GrammarCase,
  HighScores,
  LevelFilter,
  PersistedState,
  WordProgress,
} from '../types/game';
import { setSoundEnabled } from '../utils/sound';
import { defaultState, emptyCases, loadState, saveState } from './persistence';
import { mergeStates, type MergeReport } from './sync';

const SAVE_DEBOUNCE_MS = 250;

interface AppStore {
  progress: Record<string, WordProgress>;
  settings: GameSettings;
  highScores: HighScores;
  levelFilter: LevelFilter;
  daily: Record<string, DayStat>;
  cases: Record<GrammarCase, CaseStat>;
  /** Актуальный прогресс без ожидания ререндера (для очереди слов). */
  getProgress: (wordId: string) => WordProgress | undefined;
  /** Текущее состояние целиком (для экспорта). */
  snapshot: () => PersistedState;
  recordAnswer: (wordId: string, correct: boolean, reactionMs: number) => void;
  recordCaseAnswer: (c: GrammarCase, correct: boolean) => void;
  updateSettings: (patch: Partial<GameSettings>) => void;
  setLevelFilter: (f: LevelFilter) => void;
  /** Возвращает true, если это новый рекорд. */
  submitScore: (mode: keyof HighScores, score: number) => boolean;
  importProgress: (incoming: PersistedState) => MergeReport;
  resetProgress: () => void;
}

const Ctx = createContext<AppStore | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(loadState);
  const stateRef = useRef(state);

  const commit = useCallback((next: PersistedState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  // Сохранение с debounce + сброс на диск при закрытии вкладки.
  useEffect(() => {
    const id = window.setTimeout(() => saveState(state), SAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [state]);
  useEffect(() => {
    const flush = () => saveState(stateRef.current);
    window.addEventListener('pagehide', flush);
    return () => window.removeEventListener('pagehide', flush);
  }, []);

  useEffect(() => setSoundEnabled(state.settings.soundEnabled), [state.settings.soundEnabled]);

  const getProgress = useCallback((id: string) => stateRef.current.progress[id], []);
  const snapshot = useCallback(() => stateRef.current, []);

  const recordAnswer = useCallback(
    (wordId: string, correct: boolean, reactionMs: number) => {
      const cur = stateRef.current;
      const prev = cur.progress[wordId] ?? emptyProgress(wordId);
      const now = Date.now();
      commit({
        ...cur,
        progress: { ...cur.progress, [wordId]: applyAnswer(prev, correct, reactionMs, now) },
        daily: addAnswer(cur.daily, dayKey(new Date(now)), correct),
      });
    },
    [commit],
  );

  const recordCaseAnswer = useCallback(
    (c: GrammarCase, correct: boolean) => {
      const cur = stateRef.current;
      const prev = cur.cases[c];
      commit({
        ...cur,
        cases: { ...cur.cases, [c]: { attempts: prev.attempts + 1, correct: prev.correct + (correct ? 1 : 0) } },
        daily: addAnswer(cur.daily, dayKey(new Date()), correct),
      });
    },
    [commit],
  );

  const updateSettings = useCallback(
    (patch: Partial<GameSettings>) => {
      const cur = stateRef.current;
      commit({ ...cur, settings: { ...cur.settings, ...patch } });
    },
    [commit],
  );

  const setLevelFilter = useCallback(
    (levelFilter: LevelFilter) => commit({ ...stateRef.current, levelFilter }),
    [commit],
  );

  const submitScore = useCallback(
    (mode: keyof HighScores, score: number) => {
      const cur = stateRef.current;
      if (score <= cur.highScores[mode]) return false;
      const next = { ...cur, highScores: { ...cur.highScores, [mode]: score } };
      commit(next);
      saveState(next);
      return true;
    },
    [commit],
  );

  const importProgress = useCallback(
    (incoming: PersistedState) => {
      const report = mergeStates(stateRef.current, incoming);
      commit(report.state);
      saveState(report.state);
      return report;
    },
    [commit],
  );

  const resetProgress = useCallback(() => {
    const cur = stateRef.current;
    const next = { ...defaultState(), settings: cur.settings, levelFilter: cur.levelFilter, cases: emptyCases() };
    commit(next);
    saveState(next);
  }, [commit]);

  const value = useMemo<AppStore>(
    () => ({
      progress: state.progress,
      settings: state.settings,
      highScores: state.highScores,
      levelFilter: state.levelFilter,
      daily: state.daily,
      cases: state.cases,
      getProgress,
      snapshot,
      recordAnswer,
      recordCaseAnswer,
      updateSettings,
      setLevelFilter,
      submitScore,
      importProgress,
      resetProgress,
    }),
    [
      state,
      getProgress,
      snapshot,
      recordAnswer,
      recordCaseAnswer,
      updateSettings,
      setLevelFilter,
      submitScore,
      importProgress,
      resetProgress,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppStore(): AppStore {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAppStore вне AppStoreProvider');
  return v;
}
