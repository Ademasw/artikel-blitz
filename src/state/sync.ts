import type { PersistedState, WordProgress } from '../types/game';
import { GRAMMAR_CASES, parseState, sanitizeDaily } from './persistence';

/**
 * Перенос прогресса между устройствами без сервера.
 * Экспорт — JSON (файл) или сжатый код (для копирования). Импорт объединяет, а не перезаписывает:
 * по каждому слову берётся более свежая запись, рекорды — максимум. Поэтому переносить можно
 * в обе стороны сколько угодно раз, ничего не теряя.
 */

const CODE_PREFIX_DEFLATE = 'AB1.';
const CODE_PREFIX_PLAIN = 'AB0.';

export interface ExportFile {
  app: 'artikel-blitz';
  version: 1;
  exportedAt: string;
  progress: PersistedState['progress'];
  highScores: PersistedState['highScores'];
  daily: PersistedState['daily'];
  cases: PersistedState['cases'];
}

export function buildExport(state: PersistedState, now: Date = new Date()): ExportFile {
  const progress: Record<string, WordProgress> = {};
  for (const [id, p] of Object.entries(state.progress)) if (p.attempts > 0) progress[id] = p;
  return {
    app: 'artikel-blitz',
    version: 1,
    exportedAt: now.toISOString(),
    progress,
    highScores: state.highScores,
    daily: state.daily,
    cases: state.cases,
  };
}

/** Проверяет и чистит импортируемые данные теми же правилами, что и localStorage. */
export function parseExport(json: string): PersistedState {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new ImportError('Это не файл прогресса Artikel Blitz.');
  }
  if (typeof data !== 'object' || data === null || (data as { app?: unknown }).app !== 'artikel-blitz') {
    throw new ImportError('Это не файл прогресса Artikel Blitz.');
  }
  return parseState(json);
}

export class ImportError extends Error {}

function newer(a: WordProgress, b: WordProgress): WordProgress {
  if (a.lastSeenAt !== b.lastSeenAt) return a.lastSeenAt > b.lastSeenAt ? a : b;
  return a.attempts >= b.attempts ? a : b;
}

export interface MergeReport {
  state: PersistedState;
  /** Слов, по которым запись пришла из импорта (новые или более свежие). */
  wordsUpdated: number;
}

/** Объединение: настройки и фильтр уровня остаются локальными. */
export function mergeStates(local: PersistedState, incoming: PersistedState): MergeReport {
  const progress = { ...local.progress };
  let wordsUpdated = 0;
  for (const [id, p] of Object.entries(incoming.progress)) {
    const cur = progress[id];
    const pick = cur ? newer(cur, p) : p;
    if (pick !== cur) {
      progress[id] = pick;
      wordsUpdated++;
    }
  }

  const daily = { ...local.daily };
  for (const [k, d] of Object.entries(incoming.daily)) {
    const cur = daily[k];
    // за один день на двух устройствах могли играть оба раза: сложить нельзя (повторный импорт удвоит),
    // поэтому берём больший из двух
    if (!cur || d.answers > cur.answers) daily[k] = d;
  }

  const cases = { ...local.cases };
  for (const c of GRAMMAR_CASES) {
    if (incoming.cases[c].attempts > cases[c].attempts) cases[c] = incoming.cases[c];
  }

  return {
    wordsUpdated,
    state: {
      ...local,
      progress,
      daily: sanitizeDaily(daily),
      cases,
      highScores: {
        survival: Math.max(local.highScores.survival, incoming.highScores.survival),
        sprint: Math.max(local.highScores.sprint, incoming.highScores.sprint),
      },
    },
  };
}

// --- Компактный код для копирования -------------------------------------------------------

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

const canCompress = () => typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined';

export async function encodeCode(file: ExportFile): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(file));
  if (!canCompress()) return CODE_PREFIX_PLAIN + toBase64Url(bytes);
  return CODE_PREFIX_DEFLATE + toBase64Url(await pipe(bytes, new CompressionStream('deflate-raw')));
}

/** Принимает код или содержимое JSON-файла. Пробелы и переносы строк внутри кода игнорируются. */
export async function decodeImport(text: string): Promise<PersistedState> {
  const t = text.trim();
  if (t.startsWith('{')) return parseExport(t);
  const compact = t.replace(/\s+/g, '');
  try {
    if (compact.startsWith(CODE_PREFIX_PLAIN)) {
      return parseExport(new TextDecoder().decode(fromBase64Url(compact.slice(CODE_PREFIX_PLAIN.length))));
    }
    if (compact.startsWith(CODE_PREFIX_DEFLATE)) {
      if (!canCompress()) throw new ImportError('Этот браузер не умеет распаковывать код. Перенесите прогресс файлом.');
      const raw = await pipe(fromBase64Url(compact.slice(CODE_PREFIX_DEFLATE.length)), new DecompressionStream('deflate-raw'));
      return parseExport(new TextDecoder().decode(raw));
    }
  } catch (e) {
    if (e instanceof ImportError) throw e;
    throw new ImportError('Код повреждён: скопируйте его целиком, от «AB1.» до конца.');
  }
  throw new ImportError('Не похоже на код прогресса: он начинается с «AB1.».');
}
