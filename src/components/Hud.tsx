import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Flag, Heart } from 'lucide-react';
import { SURVIVAL_LIVES } from '../engine/modes';
import { comboMultiplier, isFever } from '../engine/scoring';
import type { SessionSnapshot } from '../engine/session';
import { SprintClock } from './TimeBar';

interface Props {
  snap: SessionSnapshot;
  onBack: () => void;
  onFinish: () => void;
}

export function Hud({ snap, onBack, onFinish }: Props) {
  const mult = comboMultiplier(snap.combo);
  const fever = isFever(snap.combo);

  return (
    <header className="flex h-12 w-full items-center gap-3">
      <button
        type="button"
        onClick={onBack}
        className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-2 text-muted hover:text-ink"
        aria-label="Пауза"
        title="Пауза (Esc)"
      >
        <ArrowLeft size={20} />
      </button>

      <div className="flex min-w-0 flex-1 items-center gap-3">
        {snap.mode === 'survival' && (
          <div className="flex gap-1" aria-label={`Жизни: ${snap.lives} из ${SURVIVAL_LIVES}`}>
            {Array.from({ length: SURVIVAL_LIVES }, (_, i) => (
              <Heart
                key={i}
                size={20}
                className={i < snap.lives ? 'fill-die text-die' : 'text-line'}
                aria-hidden
              />
            ))}
          </div>
        )}
        {snap.mode === 'sprint' && (
          <div className="relative text-xl font-bold" aria-label="Оставшееся время">
            <SprintClock timer={snap.timer} />
            <span className="ml-0.5 text-sm text-muted">s</span>
            <AnimatePresence>
              {snap.bonusSeq > 0 && (
                <motion.span
                  key={snap.bonusSeq}
                  initial={{ opacity: 1, y: 0 }}
                  animate={{ opacity: 0, y: -22 }}
                  transition={{ duration: 0.9 }}
                  className="absolute -top-1 left-full ml-1 text-sm font-bold text-das"
                >
                  +3s
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        )}
        {(snap.mode === 'mistakes' || snap.mode === 'round_review') && (
          <span className="text-sm text-muted">
            Осталось: <b className="text-ink tabular-nums">{snap.remainingWords}</b>
          </span>
        )}
        {snap.mode === 'zen' && (
          <button
            type="button"
            onClick={onFinish}
            className="flex items-center gap-1.5 rounded-xl bg-surface-2 px-3 py-2 text-sm text-muted hover:text-ink"
          >
            <Flag size={16} /> Завершить раунд
          </button>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {mult > 1 && (
          <span
            className={`rounded-lg px-2 py-1 text-xs font-extrabold ${
              fever ? 'bg-fever text-black' : 'bg-surface-2 text-ink'
            }`}
          >
            {fever ? 'FEVER x4' : `x${mult}`}
          </span>
        )}
        <span className="min-w-[4.5ch] text-right text-xl font-bold tabular-nums" aria-label="Счёт">
          {snap.score.toLocaleString('ru-RU')}
        </span>
      </div>
    </header>
  );
}
