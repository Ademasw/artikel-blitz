import { motion } from 'framer-motion';
import { Home as HomeIcon, RotateCcw, Sparkles, Target, Trophy } from 'lucide-react';
import { useEffect } from 'react';
import { ART } from '../components/articleStyles';
import { HighlightedWord } from '../components/Card';
import { RuleBadge } from '../components/RuleBadge';
import { MODE_TITLES } from '../engine/modes';
import type { SessionSummary } from '../engine/session';
import type { GameMode } from '../types/game';
import { playRecord } from '../utils/sound';

interface Props {
  mode: GameMode;
  summary: SessionSummary;
  isRecord: boolean;
  onReplay: () => void;
  onReviewMistakes: () => void;
  onMenu: () => void;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface-2 px-3 py-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-0.5 text-xl font-bold tabular-nums">{value}</div>
    </div>
  );
}

export function Summary({ mode, summary, isRecord, onReplay, onReviewMistakes, onMenu }: Props) {
  useEffect(() => {
    if (isRecord) playRecord();
  }, [isRecord]);

  const mistakes = summary.uniqueMistakes;
  const avg = summary.avgReactionMs === null ? '—' : `${(summary.avgReactionMs / 1000).toFixed(2)} с`;

  return (
    <div className="safe-pad mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-5">
      <header className="pt-4 text-center">
        <div className="text-sm text-muted">{MODE_TITLES[mode]} · итоги</div>
        <motion.div
          className="mt-1 text-6xl font-extrabold tabular-nums"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          {summary.score.toLocaleString('ru-RU')}
        </motion.div>
        {isRecord && (
          <motion.div
            className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-fever px-3 py-1 text-sm font-bold text-black"
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            <Trophy size={16} /> Новый рекорд!
          </motion.div>
        )}
      </header>

      <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Metric label="Слов пройдено" value={String(summary.cards)} />
        <Metric label="Точность" value={`${Math.round(summary.accuracy * 100)}%`} />
        <Metric label="Средняя реакция" value={avg} />
        <Metric label="Макс. комбо" value={String(summary.maxCombo)} />
      </section>

      <section className="flex min-h-0 flex-1 flex-col">
        <h2 className="mb-2 text-sm font-semibold text-muted">Ошибки раунда</h2>
        {mistakes.length === 0 ? (
          <div className="grid flex-1 place-items-center rounded-2xl border border-line py-10 text-center">
            <div>
              <Sparkles className="mx-auto text-fever" size={28} />
              <div className="mt-2 text-lg font-bold">Идеальный раунд!</div>
              <div className="text-sm text-muted">Ни одной ошибки.</div>
            </div>
          </div>
        ) : (
          <ul className="flex max-h-[40dvh] flex-col gap-2 overflow-y-auto pr-1">
            {mistakes.map(({ word, userAnswer }) => {
              const s = ART[word.article];
              return (
                <li key={word.id} className="rounded-2xl border border-line bg-surface px-4 py-3">
                  <div className="flex flex-wrap items-baseline gap-x-2" lang="de">
                    <span className={`font-extrabold ${s.text}`}>{word.article}</span>
                    <span className="text-lg font-bold">
                      <HighlightedWord word={word.word} highlight={word.highlight} color={s.text} />
                    </span>
                    <span className="text-sm text-muted">{word.plural ? `· die ${word.plural}` : '· нет мн. ч.'}</span>
                  </div>
                  <div className="mt-0.5 text-sm text-muted">
                    {word.translation} · твой ответ:{' '}
                    <span className={userAnswer === 'timeout' ? 'text-warn' : ART[userAnswer].text}>
                      {userAnswer === 'timeout' ? 'время вышло' : userAnswer}
                    </span>
                  </div>
                  <div className="mt-2">
                    <RuleBadge word={word} compact />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <footer className="flex flex-col gap-2 pb-2">
        {mistakes.length > 0 && (
          <button
            type="button"
            onClick={onReviewMistakes}
            className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-ink font-bold text-bg"
          >
            <Target size={18} /> Прогнать ошибки этого раунда ({mistakes.length})
          </button>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onReplay}
            className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl font-semibold ${
              mistakes.length === 0 ? 'bg-ink text-bg' : 'bg-surface-2'
            }`}
          >
            <RotateCcw size={18} /> Сыграть ещё
          </button>
          <button
            type="button"
            onClick={onMenu}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-surface-2 font-semibold"
          >
            <HomeIcon size={18} /> В меню
          </button>
        </div>
      </footer>
    </div>
  );
}
