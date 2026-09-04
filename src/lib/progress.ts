/** Natija, statistika va ball — brauzerda va (kirilgan bo'lsa) cloud'da.
 *
 *  Ilovadagi tartib saqlanadi: **asosiy manba — qurilma**, cloud esa
 *  nusxa va boshqa qurilmada tiklash uchun. Shu sabab natija darhol
 *  ko'rinadi va internet uzilsa ham o'yin davom etadi.
 *
 *  Yozilgan yo'llar ilova bilan bir xil:
 *   * `users/{uid}/stats/{mode}_{length}` — statistika nusxasi;
 *   * `users/{uid}/found_words/{so'z}`    — topilgan so'zlar;
 *   * `scores/{uid}`                      — umumiy ball (reyting shundan);
 *   * `daily_results/{sana}_{n}/entries/{uid}` — kunlik reyting. */
import { client } from '../firebase/client';
import { PATHS, statsDoc } from '../firebase/paths';
import { readDoc } from '../firebase/rest';
import type { Account } from './auth';
import { attemptsFor, DAILY_LENGTH, LENGTHS, type Mode } from './modes';
import { readStoredNickname } from './nickname';
import { scoreFor } from './score';

export interface GameStats {
  played: number;
  wins: number;
  currentStreak: number;
  maxStreak: number;
  /** Urinish raqami → nechta g'alaba. */
  distribution: Record<number, number>;
  /** Oxirgi o'ynalgan kunlik o'yin raqami — ketma-ketlik uchun. */
  lastDailyNumber: number | null;
}

export interface FoundWord {
  word: string;
  mode: Mode;
  length: number;
  attempts: number;
  score: number;
  foundAt: number;
  categoryId?: string;
}

export interface FoundSummary {
  totalScore: number;
  count: number;
}

export interface Outcome {
  mode: Mode;
  length: number;
  won: boolean;
  attempts: number;
  number: number;
  dateKey: string;
  answer: string;
  categoryId?: string;
}

export interface Recorded {
  points: number;
  stats: GameStats;
  total: FoundSummary;
}

export const EMPTY_STATS: GameStats = {
  played: 0,
  wins: 0,
  currentStreak: 0,
  maxStreak: 0,
  distribution: {},
  lastDailyNumber: null,
};

const STATS_KEY = (mode: Mode, length: number) => `sozgir.stats.${mode}.${length}`;
const FOUND_KEY = 'sozgir.found';
const ENDLESS_KEY = (length: number) => `sozgir.endless.${length}`;

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
    // Shaxsiy rejimda saqlab bo'lmaydi — natija shu sahifada qoladi.
  }
}

export function readStats(mode: Mode, length: number): GameStats {
  const stored = read<Partial<GameStats>>(STATS_KEY(mode, length), {});
  return { ...EMPTY_STATS, ...stored, distribution: stored.distribution ?? {} };
}

export function readFound(): Record<string, FoundWord> {
  return read<Record<string, FoundWord>>(FOUND_KEY, {});
}

export function foundSummary(
  found: Record<string, FoundWord> = readFound(),
): FoundSummary {
  const words = Object.values(found);
  return {
    totalScore: words.reduce((sum, word) => sum + word.score, 0),
    count: words.length,
  };
}

/** Cheksiz rejimdagi keyingi o'yin raqami — har chaqirishda oshadi. */
export function nextEndlessNumber(length: number): number {
  const next = read<number>(ENDLESS_KEY(length), 0) + 1;
  write(ENDLESS_KEY(length), next);
  return next;
}

/** Ketma-ket g'alabalar: kunlik rejimda kun o'tkazib yuborilsa uziladi,
 *  cheksizda shunchaki ketma-ket g'alabalar sanaladi. */
function nextStreak({
  current,
  mode,
  won,
  number,
}: {
  current: GameStats;
  mode: Mode;
  won: boolean;
  number: number;
}): number {
  if (!won) return 0;
  if (mode !== 'daily') return current.currentStreak + 1;

  const last = current.lastDailyNumber;
  return last === null || number === last + 1 ? current.currentStreak + 1 : 1;
}

/** O'yin natijasini yozadi: ball, statistika va topilgan so'z.
 *
 *  Cloud yozuvi natijani kutib turmaydi — u fon rejimida ketadi, chunki
 *  natija oynasi darhol ko'rinishi kerak. */
export async function recordOutcome(
  outcome: Outcome,
  account: Account | null,
): Promise<Recorded> {
  const { mode, length, won, attempts, number, answer } = outcome;

  // Muhim tartib: avval cloud'dagi natijalar brauzerga tiklanadi.
  // Aks holda telefonda 40 kun yig'ilgan streak sayt yozgan «1» bilan
  // almashib ketardi.
  if (account) await ensureRestored(account);

  const found = readFound();
  const previous = found[answer];

  const points = won
    ? scoreFor({
        mode,
        length,
        attempts,
        maxAttempts: attemptsFor(length),
        repeated: Boolean(previous),
      })
    : 0;

  // Bir so'z ro'yxatda bir marta turadi va **eng yuqori ball** saqlanadi:
  // takror o'ynash umumiy hisobni kamaytirmasligi kerak.
  let entry: FoundWord | null = null;
  if (won) {
    entry = {
      word: answer,
      mode,
      length,
      attempts,
      score: Math.max(points, previous?.score ?? 0),
      foundAt: Date.now(),
      ...(outcome.categoryId ? { categoryId: outcome.categoryId } : {}),
    };
    found[answer] = entry;
    write(FOUND_KEY, found);
  }

  const current = readStats(mode, length);
  const distribution = { ...current.distribution };
  if (won) distribution[attempts] = (distribution[attempts] ?? 0) + 1;

  const streak = nextStreak({ current, mode, won, number });
  const stats: GameStats = {
    played: current.played + 1,
    wins: current.wins + (won ? 1 : 0),
    currentStreak: streak,
    maxStreak: Math.max(streak, current.maxStreak),
    distribution,
    lastDailyNumber: mode === 'daily' ? number : current.lastDailyNumber,
  };
  write(STATS_KEY(mode, length), stats);

  const total = foundSummary(found);

  if (account) {
    void pushToCloud({ account, outcome, points, stats, entry, total });
  } else {
    // Kirmasdan o'ynagan natija navbatda turadi: keyin kirilsa cloud'ga
    // o'zi yoziladi va reytingga tushadi.
    queuePending({ outcome, points });
  }

  return { points, stats, total };
}

async function pushToCloud({
  account,
  outcome,
  points,
  stats,
  entry,
  total,
}: {
  account: Account;
  outcome: Outcome;
  points: number;
  stats: GameStats;
  entry: FoundWord | null;
  total: FoundSummary;
}): Promise<void> {
  try {
    const { db } = await client();
    const { doc, setDoc, serverTimestamp } = await import('firebase/firestore/lite');
    const { uid } = account;
    // Nom yozish paytida o'qiladi: kirish bilan natija yozuvi orasida
    // taxallus o'zgargan bo'lishi mumkin.
    const nickname = readStoredNickname() || account.nickname;
    const { mode, length, won, attempts, number, dateKey } = outcome;

    const writes: Promise<unknown>[] = [
      setDoc(
        doc(db, PATHS.users, uid, PATHS.stats, statsDoc(mode, length)),
        stats,
        { merge: true },
      ),
    ];

    if (entry) {
      // Hujjat nomi — so'zning o'zi: bir so'z bir marta yoziladi.
      writes.push(
        setDoc(
          doc(db, PATHS.users, uid, PATHS.foundWords, entry.word),
          {
            word: entry.word,
            mode: entry.mode,
            length: entry.length,
            attempts: entry.attempts,
            score: entry.score,
            foundAt: entry.foundAt,
            ...(entry.categoryId ? { categoryId: entry.categoryId } : {}),
          },
          { merge: true },
        ),
        setDoc(
          doc(db, PATHS.scores, uid),
          {
            nickname,
            totalScore: total.totalScore,
            wordsFound: total.count,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        ),
      );
    }

    // Reyting — faqat kunlik o'yin uchun. Maydonlar qoidalarda qat'iy
    // tekshiriladi, shuning uchun aynan shu ro'yxat yoziladi.
    //
    // Yozuv bor bo'lsa tegmaymiz: kunlik o'yin kuniga bitta, ya'ni
    // o'sha yozuv ilovada olingan natija. Mehmon holatida o'ynab keyin
    // kirilganda navbatdagi natija uni bosib ketardi.
    if (mode === 'daily' && !(await fetchDailyEntry({ uid, dateKey, length }))) {
      writes.push(
        setDoc(
          doc(
            db,
            PATHS.dailyResults,
            `${dateKey}_${length}`,
            PATHS.entries,
            uid,
          ),
          {
            nickname,
            attempts,
            won,
            points: won ? points : 0,
            number,
            createdAt: serverTimestamp(),
          },
          { merge: true },
        ),
      );
    }

    await Promise.all(writes);
  } catch {
    // Zaxira nusxa yiqilsa ham o'yin davom etadi — natija qurilmada bor.
  }
}

/** Shu foydalanuvchining kunlik reytingdagi bugungi yozuvi. */
export interface DailyEntry {
  attempts: number;
  won: boolean;
  points: number;
  number: number;
}

/** Bugungi kunlik o'yin allaqachon o'ynalganmi — ilovada yoki boshqa
 *  qurilmada.
 *
 *  Kunlik o'yin kuniga bitta: telefonda o'ynab bo'lgan odam saytda uni
 *  qaytadan o'ynay olmasligi kerak. Buning ustiga saytdagi yozuv
 *  ilovanikini bosib ketardi — yozuv `merge` bilan bitta hujjatga
 *  tushadi, ya'ni yomonroq natija yaxshisining o'rniga yozilardi.
 *
 *  Hujjat qoidalarda hammaga ochiq, shuning uchun SDK'siz, REST bilan
 *  o'qiladi. */
export async function fetchDailyEntry({
  uid,
  dateKey,
  length,
}: {
  uid: string;
  dateKey: string;
  length: number;
}): Promise<DailyEntry | null> {
  const data = await readDoc(
    `${PATHS.dailyResults}/${dateKey}_${length}/${PATHS.entries}/${uid}`,
  );
  if (!data || typeof data.number !== 'number') return null;

  return {
    attempts: typeof data.attempts === 'number' ? data.attempts : 0,
    won: data.won === true,
    points: typeof data.points === 'number' ? data.points : 0,
    number: data.number,
  };
}

/** Kirmasdan o'ynalgan va hali cloud'ga yozilmagan natijalar. */
interface Pending {
  outcome: Outcome;
  points: number;
}

const PENDING_KEY = 'sozgir.pending';

function queuePending(item: Pending): void {
  const queue = read<Pending[]>(PENDING_KEY, []);
  // Bir o'yin bir marta: kunlik natija ustiga yozilsa ham nusxa qolmaydi.
  const rest = queue.filter(
    (old) =>
      old.outcome.mode !== item.outcome.mode ||
      old.outcome.length !== item.outcome.length ||
      old.outcome.number !== item.outcome.number,
  );
  write(PENDING_KEY, [...rest, item].slice(-20));
}

/** Kirilgandan keyin navbatdagi natijalarni cloud'ga yozadi. */
export async function flushPending(account: Account): Promise<void> {
  const queue = read<Pending[]>(PENDING_KEY, []);
  if (queue.length === 0) return;
  write(PENDING_KEY, []);

  const total = foundSummary();
  const found = readFound();
  for (const { outcome, points } of queue) {
    await pushToCloud({
      account,
      outcome,
      points,
      stats: readStats(outcome.mode, outcome.length),
      entry: outcome.won ? (found[outcome.answer] ?? null) : null,
      total,
    });
  }
}

/** Cloud'dan tiklash bir sessiyada bir marta — takror so'rov qilmaslik
 *  uchun natija eslab qolinadi. */
const restoring = new Map<string, Promise<void>>();

export function ensureRestored(account: Account): Promise<void> {
  let task = restoring.get(account.uid);
  if (!task) {
    task = restoreFromCloud(account);
    restoring.set(account.uid, task);
  }
  return task;
}

/** Cloud'dagi natijalarni brauzerga tiklaydi.
 *
 *  Ikki narsa uchun kerak:
 *   * telefonda yig'ilgan statistika va streak saytda davom etsin (sayt
 *     uni bosib ketmasligi kerak) — shuning uchun cloud oldinda bo'lsa
 *     qabul qilinadi;
 *   * topilgan so'zlar ro'yxati — takror topilgan so'zga to'liq ball
 *     berilmasligi uchun. */
async function restoreFromCloud(account: Account): Promise<void> {
  try {
    const { db } = await client();
    const { collection, doc, getDoc, getDocs, limit, orderBy, query } =
      await import('firebase/firestore/lite');

    const words = await getDocs(
      query(
        collection(db, PATHS.users, account.uid, PATHS.foundWords),
        orderBy('foundAt', 'desc'),
        limit(500),
      ),
    );
    if (!words.empty) {
      const found = readFound();
      for (const entry of words.docs) {
        const data = entry.data() as FoundWord;
        if (!data.word) continue;
        const local = found[data.word];
        // Ikki manbadan eng yuqori ball qoladi.
        if (!local || data.score > local.score) found[data.word] = data;
      }
      write(FOUND_KEY, found);
    }

    const modes: [Mode, number][] = [
      ['daily', DAILY_LENGTH],
      ...LENGTHS.map((length): [Mode, number] => ['endless', length]),
    ];

    for (const [mode, length] of modes) {
      const local = readStats(mode, length);
      const snapshot = await getDoc(
        doc(db, PATHS.users, account.uid, PATHS.stats, statsDoc(mode, length)),
      );
      const data = snapshot.data() as
        | (Omit<GameStats, 'distribution'> & {
            distribution?: Record<string, number>;
          })
        | undefined;
      // Faqat cloud oldinda bo'lganda qabul qilinadi.
      if (!data?.played || data.played <= local.played) continue;

      const distribution: Record<number, number> = {};
      for (const [key, value] of Object.entries(data.distribution ?? {})) {
        distribution[Number(key)] = value;
      }
      write(STATS_KEY(mode, length), { ...EMPTY_STATS, ...data, distribution });
    }
  } catch {
    // Tiklanmasa — brauzerdagi natijalar bilan davom etadi.
  }
}
