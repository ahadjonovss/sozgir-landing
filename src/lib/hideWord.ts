/** So'z yashirish — qidiruv va tasodifiy takliflar.
 *
 *  **Nega so'z qo'lda yozilmaydi.** Yashirilgan so'zni topadigan
 *  odam uni oddiy o'yindagidek teradi, ya'ni so'z lug'atda
 *  bo'lishi shart. Qo'lda yozilsa, lug'atda yo'q so'z yashirilardi
 *  va o'yin yechilmas bo'lib qolardi. Shuning uchun bu yerda
 *  faqat **tanlash** bor.
 *
 *  **Nega faqat javob so'zlari.** Lug'at turlangan shakllarni ham
 *  qabul qiladi (`kunni`, `surda`) — ular taxmin sifatida
 *  yaroqli, lekin bosh so'z emas va izohi yo'q. Server aynan
 *  shularni rad etadi (`canBeAnswer`), ya'ni ro'yxatga qo'shilsa
 *  odam tanlaydi va tugmani bosganda xato ko'radi. Ilovada
 *  hozircha shunday; bu yerda ular umuman ko'rsatilmaydi.
 *
 *  Lug'at o'yin uchun baribir keshda turadi (`dictionary.ts`),
 *  ya'ni qidiruv tarmoqqa chiqmaydi va har harfda ishlayveradi. */
import { loadDictionary } from './dictionary';
import { LUGAT_LENGTHS } from './lugat';
import { lengthOf, normalize } from './uz';

/** Shuncha harfdan kam yozilganda qidiruv boshlanmaydi: bitta harf
 *  butun lug'atni qaytarardi. Ilovadagi `WordSearch.minQuery`. */
export const MIN_QUERY = 2;

/** Bir marta ko'rsatiladigan natijalar soni. */
const LIMIT = 24;

/** Bo'sh maydon ostidagi tasodifiy takliflar soni. */
const SUGGEST = 8;

let cache: string[] | null = null;

/** Yashirish mumkin bo'lgan barcha so'zlar — bir marta yig'iladi.
 *
 *  To'rtta uzunlik alohida so'rov, lekin ular odatda keshdan
 *  keladi. Biror uzunlik kelmasa ham ro'yxat yasalaveradi:
 *  qolganidan tanlash yo'qdan ko'ra yaxshi. */
export async function hideWords(): Promise<string[]> {
  if (cache !== null) return cache;
  const parts = await Promise.all(
    LUGAT_LENGTHS.map((length) => loadDictionary(length).catch(() => null))
  );
  const words = parts.flatMap((part) => part?.answers ?? []);
  // Takror bo'lishi mumkin emas, lekin tartib barqaror bo'lsin:
  // taklif ro'yxati shundan tanlanadi va u har safar boshqacha
  // chiqishi kerak — tasodif aynan `suggestWords` da qo'shiladi.
  cache = [...new Set(words)].sort();
  return cache;
}

/** Qidiruv natijalari — boshi mos kelganlar yuqorida.
 *
 *  Tartib ilovanikidek: odam so'zni boshidan yozadi, ya'ni
 *  «kit» uchun «kitob» «nikoh» dan oldin turishi kerak. Har
 *  guruhda qisqasi oldinda va teng uzunlikda alifbo tartibi —
 *  shunda ro'yxat har bosishda bir xil chiqadi. */
export function rankWords(query: string, words: readonly string[]): string[] {
  const needle = normalize(query);
  if (lengthOf(needle) < MIN_QUERY) return [];

  const prefix: string[] = [];
  const inside: string[] = [];
  for (const word of words) {
    if (!word.includes(needle)) continue;
    (word.startsWith(needle) ? prefix : inside).push(word);
  }

  const byLength = (a: string, b: string) =>
    lengthOf(a) - lengthOf(b) || a.localeCompare(b);
  prefix.sort(byLength);
  inside.sort(byLength);
  return [...prefix, ...inside].slice(0, LIMIT);
}

/** Maydon bo'sh turganda ko'rinadigan ro'yxat.
 *
 *  Bo'sh ekran odamni «nima yozsam ekan?» degan savol bilan
 *  qoldiradi. Taklif esa ekranni ishga soladi: bir bosishda so'z
 *  tanlanadi. */
export function suggestWords(words: readonly string[]): string[] {
  if (words.length === 0) return [];
  const picked = new Set<string>();
  // Tasodifiy o'rindan olinadi; takrorlanib qolsa shunchaki
  // kamroq so'z chiqadi — ro'yxat bezak, aniq son emas.
  for (let tries = 0; tries < SUGGEST * 4 && picked.size < SUGGEST; tries++) {
    picked.add(words[Math.floor(Math.random() * words.length)]);
  }
  return [...picked];
}
