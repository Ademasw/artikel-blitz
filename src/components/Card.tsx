import { motion, useAnimationControls, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { Article, GamePhase, WordItem } from '../types/game';
import { ART, ART_DIRECTION } from './articleStyles';
import { RuleBadge } from './RuleBadge';

export const SWIPE_THRESHOLD = 80;

interface Props {
  word: WordItem;
  phase: GamePhase;
  showTranslation: boolean;
  reducedMotion: boolean;
  keyHint: string;
  onSwipe: (a: Article, from: { x: number; y: number }) => void;
}

function swipeArticle(dx: number, dy: number): Article | null {
  if (Math.abs(dx) >= Math.abs(dy)) {
    if (dx <= -SWIPE_THRESHOLD) return 'der';
    if (dx >= SWIPE_THRESHOLD) return 'das';
  } else if (dy <= -SWIPE_THRESHOLD) {
    return 'die';
  }
  return null;
}

export const CARD_ENTER = { opacity: 0, scale: 0.94, y: 10 };
export const CARD_CENTER = { opacity: 1, scale: 1, x: 0, y: 0, transition: { duration: 0.12, ease: 'easeOut' } } as const;
export const FLY_MS = 140;

/** Куда улетает карточка после ответа: в сторону выбранного артикля. */
export function flyTarget(dir: Article | null, reducedMotion: boolean) {
  if (!dir || reducedMotion) return { opacity: 0 };
  const d = ART_DIRECTION[dir];
  return { x: d.x * 460, y: d.y * 460, rotate: d.x * 14, opacity: 0 };
}

/** Слово с подсвеченным окончанием (совпадение с концом слова). */
export function HighlightedWord({ word, highlight, color }: { word: string; highlight?: string; color: string }) {
  if (!highlight || !word.endsWith(highlight) || highlight.length >= word.length) return <>{word}</>;
  const stem = word.slice(0, word.length - highlight.length);
  return (
    <>
      {stem}
      <span className={`${color} underline decoration-2 underline-offset-[6px]`}>{highlight}</span>
    </>
  );
}

export function Card({ word, phase, showTranslation, reducedMotion, keyHint, onSwipe }: Props) {
  const locked = phase === 'error_lock';
  const correct = ART[word.article];
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-12, 12]);
  const [dragDir, setDragDir] = useState<Article | null>(null);
  const shake = useAnimationControls();

  useEffect(() => {
    if (locked && !reducedMotion) {
      void shake.start({ x: [0, -14, 12, -9, 7, -4, 0], transition: { duration: 0.38 } });
    }
  }, [locked, reducedMotion, shake]);

  const onDrag = (_: unknown, info: PanInfo) => {
    const dir = swipeArticle(info.offset.x, info.offset.y);
    if (dir !== dragDir) setDragDir(dir);
  };
  const onDragEnd = (_: unknown, info: PanInfo) => {
    setDragDir(null);
    const dir = swipeArticle(info.offset.x, info.offset.y);
    if (dir) onSwipe(dir, { x: info.offset.x, y: info.offset.y });
  };

  const translationVisible = showTranslation || !!word.alwaysShowTranslation || locked;
  const borderClass = locked ? correct.border : dragDir ? ART[dragDir].border : 'border-line';
  const longWord = word.word.length + (locked ? 4 : 0) > 12;

  return (
    <motion.div
      className="absolute inset-0 touch-none select-none"
      style={{ x, y, rotate }}
      drag={phase === 'playing' || locked}
      dragSnapToOrigin
      dragElastic={0.55}
      dragMomentum={false}
      onDrag={onDrag}
      onDragEnd={onDragEnd}
    >
      <motion.div
        animate={shake}
        className={`relative flex h-full flex-col rounded-3xl border-2 bg-surface px-5 pt-4 pb-4 shadow-[0_20px_60px_-20px_rgb(0_0_0/0.7)] transition-colors duration-100 ${borderClass}`}
      >
        {locked && <div className={`pointer-events-none absolute inset-0 rounded-[22px] ${correct.soft}`} />}

        <div className="relative flex items-center justify-between text-xs font-semibold tracking-wide">
          <span className="rounded-md bg-surface-2 px-2 py-1 text-muted">{word.level}</span>
          {word.alwaysShowTranslation && !locked && (
            <span className="rounded-md bg-surface-2 px-2 py-1 text-muted">омоним</span>
          )}
        </div>

        <div className="relative flex flex-1 flex-col items-center justify-center text-center">
          <div
            className="font-extrabold leading-tight tracking-tight break-words"
            style={{ fontSize: longWord ? 'clamp(1.6rem, 8.2vw, 2.6rem)' : 'clamp(2.2rem, 11vw, 3.4rem)' }}
            lang="de"
          >
            {locked && <span className={`${correct.text} mr-2`}>{correct.label}</span>}
            {locked ? <HighlightedWord word={word.word} highlight={word.highlight} color={correct.text} /> : word.word}
          </div>
          <div className={`mt-2 min-h-6 text-base text-muted ${translationVisible ? '' : 'invisible'}`}>
            {word.translation}
          </div>
        </div>

        {/* Зона обратной связи фиксированной высоты: макет не прыгает */}
        <div className="relative flex h-[92px] flex-col items-center justify-end gap-2 text-center">
          {locked && (
            <>
              <div className="text-sm text-muted" lang="de">
                {word.plural ? (
                  <>
                    мн. ч.: <span className="text-ink">die {word.plural}</span>
                  </>
                ) : (
                  'нет мн. ч.'
                )}
              </div>
              <RuleBadge word={word} />
              <div className="text-xs text-muted">
                Нажми <span className={`font-bold ${correct.text}`}>{correct.label}</span>
                <span className="hidden sm:inline"> ({keyHint})</span>, чтобы продолжить
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
