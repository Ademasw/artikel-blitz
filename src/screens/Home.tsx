import { Brain, Flame, Heart, Leaf, Settings, Timer, Trophy } from 'lucide-react';
import type { ReactNode } from 'react';
import { ART } from '../components/articleStyles';
import { getAllWords } from '../data/dictionaryRepository';
import { isReflex } from '../engine/mastery';
import { LEVEL_FILTER_LABELS, RULE_FILTER_LABELS, buildPool, matchesLevel } from '../engine/modes';
import { useAppStore } from '../state/AppStore';
import type { GameMode, LevelFilter, RuleFilter } from '../types/game';

type PlayableMode = Exclude<GameMode, 'round_review'>;

interface Props {
  ruleFilter: RuleFilter;
  onRuleFilter: (f: RuleFilter) => void;
  onStart: (mode: PlayableMode) => void;
  onOpenSettings: () => void;
}

function ModeCard({
  title,
  subtitle,
  icon,
  disabledLabel,
  onStart,
  children,
  accent,
}: {
  title: string;
  subtitle: ReactNode;
  icon: ReactNode;
  disabledLabel?: string | null;
  onStart: () => void;
  children?: ReactNode;
  accent: string;
}) {
  const disabled = !!disabledLabel;
  return (
    <div
      className={`flex flex-col rounded-3xl border border-line bg-surface p-4 transition-colors ${
        disabled ? 'opacity-55' : 'hover:border-muted/50'
      }`}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={onStart}
        className="flex flex-1 flex-col items-start gap-2 text-left"
      >
        <span className={`grid size-10 place-items-center rounded-xl ${accent}`}>{icon}</span>
        <span className="text-lg leading-tight font-bold">{title}</span>
        <span className="text-sm text-muted">{disabled ? disabledLabel : subtitle}</span>
      </button>
      {children}
    </div>
  );
}

export function Home({ ruleFilter, onRuleFilter, onStart, onOpenSettings }: Props) {
  const { progress, highScores, levelFilter, setLevelFilter } = useAppStore();
  const words = getAllWords();
  const inLevel = words.filter((w) => matchesLevel(w, levelFilter));
  const reflex = words.filter((w) => isReflex(progress[w.id])).length;
  const problematic = buildPool('mistakes', words, progress, levelFilter, 'ALL').length;
  const zenPool = buildPool('zen', words, progress, levelFilter, ruleFilter).length;
  const noWords = inLevel.length === 0 ? 'Нет слов под фильтр' : null;

  return (
    <div className="safe-pad mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-5">
      <header className="flex items-center justify-between pt-2">
        <h1 className="text-2xl font-extrabold tracking-tight">
          Artikel <span className="text-die">Blitz</span>
        </h1>
        <button
          type="button"
          onClick={onOpenSettings}
          className="grid size-11 place-items-center rounded-xl bg-surface-2 text-muted hover:text-ink"
          aria-label="Настройки"
        >
          <Settings size={22} />
        </button>
      </header>

      <div className="flex gap-1.5 text-3xl font-black tracking-tight sm:text-4xl" aria-hidden>
        <span className={ART.der.text}>DER</span>
        <span className="text-line">/</span>
        <span className={ART.die.text}>DIE</span>
        <span className="text-line">/</span>
        <span className={ART.das.text}>DAS</span>
      </div>

      <section className="grid grid-cols-3 gap-2" aria-label="Статистика">
        <div className="rounded-2xl bg-surface-2 px-3 py-3">
          <div className="flex items-center gap-1 text-xs text-muted">
            <Brain size={13} /> На рефлексе
          </div>
          <div className="mt-0.5 text-lg font-bold tabular-nums">
            {reflex}
            <span className="text-sm font-medium text-muted"> / {words.length}</span>
          </div>
        </div>
        <div className="rounded-2xl bg-surface-2 px-3 py-3">
          <div className="flex items-center gap-1 text-xs text-muted">
            <Heart size={13} /> Выживание
          </div>
          <div className="mt-0.5 text-lg font-bold tabular-nums">{highScores.survival.toLocaleString('ru-RU')}</div>
        </div>
        <div className="rounded-2xl bg-surface-2 px-3 py-3">
          <div className="flex items-center gap-1 text-xs text-muted">
            <Timer size={13} /> Спринт
          </div>
          <div className="mt-0.5 text-lg font-bold tabular-nums">{highScores.sprint.toLocaleString('ru-RU')}</div>
        </div>
      </section>

      <section>
        <div className="mb-2 text-sm font-semibold text-muted">Уровень</div>
        <div role="radiogroup" aria-label="Уровень сложности" className="flex rounded-2xl bg-surface-2 p-1">
          {(Object.keys(LEVEL_FILTER_LABELS) as LevelFilter[]).map((f) => (
            <button
              key={f}
              type="button"
              role="radio"
              aria-checked={levelFilter === f}
              onClick={() => setLevelFilter(f)}
              className={`h-10 flex-1 rounded-xl text-sm font-semibold transition-colors ${
                levelFilter === f ? 'bg-ink text-bg' : 'text-muted hover:text-ink'
              }`}
            >
              {LEVEL_FILTER_LABELS[f]}
            </button>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 pb-4 min-[420px]:grid-cols-2">
        <ModeCard
          title="Выживание"
          subtitle={
            <>
              3 жизни, время на карточку тает
              {highScores.survival > 0 && (
                <span className="mt-1 flex items-center gap-1 text-xs">
                  <Trophy size={12} /> {highScores.survival.toLocaleString('ru-RU')}
                </span>
              )}
            </>
          }
          icon={<Heart size={20} className="text-white" />}
          accent="bg-die"
          disabledLabel={noWords}
          onStart={() => onStart('survival')}
        />
        <ModeCard
          title="Спринт"
          subtitle={
            <>
              60 секунд, ошибка −2 с, серия +3 с
              {highScores.sprint > 0 && (
                <span className="mt-1 flex items-center gap-1 text-xs">
                  <Trophy size={12} /> {highScores.sprint.toLocaleString('ru-RU')}
                </span>
              )}
            </>
          }
          icon={<Timer size={20} className="text-white" />}
          accent="bg-der"
          disabledLabel={noWords}
          onStart={() => onStart('sprint')}
        />
        <ModeCard
          title="Дзен / Правила"
          subtitle={`Без таймера · ${zenPool} слов`}
          icon={<Leaf size={20} className="text-white" />}
          accent="bg-das"
          disabledLabel={zenPool === 0 ? 'Нет слов под фильтр' : null}
          onStart={() => onStart('zen')}
        >
          <div className="mt-3 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Фильтр правил">
            {(Object.keys(RULE_FILTER_LABELS) as RuleFilter[]).map((f) => (
              <button
                key={f}
                type="button"
                role="radio"
                aria-checked={ruleFilter === f}
                onClick={() => onRuleFilter(f)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                  ruleFilter === f ? 'bg-das text-white' : 'bg-surface-2 text-muted hover:text-ink'
                }`}
              >
                {RULE_FILTER_LABELS[f]}
              </button>
            ))}
          </div>
        </ModeCard>
        <ModeCard
          title="Разбор завалов"
          subtitle={
            <>
              Проблемных слов: <b className="text-ink">{problematic}</b>
            </>
          }
          icon={<Flame size={20} className="text-black" />}
          accent="bg-fever"
          disabledLabel={problematic === 0 ? 'Завалов нет' : null}
          onStart={() => onStart('mistakes')}
        />
      </section>
    </div>
  );
}
