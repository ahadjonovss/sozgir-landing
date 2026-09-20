/** Kunlik so'z javoblari — bugungisi va arxiv (`/javoblar`).
 *
 *  Javoblar `daily/{sana}_{uzunlik}` hujjatlarida turadi va ular hammaga
 *  ochiq: o'yin ularni shu yerdan oladi. Arxiv — o'sha hujjatlarning
 *  ro'yxati.
 *
 *  **Ertangi so'z ko'rsatilmaydi.** Hujjatlar oldindan yasab qo'yiladi
 *  (server bir necha kunga oldinga ishlaydi), ya'ni ro'yxatni shundoq
 *  chiqarish o'yinni buzardi — bugungi kundan keyingi har qanday yozuv
 *  bu yerda tashlab yuboriladi. Chegara **sana bo'yicha**: brauzer
 *  soatini o'zgartirgan odam ham ro'yxatdan kelajakni chiqara olmaydi,
 *  chunki so'rovning o'zi bugungi kalitgacha bo'lgan yozuvlarni
 *  so'raydi.
 *
 *  Ma'nolar lug'atdan qo'shiladi (`dictionary.ts`) — u baribir
 *  brauzerda keshlangan va o'yin uchun yuklanadi. */
import { PATHS } from '../firebase/paths';
import { queryUpTo } from '../firebase/rest';
import { dailyKey } from './daily';
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

const int = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : 0;

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

/** O'tgan kunlar javobi, eng yangisidan boshlab. Bugungisi ham shu
 *  ro'yxatning birinchi qatori. */
export async function loadAnswers(
  { limit = LIMIT, length = DAILY_LENGTH }: { limit?: number; length?: number } = {},
): Promise<DailyAnswer[]> {
  // Chegara so'rovning o'zida: kelajakdagi so'zlar brauzerga umuman
  // kelmaydi. Hujjatlar har uzunlik uchun alohida (`{sana}_4` …
  // `{sana}_7`), shuning uchun kerakligidan to'rt barobar ko'p
  // so'raladi va keragi shu yerda saralanadi.
  const today = dailyKey();
  const documents = await queryUpTo(PATHS.daily, {
    field: 'dateKey',
    atMost: today,
    limit: limit * 4,
  });
  const rows = documents
    .map((document) => ({
      number: int(document.fields.number),
      dateKey: text(document.fields.dateKey),
      word: text(document.fields.answer).toLowerCase(),
      length: int(document.fields.length),
    }))
    .filter((row) => row.length === length && row.word && row.dateKey <= today)
    .slice(0, limit);

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
