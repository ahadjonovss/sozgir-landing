/** Reyting jadvallari — ilovadagi ikki ro'yxatning aynan o'zi.
 *
 *  Ikkisi ham ochiq hujjatlardan o'qiladi (`allow read: if true`), shuning
 *  uchun jadvalni ko'rish uchun kirish shart emas va Firebase SDK ham
 *  yuklanmaydi. Saralash bitta maydon bo'yicha — qo'shimcha indeks kerak
 *  emas, ilova ham xuddi shunday qiladi. */
import { PATHS } from '../firebase/paths';
import { listDocs } from '../firebase/rest';
import { GUEST } from './nickname';

export interface Entry {
  uid: string;
  nickname: string;
  /** Kunlik jadvalda — urinishlar soni, umumiyda — topilgan so'zlar soni. */
  count: number;
  points: number;
  won: boolean;
}

const text = (value: unknown, fallback: string) =>
  typeof value === 'string' && value.trim() ? value.trim() : fallback;

const int = (value: unknown) => (typeof value === 'number' ? value : 0);

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
  const documents = await listDocs(
    `${PATHS.dailyResults}/${dateKey}_${length}/${PATHS.entries}`,
    { orderBy: 'points desc', pageSize: limit },
  );

  return documents.map((document) => ({
    uid: document.id,
    nickname: text(document.fields.nickname, GUEST),
    count: int(document.fields.attempts),
    points: int(document.fields.points),
    won: document.fields.won === true,
  }));
}

/** Umumiy (all-time) reyting — jamlangan ball bo'yicha. */
export async function totalTop({ limit = 10 }: { limit?: number } = {}): Promise<
  Entry[]
> {
  const documents = await listDocs(PATHS.scores, {
    orderBy: 'totalScore desc',
    pageSize: limit,
  });

  return documents.map((document) => ({
    uid: document.id,
    nickname: text(document.fields.nickname, GUEST),
    count: int(document.fields.wordsFound),
    points: int(document.fields.totalScore),
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

/** So'zjang reytingi — `battle_ratings`, `rating desc`. Hujjatni server jang
 *  yakunida yozadi, o'qish hammaga ochiq; jang o'ynamagan odam jadvalga
 *  tushmaydi (hujjati yo'q).
 *
 *  Robotlar (`bot: true`) jadvalga chiqmaydi: ular navbatda odam
 *  bo'lmaganda raqib bo'lish uchun yaratilgan va eng yuqori reytinglarni
 *  egallab olgan — jadvalda o'ntaning hammasi robot bo'lib turardi. REST
 *  ro'yxati filtr bilmaydi, shuning uchun ko'proq olinib shu yerda
 *  saralanadi. */
export async function battleTop({ limit = 10 }: { limit?: number } = {}): Promise<
  BattleEntry[]
> {
  const documents = await listDocs(PATHS.battleRatings, {
    orderBy: 'rating desc',
    pageSize: limit * 4,
  });

  return documents
    .filter((document) => document.fields.bot !== true)
    .slice(0, limit)
    .map((document) => ({
    uid: document.id,
    nickname: text(document.fields.nickname, GUEST),
    rating: int(document.fields.rating),
    wins: int(document.fields.wins),
    losses: int(document.fields.losses),
    draws: int(document.fields.draws),
  }));
}
