import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { AnswerButtons } from '../components/AnswerButtons';
import { ART } from '../components/articleStyles';
import { CARD_CENTER, CARD_ENTER, Card, FLY_MS, flyTarget } from '../components/Card';
import { Dialog, DialogButton } from '../components/Dialog';
import { Hud } from '../components/Hud';
import { TimeBar } from '../components/TimeBar';
import { useFrame } from '../components/useFrame';
import { MODE_TITLES } from '../engine/modes';
import { isFever } from '../engine/scoring';
import { GameSession, type SessionSnapshot } from '../engine/session';
import { KEY_HINTS } from '../input/keymap';
import { useKeyboard } from '../input/useKeyboard';
import { useAppStore } from '../state/AppStore';
import type { Article, GameMode, WordItem } from '../types/game';
import { playBonus, playCorrect, playError, playNudge, unlockAudio } from '../utils/sound';

interface Props {
  mode: GameMode;
  pool: WordItem[];
  onFinish: (snap: SessionSnapshot) => void;
}

const TIMED: GameMode[] = ['survival', 'sprint'];

export function Game({ mode, pool, onFinish }: Props) {
  const { getProgress, recordAnswer, settings } = useAppStore();
  const reducedMotion = useReducedMotion() ?? false;
  const [session] = useState(
    () => new GameSession({ mode, pool, progress: getProgress, onAnswer: recordAnswer }, performance.now()),
  );
  const snap = useSyncExternalStore(session.subscribe, session.getSnapshot);
  /** Улетающая копия отвеченной карточки; удаляется по таймеру, поэтому не может «залипнуть». */
  const [ghost, setGhost] = useState<{
    seq: number;
    word: WordItem;
    dir: Article;
    from: { x: number; y: number };
  } | null>(null);
  const [nudge, setNudge] = useState<{ article: Article; seq: number } | null>(null);

  // Таймаут карточки / конец спринта считаются в rAF по performance.now().
  useFrame(
    (now) => {
      const out = session.tick(now);
      if (out?.kind === 'wrong') playError();
    },
    snap.phase === 'playing' && snap.timer !== null,
  );

  const onFinishRef = useRef(onFinish);
  useEffect(() => {
    onFinishRef.current = onFinish;
  });
  useEffect(() => {
    if (snap.phase !== 'finished') return;
    const id = window.setTimeout(() => onFinishRef.current(snap), 220);
    return () => window.clearTimeout(id);
  }, [snap]);

  // Скрытие вкладки = авто-пауза в режимах с таймером.
  useEffect(() => {
    if (!TIMED.includes(mode)) return;
    const onVis = () => {
      if (document.visibilityState === 'hidden') session.pause(performance.now());
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [mode, session]);

  useEffect(() => {
    if (!ghost) return;
    const id = window.setTimeout(() => setGhost((g) => (g?.seq === ghost.seq ? null : g)), FLY_MS + 60);
    return () => window.clearTimeout(id);
  }, [ghost]);

  const handleArticle = useCallback(
    (a: Article, from: { x: number; y: number } = { x: 0, y: 0 }) => {
      unlockAudio();
      const before = session.getSnapshot();
      const out = session.answer(a, performance.now());
      if ((out.kind === 'correct' || out.kind === 'lock_release') && before.current) {
        setGhost({ seq: before.cardSeq, word: before.current, dir: a, from });
      }
      switch (out.kind) {
        case 'correct':
          playCorrect(out.combo, isFever(out.combo));
          if (out.bonusTime || out.feverStart) playBonus();
          break;
        case 'wrong':
          playError();
          break;
        case 'lock_wrong':
          playNudge();
          setNudge((n) => ({ article: a, seq: (n?.seq ?? 0) + 1 }));
          break;
      }
    },
    [session],
  );

  const togglePause = useCallback(() => {
    const now = performance.now();
    const phase = session.getSnapshot().phase;
    if (phase === 'paused') session.resume(now);
    else session.pause(now);
  }, [session]);

  useKeyboard({ onArticle: (a) => handleArticle(a), onEscape: togglePause }, snap.phase !== 'finished');

  const word = snap.current;
  const locked = snap.phase === 'error_lock';
  const fever = isFever(snap.combo);
  const hints = KEY_HINTS[settings.keyPreset];
  const liveText =
    locked && word
      ? `${snap.lockAnswer === 'timeout' ? 'Время вышло' : 'Неверно'}. Правильно: ${word.article} ${word.word}. Нажми ${word.article}.`
      : '';

  return (
    <div className={`safe-pad mx-auto flex min-h-dvh w-full max-w-xl flex-col ${fever ? 'fever-frame' : ''}`}>
      <Hud snap={snap} onBack={togglePause} onFinish={() => session.finish(performance.now())} />

      <div className="mt-3 h-2">{mode === 'survival' && <TimeBar timer={snap.timer} totalMs={snap.timerTotalMs} />}</div>

      <main className="flex flex-1 flex-col items-center justify-center py-4">
        <div className="relative w-full max-w-md" style={{ height: 'clamp(270px, 46dvh, 360px)' }}>
          {word && snap.phase !== 'finished' && (
            <motion.div
              key={snap.cardSeq}
              className="absolute inset-0"
              initial={reducedMotion ? { opacity: 0 } : CARD_ENTER}
              animate={reducedMotion ? { opacity: 1, transition: { duration: 0.08 } } : CARD_CENTER}
            >
              <Card
                word={word}
                phase={snap.phase}
                showTranslation={settings.showTranslationBeforeAnswer}
                reducedMotion={reducedMotion}
                keyHint={hints[word.article]}
                onSwipe={handleArticle}
              />
            </motion.div>
          )}
          {ghost && (
            <motion.div
              key={`ghost-${ghost.seq}`}
              className="pointer-events-none absolute inset-0 z-10"
              initial={{ x: ghost.from.x, y: ghost.from.y, opacity: 1 }}
              animate={flyTarget(ghost.dir, reducedMotion)}
              transition={{ duration: FLY_MS / 1000, ease: 'easeIn' }}
              aria-hidden
            >
              <Card
                word={ghost.word}
                phase="finished"
                showTranslation={settings.showTranslationBeforeAnswer}
                reducedMotion
                keyHint=""
                onSwipe={() => {}}
              />
            </motion.div>
          )}
        </div>

        <div className="mt-4 h-6 truncate text-center text-sm text-muted" lang="de">
          {snap.previous && (
            <>
              <span className={`font-bold ${ART[snap.previous.article].text}`}>{snap.previous.article}</span>{' '}
              <span className="text-ink">{snap.previous.word}</span>
              <span lang="ru"> — {snap.previous.translation}</span>
            </>
          )}
        </div>
      </main>

      <div aria-live="assertive" className="sr-only">
        {liveText}
      </div>

      <footer className="pb-1">
        <AnswerButtons
          keyPreset={settings.keyPreset}
          onPress={handleArticle}
          expected={locked && word ? word.article : null}
          nudge={nudge}
          reducedMotion={reducedMotion}
        />
      </footer>

      <AnimatePresence>
        {snap.phase === 'paused' && (
          <Dialog
            title="Пауза"
            onClose={togglePause}
            actions={
              <>
                <DialogButton variant="primary" onClick={togglePause}>
                  Продолжить
                </DialogButton>
                <DialogButton onClick={() => session.finish(performance.now())}>Завершить раунд</DialogButton>
              </>
            }
          >
            {MODE_TITLES[mode]} · счёт {snap.score.toLocaleString('ru-RU')}. Таймер остановлен.
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}
