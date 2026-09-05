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

export interface BattlePlayer {
  nickname?: string;
  /** Ranglar qatorlari (`srryy`). Harflar yo'q — raqib javobni bilmasin. */
  rows?: string[];
  attempts?: number;
  won?: boolean;
  finished?: boolean;
  score?: number;
  durationMs?: number;
  /** Jang tugagach oshkor qilinadigan taxminlar. */
  words?: string[];
}

export interface BattleDoc {
  type?: BattleType;
  status?: BattleStatus;
  length?: number;
  createdBy?: string;
  inviteCode?: string;
  players?: Record<string, BattlePlayer>;
  winnerUid?: string | null;
  /** Jang tugagach oshkor qilinadi. */
  answer?: string | null;
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

export const joinByCode = (input: { code: string; nickname: string }) =>
  callFunction<{ battleId: string }>('battleJoin', input);

export const quickMatch = (input: { length: number; nickname: string }) =>
  callFunction<{ battleId?: string; queued?: boolean }>('battleQuick', input);

export const leaveQueue = () => callFunction<unknown>('battleLeaveQueue');

export const sendGuess = (input: { battleId: string; word: string }) =>
  callFunction<GuessReply>('battleGuess', input);

export const forfeit = (battleId: string) =>
  callFunction<unknown>('battleForfeit', { battleId });

export const watchBattle = (
  battleId: string,
  onData: (battle: BattleDoc | null) => void,
): Promise<Unsubscribe> => watchDoc<BattleDoc>(`battles/${battleId}`, onData);

export const watchQueue = (
  uid: string,
  onData: (entry: { status?: string; matchId?: string } | null) => void,
): Promise<Unsubscribe> => watchDoc(`battle_queue/${uid}`, onData);

/** Chaqiruv havolasi — bosgan odam kodni terib o'tirmasligi uchun. */
export const inviteLink = (code: string) =>
  `https://sozgir.uz/sozjang?kod=${code}`;
