/** Natija, statistika va aqcha — brauzerda va (kirilgan bo'lsa) cloud'da.
 *
 *  Saqlanadigan son **tiyin**: aqcha uning o'ni (`lib/aqcha.ts`). Hujjatga
 *  ham, `localStorage` ga ham tiyin tushadi — ko'rsatishdagina bo'linadi.
 *
 *  Ilovadagi tartib saqlanadi: **asosiy manba — qurilma**, cloud esa
 *  nusxa va boshqa qurilmada tiklash uchun. Shu sabab natija darhol
 *  ko'rinadi va internet uzilsa ham o'yin davom etadi.
 *
 *  Chaqiriladigan marshrutlar ilova bilan bir xil:
 *   * `PUT  /v1/me/stats`      — statistika nusxasi;
 *   * `POST /v1/me/words`      — topilgan so'z;
 *   * `POST /v1/daily/submit`  — kunlik o'yin natijasi.
 *
 *  **Ball bu yerda yozilmaydi.** Ilgari sayt umumiy hisobni o'zi
 *  yig'ib `scores/{uid}` ga yozardi va shu sabab u hech qachon
 *  pasaytirilmasdi: brauzerdagi ro'yxat telefonnikidan qisqa bo'lsa,
 *  past son yaxshisini bosib ketardi. Endi ball serverda hisoblanadi
 *  — sayt yozilgan so'zlarni yuboradi, xolos. Shu bilan «pasaytirma»
 *  qoidasi ham, kun hisobining brauzerdagi sanog'i ham keraksiz
 *  bo'ldi: kunlik reyting `/v1/daily/submit` ning o'zidan chiqadi. */
import { api } from '../api/client';
import type { Account } from './auth';
import { markPlayedAt } from './badges';
import { attemptsFor, DAILY_LENGTH, LENGTHS, type Mode } from './modes';
import { scoreFor, type HintLevel } from './score';
import { EMPTY_TALLY, type GameTally } from './scores';

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
  /** Yozilgan taxminlar — tartibi bilan.
   *
   *  Kunlik o'yinda serverga shular boradi: ball mijozdan olinmaydi,
   *  server ro'yxatni o'z javobi bilan solishtiradi va urinishlar
   *  sonini uzunligidan oladi. */
  words: readonly string[];
  categoryId?: string;
  /** Yakka o'yinda olingan yordam: 0 — yo'q, 1 — mavzu, 2 — ma'no ham.
   *  Mukofotning yuqori chegarasini tushiradi (`score.ts`). */
  hint?: HintLevel;
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
    // Bulutdan tiklangan yozuvda ball bo'lmasligi mumkin (eski yoki
    // ilovadan kelgan hujjat) — `NaN` yig'indiga tushmasin.
    totalScore: words.reduce((sum, word) => sum + (Number(word.score) || 0), 0),
    count: words.length,
  };
}

/** So'ztopning xom hisobi (tiyin) — ilovadagi `SoztopScoreSource` ko'chirmasi.
 *
 *  So'zjangda topilgan so'z ham shu ro'yxatda turadi (ilova unga
 *  `mode: 'battle'` yozadi), ya'ni yakka va raqib bilan o'ynalgani
 *  **ajratilmaydi**: ikkalasi ham shu o'yinning balli. */
export function soztopTally(
  found: Record<string, FoundWord> = readFound(),
): GameTally {
  const words = Object.values(found);
  if (words.length === 0) return EMPTY_TALLY;

  let score = 0;
  for (const word of words) score += Number(word.score) || 0;
  return { score, count: words.length };
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

  // Nishonlar: o'ynalgan payt (tong sahar yoki yarim tundan keyin)
  // hech qanday sanoqda qolmaydi, shuning uchun aynan shu yerda
  // belgilanadi (`lib/badges.ts`). Qolgan nishonlar quyidagi sonlardan
  // o'zi hisoblanadi — bu yerda qo'shimcha yozuv yo'q.
  markPlayedAt();

  // Muhim tartib: avval cloud'dagi natijalar brauzerga tiklanadi.
  // Aks holda telefonda 40 kun yig'ilgan streak sayt yozgan «1» bilan
  // almashib ketardi.
  if (account) await ensureRestored(account);

  const found = readFound();
  const previous = found[answer];

  const points = won
    ? scoreFor({
        mode,
        attempts,
        maxAttempts: attemptsFor(length),
        repeated: Boolean(previous),
        hint: outcome.hint ?? 0,
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
    void pushToCloud({ outcome, stats, entry });
  } else {
    // Kirmasdan o'ynagan natija navbatda turadi: keyin kirilsa cloud'ga
    // o'zi yoziladi va reytingga tushadi.
    queuePending({ outcome });
  }

  return { points, stats, total };
}

async function pushToCloud({
  outcome,
  stats,
  entry,
}: {
  outcome: Outcome;
  stats: GameStats;
  entry: FoundWord | null;
}): Promise<void> {
  const { mode, length, dateKey, words } = outcome;
  try {
    // Statistika — qurilmadagi sonlar nusxasi. Server ularni
    // qo'shmaydi, o'rnatadi: bir o'yin ikki qurilmada ochilsa sonlar
    // ikkilanmasligi kerak.
    await api.put('/v1/me/stats', {
      body: {
        mode,
        length,
        played: stats.played,
        wins: stats.wins,
        currentStreak: stats.currentStreak,
        maxStreak: stats.maxStreak,
        distribution: stats.distribution,
        lastDailyNumber: stats.lastDailyNumber,
      },
    });

    // Topilgan so'z — bir so'z bir marta. Takrori `added: false`
    // qaytaradi va bu xato emas, qoida.
    if (entry) {
      await api.post('/v1/me/words', {
        body: {
          word: entry.word,
          mode: entry.mode,
          length: entry.length,
          score: entry.score,
          attempts: entry.attempts,
          ...(entry.categoryId ? { categoryId: entry.categoryId } : {}),
        },
      });
    }

    /*
     * Kunlik o'yin — **yozilgan so'zlar** yuboriladi, ball emas.
     *
     * Ballni server o'z javobi bilan solishtirib hisoblaydi, reyting
     * va liga ham o'sha yerda yangilanadi. Ikkinchi yozuv qabul
     * qilinmaydi: natija birinchisiniki bo'lib qoladi, ya'ni saytdagi
     * o'yin telefonda olingan natijani bosib ketolmaydi — ilgari buni
     * oldindan tekshirish bilan to'sardik, endi qoida serverda.
     */
    if (mode === 'daily' && words.length > 0) {
      await api.post('/v1/daily/submit', {
        body: { day: dateKey, length, words },
      });
    }
  } catch {
    // Zaxira nusxa yiqilsa ham o'yin davom etadi — natija qurilmada bor.
  }
}

/** Shu foydalanuvchining o'sha kundagi natijasi. */
export interface DailyEntry {
  attempts: number;
  won: boolean;
  points: number;
}

/** Bugungi kunlik o'yin allaqachon o'ynalganmi — ilovada yoki boshqa
 *  qurilmada, va o'ynalgan bo'lsa qanday tugagan.
 *
 *  Kunlik o'yin kuniga bitta: telefonda o'ynab bo'lgan odam saytda uni
 *  qaytadan o'ynay olmasligi kerak. Natijaning o'zi ham kerak —
 *  taxta yopilganda ekranga nimadir chizilishi shart, sayt esa uni
 *  o'zida saqlamaydi.
 *
 *  O'yin raqami so'ralmaydi: kun va uzunlik topishmoqni allaqachon
 *  bir qilib belgilaydi. */
export async function fetchDailyEntry({
  dateKey,
  length,
}: {
  dateKey: string;
  length: number;
}): Promise<DailyEntry | null> {
  try {
    const data = await api.get<{ played: boolean; result: DailyEntry | null }>(
      '/v1/daily/played',
      { query: { day: dateKey, length } },
    );
    return data.result ?? null;
  } catch {
    // Bilib bo'lmadi — o'yin ochiq qoladi. Ikkinchi yozuvni server
    // baribir qabul qilmaydi.
    return null;
  }
}

/** Kirmasdan o'ynalgan va hali cloud'ga yozilmagan natijalar. */
interface Pending {
  outcome: Outcome;
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

/** Kirilgandan keyin navbatdagi natijalarni serverga yozadi.
 *
 *  Hisob kerak emas — token `api` ning o'zida, lekin chaqiruvchi uni
 *  baribir biladi va shart sifatida qoldirilgan: kirmagan odam uchun
 *  navbat bo'shatilmasligi kerak. */
export async function flushPending(_account: Account): Promise<void> {
  const queue = read<Pending[]>(PENDING_KEY, []);
  if (queue.length === 0) return;
  write(PENDING_KEY, []);

  const found = readFound();
  for (const { outcome } of queue) {
    await pushToCloud({
      outcome,
      stats: readStats(outcome.mode, outcome.length),
      entry: outcome.won ? (found[outcome.answer] ?? null) : null,
    });
  }
}

/** Brauzerdagi o'yin izini tozalaydi: topilgan so'zlar va statistika.
 *
 *  Hisob almashganda chaqiriladi (`claimDevice`). Ikkovi ham ballga
 *  aylanadi — avvalgi hisobning so'zlari yangi hisobning yig'indisiga
 *  qo'shilib ketmasligi kerak. Yo'qolmaydi: har ikkalasi bulutda ham
 *  turadi va kirilganda o'z egasiga qaytadi (`restoreFromCloud`).
 *
 *  Navbatdagi natijalar (`sozgir.pending`) tegilmaydi — ular mehmon
 *  holatida o'ynalgan, ya'ni hozir kirayotgan odamniki. */
export function clearLocalProgress(): void {
  try {
    localStorage.removeItem(FOUND_KEY);
    for (const mode of ['daily', 'endless'] as Mode[]) {
      for (const length of LENGTHS) localStorage.removeItem(STATS_KEY(mode, length));
    }
  } catch {
    // Tozalanmasa — hech bo'lmasa kun hisobi hozirdan boshlanadi.
  }
  // Tiklash bir sessiyada bir marta bo'ladi: yangi hisob o'z tarixini
  // olib kelishi uchun belgi ham tashlanadi.
  restoring.clear();
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
async function restoreFromCloud(_account: Account): Promise<void> {
  try {
    const words = await api.get<{
      items: {
        word: string;
        mode: string;
        length: number;
        score: number;
        attempts: number;
        category_id: string | null;
        found_at: string;
      }[];
    }>('/v1/me/words', { query: { limit: 500 } });

    if (words.items.length > 0) {
      const found = readFound();
      for (const raw of words.items) {
        if (!raw.word) continue;
        const data: FoundWord = {
          word: raw.word,
          mode: raw.mode as Mode,
          length: raw.length,
          attempts: raw.attempts,
          score: Number(raw.score) || 0,
          foundAt: Date.parse(raw.found_at) || Date.now(),
          ...(raw.category_id ? { categoryId: raw.category_id } : {}),
        };
        const local = found[data.word];
        // Ikki manbadan eng yuqori ball qoladi.
        if (!local || data.score > (Number(local.score) || 0)) found[data.word] = data;
      }
      write(FOUND_KEY, found);
    }

    const stats = await api.get<{
      items: {
        mode: string;
        length: number;
        played: number;
        wins: number;
        current_streak: number;
        max_streak: number;
        distribution: Record<string, number>;
        last_daily_number: number | null;
      }[];
    }>('/v1/me/stats');

    const wanted = new Set<string>([
      `daily_${DAILY_LENGTH}`,
      ...LENGTHS.map((length) => `endless_${length}`),
    ]);

    for (const row of stats.items) {
      if (!wanted.has(`${row.mode}_${row.length}`)) continue;
      const mode = row.mode as Mode;
      const local = readStats(mode, row.length);
      // Faqat server oldinda bo'lganda qabul qilinadi.
      if (!row.played || row.played <= local.played) continue;

      const distribution: Record<number, number> = {};
      for (const [key, value] of Object.entries(row.distribution ?? {})) {
        distribution[Number(key)] = value;
      }
      write(STATS_KEY(mode, row.length), {
        played: row.played,
        wins: row.wins,
        currentStreak: row.current_streak,
        maxStreak: row.max_streak,
        distribution,
        lastDailyNumber: row.last_daily_number,
      });
    }
  } catch {
    // Tiklanmasa — brauzerdagi natijalar bilan davom etadi.
  }
}
