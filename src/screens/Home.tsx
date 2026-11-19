import { BarChart3, ChevronRight, Flame, Heart, Layers, Leaf, Settings, Timer, Zap } from 'lucide-react';
import type { ReactNode } from 'react';
import { getAllWords } from '../data/dictionaryRepository';
import { dayKey, lastDays, streak } from '../engine/daily';
import { isReflex } from '../engine/mastery';
import { LEVEL_FILTER_LABELS, RULE_FILTER_LABELS, buildPool, matchesLevel } from '../engine/modes';
import { useAppStore } from '../state/AppStore';
import type { GameMode, LevelFilter, RuleFilter } from '../types/game';

type PlayableMode = Exclude<GameMode, 'round_review'>;

interface Props {
  ruleFilter: RuleFilter;
  onRuleFilter: (f: RuleFilter) => void;
  onStart: (mode: PlayableMode) => void;
  onStartCases: () => void;
  onOpenSettings: () => void;
  onOpenStats: () => void;
}

const WEEKDAY = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

function daysWord(n: number): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return 'день';
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'дня';
  return 'дней';
}

/** Карточка «Сегодня»: цель дня, серия, неделя. Главный объект экрана. */
function TodayCard() {
  const { daily, settings } = useAppStore();
  const today = new Date();
  const goal = settings.dailyGoal;
  const done = daily[dayKey(today)]?.answers ?? 0;
  const frac = Math.min(1, done / goal);
  const series = streak(daily, goal, today);
  const week = lastDays(daily, 7, goal, today);

  return (
    <section className="paper-card relative -rotate-[0.6deg] px-5 pt-0 pb-5" aria-label="Цель на сегодня">
      <div className="flex h-12 items-center justify-between text-sm font-semibold text-paper-muted">
        <span>Сегодня</span>
        <span className={`flex items-center gap-1 ${series > 0 ? 'text-paper-ink' : ''}`}>
          <Flame size={16} className={series > 0 ? 'fill-chalk text-[#c9961b]' : ''} aria-hidden />
          {series > 0 ? `${series} ${daysWord(series)} подряд` : 'серии пока нет'}
        </span>
      </div>

      <div className="flex items-baseline gap-2 font-display">
        <span className="text-[3.25rem] leading-none font-extrabold tabular-nums">{done}</span>
        <span className="text-xl font-semibold text-paper-muted">из {goal} ответов</span>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-paper-ink/10">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${frac >= 1 ? 'bg-das' : 'bg-paper-ink'}`}
          style={{ width: `${frac * 100}%` }}
        />
      </div>
      <p className="mt-2 text-sm text-paper-muted">
        {frac >= 1 ? 'Цель на сегодня выполнена.' : `Ещё ${goal - done} — и день засчитан в серию.`}
      </p>

      <ol className="mt-4 grid grid-cols-7 gap-1.5" aria-label="Последние 7 дней">
        {week.map((d, i) => {
          const isToday = i === week.length - 1;
          return (
            <li key={d.key} className="flex flex-col items-center gap-1">
              <span
                className={`grid size-8 place-items-center rounded-full text-[11px] font-bold ${
                  d.goalMet
                    ? 'bg-paper-ink text-paper'
                    : d.answers > 0
                      ? 'border-2 border-paper-ink/40 text-paper-ink'
                      : 'border border-dashed border-paper-ink/25 text-transparent'
                } ${isToday ? 'outline-2 outline-offset-2 outline-[#c9961b]' : ''}`}
                aria-label={`${d.key}: ${d.answers} ответов${d.goalMet ? ', цель выполнена' : ''}`}
              >
                {d.goalMet ? '✓' : d.answers > 0 ? d.answers : '·'}
              </span>
              <span className={`text-[11px] ${isToday ? 'font-bold text-paper-ink' : 'text-paper-muted'}`}>
                {WEEKDAY[d.date.getDay()]}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function ModeRow({
  icon,
  title,
  description,
  meta,
  disabledLabel,
  onStart,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: ReactNode;
  meta?: ReactNode;
  disabledLabel?: string | null;
  onStart: () => void;
  children?: ReactNode;
}) {
  const disabled = !!disabledLabel;
  return (
    <li className="chalk-rule border-b last:border-b-0">
      <button
        type="button"
        disabled={disabled}
        onClick={onStart}
        className={`group flex w-full items-center gap-4 py-4 text-left ${disabled ? 'opacity-45' : ''}`}
      >
        <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-surface-2 text-ink group-hover:bg-ink group-hover:text-bg">
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-xl leading-tight font-bold">{title}</span>
          <span className="block text-sm text-muted">{disabled ? disabledLabel : description}</span>
        </span>
        {meta && <span className="shrink-0 text-right">{meta}</span>}
        <ChevronRight size={18} className="shrink-0 text-muted group-hover:text-ink" aria-hidden />
      </button>
      {children}
    </li>
  );
}

function Best({ value }: { value: number }) {
  if (value <= 0) return null;
  return (
    <>
      <span className="block text-[11px] text-muted">рекорд</span>
      <span className="block font-display text-lg leading-none font-bold text-chalk tabular-nums">
        {value.toLocaleString('ru-RU')}
      </span>
    </>
  );
}

export function Home({ ruleFilter, onRuleFilter, onStart, onStartCases, onOpenSettings, onOpenStats }: Props) {
  const { progress, highScores, levelFilter, setLevelFilter } = useAppStore();
  const words = getAllWords();
  const inLevel = words.filter((w) => matchesLevel(w, levelFilter));
  const reflex = words.filter((w) => isReflex(progress[w.id])).length;
  const problematic = buildPool('mistakes', words, progress, levelFilter, 'ALL').length;
  const zenPool = buildPool('zen', words, progress, levelFilter, ruleFilter).length;
  const noWords = inLevel.length === 0 ? 'Нет слов под фильтр' : null;

  return (
    <div className="safe-pad mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-6">
      <header className="flex items-start justify-between pt-2">
        <div>
          <h1 className="font-display text-[2.6rem] leading-none font-extrabold tracking-tight">
            Artikel Blitz
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            {reflex} из {words.length} слов уже на рефлексе
          </p>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onOpenStats}
            className="grid size-11 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
            aria-label="Статистика"
          >
            <BarChart3 size={22} />
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="grid size-11 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
            aria-label="Настройки"
          >
            <Settings size={22} />
          </button>
        </div>
      </header>

      <TodayCard />

      <section className="flex items-center gap-3">
        <span className="text-sm text-muted">Слова</span>
        <div role="radiogroup" aria-label="Уровень сложности" className="flex flex-1 rounded-lg bg-surface p-1">
          {(Object.keys(LEVEL_FILTER_LABELS) as LevelFilter[]).map((f) => (
            <button
              key={f}
              type="button"
              role="radio"
              aria-checked={levelFilter === f}
              onClick={() => setLevelFilter(f)}
              className={`h-9 flex-1 rounded-md text-sm font-semibold transition-colors ${
                levelFilter === f ? 'bg-ink text-bg' : 'text-muted hover:text-ink'
              }`}
            >
              {LEVEL_FILTER_LABELS[f]}
            </button>
          ))}
        </div>
      </section>

      <ul className="-mt-2 pb-4" aria-label="Режимы">
        <ModeRow
          icon={<Heart size={20} />}
          title="Выживание"
          description="3 жизни, и с каждым ответом времени меньше"
          meta={<Best value={highScores.survival} />}
          disabledLabel={noWords}
          onStart={() => onStart('survival')}
        />
        <ModeRow
          icon={<Timer size={20} />}
          title="Спринт"
          description="60 секунд, за ошибку −2 с"
          meta={<Best value={highScores.sprint} />}
          disabledLabel={noWords}
          onStart={() => onStart('sprint')}
        />
        <ModeRow
          icon={<Layers size={20} />}
          title="Падежи"
          description="den, dem, des в коротких предложениях"
          onStart={onStartCases}
        />
        <ModeRow
          icon={<Leaf size={20} />}
          title="Дзен"
          description={`Без таймера, ${zenPool} слов`}
          disabledLabel={zenPool === 0 ? 'Нет слов под фильтр' : null}
          onStart={() => onStart('zen')}
        >
          <div className="-mt-1 flex flex-wrap gap-1.5 pb-4 pl-15" role="radiogroup" aria-label="Какие правила тренировать">
            {(Object.keys(RULE_FILTER_LABELS) as RuleFilter[]).map((f) => (
              <button
                key={f}
                type="button"
                role="radio"
                aria-checked={ruleFilter === f}
                onClick={() => onRuleFilter(f)}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                  ruleFilter === f ? 'bg-ink text-bg' : 'bg-surface text-muted hover:text-ink'
                }`}
              >
                {RULE_FILTER_LABELS[f]}
              </button>
            ))}
          </div>
        </ModeRow>
        <ModeRow
          icon={<Zap size={20} />}
          title="Разбор завалов"
          description={`${problematic} слов ждут повтора`}
          disabledLabel={problematic === 0 ? 'Завалов нет: ошибки появятся здесь' : null}
          onStart={() => onStart('mistakes')}
        />
      </ul>
    </div>
  );
}
