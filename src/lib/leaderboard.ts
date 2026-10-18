/** Reyting jadvallari — ilovadagi ikki ro'yxatning aynan o'zi.
 *
 *  Hammasi ochiq marshrutlardan o'qiladi, ya'ni jadvalni ko'rish uchun
 *  kirish shart emas va Firebase SDK yuklanmaydi.
 *
 *  Robotlarni **server** ajratadi (`users.is_bot = false`): Firestore
 *  REST filtr bilmagani uchun sayt ilgari ko'proq olib, o'zi saralardi —
 *  endi uning hojati yo'q. */
import { api } from '../api/client';
import { GUEST } from './nickname';

export interface Entry {
  uid: string;
  nickname: string;
  /** Kunlik jadvalda — urinishlar soni, umumiyda — topilgan so'zlar soni. */
  count: number;
  points: number;
  won: boolean;
}

interface Row {
  uid?: unknown;
  nickname?: unknown;
  points?: unknown;
  attempts?: unknown;
  aqcha?: unknown;
  wordsFound?: unknown;
  rating?: unknown;
  wins?: unknown;
  losses?: unknown;
  draws?: unknown;
}

const text = (value: unknown, fallback: string) =>
  typeof value === 'string' && value.trim() ? value.trim() : fallback;

const int = (value: unknown) => (typeof value === 'number' ? value : 0);

/** Bo'sh yoki chala javob jadvalni yiqitmasligi kerak: bo'lim shunchaki
 *  bo'sh ko'rinadi, avvalgi xulq ham shunday edi. */
async function items(path: string, query?: Record<string, string | number>): Promise<Row[]> {
  try {
    const data = await api.get<{ items?: unknown }>(path, { query, auth: false });
    return Array.isArray(data.items) ? (data.items as Row[]) : [];
  } catch {
    return [];
  }
}

/** Bugungi eng yaxshi natijalar. */
export async function dailyTop({
  dateKey,
  length,
  limit = 10,
}: {
  dateKey: string;
  length: number;
  limit?: number;
}): Promise<Entry[]> {
  const rows = await items('/v1/daily/ranking', { day: dateKey, length });

  return rows.slice(0, limit).map((row) => ({
    uid: text(row.uid, ''),
    nickname: text(row.nickname, GUEST),
    count: int(row.attempts),
    points: int(row.points),
    // Serverdagi jadvalga faqat yakunlangan natija tushadi.
    won: true,
  }));
}

/** Bugun barcha o'yinlarda ishlangan aqcha — ilovadagi «Bugun»
 *  jadvalining o'zi.
 *
 *  Kunlik jadvaldan farqi: u faqat bugungi **so'z** natijasi, bu esa shu
 *  kunda So'ztop, G'uncha va jangda yig'ilgan ballning yig'indisi. */
export async function todayTop({
  dateKey,
  limit = 10,
}: {
  dateKey: string;
  limit?: number;
}): Promise<Entry[]> {
  const rows = await items('/v1/daily/aqcha', { day: dateKey, limit });

  return rows.map((row) => ({
    uid: text(row.uid, ''),
    nickname: text(row.nickname, GUEST),
    // Urinish ham, topilgan so'z ham yo'q: yozuv faqat shu kunda
    // yig'ilgan ballni saqlaydi — u bitta so'zniki emas.
    count: 0,
    points: int(row.points),
    won: true,
  }));
}

/** Umumiy (all-time) reyting — yig'ilgan aqcha bo'yicha.
 *
 *  Serverdagi `aqcha` — o'yinlarda yig'ilgan ball bilan o'lja
 *  ustamasining yig'indisi (`docs/aqcha.md`, 5-bo'lim), ya'ni
 *  Firestore'dagi `wealth` maydonining o'rnini bosadi. */
export async function totalTop({ limit = 10 }: { limit?: number } = {}): Promise<
  Entry[]
> {
  const rows = await items('/v1/ranking', { limit });

  return rows.map((row) => ({
    uid: text(row.uid, ''),
    nickname: text(row.nickname, GUEST),
    count: int(row.wordsFound),
    points: int(row.aqcha),
    won: true,
  }));
}

export interface BattleEntry {
  uid: string;
  nickname: string;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
}

/** So'zjang reytingi. Yozuvni server jang yakunida qo'yadi, o'qish
 *  hammaga ochiq; jang o'ynamagan odam jadvalga tushmaydi. */
export async function battleTop({ limit = 10 }: { limit?: number } = {}): Promise<
  BattleEntry[]
> {
  const rows = await items('/v1/battle-ratings', { limit });

  return rows.map((row) => ({
    uid: text(row.uid, ''),
    nickname: text(row.nickname, GUEST),
    rating: int(row.rating),
    wins: int(row.wins),
    losses: int(row.losses),
    draws: int(row.draws),
  }));
}
