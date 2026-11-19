import { useCallback, useState } from 'react';
import { SettingsDrawer } from './components/SettingsDrawer';
import { getAllWords } from './data/dictionaryRepository';
import { buildPool } from './engine/modes';
import { summarize, type SessionSnapshot, type SessionSummary } from './engine/session';
import { useAppStore } from './state/AppStore';
import { Cases } from './screens/Cases';
import { Game } from './screens/Game';
import { Home } from './screens/Home';
import { Stats } from './screens/Stats';
import { Summary } from './screens/Summary';
import type { GameMode, RuleFilter, WordItem } from './types/game';
import { unlockAudio } from './utils/sound';

/** fixedPool: раунд на заданном наборе слов (ошибки раунда, тренировка правила) — «ещё раз» берёт тот же набор. */
type Screen =
  | { name: 'home' }
  | { name: 'stats' }
  | { name: 'cases'; key: number }
  | { name: 'game'; mode: GameMode; pool: WordItem[]; fixedPool: boolean; key: number }
  | { name: 'summary'; mode: GameMode; pool: WordItem[]; fixedPool: boolean; summary: SessionSummary; isRecord: boolean };

export default function App() {
  const store = useAppStore();
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  const [ruleFilter, setRuleFilter] = useState<RuleFilter>('ALL');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const start = useCallback(
    (mode: GameMode, explicitPool?: WordItem[]) => {
      unlockAudio();
      const pool =
        explicitPool ??
        (mode === 'round_review'
          ? []
          : buildPool(mode, getAllWords(), store.progress, store.levelFilter, ruleFilter));
      if (pool.length === 0) {
        setScreen({ name: 'home' });
        return;
      }
      setScreen({ name: 'game', mode, pool, fixedPool: !!explicitPool, key: Date.now() });
    },
    [store.progress, store.levelFilter, ruleFilter],
  );

  const { submitScore } = store;
  const finish = useCallback(
    (mode: GameMode, pool: WordItem[], fixedPool: boolean, snap: SessionSnapshot) => {
      const summary = summarize(snap);
      const isRecord = mode === 'survival' || mode === 'sprint' ? submitScore(mode, summary.score) : false;
      setScreen({ name: 'summary', mode, pool, fixedPool, summary, isRecord });
    },
    [submitScore],
  );

  const home = () => setScreen({ name: 'home' });

  return (
    <>
      {screen.name === 'home' && (
        <Home
          ruleFilter={ruleFilter}
          onRuleFilter={setRuleFilter}
          onStart={(m) => start(m)}
          onStartCases={() => {
            unlockAudio();
            setScreen({ name: 'cases', key: Date.now() });
          }}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenStats={() => setScreen({ name: 'stats' })}
        />
      )}
      {screen.name === 'stats' && <Stats onBack={home} onTrain={(words) => start('zen', words)} />}
      {screen.name === 'cases' && <Cases key={screen.key} onMenu={home} />}
      {screen.name === 'game' && (
        <Game
          key={screen.key}
          mode={screen.mode}
          pool={screen.pool}
          onFinish={(snap) => finish(screen.mode, screen.pool, screen.fixedPool, snap)}
        />
      )}
      {screen.name === 'summary' && (
        <Summary
          mode={screen.mode}
          summary={screen.summary}
          isRecord={screen.isRecord}
          onReplay={() => start(screen.mode, screen.fixedPool ? screen.pool : undefined)}
          onReviewMistakes={() => start('round_review', screen.summary.uniqueMistakes.map((m) => m.word))}
          onMenu={home}
        />
      )}
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
