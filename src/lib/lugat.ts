/** Lug'at bo'limi — harf bo'yicha so'zlar va ularning ma'nolari.
 *
 *  **Nega bu bo'lim bor.** Saytda 23 ta sahifa bor edi va ularning
 *  ko'pi o'yinning o'zi — matn kam, chunki o'yin sahifasiga matn
 *  kerak emas. Reklama tarmog'i uchun esa bu «reklama uchun yasalgan
 *  kichik sayt» ko'rinishida va aynan shu «иные причины» degan rad
 *  javobiga olib keladi.
 *
 *  Yechim sotib olinmaydi va o'ylab topilmaydi — u allaqachon bor:
 *  lug'atdagi olti mingga yaqin so'zning har birida yozilgan ma'nosi.
 *  Bu haqiqiy, o'zbekcha, boshqa joydan ko'chirilmagan kontent.
 *
 *  **Nega har so'zga alohida sahifa emas.** Birinchi o'ylanadigan narsa
 *  `/soz/kitob` kabi sahifa, ya'ni 5 921 ta yangi manzil. Bu aynan
 *  qilmaslik kerak bo'lgan ish: har sahifada o'rtacha **28 belgi**
 *  matn bo'lardi, ya'ni mingdan ortiq belgi talabidan qirq barobar
 *  kam. Qidiruv tizimi ham, moderator ham buni bir nomda ko'radi —
 *  «doorway», sahifa sonini sun'iy shishirish. Natija hozirgisidan
 *  yomonroq bo'lardi.
 *
 *  Shuning uchun guruhlash: har **bosh harf** bitta sahifa. Yigirma
 *  sakkizta sahifa, har birida yuzlab so'z ma'nosi bilan — ya'ni har
 *  biri bir necha ming belgi haqiqiy matn. Oz sahifa, lekin har biri
 *  to'la.
 *
 *  **Ma'lumot ikki yo'ldan keladi.** Build paytida `vite/prerender.ts`
 *  serverdan lug'atni oladi va statik HTML yozadi — robot ko'radigan
 *  matn shu. Brauzerda esa o'sha ro'yxat [loadDictionary] orqali
 *  yig'iladi; lug'at o'yin uchun baribir keshda turadi, demak sahifa
 *  deyarli har doim darhol chiziladi. Ikkala yo'l ham shu fayldagi
 *  [groupByLetter] dan o'tadi: robotga boshqa, odamga boshqa matn
 *  ko'rsatish (klouking) saytni ikkala ro'yxatdan ham chiqarib
 *  yuboradi. */
import { split } from './uz';

/** Lug'atdagi bitta yozuv. */
export interface LugatWord {
  word: string;
  meaning: string;
  /** Harf-birlikdagi emas, katakdagi uzunlik — `/cheksiz/5-harf` bilan
   *  bir xil ma'noda, chunki sahifada aynan shu guruhlaydi. */
  length: number;
}

/** Bitta harf sahifasining mazmuni. */
export interface LugatLetter {
  /** Harfning o'zi — `sh`, `oʻ`. */
  letter: string;
  /** Manzildagi qismi — [LETTER_SLUGS]. */
  slug: string;
  /** Uzunlik bo'yicha guruhlangan so'zlar; bo'sh guruh tushib qoladi. */
  groups: { length: number; words: LugatWord[] }[];
  /** Jami so'z — sarlavha va ro'yxat uchun. */
  total: number;
}

/** Lug'at qaysi uzunliklardan yig'iladi. Ma'nolar faqat javob bo'la
 *  oladigan so'zlarda bor, ular esa shu to'rt uzunlikda. */
export const LUGAT_LENGTHS = [4, 5, 6, 7] as const;

/** Harf → manzildagi qismi.
 *
 *  `oʻ` va `gʻ` ichidagi tovush belgisi (U+02BB) manzilga yaramaydi:
 *  u foizli kodga aylanadi va `sitemap.xml` da ham, ulashilgan
 *  havolada ham o'qib bo'lmaydigan narsa chiqadi. Shuning uchun ular
 *  `sh` va `ch` kabi ikki lotin harfi bilan yoziladi — `oh`, `gh`.
 *  Bunday qo'shharf o'zbek alifbosida yo'q, ya'ni hech qaysi harf
 *  bilan chalkashmaydi. */
export const LETTER_SLUGS: Record<string, string> = {
  'oʻ': 'oh',
  'gʻ': 'gh',
};

export const slugOfLetter = (letter: string): string =>
  LETTER_SLUGS[letter] ?? letter;

/** Alifbo tartibi — sahifalar ro'yxati va navigatsiya shu tartibda.
 *
 *  `uz.ts` dagi `LETTERS` klaviatura tartibida (`q, e, r, t, …`) va u
 *  o'yin uchun to'g'ri, lekin lug'at uchun emas: odam lug'atda harfni
 *  alifbo tartibida qidiradi. Ro'yxat qo'lda yozilgan, chunki o'zbek
 *  alifbosining tartibi `localeCompare` dan chiqmaydi — `oʻ` va `gʻ`
 *  o'z joyida, `o` va `g` dan keyin turishi kerak. */
export const LUGAT_LETTERS = [
  'a', 'b', 'ch', 'd', 'e', 'f', 'g', 'gʻ', 'h', 'i', 'j', 'k', 'l',
  'm', 'n', 'o', 'oʻ', 'p', 'q', 'r', 's', 'sh', 't', 'u', 'v', 'x',
  'y', 'z',
] as const;

const BY_SLUG = new Map(LUGAT_LETTERS.map((letter) => [slugOfLetter(letter), letter]));

/** Manzildagi qismdan harfni topadi. Noma'lum bo'lsa — `null`. */
export const letterOfSlug = (slug: string): string | null =>
  BY_SLUG.get(slug) ?? null;

/** So'zning bosh harfi — `shamol` → `sh`, `oʻrik` → `oʻ`.
 *
 *  `split` qo'shharflarni biladi, shuning uchun oddiy `word[0]` emas:
 *  u `shamol` ni `s` harfiga qo'yardi va o'yin bilan sayt bir xil
 *  alifboda gapirmay qolardi. */
export const firstLetter = (word: string): string => split(word)[0] ?? '';

/** So'zlarni harflar bo'yicha taqsimlaydi.
 *
 *  Kirish — har uzunlik uchun «so'z → ma'no» jadvali. Chiqish — alifbo
 *  tartibidagi harflar, har birida uzunlik bo'yicha guruhlangan va
 *  alifbo tartibida saralangan so'zlar.
 *
 *  Ma'nosi yo'q so'z **tushib qoladi**: sahifaning butun mazmuni
 *  ma'nolarda, ma'nosiz so'z esa shunchaki qator uzunligini oshiradi
 *  va «ro'yxat uchun ro'yxat» yasaydi. */
export function groupByLetter(
  source: { length: number; words: Record<string, { d?: string }> }[],
): LugatLetter[] {
  const buckets = new Map<string, LugatWord[]>();

  for (const { length, words } of source) {
    for (const [word, info] of Object.entries(words)) {
      const meaning = info.d?.trim();
      if (!meaning) continue;
      const letter = firstLetter(word);
      if (!letter) continue;
      const bucket = buckets.get(letter);
      if (bucket) bucket.push({ word, meaning, length });
      else buckets.set(letter, [{ word, meaning, length }]);
    }
  }

  const letters: LugatLetter[] = [];
  for (const letter of LUGAT_LETTERS) {
    const words = buckets.get(letter);
    if (!words?.length) continue;
    const groups = LUGAT_LENGTHS.map((length) => ({
      length,
      words: words
        .filter((item) => item.length === length)
        .sort((a, b) => a.word.localeCompare(b.word, 'uz')),
    })).filter((group) => group.words.length > 0);
    letters.push({
      letter,
      slug: slugOfLetter(letter),
      groups,
      total: words.length,
    });
  }
  return letters;
}
