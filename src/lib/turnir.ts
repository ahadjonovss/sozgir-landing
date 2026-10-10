/** Turnir — ketma-ket bir necha **mardu maydoni**.
 *
 *  Yangi o'yin emas va maydonning ustiga qurilgan qavat ham emas:
 *  turnir faqat **tartib** beradi — kim kim bilan, qaysi davrada va kim
 *  o'tadi. O'ynaladigan narsa baribir o'sha mardu maydoni, ya'ni
 *  `battles/{id}` hujjati, o'sha jang ekrani, o'sha jadval
 *  (`docs/mardu_turnir.md`).
 *
 *  Har davrada odam ikki barobar kamayadi; sakkiztadan ko'p bo'lsa
 *  guruhlarga bo'linadi va guruhlar **bir vaqtda** boshlanib bir vaqtda
 *  tugaydi. Shu sababli kutish yo'q: pley-off juftlarida keyingi davra
 *  eng sekin juftni kutardi.
 *
 *  Yozishning hammasi Cloud Functions qo'lida — `mardu_series/{KOD}`
 *  hujjatiga mijoz yoza olmaydi (Firestore qoidasi `write: if false`).
 *  Saytga o'qish va chaqirish qoladi. */
import { callFunction } from '../firebase/functions';
import { watchDoc, type Unsubscribe } from '../firebase/live';
import type { BattleDoc, BattleGame } from './battle';
import type { ArenaStanding, MarduDoc } from './mardu';
import { rankArena } from './mardu';

/** Turnir hajmi. Uchtadan boshqasi yo'q: har davrada odam ikki barobar
 *  kamayishi kerak, ya'ni son ikkining darajasi bo'lishi shart. */
export const TURNIR_SIZES = [8, 16, 32] as const;
export type TurnirCapacity = (typeof TURNIR_SIZES)[number];

/** Shuncha odamdan kam bo'lsa turnir boshlanmaydi. */
export const TURNIR_MIN_PLAYERS = 2;

/** Bir guruhga sig'adigan odam — mardu maydonining o'z sig'imi.
 *  Sakkiz kishilik hujjat barqaror ~1 yozuv/soniya chegarasida qoladi. */
export const TURNIR_GROUP = 8;

/** Davralar orasidagi tanaffus: jadvalni o'qishga yetadi, davra
 *  tarqalib ketishiga yetmaydi. */
export const TURNIR_GAP_SECONDS = 20;

/** Kod uzunligi — mardudagi chaqiruv kodi bilan bir xil shaklda. */
export const TURNIR_CODE_LENGTH = 6;

type Stamp = { seconds?: number } | null;

export type TurnirStatus = 'gathering' | 'running' | 'finished' | 'expired';

export interface TurnirMember {
  nickname?: string;
  joinedAt?: Stamp;
}

/** Joriy davradagi bitta maydon. */
export interface TurnirGroup {
  battleId?: string;
  uids?: string[];
  done?: boolean;
}

/** Tugagan davradagi bitta maydon — jadvali bilan. */
export interface TurnirPastGroup {
  battleId?: string;
  standings?: ArenaStanding[];
}

export interface TurnirPastRound {
  round?: number;
  groups?: TurnirPastGroup[];
  /** Shu davrada olingan ochko — qator yonida turadi. Jami emas:
   *  to'rni o'qiyotgan odam har davrada kim qanday o'ynaganini
   *  ko'rishi kerak, jami esa jadvalda (`TurnirDoc.points`). */
  points?: Record<string, number>;
}

/** `mardu_series/{KOD}` — turnirning butun tarixi bitta hujjatda.
 *  Davra beshdan oshmaydi, ya'ni 32 kishida ham hujjat ~30 KB. */
export interface TurnirDoc {
  code?: string;
  title?: string;
  game?: BattleGame;
  length?: number;
  capacity?: number;
  status?: TurnirStatus;

  host?: string;
  createdBy?: string;
  createdAt?: Stamp;
  expiresAt?: Stamp;
  startedAt?: Stamp;
  finishedAt?: Stamp;

  members?: Record<string, TurnirMember>;
  uids?: string[];

  round?: number;
  /** Turnir necha davradan iborat — boshlanganda muhrlanadi. */
  rounds?: number;
  /** Boshlanganda muhrlanadigan kirish tartibi — teng ochkoda
   *  jadvaldagi o'rinni shu buzadi va u o'yindan **oldin** hammaga
   *  ko'rinadi. */
  seeds?: string[];
  /** Shu davrada o'ynayotganlar — shveytsarda odatda hamma. */
  alive?: string[];
  /** Jadval tartibi: ochko bo'yicha, teng ochkoda `seeds` bo'yicha. */
  order?: string[];
  /** Yig'ilgan ochko. */
  points?: Record<string, number>;
  /** Joriy davra oxirgisimi — unda birinchi guruh **final** bo'ladi. */
  final?: boolean;
  groups?: TurnirGroup[];
  nextRoundAt?: Stamp;
  ladder?: TurnirPastRound[];

  winnerUid?: string;
  runnerUpUid?: string;

  /** G'olibga to'langan ustama (aqcha) — sonni **server** hisoblaydi
   *  va shu yerga yozadi (`onTurnirFinished`).
   *
   *  Formula sahifada takrorlanmaydi: ikki joyda ikki xil bo'lib
   *  qolsa, ekrandagi son hisobga tushganidan farq qilardi — ustama
   *  esa `scores/{uid}` da, ya'ni mijozga yopiq.
   *
   *  Nol bo'lishi mumkin: sakkiz kishidan kam turnir mukofot
   *  chiqarmaydi (`rewards.ts`, `TURNIR_PRIZE_MIN_PLAYERS`). */
  prize?: number;
  runnerUpPrize?: number;
}

// ── Chaqiruvlar ────────────────────────────────────────────────────────

export const createTurnir = (input: {
  game: BattleGame;
  capacity: TurnirCapacity;
  length?: number;
  title?: string;
}) => callFunction<{ code: string }>('turnirCreate', input);

/** Kod bilan qo'shilish. Takroriy chaqiruv xato bermaydi — sahifasini
 *  yangilagan odam o'sha turnirga qaytadi. */
export const joinTurnir = (input: { code: string; nickname: string }) =>
  callFunction<{ code: string; round?: number }>('turnirJoin', input);

export const leaveTurnir = (code: string) =>
  callFunction<{ left: boolean }>('turnirLeave', { code });

/** Boshlashni tashkilotchi bosadi. Idempotent: ikki marta bosilsa
 *  ikkinchi davra ochilmaydi. */
export const startTurnir = (code: string) =>
  callFunction<{ round: number; startsAt?: number }>('turnirStart', { code });

export const kickFromTurnir = (code: string, uid: string) =>
  callFunction<{ removed: boolean }>('turnirKick', { code, uid });

export const watchTurnir = (
  code: string,
  onData: (doc: TurnirDoc | null) => void,
): Promise<Unsubscribe> => watchDoc<TurnirDoc>(`mardu_series/${code}`, onData);

/** Ulashiladigan havola — QR ham, «Nusxa olish» ham shuni beradi. */
export const turnirLink = (code: string) =>
  `https://sozgir.uz/turnir/${code.toUpperCase()}`;

/** Sayt ichidagi manzil — router shu bo'yicha sahifani tanlaydi. */
export const turnirPath = (code: string) => `/turnir/${code.toUpperCase()}`;

/** Kodni bitta shaklga keltiradi: olti belgi, katta harf. */
export const cleanCode = (value: string) =>
  value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, TURNIR_CODE_LENGTH);

// ── Zinapoya ───────────────────────────────────────────────────────────

/** Turnir necha davradan iborat (8 → 3, 16 → 4, 32 → 5).
 *
 *  Serverdagi `turnirRounds` ning aynan o'zi. Shveytsarda bu «odam
 *  ikki barobar kamayadi» degani emas — hamma hamma davrani
 *  o'ynaydi — faqat davralar soni. Yig'ilish sahifasida va'da bo'lib
 *  turadi: odam birinchi qarashdayoq necha davra o'ynashini va
 *  chiqarib yuborilmasligini bilsin. */
export function turnirRounds(players: number): number {
  let left = Math.max(1, players);
  let rounds = 0;
  while (left > 1) {
    left = Math.ceil(left / 2);
    rounds += 1;
  }
  return rounds;
}

/** Shuncha odam necha guruhga bo'linadi (`ceil(n / 8)`). */
export const groupCount = (players: number) =>
  Math.max(1, Math.ceil(players / TURNIR_GROUP));

export const memberName = (doc: TurnirDoc | null | undefined, uid: string) =>
  doc?.members?.[uid]?.nickname ?? 'Mehmon';

/** Turnirda qatnashayotganlar soni. `uids` qoidalar uchun yoziladi,
 *  `members` esa ko'rsatish uchun — ikkalasi ham bo'lmasa nol. */
export const playerCount = (doc: TurnirDoc | null | undefined) =>
  doc?.uids?.length ?? Object.keys(doc?.members ?? {}).length;

/** Joriy davrada shu odamning maydoni. Chiqib ketgan odamda `null`. */
export function groupOf(
  doc: TurnirDoc | null | undefined,
  uid: string,
): TurnirGroup | null {
  return doc?.groups?.find((group) => group.uids?.includes(uid)) ?? null;
}

/** Shu odamning jadvaldagi holati.
 *
 *  Shveytsarda «chiqib ketdim» degan holat yo'q — hamma oxirigacha
 *  o'ynaydi. Shuning uchun savol boshqacha: **nechanchi o'rindaman va
 *  nechta ochkom bor**. */
export interface TurnirPlace {
  /** Jadvaldagi o'rin (1 dan). Ro'yxatda bo'lmasa 0. */
  rank: number;
  points: number;
  /** Shu davrada o'ynayaptimi. Deyarli doim rost: faqat oxirgi
   *  davrada, qolganlar ikki kishidan kam bo'lsa, bitta odam
   *  o'tkazib yuboriladi. */
  playing: boolean;
  winner: boolean;
}

export function placeOf(
  doc: TurnirDoc | null | undefined,
  uid: string,
): TurnirPlace {
  if (!uid) return { rank: 0, points: 0, playing: false, winner: false };
  const at = doc?.order?.indexOf(uid) ?? -1;
  return {
    rank: at < 0 ? 0 : at + 1,
    points: doc?.points?.[uid] ?? 0,
    playing: doc?.alive?.includes(uid) ?? false,
    winner: doc?.winnerUid === uid,
  };
}

/** Joriy davradagi guruh final guruhimi.
 *
 *  Final har doim **birinchi** guruh (serverdagi `finalGroups`). */
export const isFinalGroup = (
  doc: TurnirDoc | null | undefined,
  group: TurnirGroup,
): boolean =>
  doc?.final === true && doc.groups?.[0]?.battleId === group.battleId;

// ── To'r ───────────────────────────────────────────────────────────────

/** To'rdagi bitta qator. */
export interface LadderSeat {
  uid: string;
  nickname: string;
  /** Guruhdagi o'rin. Hali o'ynalmagan davrada `null`. */
  rank: number | null;
  score: number | null;
  /** Shu davrada olingan ochko. Tugamagan guruhda `null`. */
  points: number | null;
  mine: boolean;
}

export interface LadderGroup {
  battleId: string | null;
  seats: LadderSeat[];
  done: boolean;
}

export interface LadderGroupName {
  /** Oxirgi davradagi birinchi guruh — **final**. */
  final: boolean;
}

export interface LadderRound {
  round: number;
  groups: LadderGroup[];
  players: number;
  /** Hozir o'ynalayotgan davra — ko'rinishda ajralib turadi. */
  current: boolean;
  /** Oxirgi davra: birinchi guruh final, qolganlari jadval uchun. */
  last: boolean;
}

/** Hujjatdan to'r: tugagan davralar `ladder` dan, joriysi `groups` dan.
 *
 *  `live` — joriy davradagi guruh janglarining hujjatlari. Ular bo'lsa
 *  jadval jonli ko'rinadi (kim nechta to'pladi), bo'lmasa qator faqat
 *  ism bo'lib turadi: jang hujjatini o'qiy olmaslik — xato emas, shunchaki
 *  kamroq ma'lumot. */
export function buildLadder({
  doc,
  uid,
  live,
}: {
  doc: TurnirDoc | null | undefined;
  uid: string;
  live?: Record<string, MarduDoc | null>;
}): LadderRound[] {
  const rounds: LadderRound[] = [];

  for (const past of doc?.ladder ?? []) {
    const earned = past.points ?? {};
    const groups: LadderGroup[] = (past.groups ?? []).map((group) => ({
      battleId: group.battleId ?? null,
      done: true,
      seats: [...(group.standings ?? [])]
        .sort((a, b) => a.rank - b.rank)
        .map((row) => ({
          uid: row.uid,
          nickname: memberName(doc, row.uid),
          rank: row.rank,
          score: row.score,
          points: earned[row.uid] ?? null,
          mine: row.uid === uid,
        })),
    }));
    rounds.push({
      round: past.round ?? rounds.length + 1,
      groups,
      players: groups.reduce((sum, group) => sum + group.seats.length, 0),
      current: false,
      last: (past.round ?? 0) >= (doc?.rounds ?? 0),
    });
  }

  const running = doc?.status === 'running' && (doc.round ?? 0) > 0;
  if (running && !rounds.some((item) => item.round === doc.round)) {
    const groups: LadderGroup[] = (doc.groups ?? []).map((group) => {
      const battle = group.battleId ? live?.[group.battleId] : null;
      const rows = battle ? rankArena({ battle, uid }) : [];
      const byUid = new Map(rows.map((row) => [row.uid, row] as const));
      // Tartib jonli jadvaldan, u yo'q bo'lsa serverdagi ro'yxat
      // tartibidan — ya'ni qator sakrab turmaydi.
      const seats = (group.uids ?? []).map((seat) => {
        const row = byUid.get(seat);
        return {
          uid: seat,
          nickname: row?.nickname ?? memberName(doc, seat),
          rank: row?.rank ?? null,
          score: row?.score ?? null,
          points: null,
          mine: seat === uid,
        };
      });
      seats.sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));
      return { battleId: group.battleId ?? null, seats, done: group.done === true };
    });

    rounds.push({
      round: doc.round ?? rounds.length + 1,
      groups,
      players: groups.reduce((sum, group) => sum + group.seats.length, 0),
      current: true,
      last: doc.final === true,
    });
  }

  return rounds;
}

/** Jang turnir guruhimi — shunday bo'lsa qaysi turnirniki.
 *
 *  Natija ekrani shu bilan «Maydonga qaytish» o'rniga «Turnirga
 *  qaytish» ko'rsatadi: odam o'z turniriga qaytishi kerak, umumiy
 *  maydon bo'limiga emas. */
export const seriesOf = (battle: BattleDoc | null | undefined): string | null =>
  (battle as MarduDoc | null | undefined)?.seriesId ?? null;
