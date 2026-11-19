import { motion } from 'framer-motion';
import { Home as HomeIcon, RotateCcw, Target, Volume2 } from 'lucide-react';
import { useEffect } from 'react';
import { ART } from '../components/articleStyles';
import { HighlightedWord } from '../components/Card';
import { RuleBadge } from '../components/RuleBadge';
import { dayKey } from '../engine/daily';
import { MODE_TITLES } from '../engine/modes';
import type { SessionSummary } from '../engine/session';
import { useAppStore } from '../state/AppStore';
import type { GameMode } from '../types/game';
import { playRecord } from '../utils/sound';
import { speak, speechSupported } from '../utils/speech';

interface Props {
  mode: GameMode;
  summary: SessionSummary;
  isRecord: boolean;
  onReplay: () => void;
  onReviewMistakes: () => void;
  onMenu: () => void;
}

/** Строка показателей на доске: число крупно, подпись мелко, разделители мелом. */
export function MetricsRow({ items }: { items: { label: string; value: string }[] }) {
  return (
    <dl className="chalk-rule grid grid-cols-2 border-y sm:grid-cols-4">
      {items.map((m, i) => (
        <div
          key={m.label}
          className={`chalk-rule px-3 py-3 ${i % 2 === 1 ? 'border-l' : ''} ${i >= 2 ? 'border-t sm:border-t-0' : ''} ${
            i === 2 ? 'sm:border-l' : ''
          }`}
        >
          <dt className="text-xs text-muted">{m.label}</dt>
          <dd className="font-display text-2xl font-bold tabular-nums">{m.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function GoalLine() {
  const { daily, settings } = useAppStore();
  const done = daily[dayKey(new Date())]?.answers ?? 0;
  const goal = settings.dailyGoal;
  return (
    <p className="text-center text-sm text-muted">
      {done >= goal ? (
        <span className="text-chalk">Цель дня выполнена: {done} из {goal}</span>
      ) : (
        <>
          Сегодня {done} из {goal}. До цели дня ещё {goal - done}.
        </>
      )}
    </p>
  );
}

export function Summary({ mode, summary, isRecord, onReplay, onReviewMistakes, onMenu }: Props) {
  useEffect(() => {
    if (isRecord) playRecord();
  }, [isRecord]);

  const mistakes = summary.uniqueMistakes;
  const avg = summary.avgReactionMs === null ? '—' : `${(summary.avgReactionMs / 1000).toFixed(2)} с`;
  const canSpeak = speechSupported();

  return (
    <div className="safe-pad mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-5">
      <header className="pt-4 text-center">
        <div className="text-sm text-muted">{MODE_TITLES[mode]}</div>
        <motion.div
          className="mt-1 font-display text-7xl leading-none font-extrabold tabular-nums"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          {summary.score.toLocaleString('ru-RU')}
        </motion.div>
        {isRecord && (
          <motion.div
            className="mt-3 inline-block -rotate-2 rounded-[3px] bg-chalk px-3 py-1 font-display text-lg font-bold text-paper-ink"
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            Новый рекорд
          </motion.div>
        )}
      </header>

      <MetricsRow
        items={[
          { label: 'Слов', value: String(summary.cards) },
          { label: 'Точность', value: `${Math.round(summary.accuracy * 100)}%` },
          { label: 'Средняя реакция', value: avg },
          { label: 'Лучшая серия', value: String(summary.maxCombo) },
        ]}
      />

      <GoalLine />

      <section className="flex min-h-0 flex-1 flex-col">
        <h2 className="mb-3 font-display text-xl font-bold">
          {mistakes.length === 0 ? 'Ни одной ошибки' : `Ошибки: ${mistakes.length}`}
        </h2>
        {mistakes.length === 0 ? (
          <p className="text-sm text-muted">Все слова раунда угаданы с первой попытки.</p>
        ) : (
          <ul className="flex max-h-[42dvh] flex-col gap-2.5 overflow-y-auto px-1 pb-2">
            {mistakes.map(({ word, userAnswer }, i) => {
              const s = ART[word.article];
              return (
                <li
                  key={word.id}
                  className={`paper-slip relative px-4 py-3 ${i % 2 ? 'rotate-[0.4deg]' : '-rotate-[0.3deg]'}`}
                >
                  <div className={`absolute inset-y-0 left-0 w-1 rounded-l-[4px] ${s.bg}`} aria-hidden />
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2" lang="de">
                        <span className={`font-display text-xl font-extrabold ${s.text}`}>{word.article}</span>
                        <span className="font-display text-xl font-bold">
                          <HighlightedWord word={word.word} highlight={word.highlight} color={s.text} />
                        </span>
                        <span className="text-sm text-paper-muted">
                          {word.plural ? `мн. ч. die ${word.plural}` : 'нет мн. ч.'}
                        </span>
                      </div>
                      <div className="mt-0.5 text-sm text-paper-muted">
                        {word.translation}. Ваш ответ:{' '}
                        <span className={`font-semibold ${userAnswer === 'timeout' ? 'text-paper-ink' : ART[userAnswer].text}`}>
                          {userAnswer === 'timeout' ? 'время вышло' : userAnswer}
                        </span>
                      </div>
                      <div className="mt-2">
                        <RuleBadge word={word} compact />
                      </div>
                    </div>
                    {canSpeak && (
                      <button
                        type="button"
                        onClick={() => speak(`${word.article} ${word.word}`)}
                        className="grid size-9 shrink-0 place-items-center rounded-md text-paper-muted hover:bg-black/5 hover:text-paper-ink"
                        aria-label={`Произнести: ${word.article} ${word.word}`}
                      >
                        <Volume2 size={18} />
                      </button>
                    )}
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
            className="flex h-14 items-center justify-center gap-2 rounded-lg bg-ink font-semibold text-bg"
          >
            <Target size={18} /> Повторить ошибки этого раунда
          </button>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onReplay}
            className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-lg font-semibold ${
              mistakes.length === 0 ? 'bg-ink text-bg' : 'bg-surface-2'
            }`}
          >
            <RotateCcw size={18} /> Сыграть ещё
          </button>
          <button
            type="button"
            onClick={onMenu}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-surface-2 font-semibold"
          >
            <HomeIcon size={18} /> В меню
          </button>
        </div>
      </footer>
    </div>
  );
}
