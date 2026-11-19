import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { applyAnswer, emptyProgress } from '../engine/mastery';
import type { GameSettings, HighScores, LevelFilter, PersistedState, WordProgress } from '../types/game';
import { setSoundEnabled } from '../utils/sound';
import { defaultState, loadState, saveState } from './persistence';

const SAVE_DEBOUNCE_MS = 250;

interface AppStore {
  progress: Record<string, WordProgress>;
  settings: GameSettings;
  highScores: HighScores;
  levelFilter: LevelFilter;
  /** Актуальный прогресс без ожидания ререндера (для очереди слов). */
  getProgress: (wordId: string) => WordProgress | undefined;
  recordAnswer: (wordId: string, correct: boolean, reactionMs: number) => void;
  updateSettings: (patch: Partial<GameSettings>) => void;
  setLevelFilter: (f: LevelFilter) => void;
  /** Возвращает true, если это новый рекорд. */
  submitScore: (mode: keyof HighScores, score: number) => boolean;
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

  const recordAnswer = useCallback(
    (wordId: string, correct: boolean, reactionMs: number) => {
      const cur = stateRef.current;
      const prev = cur.progress[wordId] ?? emptyProgress(wordId);
      commit({
        ...cur,
        progress: { ...cur.progress, [wordId]: applyAnswer(prev, correct, reactionMs, Date.now()) },
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

  const resetProgress = useCallback(() => {
    const cur = stateRef.current;
    const base = defaultState();
    const next = { ...base, settings: cur.settings, levelFilter: cur.levelFilter };
    commit(next);
    saveState(next);
  }, [commit]);

  const value = useMemo<AppStore>(
    () => ({
      progress: state.progress,
      settings: state.settings,
      highScores: state.highScores,
      levelFilter: state.levelFilter,
      getProgress,
      recordAnswer,
      updateSettings,
      setLevelFilter,
      submitScore,
      resetProgress,
    }),
    [state, getProgress, recordAnswer, updateSettings, setLevelFilter, submitScore, resetProgress],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppStore(): AppStore {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAppStore вне AppStoreProvider');
  return v;
}
