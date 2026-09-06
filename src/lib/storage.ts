/** Brauzerdagi xotira: tugallanmagan o'yin, statistika va ball.
 *
 *  Ilovada bular `shared_preferences` va Firestore'da turadi; saytda esa
 *  `localStorage` — hisobsiz ham natija yo'qolmasin. Kalitlar `sozgir.`
 *  bilan boshlanadi (mavzu kaliti admin panel bilan bir xil). */

import type { Mode } from './game';

export type Status = 'playing' | 'won' | 'lost';

export type SavedGame = {
  /** Javob — o'yin qaytadan ochilganda tekshirilmaydi, shu yerdan olinadi. */
  answer: string;
  guesses: string[][];
  status: Status;
  /** Yordam olinganmi (mavzu / ta'rif) — qaytib kelganda ham ko'rinadi. */
  hint?: boolean;
  meaning?: boolean;
  /** Yutilgan ball — natija oynasi qayta ochilganda ko'rsatiladi. */
  score?: number;
};

export type Stats = {
  played: number;
  won: number;
  streak: number;
  best: number;
  /** Urinishlar taqsimoti: `dist[i]` — (i+1)-urinishda topilganlar soni. */
  dist: number[];
  /** Kunlik rejimda oxirgi o'ynalgan o'yin raqami — streak shunga qaraydi. */
  last?: number;
};

const read = <T,>(key: string): T | null => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    // Buzuq yozuv o'yinni to'xtatmasin — bo'sh holatdan boshlanadi.
    return null;
  }
};

const write = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Xotira to'lgan yoki taqiqlangan (private rejim) — o'yin baribir ishlaydi.
  }
};

/** O'yin kaliti: kunlikda raqam, qolganida uzunlik va kategoriya. */
export function gameKey(
  mode: Mode,
  length: number,
  extra?: string | number,
): string {
  return ['sozgir.game', mode, extra ?? length].join('.');
}

export const loadGame = (key: string) => read<SavedGame>(key);
export const saveGame = (key: string, game: SavedGame) => write(key, game);
export const clearGame = (key: string) => localStorage.removeItem(key);

/** Statistika kaliti — har rejim va uzunlik uchun alohida (ilovadagidek). */
export const statsKey = (mode: Mode, length: number) =>
  `sozgir.stats.${mode}.${length}`;

export const emptyStats = (): Stats => ({
  played: 0,
  won: 0,
  streak: 0,
  best: 0,
  dist: [],
});

export const loadStats = (mode: Mode, length: number): Stats => {
  const saved = read<Stats>(statsKey(mode, length));
  return saved ? { ...emptyStats(), ...saved } : emptyStats();
};

/** O'yin tugagach statistikani yangilaydi va yangi holatni qaytaradi.
 *
 *  Kunlik rejimda ketma-ketlik kun raqamiga qarab uziladi: kecha
 *  o'ynalmagan bo'lsa seriya noldan boshlanadi. */
export function recordGame({
  mode,
  length,
  won,
  attempts,
  number,
}: {
  mode: Mode;
  length: number;
  won: boolean;
  attempts: number;
  number?: number;
}): Stats {
  const stats = loadStats(mode, length);
  const dist = [...stats.dist];
  if (won) dist[attempts - 1] = (dist[attempts - 1] ?? 0) + 1;

  const continued =
    mode !== 'daily' || stats.last === undefined || stats.last === (number ?? 0) - 1;
  const streak = won ? (continued ? stats.streak : 0) + 1 : 0;

  const next: Stats = {
    played: stats.played + 1,
    won: stats.won + (won ? 1 : 0),
    streak,
    best: Math.max(stats.best, streak),
    dist,
    last: mode === 'daily' ? number : stats.last,
  };
  write(statsKey(mode, length), next);
  return next;
}

/* ── Ball va topilgan so'zlar ───────────────────────────────────────── */

const FOUND_KEY = 'sozgir.found';

export const loadFound = (): Record<string, number> =>
  read<Record<string, number>>(FOUND_KEY) ?? {};

/** So'z avval topilganmi — takroriy so'zda ball kamayadi. */
export const wasFound = (word: string) => word in loadFound();

/** Topilgan so'zni yozadi; har so'z bir marta turadi va eng yuqori bali
 *  saqlanadi — takror o'ynash umumiy ballni kamaytirmaydi. */
export function addFound(word: string, score: number) {
  const found = loadFound();
  found[word] = Math.max(found[word] ?? 0, score);
  write(FOUND_KEY, found);
}

export const totalScore = () =>
  Object.values(loadFound()).reduce((sum, value) => sum + value, 0);

export const foundCount = () => Object.keys(loadFound()).length;

/* ── Sozlamalar ─────────────────────────────────────────────────────── */

export const loadLength = (): number => {
  const raw = Number(localStorage.getItem('sozgir.length'));
  return raw >= 4 && raw <= 7 ? raw : 5;
};

export const saveLength = (length: number) =>
  localStorage.setItem('sozgir.length', String(length));

export const loadNickname = () => localStorage.getItem('sozgir.nickname') ?? '';

export const saveNickname = (name: string) =>
  localStorage.setItem('sozgir.nickname', name.trim());

/* ── Kunlik holat ───────────────────────────────────────────────────── */

/** Bugungi o'yin qay holatda — bosh ekrandagi kartochka shunga qaraydi
 *  (ilovadagi `DailyStatusCubit` ning veb ko'rinishi). */
export function dailyStatus(number: number, length: number) {
  const saved = loadGame(gameKey('daily', length, number));
  const attempts = saved?.guesses.length ?? 0;
  return {
    started: attempts > 0,
    finished: saved?.status === 'won' || saved?.status === 'lost',
    won: saved?.status === 'won',
    attempts,
    answer: saved?.answer ?? '',
    score: saved?.score ?? 0,
  };
}
