import { ArrowLeft, Play } from 'lucide-react';
import type { ReactNode } from 'react';
import { getAllWords } from '../data/dictionaryRepository';
import { CASE_NAMES } from '../engine/cases';
import { lastDays, streak } from '../engine/daily';
import { levelBreakdown, ruleGroups, type MasteryStage } from '../engine/stats';
import { useAppStore } from '../state/AppStore';
import type { GrammarCase, WordItem } from '../types/game';

interface Props {
  onBack: () => void;
  onTrain: (words: WordItem[]) => void;
}

const STAGES: { key: MasteryStage; label: string; cls: string }[] = [
  { key: 'mastered', label: 'выучено', cls: 'bg-chalk' },
  { key: 'good', label: 'почти', cls: 'bg-ink/70' },
  { key: 'learning', label: 'учу', cls: 'bg-ink/30' },
  { key: 'new', label: 'не встречалось', cls: 'bg-ink/[0.08]' },
];

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="chalk-rule border-t pt-5">
      <h2 className="font-display text-2xl font-bold">{title}</h2>
      {note && <p className="mt-1 text-sm text-muted">{note}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function pct(x: number): string {
  return `${Math.round(x * 100)}%`;
}

export function Stats({ onBack, onTrain }: Props) {
  const { progress, daily, settings, cases } = useAppStore();
  const words = getAllWords();
  const today = new Date();
  const goal = settings.dailyGoal;

  const history = lastDays(daily, 400, goal, today);
  let best = 0;
  let run = 0;
  for (const d of history) {
    run = d.goalMet ? run + 1 : 0;
    best = Math.max(best, run);
  }
  const current = streak(daily, goal, today);
  const grid = history.slice(-35);
  const totalAnswers = history.reduce((s, d) => s + d.answers, 0);

  const levels = levelBreakdown(words, progress);
  const weak = ruleGroups(words, progress).slice(0, 6);
  const caseKeys: GrammarCase[] = ['nom', 'akk', 'dat', 'gen'];

  return (
    <div className="safe-pad mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-6 pb-10">
      <header className="flex items-center gap-2 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="grid size-11 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
          aria-label="Назад"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-display text-3xl font-extrabold">Статистика</h1>
      </header>

      <Section title="Серия" note={`День засчитывается, когда дано ${goal} ответов.`}>
        <div className="flex items-end gap-8">
          <div>
            <div className="font-display text-6xl leading-none font-extrabold text-chalk tabular-nums">{current}</div>
            <div className="mt-1 text-sm text-muted">дней подряд сейчас</div>
          </div>
          <div>
            <div className="font-display text-3xl leading-none font-bold tabular-nums">{best}</div>
            <div className="mt-1 text-sm text-muted">лучшая серия</div>
          </div>
          <div>
            <div className="font-display text-3xl leading-none font-bold tabular-nums">
              {totalAnswers.toLocaleString('ru-RU')}
            </div>
            <div className="mt-1 text-sm text-muted">ответов всего</div>
          </div>
        </div>
        <ol className="mt-5 grid grid-cols-7 gap-1.5" aria-label="Активность за 5 недель">
          {grid.map((d) => (
            <li
              key={d.key}
              title={`${d.date.toLocaleDateString('ru-RU')}: ${d.answers}`}
              aria-label={`${d.date.toLocaleDateString('ru-RU')}: ${d.answers} ответов`}
              className={`aspect-square rounded-[3px] ${
                d.goalMet ? 'bg-chalk' : d.answers > 0 ? 'bg-chalk/35' : 'bg-ink/[0.06]'
              }`}
            />
          ))}
        </ol>
        <p className="mt-2 text-xs text-muted">Последние 5 недель: жёлтый — цель выполнена, бледный — занимались меньше цели.</p>
      </Section>

      <Section title="Слова по уровням">
        <ul className="flex flex-col gap-4">
          {levels.map((l) => (
            <li key={l.level}>
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-display text-lg font-bold">{l.level}</span>
                <span className="text-muted">
                  выучено {l.stages.mastered} из {l.total}
                </span>
              </div>
              <div className="mt-1.5 flex h-3 overflow-hidden rounded-full" aria-hidden>
                {STAGES.map((s) =>
                  l.stages[s.key] > 0 ? (
                    <div key={s.key} className={s.cls} style={{ width: `${(l.stages[s.key] / l.total) * 100}%` }} />
                  ) : null,
                )}
              </div>
            </li>
          ))}
        </ul>
        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          {STAGES.map((s) => (
            <li key={s.key} className="flex items-center gap-1.5">
              <span className={`size-2.5 rounded-full ${s.cls}`} aria-hidden /> {s.label}
            </li>
          ))}
        </ul>
      </Section>

      <Section
        title="Где ошибаетесь"
        note={weak.length === 0 ? undefined : 'Правила с самой большой долей ошибок. Тренировка — в режиме без таймера.'}
      >
        {weak.length === 0 ? (
          <p className="text-sm text-muted">Сыграйте пару раундов: здесь появятся правила, которые даются труднее всего.</p>
        ) : (
          <ul className="flex flex-col">
            {weak.map((g) => (
              <li key={g.key} className="chalk-rule flex items-center gap-3 border-b py-3 last:border-b-0">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{g.label}</div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/10">
                      <div className="h-full rounded-full bg-die" style={{ width: pct(g.errorRate) }} />
                    </div>
                    <span className="w-24 shrink-0 text-right text-xs text-muted tabular-nums">
                      {pct(g.errorRate)} ошибок
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onTrain(g.words)}
                  className="flex h-9 shrink-0 items-center gap-1.5 rounded-md bg-surface-2 px-3 text-sm font-semibold hover:bg-ink hover:text-bg"
                  aria-label={`Тренировать: ${g.label}`}
                >
                  <Play size={14} /> {g.words.length}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Падежи" note="Доля верных ответов с первой попытки.">
        <ul className="grid grid-cols-2 gap-x-6 gap-y-4">
          {caseKeys.map((c) => {
            const s = cases[c];
            return (
              <li key={c}>
                <div className="flex items-baseline justify-between">
                  <span className="font-semibold">{CASE_NAMES[c].de}</span>
                  <span className="font-display text-xl font-bold tabular-nums">
                    {s.attempts === 0 ? '—' : pct(s.correct / s.attempts)}
                  </span>
                </div>
                <div className="text-xs text-muted">
                  {CASE_NAMES[c].ru}, ответов: {s.attempts}
                </div>
              </li>
            );
          })}
        </ul>
      </Section>
    </div>
  );
}
