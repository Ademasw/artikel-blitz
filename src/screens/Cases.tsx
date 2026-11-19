import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Home as HomeIcon, Pause, RotateCcw, Volume2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PressKey } from '../components/AnswerButtons';
import { ART } from '../components/articleStyles';
import { Dialog, DialogButton } from '../components/Dialog';
import { getAllWords } from '../data/dictionaryRepository';
import {
  CASE_FORMS,
  CASE_NAMES,
  CASE_TABLE,
  buildCaseRound,
  type CaseForm,
  type CaseTask,
} from '../engine/cases';
import { useAppStore } from '../state/AppStore';
import { ARTICLES, type GrammarCase } from '../types/game';
import { playCorrect, playError, playNudge, unlockAudio } from '../utils/sound';
import { speak, speechSupported, stopSpeaking } from '../utils/speech';
import { GoalLine, MetricsRow } from './Summary';

const ROUND_SIZE = 20;
const RETRY_AFTER = 3;
const REVEAL_MS = 380;

const KEY_TO_FORM: Record<string, CaseForm> = {
  KeyA: 'der',
  KeyS: 'die',
  KeyD: 'das',
  KeyZ: 'den',
  KeyX: 'dem',
  KeyC: 'des',
  Digit1: 'der',
  Digit2: 'die',
  Digit3: 'das',
  Digit4: 'den',
  Digit5: 'dem',
  Digit6: 'des',
};
const FORM_HINT: Record<CaseForm, string> = { der: 'A', die: 'S', das: 'D', den: 'Z', dem: 'X', des: 'C' };

interface Item {
  task: CaseTask;
  retry: boolean;
}

interface Mistake {
  task: CaseTask;
  answer: CaseForm;
}

type Phase = 'playing' | 'reveal' | 'lock' | 'done';

function sentence(t: CaseTask, form: string): string {
  return `${t.template.before} ${form} ${t.noun}${t.template.after}`;
}

/** Предложение с пропуском: до ответа — черта, после — форма артикля цветом рода. */
function Sentence({ task, filled }: { task: CaseTask; filled: boolean }) {
  const s = ART[task.word.article];
  return (
    <p className="font-display text-[clamp(1.6rem,7.4vw,2.4rem)] leading-snug font-bold" lang="de">
      {task.template.before}{' '}
      {filled ? (
        <span className={`${s.text} underline decoration-[3px] underline-offset-[7px]`}>{task.answer}</span>
      ) : (
        <span className="inline-block w-[2.6em] translate-y-[0.1em] border-b-[3px] border-paper-ink/70" aria-label="пропуск" />
      )}{' '}
      {task.noun}
      {task.template.after}
    </p>
  );
}

/** Строка таблицы склонения для текущего падежа; род слова выделен. */
function CaseRow({ task }: { task: CaseTask }) {
  const c = task.template.grammarCase;
  return (
    <div className="grid grid-cols-3 gap-1.5 text-center text-sm" lang="de">
      {ARTICLES.map((a) => {
        const active = a === task.word.article;
        return (
          <div
            key={a}
            className={`rounded-[4px] px-2 py-1 ${active ? `${ART[a].bg} text-white` : 'bg-paper-ink/[0.06] text-paper-muted'}`}
          >
            <span className="opacity-75">{a} →</span> <b>{CASE_TABLE[c][a]}</b>
          </div>
        );
      })}
    </div>
  );
}

export function Cases({ onMenu }: { onMenu: () => void }) {
  const { recordCaseAnswer, settings } = useAppStore();
  const reducedMotion = useReducedMotion() ?? false;
  const [items, setItems] = useState<Item[]>(() =>
    buildCaseRound(getAllWords(), ROUND_SIZE).map((task) => ({ task, retry: false })),
  );
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('playing');
  const [paused, setPaused] = useState(false);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [firstTry, setFirstTry] = useState(0);
  const [streakNow, setStreakNow] = useState(0);
  const [byCase, setByCase] = useState<Record<GrammarCase, { n: number; ok: number }>>({
    nom: { n: 0, ok: 0 },
    akk: { n: 0, ok: 0 },
    dat: { n: 0, ok: 0 },
    gen: { n: 0, ok: 0 },
  });
  const [nudge, setNudge] = useState<{ form: CaseForm; seq: number } | null>(null);
  const revealTimer = useRef<number | undefined>(undefined);

  const item = items[idx];
  const task = item?.task;
  const speechMode = settings.speech;

  useEffect(() => () => {
    window.clearTimeout(revealTimer.current);
    stopSpeaking();
  }, []);

  const next = useCallback(() => {
    const n = idx + 1;
    setIdx(n);
    setPhase(n >= items.length ? 'done' : 'playing');
  }, [idx, items.length]);

  const answer = useCallback(
    (form: CaseForm) => {
      if (!item || !task || paused) return;
      unlockAudio();
      const c = task.template.grammarCase;

      if (phase === 'lock') {
        if (form === task.answer) next();
        else {
          playNudge();
          setNudge((n) => ({ form, seq: (n?.seq ?? 0) + 1 }));
        }
        return;
      }
      if (phase !== 'playing') return;

      const ok = form === task.answer;
      if (!item.retry) {
        recordCaseAnswer(c, ok);
        setByCase((b) => ({ ...b, [c]: { n: b[c].n + 1, ok: b[c].ok + (ok ? 1 : 0) } }));
        if (ok) setFirstTry((n) => n + 1);
      }
      if (ok) {
        const s = streakNow + 1;
        setStreakNow(s);
        playCorrect(s, false);
        if (speechMode === 'always') speak(sentence(task, task.answer));
        setPhase('reveal');
        revealTimer.current = window.setTimeout(next, reducedMotion ? 150 : REVEAL_MS);
        return;
      }

      setStreakNow(0);
      playError();
      if (speechMode !== 'off') speak(sentence(task, task.answer));
      if (!item.retry) {
        setMistakes((m) => [...m, { task, answer: form }]);
        // ошибка возвращается через несколько заданий
        setItems((list) => {
          const copy = [...list];
          copy.splice(Math.min(copy.length, idx + 1 + RETRY_AFTER), 0, { task, retry: true });
          return copy;
        });
      }
      setPhase('lock');
    },
    [item, task, paused, phase, next, recordCaseAnswer, streakNow, speechMode, reducedMotion, idx],
  );

  // клавиатура: A S D / Z X C или 1–6 (по физическим клавишам, раскладка не важна)
  const answerRef = useRef(answer);
  useEffect(() => {
    answerRef.current = answer;
  });
  useEffect(() => {
    if (phase === 'done') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.code === 'Escape') {
        e.preventDefault();
        setPaused((p) => !p);
        return;
      }
      const f = KEY_TO_FORM[e.code];
      if (!f) return;
      e.preventDefault();
      answerRef.current(f);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase]);

  const restart = () => {
    setItems(buildCaseRound(getAllWords(), ROUND_SIZE).map((t) => ({ task: t, retry: false })));
    setIdx(0);
    setPhase('playing');
    setMistakes([]);
    setFirstTry(0);
    setStreakNow(0);
    setByCase({ nom: { n: 0, ok: 0 }, akk: { n: 0, ok: 0 }, dat: { n: 0, ok: 0 }, gen: { n: 0, ok: 0 } });
  };

  if (phase === 'done' || !task) {
    const total = ROUND_SIZE;
    return (
      <div className="safe-pad mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-5">
        <header className="pt-4 text-center">
          <div className="text-sm text-muted">Падежи</div>
          <div className="mt-1 font-display text-7xl leading-none font-extrabold tabular-nums">
            {Math.round((firstTry / total) * 100)}%
          </div>
          <div className="mt-2 text-sm text-muted">
            {firstTry} из {total} с первой попытки
          </div>
        </header>
        <MetricsRow
          items={(['nom', 'akk', 'dat', 'gen'] as GrammarCase[]).map((c) => ({
            label: CASE_NAMES[c].de,
            value: byCase[c].n === 0 ? '—' : `${byCase[c].ok} / ${byCase[c].n}`,
          }))}
        />
        <GoalLine />
        <section className="flex min-h-0 flex-1 flex-col">
          <h2 className="mb-3 font-display text-xl font-bold">
            {mistakes.length === 0 ? 'Ни одной ошибки' : `Ошибки: ${mistakes.length}`}
          </h2>
          <ul className="flex max-h-[42dvh] flex-col gap-2.5 overflow-y-auto px-1 pb-2">
            {mistakes.map(({ task: t, answer: a }) => (
              <li key={t.id} className="paper-slip relative px-4 py-3">
                <div className={`absolute inset-y-0 left-0 w-1 rounded-l-[4px] ${ART[t.word.article].bg}`} aria-hidden />
                <div className="font-display text-lg font-bold" lang="de">
                  {t.template.before} <span className={ART[t.word.article].text}>{t.answer}</span> {t.noun}
                  {t.template.after}
                </div>
                <div className="mt-0.5 text-sm text-paper-muted">
                  {t.template.trigger}, {t.word.article} {t.word.word}. Ваш ответ: <b className="text-paper-ink">{a}</b>
                </div>
              </li>
            ))}
          </ul>
        </section>
        <footer className="flex gap-2 pb-2">
          <button
            type="button"
            onClick={restart}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-ink font-semibold text-bg"
          >
            <RotateCcw size={18} /> Ещё раунд
          </button>
          <button
            type="button"
            onClick={onMenu}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-surface-2 font-semibold"
          >
            <HomeIcon size={18} /> В меню
          </button>
        </footer>
      </div>
    );
  }

  const locked = phase === 'lock';
  const filled = phase !== 'playing';
  const caseName = CASE_NAMES[task.template.grammarCase];
  const done = Math.min(idx, items.length);

  return (
    <div className="safe-pad mx-auto flex min-h-dvh w-full max-w-xl flex-col">
      <header className="flex h-12 items-center gap-3">
        <button
          type="button"
          onClick={() => setPaused(true)}
          className="grid size-10 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
          aria-label="Пауза"
          title="Пауза (Esc)"
        >
          <Pause size={20} />
        </button>
        <div className="flex-1 text-sm text-muted">Падежи</div>
        <div className="font-display text-2xl font-bold tabular-nums" aria-label="Прогресс раунда">
          {done}
          <span className="text-base text-muted"> / {items.length}</span>
        </div>
      </header>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink/10" aria-hidden>
        <div className="h-full rounded-full bg-ink transition-[width] duration-300" style={{ width: `${(done / items.length) * 100}%` }} />
      </div>

      <main className="flex flex-1 flex-col items-center justify-center py-4">
        <AnimatePresence mode="wait">
          <motion.section
            key={`${idx}-${task.id}`}
            className="paper-card relative flex min-h-[clamp(270px,46dvh,360px)] w-full max-w-md flex-col overflow-hidden px-5 pb-4"
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.97 }}
            animate={
              locked && !reducedMotion
                ? { opacity: 1, y: 0, scale: 1, x: [0, -12, 10, -7, 5, 0] }
                : { opacity: 1, y: 0, scale: 1 }
            }
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, x: -40 }}
            transition={{ duration: 0.14 }}
            aria-live="polite"
          >
            <div className={`absolute inset-x-0 top-0 h-1.5 ${filled ? ART[task.word.article].bg : ''}`} aria-hidden />
            <div className="flex h-12 items-center justify-between text-xs font-semibold text-paper-muted">
              <span>{item.retry ? 'повтор' : task.word.level}</span>
              {locked && speechSupported() && (
                <button
                  type="button"
                  onClick={() => speak(sentence(task, task.answer))}
                  className="-mr-2 grid size-9 place-items-center rounded-md hover:bg-black/5 hover:text-paper-ink"
                  aria-label="Произнести предложение"
                >
                  <Volume2 size={18} />
                </button>
              )}
            </div>
            <div className="flex flex-1 flex-col justify-center gap-3">
              <Sentence task={task} filled={filled} />
              {/* род слова не подсказываем: его нужно вспомнить вместе с падежом */}
              <p className="text-sm text-paper-muted">
                {filled ? (
                  <>
                    <span lang="de">
                      {task.word.article} {task.word.word}
                    </span>{' '}
                    — {task.word.translation}
                  </>
                ) : (
                  task.word.translation
                )}
              </p>
            </div>
            <div className="flex min-h-[92px] flex-col justify-end gap-2">
              {locked && (
                <>
                  <p className="text-sm">
                    <b>{task.template.trigger}</b>
                    <span className="text-paper-muted">
                      {' '}
                      ({caseName.ru}, {caseName.question})
                    </span>
                  </p>
                  <CaseRow task={task} />
                </>
              )}
            </div>
          </motion.section>
        </AnimatePresence>
      </main>

      <footer className="grid grid-cols-3 gap-2 pb-1 sm:gap-3">
        {CASE_FORMS.map((f) => {
          const dimmed = locked && f !== task.answer;
          return (
            <PressKey
              key={f}
              label={f}
              hint={FORM_HINT[f]}
              ariaLabel={f}
              onPress={() => answer(f)}
              nudgeSeq={nudge?.form === f ? nudge.seq : 0}
              reducedMotion={reducedMotion}
              className={`h-14 text-2xl sm:h-16 ${
                locked && f === task.answer
                  ? 'bg-chalk text-paper-ink'
                  : 'bg-surface-2 text-ink hover:bg-line'
              } ${dimmed ? 'opacity-35' : ''}`}
            />
          );
        })}
      </footer>

      <AnimatePresence>
        {paused && (
          <Dialog
            title="Пауза"
            onClose={() => setPaused(false)}
            actions={
              <>
                <DialogButton variant="primary" onClick={() => setPaused(false)}>
                  Продолжить
                </DialogButton>
                <DialogButton onClick={onMenu}>Выйти в меню</DialogButton>
              </>
            }
          >
            Пройдено {done} из {items.length}. Ответы уже сохранены.
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}
