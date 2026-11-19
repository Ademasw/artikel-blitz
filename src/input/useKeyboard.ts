import { useEffect, useRef } from 'react';
import type { Article } from '../types/game';
import { articleForCode } from './keymap';

interface Handlers {
  onArticle: (a: Article) => void;
  onEscape?: () => void;
}

/** Глобальные горячие клавиши игры. Зажатая клавиша (event.repeat) игнорируется. */
export function useKeyboard(handlers: Handlers, enabled = true): void {
  const ref = useRef(handlers);
  useEffect(() => {
    ref.current = handlers;
  });

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.code === 'Escape') {
        e.preventDefault();
        ref.current.onEscape?.();
        return;
      }
      const article = articleForCode(e.code);
      if (!article) return;
      e.preventDefault();
      ref.current.onArticle(article);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled]);
}
