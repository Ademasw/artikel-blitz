import type { WordItem } from '../types/game';

/** Бейдж правила: правило окончания/группы, «Исключение!» или «Запомнить». */
export function RuleBadge({ word, compact = false }: { word: WordItem; compact?: boolean }) {
  const size = compact ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';
  if (word.ruleType === 'exception') {
    return (
      <span className={`inline-flex flex-wrap items-center justify-center gap-x-1.5 rounded-full bg-warn/15 text-warn ${size}`}>
        <b>Исключение!</b>
        {word.ruleHint && <span className="text-ink/90">{word.ruleHint}</span>}
      </span>
    );
  }
  if (word.ruleType === 'none') {
    return (
      <span className={`inline-flex flex-wrap items-center justify-center gap-x-1.5 rounded-full bg-surface-2 text-muted ${size}`}>
        <b className="text-ink">Запомнить</b>
        {word.ruleHint && <span>{word.ruleHint}</span>}
      </span>
    );
  }
  return <span className={`inline-flex rounded-full bg-surface-2 text-ink ${size}`}>{word.ruleHint}</span>;
}
