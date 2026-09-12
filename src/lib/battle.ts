/** So'zjang — ilovadagi bellashuv rejimining veb ko'rinishi.
 *
 *  Ma'lumot modeli va chaqiruvlar ilova bilan bir xil, ya'ni saytda
 *  yaratilgan chaqiruvga telefondan qo'shilish mumkin va aksincha.
 *
 *  Yozishning hammasi Cloud Functions orqali: qoidalar mijozga
 *  `serverAuthoritative` jangni o'zgartirishga ruxsat bermaydi. O'qish
 *  esa to'g'ridan-to'g'ri Firestore'dan — u tez va jonli. */
import { callFunction } from '../firebase/functions';
import { watchDoc, type Unsubscribe } from '../firebase/live';
import type { Verdict } from './uz';

export type BattleStatus = 'waiting' | 'running' | 'finished' | 'expired';
export type BattleType = 'quick' | 'challenge' | 'group';

/** Jang qaysi o'yinniki.
 *
 *  `battles` to'plami ikkalasiga umumiy: juftlash, chaqiruv, muddati
 *  o'tganini tozalash va tarix bir xil, farq faqat shu maydonda va
 *  o'yinga xos qismda. Maydoni yo'q eski janglar — So'ztopniki. */
export type BattleGame = 'soztop' | 'guncha';

export const gameOf = (value: unknown): BattleGame =>
  value === 'guncha' ? 'guncha' : 'soztop';

export interface BattlePlayer {
  nickname?: string;
  /** Ranglar qatorlari (`srryy`). Harflar yo'q — raqib javobni bilmasin. */
  rows?: string[];
  attempts?: number;
  won?: boolean;
  finished?: boolean;
  score?: number;
  durationMs?: number;
  /** Jang tugagach oshkor qilinadigan taxminlar (So'zjang) yoki topilgan
   *  so'zlar (g'uncha). */
  words?: string[];
  /** G'unchada topilgan so'zlar **soni**.
   *
   *  Ataylab `words` emas: So'zjangda o'sha nom ostida ro'yxat yotadi va
   *  ikkalasi bitta to'plamda yashaydi — bir nom ikki xil turda bo'lsa,
   *  tarixni o'qiyotgan mijoz qulab tushadi. */
  wordCount?: number;
  /** G'uncha jangi tugagach ochiladigan so'zlar. */
  found?: string[];
  /** Reyting shu jangda qancha o'zgargani — natija ekrani jadvalni
   *  kutmasdan shu ikkisidan o'qiydi. */
  ratingBefore?: number;
  ratingAfter?: number;
  /** Maslahat olgan — raqib buni ko'radi, harfni esa bilmaydi. */
  hintUsed?: boolean;
}

/** G'uncha jangining harflari — ikkala o'yinchiga bir xil. */
export interface BattleGuncha {
  center?: string;
  petals?: string[];
}

export interface BattleDoc {
  game?: BattleGame;
  type?: BattleType;
  status?: BattleStatus;
  length?: number;
  createdBy?: string;
  inviteCode?: string;
  players?: Record<string, BattlePlayer>;
  winnerUid?: string | null;
  /** Jang tugagach oshkor qilinadi. */
  answer?: string | null;
  /** G'uncha jangida — harflar. */
  guncha?: BattleGuncha;
  /** G'uncha jangi tugaydigan payt (serverning soati bo'yicha). */
  endsAt?: { seconds?: number } | null;
  /** Do'st bilan jangda raqib kirishi kerak bo'lgan muddat (2 daqiqa) —
   *  kutish ekranidagi «pilik» shundan hisoblanadi. */
  expiresAt?: { seconds?: number } | null;
}

/** Manzilli chaqiruv qayerdan yuborilgani — ilovadagi `BattleInviteKind`.
 *  Uchalasi bir oqim, farqi faqat manba va raqibga boradigan push
 *  sarlavhasi: `rematch` — jangdan keyingi revansh, `nearby` — yaqin
 *  atrofdagi o'yinchi, `profile` — reytingda ko'rilgan o'yinchiga
 *  (ilovada ochiq profil, saytda jadval qatori). */
export type InviteKind = 'rematch' | 'nearby' | 'profile';

/** Chaqiruv manbasining yozuvi — ilovadagi `battleInviteSource`. */
export function inviteSource(kind: string): string {
  if (kind === 'nearby') return 'yaqin atrofdan';
  if (kind === 'profile') return 'profil orqali';
  return 'revansh';
}

/** `battle_invites/{id}` — chaqirgan tomon kuzatadigan qismi. */
export interface InviteDoc {
  status?: 'pending' | 'accepted' | 'declined' | 'expired';
  /** Qabul qilinganda server yaratgan jang. */
  battleId?: string;
  /** Qaysi o'yinga chaqirilgan — qabul qilingach shu ekran ochiladi. */
  game?: BattleGame;
  expiresAt?: { seconds?: number } | null;
}

export interface GuessReply {
  accepted: boolean;
  reason?: string;
  row?: string;
  won?: boolean;
  finished?: boolean;
  attempts?: number;
  /** Server bergan maslahat — faqat shu o'yinchiga qaytadi. */
  hint?: { index: number; unit: string } | null;
}

/** Server qaytaradigan rang belgilari. */
export const VERDICT_OF: Record<string, Verdict> = {
  s: 'correct',
  r: 'present',
  y: 'absent',
};

export const verdictsOf = (row: string): Verdict[] =>
  [...row].map((mark) => VERDICT_OF[mark] ?? 'absent');

export const createChallenge = (input: { length: number; nickname: string }) =>
  callFunction<{ battleId: string; code: string }>('battleCreate', input);

/** Kod bilan qo'shilish — ikkala o'yin uchun bir xil funksiya.
 *
 *  G'uncha jangida sanoq shu javobdan boshlanadi: mijoz `endsAt` va
 *  `serverNow` **farqini** oladi, ya'ni qurilma soati o'zgarsa ham vaqt
 *  sakramaydi. */
export const joinByCode = (input: { code: string; nickname: string }) =>
  callFunction<{ battleId: string; endsAt?: number; serverNow?: number }>(
    'battleJoin',
    input,
  );

/** Tezkor jang. `game` yuborilmasa server So'ztop deb qabul qiladi —
 *  navbat o'yin bo'yicha ajratilgan. */
export const quickMatch = (input: {
  length: number;
  nickname: string;
  game?: BattleGame;
}) => callFunction<{ battleId?: string; queued?: boolean }>('battleQuick', input);

export const leaveQueue = () => callFunction<unknown>('battleLeaveQueue');

export const sendGuess = (input: { battleId: string; word: string }) =>
  callFunction<GuessReply>('battleGuess', input);

export const forfeit = (battleId: string) =>
  callFunction<unknown>('battleForfeit', { battleId });

/** Aniq raqibga chaqiruv. Hujjatni server yaratadi (mijozga yozish yo'q),
 *  raqibga push boradi va ilova yoki sayt ochiq bo'lsa chaqiruv oynasi
 *  chiqadi. Javobsiz chaqiruv 2 daqiqada eskiradi. `repeated` — o'sha
 *  raqibga hali ochiq chaqiruv bor edi, yangisi yaratilmadi. */
export const sendInvite = (input: {
  toUid: string;
  nickname: string;
  length: number;
  kind: InviteKind;
  game?: BattleGame;
}) => callFunction<{ inviteId: string; repeated?: boolean }>('battleInvite', input);

/** Chaqiruvni bekor qilish — chaqirganning o'zi ham shu funksiya bilan
 *  yopadi (server `declinedBy` ni yozadi va raqibga xabar yubormaydi). */
export const cancelInvite = (inviteId: string) =>
  callFunction<unknown>('battleInviteDecline', { inviteId });

/** Yuborilgan chaqiruvning javobi: qabul qilinsa `battleId` tushadi. */
export const watchInvite = (
  inviteId: string,
  onData: (invite: InviteDoc | null) => void,
): Promise<Unsubscribe> => watchDoc<InviteDoc>(`battle_invites/${inviteId}`, onData);

export const watchBattle = (
  battleId: string,
  onData: (battle: BattleDoc | null) => void,
): Promise<Unsubscribe> => watchDoc<BattleDoc>(`battles/${battleId}`, onData);

/** Navbat yozuvi. Faqat serverdan kelgan holat: keshdagi eski yozuvda
 *  o'tgan jangning `matchId` si turadi. */
export const watchQueue = (
  uid: string,
  onData: (entry: { status?: string; matchId?: string } | null) => void,
): Promise<Unsubscribe> => watchDoc(`battle_queue/${uid}`, onData, { skipCache: true });

/** Chaqiruv havolasi — bosgan odam kodni terib o'tirmasligi uchun.
 *
 *  O'yin bo'yicha boshqa sahifaga olib boradi: g'uncha jangining kodi
 *  So'zjang sahifasida ishlamaydi (u boshqa funksiyani chaqiradi). */
export const inviteLink = (code: string, game: BattleGame = 'soztop') =>
  `https://sozgir.uz${game === 'guncha' ? '/gunchajang' : '/sozjang'}?kod=${code}`;
