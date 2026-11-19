import { motion, useAnimationControls } from 'framer-motion';
import { useEffect, type ReactNode } from 'react';
import { KEY_HINTS } from '../input/keymap';
import { ARTICLES, type Article, type KeyPreset } from '../types/game';
import { ART } from './articleStyles';

interface Props {
  keyPreset: KeyPreset;
  onPress: (a: Article) => void;
  /** В ERROR_LOCK подсвечиваем правильную кнопку. */
  expected: Article | null;
  /** Неверная кнопка во время ERROR_LOCK трясётся. */
  nudge: { article: Article; seq: number } | null;
  reducedMotion: boolean;
}

/** Общая «клавиша»: срабатывает на pointerdown (на ~100 мс быстрее click на телефонах). */
export function PressKey({
  label,
  hint,
  ariaLabel,
  onPress,
  className,
  nudgeSeq = 0,
  reducedMotion,
}: {
  label: ReactNode;
  hint?: string;
  ariaLabel: string;
  onPress: () => void;
  className: string;
  nudgeSeq?: number;
  reducedMotion: boolean;
}) {
  const controls = useAnimationControls();
  useEffect(() => {
    if (nudgeSeq > 0 && !reducedMotion) {
      void controls.start({ x: [0, -7, 7, -4, 4, 0], transition: { duration: 0.25 } });
    }
  }, [nudgeSeq, reducedMotion, controls]);

  return (
    <motion.button
      type="button"
      animate={controls}
      whileTap={{ y: 2 }}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        onPress();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onPress();
        }
      }}
      aria-label={ariaLabel}
      className={`relative flex flex-1 items-center justify-center rounded-lg font-display font-extrabold transition-opacity shadow-[inset_0_-4px_0_rgb(0_0_0/0.22)] active:shadow-[inset_0_-2px_0_rgb(0_0_0/0.22)] ${className}`}
    >
      {label}
      {hint && (
        <span className="absolute right-2 bottom-1.5 hidden font-sans text-[11px] font-semibold opacity-70 sm:block">
          {hint}
        </span>
      )}
    </motion.button>
  );
}

export function AnswerButtons({ keyPreset, onPress, expected, nudge, reducedMotion }: Props) {
  const hints = KEY_HINTS[keyPreset];
  return (
    <div className="flex w-full gap-2 sm:gap-3">
      {ARTICLES.map((a) => {
        const s = ART[a];
        const dimmed = expected !== null && expected !== a;
        const emphasized = expected === a;
        return (
          <PressKey
            key={a}
            label={s.label}
            hint={hints[a]}
            ariaLabel={`${s.label}, ${s.gender} род`}
            onPress={() => onPress(a)}
            nudgeSeq={nudge?.article === a ? nudge.seq : 0}
            reducedMotion={reducedMotion}
            className={`h-16 text-[1.75rem] text-white sm:h-20 sm:text-[2rem] ${s.bg} ${dimmed ? 'opacity-30' : ''} ${
              emphasized ? 'outline-3 outline-offset-2 outline-chalk' : ''
            }`}
          />
        );
      })}
    </div>
  );
}
