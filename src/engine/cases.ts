import type { Article, GrammarCase, WordItem } from '../types/game';
import type { Rng } from './wordQueue';

/**
 * Режим «Падежи»: определённый артикль в предложении.
 * Ед. число; слова, у которых в падеже меняется само существительное нерегулярно
 * (слабое склонение: den Studenten), в режим не попадают.
 */

export type CaseForm = 'der' | 'die' | 'das' | 'den' | 'dem' | 'des';
/** Верхний ряд совпадает с основной игрой (der / die / das), нижний — косвенные формы. */
export const CASE_FORMS: readonly CaseForm[] = ['der', 'die', 'das', 'den', 'dem', 'des'];

export const CASE_TABLE: Record<GrammarCase, Record<Article, CaseForm>> = {
  nom: { der: 'der', die: 'die', das: 'das' },
  akk: { der: 'den', die: 'die', das: 'das' },
  dat: { der: 'dem', die: 'der', das: 'dem' },
  gen: { der: 'des', die: 'der', das: 'des' },
};

export const CASE_NAMES: Record<GrammarCase, { de: string; ru: string; question: string }> = {
  nom: { de: 'Nominativ', ru: 'именительный', question: 'wer? was?' },
  akk: { de: 'Akkusativ', ru: 'винительный', question: 'wen? was?' },
  dat: { de: 'Dativ', ru: 'дательный', question: 'wem?' },
  gen: { de: 'Genitiv', ru: 'родительный', question: 'wessen?' },
};

export interface CaseTemplate {
  id: string;
  grammarCase: GrammarCase;
  /** Текст до пропуска и после существительного. */
  before: string;
  after: string;
  /** Почему этот падеж: управление глагола или предлога. */
  trigger: string;
}

export const CASE_TEMPLATES: readonly CaseTemplate[] = [
  { id: 'nom-wo', grammarCase: 'nom', before: 'Wo ist', after: '?', trigger: 'подлежащее (кто? что?)' },
  { id: 'nom-hier', grammarCase: 'nom', before: 'Hier ist', after: '.', trigger: 'подлежащее (кто? что?)' },

  { id: 'akk-sehen', grammarCase: 'akk', before: 'Ich sehe', after: '.', trigger: 'sehen + Akkusativ' },
  { id: 'akk-brauchen', grammarCase: 'akk', before: 'Wir brauchen', after: '.', trigger: 'brauchen + Akkusativ' },
  { id: 'akk-kennen', grammarCase: 'akk', before: 'Kennst du', after: '?', trigger: 'kennen + Akkusativ' },
  { id: 'akk-suchen', grammarCase: 'akk', before: 'Sie sucht', after: '.', trigger: 'suchen + Akkusativ' },
  { id: 'akk-fuer', grammarCase: 'akk', before: 'Das ist für', after: '.', trigger: 'für + Akkusativ' },
  { id: 'akk-ohne', grammarCase: 'akk', before: 'Ohne', after: ' geht es nicht.', trigger: 'ohne + Akkusativ' },
  { id: 'akk-ueber', grammarCase: 'akk', before: 'Wir sprechen über', after: '.', trigger: 'sprechen über + Akkusativ' },

  { id: 'dat-mit', grammarCase: 'dat', before: 'Was machst du mit', after: '?', trigger: 'mit + Dativ' },
  { id: 'dat-von', grammarCase: 'dat', before: 'Er erzählt von', after: '.', trigger: 'von + Dativ' },
  { id: 'dat-halten', grammarCase: 'dat', before: 'Was hältst du von', after: '?', trigger: 'von + Dativ' },
  { id: 'dat-zufrieden', grammarCase: 'dat', before: 'Ich bin zufrieden mit', after: '.', trigger: 'mit + Dativ' },
  { id: 'dat-frage', grammarCase: 'dat', before: 'Sie fragt nach', after: '.', trigger: 'nach + Dativ' },

  { id: 'gen-wegen', grammarCase: 'gen', before: 'Wegen', after: ' bleiben wir zu Hause.', trigger: 'wegen + Genitiv' },
  { id: 'gen-trotz', grammarCase: 'gen', before: 'Trotz', after: ' sind wir gekommen.', trigger: 'trotz + Genitiv' },
  { id: 'gen-geschichte', grammarCase: 'gen', before: 'Das ist die Geschichte', after: '.', trigger: 'чей? чего? → Genitiv' },
];

/** Доля падежей в раунде. */
const CASE_WEIGHTS: Record<GrammarCase, number> = { nom: 0.1, akk: 0.35, dat: 0.35, gen: 0.2 };

const VOWEL_GROUPS = /[aeiouäöüy]+/gi;
function syllables(word: string): number {
  return word.match(VOWEL_GROUPS)?.length ?? 0;
}

/** Мужской род слабого склонения: den/dem/des Studenten, Jungen, Namen… */
export function isWeakMasculine(w: WordItem): boolean {
  if (w.article !== 'der') return false;
  if (w.word.endsWith('e')) return true;
  return w.plural === `${w.word}n` || w.plural === `${w.word}en`;
}

const SKIP_GROUPS = ['Языки', 'Цвета', 'Числа', 'Дроби', 'Марки'];

/** Подходит ли слово для режима вообще. */
export function isCaseFriendly(w: WordItem): boolean {
  if (w.level === 'B2') return false; // абстрактная лексика звучит в шаблонах странно
  if (w.alwaysShowTranslation) return false; // омонимам нужен перевод — в предложении его нет
  if (w.word.includes('-')) return false;
  if (w.ruleType === 'semantic' && SKIP_GROUPS.some((g) => w.ruleHint?.startsWith(g))) return false;
  return !isWeakMasculine(w);
}

/** Форма существительного в родительном падеже; null, если надёжно образовать нельзя. */
export function genitiveNoun(w: WordItem): string | null {
  if (w.article === 'die') return w.word;
  // -es / -s / -ses: надёжно только для многосложных слов не на шипящие и s
  if (/(s|ß|x|z)$/.test(w.word)) return null;
  if (syllables(w.word) < 2) return null;
  return `${w.word}s`;
}

export function nounFor(w: WordItem, c: GrammarCase): string | null {
  return c === 'gen' ? genitiveNoun(w) : w.word;
}

export interface CaseTask {
  id: string;
  word: WordItem;
  template: CaseTemplate;
  answer: CaseForm;
  noun: string;
}

function pickWeighted<T>(items: readonly T[], weight: (t: T) => number, rng: Rng): T {
  const total = items.reduce((s, t) => s + weight(t), 0);
  let r = rng() * total;
  for (const t of items) {
    r -= weight(t);
    if (r < 0) return t;
  }
  return items[items.length - 1]!;
}

/** Раунд из n заданий: без повторов слов, разные шаблоны подряд. */
export function buildCaseRound(words: readonly WordItem[], n: number, rng: Rng = Math.random): CaseTask[] {
  const pool = words.filter(isCaseFriendly);
  const used = new Set<string>();
  const tasks: CaseTask[] = [];
  let prevTemplate = '';
  for (let guard = 0; tasks.length < n && guard < n * 50; guard++) {
    const grammarCase = pickWeighted(Object.keys(CASE_WEIGHTS) as GrammarCase[], (c) => CASE_WEIGHTS[c], rng);
    const templates = CASE_TEMPLATES.filter((t) => t.grammarCase === grammarCase && t.id !== prevTemplate);
    const template = templates[Math.floor(rng() * templates.length)]!;
    const word = pool[Math.floor(rng() * pool.length)];
    if (!word || used.has(word.id)) continue;
    const noun = nounFor(word, grammarCase);
    if (!noun) continue;
    used.add(word.id);
    prevTemplate = template.id;
    tasks.push({
      id: `${word.id}:${template.id}`,
      word,
      template,
      noun,
      answer: CASE_TABLE[grammarCase][word.article],
    });
  }
  return tasks;
}
