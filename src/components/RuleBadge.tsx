import type { WordItem } from '../types/game';

/**
 * Подсказка-правило. По умолчанию для бумажной карточки; onBoard — для тёмной доски.
 * Исключение помечено жёлтым мелом, слово без правила — «Запомнить».
 */
export function RuleBadge({ word, compact = false, onBoard = false }: { word: WordItem; compact?: boolean; onBoard?: boolean }) {
  const size = compact ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1';
  const base = `inline-flex flex-wrap items-center justify-center gap-x-1.5 rounded-[4px] ${size}`;
  const neutral = onBoard ? 'bg-surface-2 text-ink' : 'bg-paper-ink/[0.06] text-paper-ink';
  const quiet = onBoard ? 'text-muted' : 'text-paper-muted';

  if (word.ruleType === 'exception') {
    return (
      <span className={`${base} ${onBoard ? 'bg-chalk/15 text-ink' : 'bg-chalk/35 text-paper-ink'}`}>
        <b>Исключение</b>
        {word.ruleHint && <span>{word.ruleHint}</span>}
      </span>
    );
  }
  if (word.ruleType === 'none') {
    return (
      <span className={`${base} ${neutral}`}>
        <b>Запомнить</b>
        {word.ruleHint && <span className={quiet}>{word.ruleHint}</span>}
      </span>
    );
  }
  return <span className={`${base} ${neutral}`}>{word.ruleHint}</span>;
}
