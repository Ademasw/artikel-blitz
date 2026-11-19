import { AnimatePresence, motion } from 'framer-motion';
import { Flag, Heart, Pause } from 'lucide-react';
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
        className="grid size-10 shrink-0 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
        aria-label="Пауза"
        title="Пауза (Esc)"
      >
        <Pause size={20} />
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
          <div className="relative font-display text-2xl font-bold" aria-label="Оставшееся время">
            <SprintClock timer={snap.timer} />
            <span className="ml-0.5 text-base text-muted">с</span>
            <AnimatePresence>
              {snap.bonusSeq > 0 && (
                <motion.span
                  key={snap.bonusSeq}
                  initial={{ opacity: 1, y: 0 }}
                  animate={{ opacity: 0, y: -22 }}
                  transition={{ duration: 0.9 }}
                  className="absolute -top-1 left-full ml-1 text-base font-bold text-chalk"
                >
                  +3
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        )}
        {(snap.mode === 'mistakes' || snap.mode === 'round_review') && (
          <span className="text-sm text-muted">
            Осталось <b className="font-display text-lg text-ink tabular-nums">{snap.remainingWords}</b>
          </span>
        )}
        {snap.mode === 'zen' && (
          <button
            type="button"
            onClick={onFinish}
            className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm text-muted hover:bg-surface-2 hover:text-ink"
          >
            <Flag size={16} /> Закончить
          </button>
        )}
      </div>

      <div className="flex shrink-0 items-baseline gap-2">
        {mult > 1 && (
          <span
            className={`rounded-[4px] px-1.5 py-0.5 font-display text-sm font-extrabold ${
              fever ? 'bg-chalk text-paper-ink' : 'text-chalk'
            }`}
          >
            {fever ? 'Fever ×4' : `×${mult}`}
          </span>
        )}
        <span className="min-w-[4.5ch] text-right font-display text-2xl font-bold tabular-nums" aria-label="Счёт">
          {snap.score.toLocaleString('ru-RU')}
        </span>
      </div>
    </header>
  );
}
