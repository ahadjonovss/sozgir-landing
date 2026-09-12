/** Ballar kitobi — ilovadagi `ScoreBook` va `ScoreRepository` ning veb
 *  ko'chirmasi (`docs/scores.md`).
 *
 *  Ilovada uch xil son bor va ular bir-biridan **kelib chiqadi**:
 *
 *  | Son | Nima | Qayerda |
 *  | --- | --- | --- |
 *  | O'yin balli | O'yinning o'z shkalasidagi xom ball | `scores/{uid}.games.{oyin}` |
 *  | Umumiy ball | Barcha o'yinlar, koeffitsient bilan | `scores/{uid}.totalScore` |
 *  | Onlayn ball | Shundan raqib bilan o'ynab olingani | `scores/{uid}.onlineScore` |
 *
 *  Shuning uchun `scores/{uid}` ga «o'zimning ballim» deb yozib bo'lmaydi:
 *  ilgari sayt `totalScore` ga faqat topilgan so'zlar yig'indisini yozardi
 *  va bu g'unchada yig'ilgan ballni hujjatdan uchirib yuborardi. Endi yozuv
 *  shu yerdan o'tadi: hujjatdagi `games` o'qiladi, faqat **shu o'yinning**
 *  ulushi almashtiriladi, umumiy va onlayn ball esa qaytadan yig'iladi.
 *
 *  Ikkinchi qoida — **pasaytirmaslik**. Sayt topilgan so'zlarning oxirgi
 *  500 tasini tiklaydi (`progress.ts`), ya'ni uning ro'yxati telefondagidan
 *  qisqa bo'lishi mumkin. Ilova to'liq ro'yxat bilan yozadi, shuning uchun
 *  sayt hech qachon hujjatdagi qiymatni kamaytirmaydi: o'yin ulushi ham,
 *  umumiy son ham faqat o'sadi. Ball kamayishi kerak bo'lgan holatni
 *  (so'z o'chirilgan, hisob almashgan) ilovaning o'zi to'g'rilaydi. */
import { client } from '../firebase/client';
import { PATHS } from '../firebase/paths';

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

/** Bitta o'yindagi xom ball — o'yinning o'z shkalasida. */
export interface GameTally {
  /** Yakka o'ynalganda yig'ilgan ball. */
  solo: number;
  /** Raqib bilan o'ynalganda yig'ilgan ball (umumiyning bir qismi). */
  online: number;
  /** Ball bergan hodisalar soni — So'ztopda topilgan so'z. */
  count: number;
}

export const EMPTY_TALLY: GameTally = { solo: 0, online: 0, count: 0 };

export type GameBook = Partial<Record<GameKey, GameTally>>;

/** O'yinning o'z reytingi — yakka va onlayn ballning yig'indisi. */
export const rawOf = (tally: GameTally) => tally.solo + tally.online;

const int = (value: unknown) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.round(number) : 0;
};

function tallyOf(raw: unknown): GameTally {
  const data = (raw ?? {}) as Record<string, unknown>;
  return {
    solo: int(data.solo),
    online: int(data.online),
    count: int(data.count),
  };
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
    book.soztop = {
      solo: int(data?.totalScore),
      online: 0,
      count: int(data?.wordsFound),
    };
  }
  return book;
}

export function totalOf(book: GameBook): number {
  let total = 0;
  for (const [game, tally] of Object.entries(book) as [GameKey, GameTally][]) {
    total += rawOf(tally) * GAME_WEIGHT[game];
  }
  return total;
}

export function onlineOf(book: GameBook): number {
  let total = 0;
  for (const [game, tally] of Object.entries(book) as [GameKey, GameTally][]) {
    total += tally.online * GAME_WEIGHT[game];
  }
  return total;
}

/** Ikkitasidan **to'lig'i** qoladi.
 *
 *  Maydonma-maydon eng kattasini olish yaramaydi: eski hujjatdagi yozuvda
 *  butun ball `solo` da turadi, saytdagi hisobda esa u yakka va onlaynga
 *  bo'lingan. Aralashtirilsa onlayn qismi ikki marta qo'shilardi. */
function fuller(stored: GameTally, mine: GameTally): GameTally {
  return rawOf(mine) >= rawOf(stored) ? mine : stored;
}

/** O'yinning ulushini yozadi va umumiy hisobni qaytadan yig'adi.
 *
 *  Xato yutiladi: ball yozilmagani o'yinni to'xtatmasligi kerak — natija
 *  brauzerda turibdi va keyingi o'yinda yana yoziladi. */
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
    await setDoc(
      reference,
      {
        nickname,
        // Hech qachon pasaymaydi: saytdagi ro'yxat telefondagidan qisqa
        // bo'lishi mumkin (oxirgi 500 so'z tiklanadi).
        totalScore: Math.max(totalOf(book), int(data?.totalScore)),
        onlineScore: Math.max(onlineOf(book), int(data?.onlineScore)),
        wordsFound: Math.max(soztop.count, int(data?.wordsFound)),
        games: book,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch {
    // Yozilmadi — keyingi o'yinda qaytadan urinamiz.
  }
}
