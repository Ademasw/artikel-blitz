import { motion, useAnimationControls, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import { Volume2 } from 'lucide-react';
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
  /** Озвучить слово (кнопка в разборе ошибки). */
  onSpeak?: () => void;
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

export const CARD_ENTER = { opacity: 0, scale: 0.96, y: 14, rotate: 0 };
export const CARD_CENTER = {
  opacity: 1,
  scale: 1,
  x: 0,
  y: 0,
  rotate: 0,
  transition: { duration: 0.12, ease: 'easeOut' },
} as const;
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
      <span className={`${color} underline decoration-[3px] underline-offset-[7px]`}>{highlight}</span>
    </>
  );
}

export function Card({ word, phase, showTranslation, reducedMotion, keyHint, onSwipe, onSpeak }: Props) {
  const locked = phase === 'error_lock';
  const correct = ART[word.article];
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-10, 10]);
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
  // Шапка карточки: в разборе — цвет правильного артикля, при свайпе — цвет направления
  const band = locked ? correct.bg : dragDir ? ART[dragDir].bg : 'bg-transparent';
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
      <motion.div animate={shake} className="paper-card relative flex h-full flex-col overflow-hidden px-5 pb-4">
        <div className={`absolute inset-x-0 top-0 h-1.5 transition-colors duration-100 ${band}`} aria-hidden />

        <div className="relative flex h-12 items-center justify-between text-xs font-semibold text-paper-muted">
          <span>{word.level}</span>
          {word.alwaysShowTranslation && !locked && <span>омоним: смотри перевод</span>}
          {locked && onSpeak && (
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={onSpeak}
              className="-mr-2 grid size-9 place-items-center rounded-md text-paper-muted hover:bg-black/5 hover:text-paper-ink"
              aria-label="Произнести слово"
            >
              <Volume2 size={18} />
            </button>
          )}
        </div>

        <div className="relative flex flex-1 flex-col items-center justify-center text-center">
          <div
            className="font-display leading-[1.05] font-extrabold tracking-tight break-words"
            style={{ fontSize: longWord ? 'clamp(1.9rem, 9vw, 2.9rem)' : 'clamp(2.6rem, 13vw, 3.9rem)' }}
            lang="de"
          >
            {locked && <span className={`${correct.text} mr-2.5`}>{correct.label}</span>}
            {locked ? <HighlightedWord word={word.word} highlight={word.highlight} color={correct.text} /> : word.word}
          </div>
          <div
            className={`mt-2 min-h-6 text-base text-paper-muted ${translationVisible ? '' : 'invisible'}`}
          >
            {word.translation}
          </div>
        </div>

        {/* Зона обратной связи фиксированной высоты: макет не прыгает */}
        <div className="relative flex h-[92px] flex-col items-center justify-end gap-2 text-center">
          {locked && (
            <>
              <div className="text-sm text-paper-muted" lang="de">
                {word.plural ? (
                  <>
                    мн. ч.: <span className="font-semibold text-paper-ink">die {word.plural}</span>
                  </>
                ) : (
                  'нет мн. ч.'
                )}
              </div>
              <RuleBadge word={word} />
              <div className="text-xs text-paper-muted">
                Нажмите <span className={`font-bold ${correct.text}`}>{correct.label}</span>
                <span className="hidden sm:inline"> ({keyHint})</span>, чтобы продолжить
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
