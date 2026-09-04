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
  limit = 20,
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
export async function totalTop({ limit = 20 }: { limit?: number } = {}): Promise<
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
