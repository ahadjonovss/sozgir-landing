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
 *  G'unchaning **o'z balli o'yin ichida qoladi** (4 harfli so'z 1, uzuni
 *  uzunligicha, pangramma +7): u daraja zinapoyasini yuritadi. Hamyonga
 *  esa raundning **ulushi** tushadi — to'liq yechilgan g'uncha 20 aqcha,
 *  yarmi 10 (`docs/aqcha.md`, 4.2). Ilgari xom yig'indining o'zi
 *  tushardi va kunlik mukofotni o'yinchi emas, o'sha kungi harflar
 *  belgilardi: lug'atda qancha so'z chiqishiga qarab 3 dan 21 aqchagacha.
 *
 *  Umumiy ballga g'uncha `scores.ts` orqali tushadi: `scores/{uid}` ning
 *  yozuvchisi bitta bo'lishi kerak, aks holda bir o'yin ikkinchisining
 *  hissasini o'chirib yuborardi. */
import { client } from '../firebase/client';
import { PATHS } from '../firebase/paths';
import { tiyin } from './aqcha';
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
   *  shu ayiriladi.
   *
   *  `paid` — to'langan tiyin. Islohotdan oldingi yozuvlarda u yo'q:
   *  o'shalarda hisobga xom ball (`score`) tushgan, ya'ni ayiriladigani
   *  ham o'sha. Shu tufayli ko'chirish kerak emas. */
  applied: { score: number; words: number; paid?: number };
}

export interface GunchaTotals {
  /** Hamyondagi ulush — **tiyinda** (ekranda aqcha bo'lib ko'rinadi). */
  score: number;
  words: number;
}

/** To'liq yechilgan g'uncha uchun mukofot — aqchada. */
const GUNCHA_BASE = 20;

/** Raundning hamyonga tushadigan ulushi — tiyinda. */
export function roundPaid(puzzle: GunchaPuzzle, score: number): number {
  const max = maxScoreOf(puzzle);
  if (max <= 0 || score <= 0) return 0;
  return tiyin(Math.floor((GUNCHA_BASE * score) / max));
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
  const paid = roundPaid(puzzle, score);
  const totals = readTotals();
  const next: GunchaTotals = {
    // Avval nima to'langan bo'lsa, o'sha ayiriladi: yangi yozuvlarda
    // `paid`, eskilarida xom ball.
    score: Math.max(0, totals.score - (applied.paid ?? applied.score) + paid),
    words: Math.max(0, totals.words - applied.words + words.length),
  };

  write(ROUND_KEY(id), {
    signature: signatureOf(puzzle),
    words,
    applied: { score, words: words.length, paid },
  } satisfies Round);
  write(TOTAL_KEY, next);

  if (account) {
    void pushGunchaScore(account, next);
    // Nusxa kutilmaydi: g'uncha aloqasiz ham o'ynaladi.
    void pushTotals(account.uid, next);
  }
  return next;
}

/** G'unchaning hamyondagi ulushi — umumiy hisobga shu tushadi.
 *
 *  Hammasi yakka o'yin: jangdagi ball hozircha alohida yuritilmaydi
 *  (ilovada ham shunday — `GunchaScoreSource` faqat yakka o'yinni
 *  sanaydi). */
function pushGunchaScore(account: Account, totals: GunchaTotals): Promise<void> {
  return pushTally({
    uid: account.uid,
    nickname: readStoredNickname() || account.nickname,
    game: 'guncha',
    tally: { score: totals.score, count: totals.words },
  });
}

/* ── Buluddagi nusxa ──────────────────────────────────────────────────
   Yig'ma hisob brauzerda turadi, ya'ni hisob almashganda u yangi
   hisobning balliga qo'shilib ketardi. Endi nusxasi bulutda
   (`users/{uid}/guncha/totals`) va son o'z egasida qoladi: yangi
   hisobda ball shu nusxadan tiklanadi. Yon foyda — tozalangan
   brauzerda g'uncha balli yo'qolmaydi.

   Ilovadagi tartib bilan bir xil (`GunchaRepositoryImpl`): qurilmadagi
   son asosiy manba, bulut esa nusxa. */

/** Nusxani yangilaydi. Xato yutiladi: nusxa yozilmasa ham ball
 *  brauzerda joyida qoladi va keyingi o'zgarishda yana yoziladi. */
async function pushTotals(uid: string, totals: GunchaTotals): Promise<void> {
  try {
    const { db } = await client();
    const { doc, setDoc, serverTimestamp } = await import('firebase/firestore/lite');
    await setDoc(
      doc(db, PATHS.users, uid, PATHS.guncha, PATHS.gunchaTotals),
      { score: totals.score, words: totals.words, updatedAt: serverTimestamp() },
      { merge: true },
    );
  } catch {
    // Aloqa yo'q — keyingi topilgan so'zda qaytadan yoziladi.
  }
}

/** Buluddagi nusxa. Yozuv yo'q yoki aloqa uzilgan bo'lsa — bo'sh. */
async function fetchTotals(uid: string): Promise<GunchaTotals> {
  try {
    const { db } = await client();
    const { doc, getDoc } = await import('firebase/firestore/lite');
    const data = (
      await getDoc(doc(db, PATHS.users, uid, PATHS.guncha, PATHS.gunchaTotals))
    ).data();
    return { score: Number(data?.score) || 0, words: Number(data?.words) || 0 };
  } catch {
    return { score: 0, words: 0 };
  }
}

/** G'unchaning brauzerdagi izi — yig'ma hisob va raundlar.
 *
 *  Hisob almashganda chaqiriladi: ball o'z egasida qoladi (bulutdagi
 *  nusxada), begona hisobning balliga qo'shilmaydi. */
export function clearGuncha(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key === TOTAL_KEY || key?.startsWith(ROUND_KEY(''))) keys.push(key);
    }
    for (const key of keys) localStorage.removeItem(key);
  } catch {
    // Tozalanmasa — hech bo'lmasa yangi hisob o'z nusxasidan tiklanadi.
  }
}

/** Kirilgandan keyin ballni joyiga qo'yadi.
 *
 *  Brauzerda ball bo'lsa — u cloud'ga chiqadi (mehmon sifatida
 *  o'ynalgan g'uncha yo'qolib ketmasin). Bo'sh bo'lsa — demak bu yangi
 *  brauzer yoki hisob almashgan: ball buluddagi nusxadan tiklanadi. */
export async function syncGuncha(account: Account): Promise<GunchaTotals> {
  const totals = readTotals();
  if (totals.score > 0 || totals.words > 0) {
    await pushGunchaScore(account, totals);
    await pushTotals(account.uid, totals);
    return totals;
  }

  const cloud = await fetchTotals(account.uid);
  if (cloud.score <= 0 && cloud.words <= 0) return totals;
  write(TOTAL_KEY, cloud);
  return cloud;
}

/** Shu g'unchada yig'ilgan ball va darajaning ulushi. */
export function roundScore(puzzle: GunchaPuzzle, words: string[]): number {
  return words.reduce((sum, word) => sum + (wordOf(puzzle, word)?.score ?? 0), 0);
}

export const shareOf = (puzzle: GunchaPuzzle, score: number) => {
  const max = maxScoreOf(puzzle);
  return max > 0 ? Math.min(1, score / max) : 0;
};
