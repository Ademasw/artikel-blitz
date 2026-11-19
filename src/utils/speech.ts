/** Озвучка немецких слов встроенным синтезатором браузера (Web Speech API): бесплатно и без сети. */

let voice: SpeechSynthesisVoice | null = null;
let listeners: (() => void)[] = [];

export function speechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

/** Предпочитаем «живые» голоса: Google / Microsoft Online / Siri-подобные звучат заметно лучше системных. */
function pickVoice(): void {
  if (!speechSupported()) return;
  const german = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('de'));
  const score = (v: SpeechSynthesisVoice) =>
    (v.lang === 'de-DE' ? 4 : 0) + (/google|online|natural|premium|enhanced/i.test(v.name) ? 2 : 0) + (v.localService ? 0 : 1);
  voice = german.sort((a, b) => score(b) - score(a))[0] ?? null;
  listeners.forEach((l) => l());
}

if (speechSupported()) {
  pickVoice();
  window.speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
}

export function hasGermanVoice(): boolean {
  return voice !== null;
}

/** Подписка на появление голосов (в Chrome список приходит асинхронно). */
export function onVoicesChanged(fn: () => void): () => void {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

/** Произносит фразу, прерывая предыдущую: в быстром темпе важна последняя карточка. */
export function speak(text: string): void {
  if (!speechSupported()) return;
  try {
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'de-DE';
    if (voice) u.voice = voice;
    u.rate = 0.95;
    synth.speak(u);
  } catch {
    // озвучка — приятное дополнение, игра без неё работает
  }
}

export function stopSpeaking(): void {
  if (speechSupported()) window.speechSynthesis.cancel();
}
