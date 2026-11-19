import { motion, useAnimationControls } from 'framer-motion';
import { useEffect } from 'react';
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

function AnswerButton({
  article,
  hint,
  onPress,
  dimmed,
  emphasized,
  nudgeSeq,
  reducedMotion,
}: {
  article: Article;
  hint: string;
  onPress: (a: Article) => void;
  dimmed: boolean;
  emphasized: boolean;
  nudgeSeq: number;
  reducedMotion: boolean;
}) {
  const s = ART[article];
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
      whileTap={{ scale: 0.96 }}
      onPointerDown={(e) => {
        // pointerdown вместо click: на ~100 мс быстрее на мобильных
        if (e.button !== 0) return;
        e.preventDefault();
        onPress(article);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onPress(article);
        }
      }}
      aria-label={`${s.label}, ${s.gender} род`}
      className={`relative flex h-16 flex-1 items-center justify-center rounded-2xl text-xl font-extrabold tracking-wide text-white uppercase shadow-lg transition-opacity sm:h-20 sm:text-2xl ${s.bg} ${
        dimmed ? 'opacity-35' : 'opacity-100'
      } ${emphasized ? 'ring-4 ring-white/70' : ''}`}
    >
      {s.label}
      <span className="absolute top-1.5 right-2 hidden rounded bg-black/25 px-1.5 text-[11px] font-semibold normal-case sm:block">
        {hint}
      </span>
    </motion.button>
  );
}

export function AnswerButtons({ keyPreset, onPress, expected, nudge, reducedMotion }: Props) {
  const hints = KEY_HINTS[keyPreset];
  return (
    <div className="flex w-full gap-2 sm:gap-3">
      {ARTICLES.map((a) => (
        <AnswerButton
          key={a}
          article={a}
          hint={hints[a]}
          onPress={onPress}
          dimmed={expected !== null && expected !== a}
          emphasized={expected === a}
          nudgeSeq={nudge?.article === a ? nudge.seq : 0}
          reducedMotion={reducedMotion}
        />
      ))}
    </div>
  );
}
