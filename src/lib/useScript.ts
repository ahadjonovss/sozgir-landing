/** Tanlangan alifboni ushlab turuvchi yagona nuqta — ilovadagi
 *  `ScriptService` ning veb ko'chirmasi.
 *
 *  **Nima uchun React konteksti emas.** Matn faqat komponentlarda yasalmaydi:
 *  o'yin xabarlari, `document.title` va DOM ko'chiruvchisi ([scriptDom])
 *  daraxtdan tashqarida ishlaydi. Alifbo esa butun sayt uchun bitta qiymat,
 *  ya'ni uni daraxtga tarqatishning ma'nosi yo'q. Komponentlar `useScript()`
 *  orqali o'zgarishni tinglaydi. */
import { useSyncExternalStore } from 'react';
import {
  fromStorageKey,
  inputToLatin,
  lettersToScript,
  physicalKey,
  proseToScript,
  storageKey,
  type UzScript,
} from './script';

/** Kalit mavzu bilan bir uslubda: `sozgir.theme` → `sozgir.script`. */
const KEY = 'sozgir.script';

function read(): UzScript {
  try {
    return fromStorageKey(localStorage.getItem(KEY));
  } catch {
    // Shaxsiy rejimda `localStorage` o'qishga ham ruxsat bermasligi mumkin.
    return 'latin';
  }
}

let current: UzScript = read();
const listeners = new Set<() => void>();

/** CSS uchun: `html[data-script='cyrillic']`. */
function mark(script: UzScript) {
  document.documentElement.dataset.script = script;
}

mark(current);

export const currentScript = () => current;

export function setScript(next: UzScript) {
  if (next === current) return;
  current = next;
  mark(next);
  try {
    localStorage.setItem(KEY, storageKey(next));
  } catch {
    // Saqlanmasa ham almashuv shu sessiyada ishlaydi.
  }
  for (const listener of listeners) listener();
}

export function subscribeScript(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Komponent alifbo o'zgarganda qayta chizilsin. */
export const useScript = () =>
  useSyncExternalStore(subscribeScript, currentScript, currentScript);

/* Qisqartmalar — chaqiruv joylari ko'p. */

/** Interfeys matni — to'g'ri imloda. */
export const prose = (text: string) => proseToScript(text, current);

/** O'yin so'zi — harfma-harf, katak soni o'zgarmaydi. */
export const word = (text: string) => lettersToScript(text, current);

/** Kiritilgan matnni bazadagi eski lotinga qaytaradi. */
export const toLatin = (text: string) => inputToLatin(text, current);

/** Fizik klaviaturada bosilgan belgi — o'yin birligiga. */
export const gameKey = (key: string) => physicalKey(key, current);
