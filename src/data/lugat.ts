/** Lug'at sahifalari — `/lugat` va `/lugat/{harf}`.
 *
 *  Mantiq `lib/lugat.ts` da, bu yerda esa sahifaning o'z matni:
 *  sarlavha, tavsif va harf haqidagi izoh. Ajratish `data/lengths.ts`
 *  dagi bilan bir xil sababdan — matnni sahifa ham, build paytidagi
 *  statik HTML ham bir joydan o'qiydi.
 *
 *  **Harf matni shablon, so'zlar esa yo'q.** Har harf sahifasining
 *  kirish xatboshisi shu yerdagi qolipdan yasaladi va harflar bo'yicha
 *  deyarli bir xil. Bu ataylab: sahifaning mazmuni kirishda emas,
 *  undan keyingi so'zlar va ma'nolarida — ular esa har harfda butunlay
 *  boshqacha va haqiqiy. Yigirma sakkizta harfga yigirma sakkizta
 *  «o'ziga xos» kirish yozish esa o'sha-o'sha gapni qayta aytishdan
 *  boshqa narsa bermasdi.
 *
 *  Qo'shharflarga (`sh`, `ch`, `oʻ`, `gʻ`) alohida izoh bor: ular
 *  o'zbek alifbosida bitta harf va aynan shu joy saytga kelgan odamni
 *  eng ko'p chalg'itadi. */
import { LUGAT_LETTERS, slugOfLetter } from '../lib/lugat';

export const LUGAT_PATH = '/lugat';

export type LugatLetterPath = `${typeof LUGAT_PATH}/${string}`;

export interface LugatLetterPage {
  letter: string;
  slug: string;
  path: string;
  h1: string;
  lead: string;
  title: string;
  description: string;
  body: string[];
}

/** Harfning ko'rinadigan shakli — sarlavhada katta harf bilan.
 *
 *  `toUpperCase` qo'shharfda ikkala belgini ham ko'taradi (`SH`), va
 *  o'zbekchada so'z boshidagi qo'shharf aynan shunday yoziladi —
 *  «SHamol» emas, «SHAMOL» yoki «Shamol». Sarlavhada to'liq katta
 *  shakl ishlatiladi, chunki u yerda harfning **o'zi** nomlanmoqda. */
const upper = (letter: string): string => letter.toUpperCase();

/** Qo'shharflar uchun qo'shimcha izoh — qolganida bo'sh. */
const MULTI_NOTE: Record<string, string> = {
  sh: 'SH — bitta harf, ikkita belgi emas. O‘yindagi taxtada ham u bitta katakka tushadi, shuning uchun «shamol» besh emas, to‘rt harfli so‘z hisoblanadi.',
  ch: 'CH — bitta harf. «Chiroq» taxtada besh katak emas, to‘rt katak egallaydi va bu yerdagi ro‘yxat ham o‘sha hisobda.',
  'oʻ': 'O‘ — O dan boshqa harf va lug‘atda ham alohida turadi. Taxtada u bitta katak, ya’ni «o‘rik» to‘rt harfli so‘z.',
  'gʻ': 'G‘ — G dan boshqa harf. U ham bitta katak egallaydi: «g‘isht» besh emas, to‘rt harfli so‘z.',
};

const page = (letter: string): LugatLetterPage => {
  const slug = slugOfLetter(letter);
  const big = upper(letter);
  const body = [
    `Quyidagi ro‘yxatda So‘zgir lug‘atidagi, ${big} harfi bilan boshlanadigan so‘zlar ma’nosi bilan berilgan. So‘zlar uzunligi bo‘yicha guruhlangan — to‘rt, besh, olti va yetti harfli. Har biri o‘yinda javob bo‘lib chiqishi mumkin: kunlik so‘z ham, cheksiz rejimdagi so‘z ham shu ro‘yxatdan olinadi.`,
    `Uzunlik harf bilan sanaladi, belgi bilan emas: SH, CH, O‘ va G‘ — bitta harf va taxtada bitta katak. Shuning uchun bu yerdagi «besh harfli» guruhdagi so‘z yozuvda olti belgidan iborat bo‘lishi mumkin.`,
  ];
  const note = MULTI_NOTE[letter];
  if (note) body.push(note);
  body.push(
    `Ma’nolar lug‘atning o‘zidan olingan — o‘yin tugagach topilgan so‘z ostida chiqadigan izohning aynan o‘zi.`,
  );
  return {
    letter,
    slug,
    path: `${LUGAT_PATH}/${slug}`,
    h1: `${big} harfi bilan boshlanadigan so‘zlar`,
    lead: `So‘zgir lug‘atidagi ${big} harfli so‘zlar — ma’nosi va uzunligi bilan.`,
    title: `${big} harfi bilan boshlanadigan o‘zbekcha so‘zlar — So‘zgir lug‘ati`,
    description: `${big} harfi bilan boshlanadigan o‘zbekcha so‘zlar ro‘yxati, har biri ma’nosi bilan. To‘rt, besh, olti va yetti harfli so‘zlar alohida guruhlangan.`,
    body,
  };
};

export const LUGAT_PAGES: LugatLetterPage[] = LUGAT_LETTERS.map(page);

export const lugatPageOf = (path: string): LugatLetterPage | undefined =>
  LUGAT_PAGES.find((item) => item.path === path);

/** Bo'limning bosh sahifasi. */
export const LUGAT_INDEX = {
  path: LUGAT_PATH,
  h1: 'So‘zgir lug‘ati',
  lead:
    'O‘yindagi so‘zlar — bosh harfi bo‘yicha, har biri ma’nosi bilan. Qaysi harfdan boshlanishini tanlang.',
  title: 'O‘zbekcha so‘zlar lug‘ati — So‘zgir',
  description:
    'So‘zgir o‘yinidagi o‘zbekcha so‘zlar lug‘ati: bosh harf bo‘yicha ro‘yxat, har so‘zning ma’nosi va uzunligi. To‘rt, besh, olti va yetti harfli so‘zlar.',
  body: [
    'Bu bo‘limda So‘zgir o‘yinida javob bo‘lib chiqishi mumkin bo‘lgan so‘zlar turibdi — har biri qisqa ma’nosi bilan. Ro‘yxat o‘yin lug‘atining o‘zidan olinadi, ya’ni u o‘yin bilan birga o‘sadi.',
    'So‘zlar bosh harfi bo‘yicha ajratilgan, har harf sahifasida esa uzunlik bo‘yicha guruhlangan: to‘rt, besh, olti va yetti harfli. Uzunlik harf bilan sanaladi — SH, CH, O‘ va G‘ bitta harf va taxtada bitta katak egallaydi.',
    'Lug‘at o‘yinning yordamchisi emas, uning davomi: o‘yin so‘zni topishga o‘rgatadi, bu yer esa topilgan so‘z nimani anglatishini aytadi.',
  ],
} as const;
