/** G'unchadagi natija — brauzerda va (kirilgan bo'lsa) umumiy ballda.
 *
 *  Ilovadagi `GunchaLocalDataSource` bilan bir xil tartib: topilgan
 *  so'zlar har bir g'uncha uchun alohida saqlanadi, yig'ma hisob esa
 *  ikkita sondan iborat.
 *
 *  Yig'ma hisob **farq bilan** yangilanadi: raundning avvalgi holati nima
 *  bergan bo'lsa, o'sha ayiriladi. Shu tufayli bir holatni qayta saqlash
 *  ballni ikkilantirmaydi va eski raund yozuvi o'chirilsa ham yig'ma
 *  hisob joyida qoladi.
 *
 *  Umumiy ballga g'uncha `scores.ts` orqali tushadi: `scores/{uid}` ning
 *  yozuvchisi bitta bo'lishi kerak, aks holda bir o'yin ikkinchisining
 *  hissasini o'chirib yuborardi. */
import type { Account } from './auth';
import { maxScoreOf, puzzleId, signatureOf, wordOf, type GunchaPuzzle } from './guncha';
import { readStoredNickname } from './nickname';
import { pushTally } from './scores';

const ROUND_KEY = (id: string) => `sozgir.guncha.round.${id}`;
const TOTAL_KEY = 'sozgir.guncha.total';
const PRACTICE_KEY = 'sozgir.guncha.practice';

/** Bitta g'unchaning saqlangan holati. */
interface Round {
  /** Harflar imzosi — lug'at yangilanib g'uncha o'zgargan bo'lsa,
   *  saqlangan so'zlar tashlanadi. */
  signature: string;
  words: string[];
  /** Shu yozuv yig'ma hisobga nima qo'shgani — keyingi saqlashda aynan
   *  shu ayiriladi. */
  applied: { score: number; words: number };
}

export interface GunchaTotals {
  score: number;
  words: number;
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Shaxsiy rejim — natija faqat shu sahifada qoladi.
  }
}

export function readTotals(): GunchaTotals {
  const stored = read<Partial<GunchaTotals>>(TOTAL_KEY, {});
  return {
    score: Number(stored.score) || 0,
    words: Number(stored.words) || 0,
  };
}

/** Saqlangan so'zlar. Harflar mos kelmasa — bo'sh ro'yxat. */
export function readRound(puzzle: GunchaPuzzle): string[] {
  const round = read<Round | null>(ROUND_KEY(puzzleId(puzzle)), null);
  if (!round || round.signature !== signatureOf(puzzle)) return [];
  return Array.isArray(round.words) ? round.words : [];
}

/** Keyingi mashq g'unchasining raqami — har chaqirishda oshadi.
 *
 *  Qurilmada saqlanadi, ya'ni mashq g'unchalari ro'yxat tugamaguncha
 *  takrorlanmaydi. */
export function nextPracticeNumber(): number {
  const next = read<number>(PRACTICE_KEY, 0) + 1;
  write(PRACTICE_KEY, next);
  return next;
}

export const practiceNumber = () => read<number>(PRACTICE_KEY, 0);

/** Topilgan so'zlarni saqlaydi va yig'ma hisobni yangilaydi.
 *
 *  Cloud yozuvi natijani kutib turmaydi — so'z darhol ekranda ko'rinishi
 *  kerak. */
export function saveRound({
  puzzle,
  words,
  account,
}: {
  puzzle: GunchaPuzzle;
  words: string[];
  account: Account | null;
}): GunchaTotals {
  const id = puzzleId(puzzle);
  const previous = read<Round | null>(ROUND_KEY(id), null);
  const score = words.reduce((sum, word) => sum + (wordOf(puzzle, word)?.score ?? 0), 0);

  const applied = previous?.applied ?? { score: 0, words: 0 };
  const totals = readTotals();
  const next: GunchaTotals = {
    score: Math.max(0, totals.score - applied.score + score),
    words: Math.max(0, totals.words - applied.words + words.length),
  };

  write(ROUND_KEY(id), {
    signature: signatureOf(puzzle),
    words,
    applied: { score, words: words.length },
  } satisfies Round);
  write(TOTAL_KEY, next);

  if (account) void pushGunchaScore(account, next);
  return next;
}

/** G'unchaning xom balli — umumiy hisobga shu tushadi.
 *
 *  Hammasi yakka o'yin: jangdagi ball hozircha alohida yuritilmaydi
 *  (ilovada ham shunday — `GunchaScoreSource` faqat yakka o'yinni
 *  sanaydi). */
function pushGunchaScore(account: Account, totals: GunchaTotals): Promise<void> {
  return pushTally({
    uid: account.uid,
    nickname: readStoredNickname() || account.nickname,
    game: 'guncha',
    tally: { solo: totals.score, online: 0, count: totals.words },
  });
}

/** Kirilgandan keyin brauzerdagi g'uncha balli cloud'ga chiqadi —
 *  mehmon sifatida o'ynalgan g'uncha yo'qolib ketmasin. */
export function flushGuncha(account: Account): Promise<void> {
  const totals = readTotals();
  if (totals.score <= 0) return Promise.resolve();
  return pushGunchaScore(account, totals);
}

/** Shu g'unchada yig'ilgan ball va darajaning ulushi. */
export function roundScore(puzzle: GunchaPuzzle, words: string[]): number {
  return words.reduce((sum, word) => sum + (wordOf(puzzle, word)?.score ?? 0), 0);
}

export const shareOf = (puzzle: GunchaPuzzle, score: number) => {
  const max = maxScoreOf(puzzle);
  return max > 0 ? Math.min(1, score / max) : 0;
};
