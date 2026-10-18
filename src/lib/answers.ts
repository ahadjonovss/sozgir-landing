/** Kunlik so'z javoblari — bugungisi va arxiv (`/javoblar`).
 *
 *  **Ertangi so'z ko'rsatilmaydi.** Kunlik so'zlar oldindan yasab
 *  qo'yiladi (server bir necha kunga oldinga ishlaydi), ya'ni
 *  jadvalda kelajak ham bor. Kesish **serverda**, uning o'z sanasi
 *  bo'yicha: brauzer soatini o'zgartirgan odam ham ro'yxatdan
 *  kelajakni chiqara olmaydi.
 *
 *  Tartib raqami javobda yo'q va u shu yerda sanaladi: u sanadan
 *  kelib chiqadigan son (`dailyNumber`) va ikkala tomonda bir xil
 *  formuladan chiqadi.
 *
 *  Ma'nolar lug'atdan qo'shiladi (`dictionary.ts`) — u baribir
 *  brauzerda keshlangan va o'yin uchun yuklanadi. Serverda so'z
 *  ma'nolari saqlanmaydi, ya'ni ular keshdagi eski lug'atda qolgan
 *  bo'lsagina chiqadi. */
import { api } from '../api/client';
import { dailyNumber } from './daily';
import { loadDictionary } from './dictionary';
import { DAILY_LENGTH } from './modes';

export interface DailyAnswer {
  /** Kunlik o'yin tartib raqami (№49). */
  number: number;
  /** `2026-09-20`. */
  dateKey: string;
  word: string;
  /** Lug'atdagi ta'rif. Topilmasa bo'sh. */
  meaning: string;
}

/** Arxivda shuncha kun ko'rinadi — yarim yil. Ro'yxat uzaygani sari
 *  sahifa og'irlashadi, o'quvchi esa pastki qismiga baribir tushmaydi. */
const LIMIT = 180;

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

/** O'tgan kunlar javobi, eng yangisidan boshlab. Bugungisi ham shu
 *  ro'yxatning birinchi qatori. */
export async function loadAnswers(
  { limit = LIMIT, length = DAILY_LENGTH }: { limit?: number; length?: number } = {},
): Promise<DailyAnswer[]> {
  let items: unknown;
  try {
    ({ items } = await api.get<{ items?: unknown }>('/v1/public/daily/answers', {
      query: { limit, length },
      auth: false,
    }));
  } catch {
    // Ro'yxat kelmadi — sahifa bo'sh ko'rinadi, bu xato emas.
    return [];
  }

  const rows = (Array.isArray(items) ? items : [])
    .map((row) => {
      const item = row as { day?: unknown; answer?: unknown };
      const dateKey = text(item.day);
      return {
        dateKey,
        word: text(item.answer).toLowerCase(),
        number: dateKey ? dailyNumber(new Date(`${dateKey}T00:00:00Z`)) : 0,
      };
    })
    .filter((row) => row.word && row.dateKey);

  // Ma'nolar bitta lug'atdan. Lug'at kelmasa ro'yxat baribir chiqadi —
  // javobning o'zi ma'nosidan muhimroq.
  let meanings: Record<string, string> = {};
  try {
    const dictionary = await loadDictionary(length);
    meanings = Object.fromEntries(
      rows.map((row) => [row.word, dictionary.words[row.word]?.d ?? '']),
    );
  } catch {
    // ma'nosiz ro'yxat ham ish beradi
  }

  return rows.map(({ number, dateKey, word }) => ({
    number,
    dateKey,
    word,
    meaning: meanings[word] ?? '',
  }));
}

const MONTHS = [
  'yanvar',
  'fevral',
  'mart',
  'aprel',
  'may',
  'iyun',
  'iyul',
  'avgust',
  'sentabr',
  'oktabr',
  'noyabr',
  'dekabr',
];

/** `2026-09-20` → `20-sentabr, 2026`. */
export function formatDate(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  if (!year || !month || !day) return dateKey;
  return `${day}-${MONTHS[month - 1]}, ${year}`;
}
