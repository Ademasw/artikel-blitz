import { useCallback, useState } from 'react';
import { SettingsDrawer } from './components/SettingsDrawer';
import { getAllWords } from './data/dictionaryRepository';
import { buildPool } from './engine/modes';
import { summarize, type SessionSnapshot, type SessionSummary } from './engine/session';
import { useAppStore } from './state/AppStore';
import { Game } from './screens/Game';
import { Home } from './screens/Home';
import { Summary } from './screens/Summary';
import type { GameMode, RuleFilter, WordItem } from './types/game';
import { unlockAudio } from './utils/sound';

type Screen =
  | { name: 'home' }
  | { name: 'game'; mode: GameMode; pool: WordItem[]; key: number }
  | { name: 'summary'; mode: GameMode; pool: WordItem[]; summary: SessionSummary; isRecord: boolean };

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
      setScreen({ name: 'game', mode, pool, key: Date.now() });
    },
    [store.progress, store.levelFilter, ruleFilter],
  );

  const { submitScore } = store;
  const finish = useCallback(
    (mode: GameMode, pool: WordItem[], snap: SessionSnapshot) => {
      const summary = summarize(snap);
      const isRecord = mode === 'survival' || mode === 'sprint' ? submitScore(mode, summary.score) : false;
      setScreen({ name: 'summary', mode, pool, summary, isRecord });
    },
    [submitScore],
  );

  return (
    <>
      {screen.name === 'home' && (
        <Home
          ruleFilter={ruleFilter}
          onRuleFilter={setRuleFilter}
          onStart={(m) => start(m)}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      )}
      {screen.name === 'game' && (
        <Game
          key={screen.key}
          mode={screen.mode}
          pool={screen.pool}
          onFinish={(snap) => finish(screen.mode, screen.pool, snap)}
        />
      )}
      {screen.name === 'summary' && (
        <Summary
          mode={screen.mode}
          summary={screen.summary}
          isRecord={screen.isRecord}
          // round_review переигрывается на том же пуле, остальные режимы собирают пул заново
          onReplay={() => start(screen.mode, screen.mode === 'round_review' ? screen.pool : undefined)}
          onReviewMistakes={() => start('round_review', screen.summary.uniqueMistakes.map((m) => m.word))}
          onMenu={() => setScreen({ name: 'home' })}
        />
      )}
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
