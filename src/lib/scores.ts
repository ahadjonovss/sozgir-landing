/** Ballar kitobi — ilovadagi `ScoreBook` va `ScoreRepository` ning veb
 *  ko'chirmasi (`docs/scores.md`).
 *
 *  Ilova **ikkita** sonni biladi va ular bir-biridan kelib chiqadi:
 *
 *  | Son | Nima | Qayerda |
 *  | --- | --- | --- |
 *  | O'yin hisobi | O'yinning o'z shkalasidagi xom son | `scores/{uid}.games.{oyin}.score` |
 *  | Umumiy hisob | Barcha o'yinlar, koeffitsient bilan | `scores/{uid}.totalScore` |
 *
 *  Ikkalasi ham **tiyinda**: ekranda ular aqcha bo'lib ko'rinadi
 *  (`lib/aqcha.ts`), hujjatdagi son esa o'zgarmaydi.
 *
 *  Uchinchisi ham bor edi — «onlayn ball» (`onlineScore`, har o'yinda
 *  `solo`/`online` ustunlari). U umumiy ballning bir qismi bo'lgani uchun
 *  odam uni alohida hisob deb o'ylab chalkashardi; ilova uni tashladi,
 *  sayt ham yozmaydi. Eski hujjatlarda maydon qolib ketadi, lekin uni
 *  hech kim o'qimaydi — o'qishda esa `solo + online` **qo'shib** olinadi,
 *  ya'ni hech kim ball yo'qotmaydi.
 *
 *  Shuning uchun `scores/{uid}` ga «o'zimning ballim» deb yozib bo'lmaydi:
 *  hujjatdagi `games` o'qiladi, faqat **shu o'yinning** ulushi
 *  almashtiriladi, umumiy ball esa qaytadan yig'iladi.
 *
 *  Ikkinchi qoida — **pasaytirmaslik**. Sayt topilgan so'zlarning oxirgi
 *  500 tasini tiklaydi (`progress.ts`), ya'ni uning ro'yxati telefondagidan
 *  qisqa bo'lishi mumkin. Ilova to'liq ro'yxat bilan yozadi, shuning uchun
 *  sayt hech qachon hujjatdagi qiymatni kamaytirmaydi: o'yin ulushi ham,
 *  umumiy son ham faqat o'sadi. Ball kamayishi kerak bo'lgan holatni
 *  (so'z o'chirilgan, hisob almashgan) ilovaning o'zi to'g'rilaydi. */
import { client } from '../firebase/client';
import { PATHS } from '../firebase/paths';
import { dailyKey } from './daily';

/** Ilovadagi `GameId` — Firestore'da turadigan barqaror nomlar. */
export type GameKey = 'soztop' | 'guncha' | 'yangsoz';

/** Xom ballni umumiy ballga o'tkazish koeffitsienti (`GameId.weight`).
 *
 *  Har o'yin o'z shkalasida ball beradi: kunlik so'z eng ko'pi bilan 100,
 *  kunlik g'uncha o'rtacha 80 ball — ikkalasi bir tartibda, shuning uchun
 *  koeffitsient 1. Yangso'zning balli o'nlab marta kichik shkalada. */
export const GAME_WEIGHT: Record<GameKey, number> = {
  soztop: 1,
  guncha: 1,
  yangsoz: 15,
};

/** Bitta o'yindagi xom ball — o'yinning o'z shkalasida.
 *
 *  Yakka va raqib bilan o'ynalgani ajratilmaydi: jangda topilgan so'z ham
 *  o'sha o'yinning balli. */
export interface GameTally {
  /** O'yinda yig'ilgan ball — qayerda o'ynalganidan qat'i nazar. */
  score: number;
  /** Ball bergan hodisalar soni — So'ztopda topilgan so'z. */
  count: number;
}

export const EMPTY_TALLY: GameTally = { score: 0, count: 0 };

export type GameBook = Partial<Record<GameKey, GameTally>>;

const int = (value: unknown) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.round(number) : 0;
};

/** Hujjatdagi bitta o'yin yozuvi.
 *
 *  Eski yozuvda ball ikkiga bo'lingan (`solo`/`online`) — u holda ikkisi
 *  **qo'shiladi**. Yangi yozuvda bitta `score` turadi va eskilari e'tiborga
 *  olinmaydi: ilova yangilangandan keyin ular muzlab qoladi, ya'ni qo'shilsa
 *  bir xil ball ikki marta sanalardi. */
function tallyOf(raw: unknown): GameTally {
  const data = (raw ?? {}) as Record<string, unknown>;
  const score =
    data.score !== undefined ? int(data.score) : int(data.solo) + int(data.online);
  return { score, count: int(data.count) };
}

/** Hujjatdagi `games` xaritasi. */
function bookOf(data: Record<string, unknown> | undefined): GameBook {
  const games = (data?.games ?? {}) as Record<string, unknown>;
  const book: GameBook = {};
  for (const game of Object.keys(GAME_WEIGHT) as GameKey[]) {
    if (games[game] !== undefined) book[game] = tallyOf(games[game]);
  }

  // Eski hujjatda `games` yo'q: o'sha paytdagi `totalScore` — aynan
  // So'ztopning balli (boshqa o'yin hali yozmagan edi).
  if (book.soztop === undefined && int(data?.totalScore) > 0) {
    book.soztop = { score: int(data?.totalScore), count: int(data?.wordsFound) };
  }
  return book;
}

export function totalOf(book: GameBook): number {
  let total = 0;
  for (const [game, tally] of Object.entries(book) as [GameKey, GameTally][]) {
    total += tally.score * GAME_WEIGHT[game];
  }
  return total;
}

/** Ikkitasidan **kattarog'i** qoladi. */
function fuller(stored: GameTally, mine: GameTally): GameTally {
  return mine.score >= stored.score ? mine : stored;
}

/** O'yinning ulushini yozadi va umumiy hisobni qaytadan yig'adi.
 *
 *  Xato yutiladi: ball yozilmagani o'yinni to'xtatmasligi kerak — natija
 *  brauzerda turibdi va keyingi o'yinda yana yoziladi. */
/** Kun hisobi: `{key, base, last}` — kun boshidagi yig'indi va oxirgi
 *  ko'rilgan yig'indi. Ilovadagi `scores.day` ning o'zi. */
const DAY_KEY = 'sozgir.scores.day';

/** Bulutga **yozilgan** oxirgi kun natijasi. Ilovadagi `scores.pushedDay`:
 *  qaror yozilgani bilan solishtiriladi, qurilmadagi kesh bilan emas —
 *  aks holda bitta muvaffaqiyatsiz yozuv kun natijasini bulutda mangu
 *  eskirgan holda qoldirardi. */
const PUSHED_DAY_KEY = 'sozgir.scores.pushedDay';

/** Kun hisobini tashlaydi — kun keyingi ballda **hozirdan** boshlanadi
 *  (`base = total`).
 *
 *  Hisob almashganda chaqiriladi: bugungi ball yig'indining farqi bilan
 *  hisoblanadi va baza avvalgi hisobdan qolsa, yangi hisobning butun
 *  tarixi «bugun ishlangan ball» bo'lib kunlik jadvalga tushardi. */
export function clearDayTally(): void {
  try {
    localStorage.removeItem(DAY_KEY);
    localStorage.removeItem(PUSHED_DAY_KEY);
  } catch {
    // Tozalanmasa ham `rollDay` manfiy farqni nolga tushiradi.
  }
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Joy yetmasa yoki shaxsiy rejim bo'lsa — kun hisobi shu sessiyada qoladi.
  }
}

/** Kun hisobini surib qo'yadi va bugun ishlab topilgan ballni qaytaradi.
 *
 *  Nega brauzerda: xom ball o'yinlarning o'zida turadi va bulutga faqat
 *  **yig'indi** bo'lib boradi, ya'ni «bugun qancha» degan savolga
 *  serverning o'zi javob berolmaydi.
 *
 *  Yozuv umuman bo'lmasa bugun **hozir** boshlanadi (`base = total`):
 *  yangi brauzerda butun tarix bir kunda ishlangandek ko'rinmasin. */
function rollDay({ total, today }: { total: number; today: string }): number {
  const day = readJson<{ key?: string; base?: number; last?: number }>(DAY_KEY, {});
  const last = Number.isFinite(day.last) ? Number(day.last) : total;
  const base =
    day.key === today
      ? Number.isFinite(day.base)
        ? Number(day.base)
        : total
      // Yangi kun kecha qanday tugagan bo'lsa, o'shandan boshlanadi.
      : last;

  writeJson(DAY_KEY, { key: today, base, last: total });

  // Ball kamayishi mumkin (so'z o'chirildi, hisob almashdi) — bunda
  // bugungi natija manfiy emas, nol bo'ladi.
  return total > base ? total - base : 0;
}

export async function pushTally(input: {
  uid: string;
  nickname: string;
  game: GameKey;
  tally: GameTally;
}): Promise<void> {
  const { uid, nickname, game, tally } = input;
  try {
    const { db } = await client();
    const { doc, getDoc, setDoc, serverTimestamp } =
      await import('firebase/firestore/lite');

    const reference = doc(db, PATHS.scores, uid);
    const data = (await getDoc(reference)).data() as
      | Record<string, unknown>
      | undefined;

    const book = bookOf(data);
    book[game] = fuller(book[game] ?? EMPTY_TALLY, tally);

    const soztop = book.soztop ?? EMPTY_TALLY;
    // Hech qachon pasaymaydi: saytdagi ro'yxat telefondagidan qisqa
    // bo'lishi mumkin (oxirgi 500 so'z tiklanadi).
    const total = Math.max(totalOf(book), int(data?.totalScore));
    await setDoc(
      reference,
      {
        nickname,
        totalScore: total,
        wordsFound: Math.max(soztop.count, int(data?.wordsFound)),
        games: book,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    // Bugungi jadval alohida hujjatda: yig'indi butun tarixni saqlaydi va
    // undan «bugun qancha» chiqmaydi. Yig'indi yozilgandan **keyin**
    // yoziladi — birinchisi yiqilsa ikkinchisi ham kutadi.
    await pushDaily({ uid, nickname, total });
  } catch {
    // Yozilmadi — keyingi o'yinda qaytadan urinamiz. Kun natijasi mutlaq
    // son bo'lib yozilgani uchun qayta yuborish xavfsiz.
  }
}

/** Bugun ishlab topilgan ball — `daily_scores/{sana}/entries/{uid}`.
 *
 *  Son **mutlaq**: kun boshidan beri yig'ilgani. Shuning uchun qayta
 *  yozish xavfsiz va yozilmay qolgani keyingi ballda o'zi yetib boradi.
 *
 *  Hujjatdagi son pasaytirilmaydi: o'sha odam telefonda ham o'ynagan
 *  bo'lishi mumkin va uning kun hisobi o'z qurilmasida yuritiladi —
 *  ikkalasi bir savolga javob beradi, kattarog'i to'g'riroq. */
async function pushDaily(input: {
  uid: string;
  nickname: string;
  total: number;
}): Promise<void> {
  const { uid, nickname, total } = input;
  const today = dailyKey();
  const earned = rollDay({ total, today });
  if (earned <= 0) return;

  // O'zgarmagan sonni qayta yozish shart emas, lekin yozilmay qolgani
  // yozilishi shart — shuning uchun qaror **yuborilgani** bilan
  // solishtiriladi, kun hisobi bilan emas.
  const pushed = readJson<{ key?: string; earned?: number }>(PUSHED_DAY_KEY, {});
  if (pushed.key === today && pushed.earned === earned) return;

  const { db } = await client();
  const { doc, getDoc, setDoc, serverTimestamp } =
    await import('firebase/firestore/lite');

  const reference = doc(
    db,
    PATHS.dailyScores,
    today,
    PATHS.entries,
    uid,
  );
  const stored = int((await getDoc(reference)).data()?.points);
  // Qoidadagi yuqori chegara — bema'ni sonni to'sish uchun.
  const points = Math.min(Math.max(earned, stored), 100_000);

  await setDoc(
    reference,
    { nickname, points, updatedAt: serverTimestamp() },
    { merge: true },
  );
  writeJson(PUSHED_DAY_KEY, { key: today, earned });
}
