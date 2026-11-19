import { useEffect, useRef } from 'react';

/** Вызывает callback каждый кадр (requestAnimationFrame), пока active. */
export function useFrame(callback: (now: number) => void, active = true): void {
  const ref = useRef(callback);
  useEffect(() => {
    ref.current = callback;
  });
  useEffect(() => {
    if (!active) return;
    let id = 0;
    const loop = (now: number) => {
      ref.current(now);
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [active]);
}
