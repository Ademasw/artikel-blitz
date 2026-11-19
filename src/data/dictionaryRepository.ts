import type { WordItem } from '../types/game';
import { WORDS } from './words';

/**
 * Единственная точка доступа к словарю.
 * В v2 сюда добавится импорт пользовательских словарей: игровая логика зависит только от этого модуля.
 */
const byId = new Map(WORDS.map((w) => [w.id, w]));

export function getAllWords(): readonly WordItem[] {
  return WORDS;
}

export function getWordById(id: string): WordItem | undefined {
  return byId.get(id);
}
