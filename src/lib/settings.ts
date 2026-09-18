/** O'yin sozlamalari — ilovadagi `AppSettings` ning veb ulushi.
 *
 *  Ilovada bular Profil > Sozlamalar ichida turadi: «Qattiq rejim» va
 *  «Avto to'ldirish». Saytda ular yo'q edi — So'zjangda avto to'ldirish
 *  doim yoqiq, qattiq rejim esa umuman yo'q edi. Endi ikkalasi ham
 *  ilovadagidek boshqariladi va **standart holati ham ilovadagidek**:
 *  ikkovi ham o'chiq, odam kerak bo'lganini o'zi yoqadi.
 *
 *  Alifbo bu yerda emas — u `useScript` da, chunki alifbo faqat o'yin
 *  emas, butun saytni o'zgartiradi.
 *
 *  `useScript` bilan bir uslubda yozilgan (`useSyncExternalStore`):
 *  qiymat butun sayt uchun bitta va uni daraxtdan tashqarida ham
 *  (o'yin holatida) o'qish kerak. */
import { useSyncExternalStore } from 'react';

export interface GameSettings {
  /** Ochilgan harflarni keyingi taxminlarda ishlatish shart. */
  hardMode: boolean;
  /** Joyi aniq bo'lgan harflar keyingi qatorga o'zi qo'yiladi. */
  autoFill: boolean;
}

/** Kalit mavzu va alifbo bilan bir uslubda: `sozgir.settings`. */
const KEY = 'sozgir.settings';

const DEFAULTS: GameSettings = { hardMode: false, autoFill: false };

function read(): GameSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const stored = JSON.parse(raw) as Partial<GameSettings>;
    return {
      hardMode: stored.hardMode === true,
      autoFill: stored.autoFill === true,
    };
  } catch {
    // Shaxsiy rejimda o'qishga ham ruxsat bo'lmasligi mumkin.
    return DEFAULTS;
  }
}

let current: GameSettings = read();
const listeners = new Set<() => void>();

export const currentSettings = () => current;

export function setSetting<K extends keyof GameSettings>(
  key: K,
  value: GameSettings[K],
) {
  if (current[key] === value) return;
  current = { ...current, [key]: value };
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    // Saqlanmasa ham almashuv shu sessiyada ishlaydi.
  }
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Komponent sozlama o'zgarganda qayta chizilsin. */
export const useSettings = () =>
  useSyncExternalStore(subscribe, currentSettings, currentSettings);
