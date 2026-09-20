/** Uzunlik bo'yicha sahifalar — `/cheksiz/4-harf` … `/cheksiz/7-harf`.
 *
 *  Cheksiz rejim baribir bor edi, lekin uning o'z manzili yo'q edi:
 *  «4 harfli so'z o'yini» deb qidirgan odam saytni topmasdi va topsa
 *  ham bosh sahifadan rejimni qo'lda tanlashi kerak edi. Endi har
 *  uzunlik o'z sahifasi, o'z sarlavhasi va o'z matni bilan keladi.
 *
 *  Raqamlar **haqiqiy**: `dictionaries/uz_{n}` hujjatidagi javoblar va
 *  qabul qilinadigan so'zlar soni (2026-yil sentabr holati). Ular
 *  o'zgarib turadi, shuning uchun matnda «dan ortiq» deb yozilgan —
 *  lug'at to'ldirilganda sahifani qaytadan yozish shart emas.
 *
 *  Matn bir joyda: `data/pages.ts` shu ro'yxatdan sahifa yozuvlarini
 *  yasaydi (sarlavha, tavsif, statik HTML), `EndlessPage` esa o'shani
 *  ekranga chiqaradi. */

/** Manzillar alohida ro'yxatda va `as const`: router tipini (`Route`)
 *  shu ro'yxat to'ldiradi, ya'ni yangi uzunlik qo'shilganda `App.tsx`
 *  dagi tekshiruv ham tipdan o'tadi. */
export const LENGTH_PATHS = [
  '/cheksiz/4-harf',
  '/cheksiz/5-harf',
  '/cheksiz/6-harf',
  '/cheksiz/7-harf',
] as const;

export type LengthPath = (typeof LENGTH_PATHS)[number];

export interface LengthPage {
  length: number;
  /** Manzil: `/cheksiz/5-harf`. */
  path: LengthPath;
  /** Sahifadagi sarlavha. */
  h1: string;
  /** Sarlavha ostidagi bir-ikki jumla. */
  lead: string;
  /** `<title>`. */
  title: string;
  /** `<meta name="description">`. */
  description: string;
  /** Taxta ostidagi matn — sahifaning o'zi ham, statik HTML ham shundan. */
  body: string[];
  /** Kartochkadagi qisqa ta'rif — boshqa uzunliklar ro'yxatida. */
  tagline: string;
}

const WORDS: Record<number, { answers: number; valid: number }> = {
  4: { answers: 800, valid: 3300 },
  5: { answers: 1750, valid: 9600 },
  6: { answers: 1790, valid: 15900 },
  7: { answers: 1560, valid: 25900 },
};

const group = (value: number) => value.toLocaleString('ru-RU').replace(/ /g, ' ');

export const LENGTH_PAGES: LengthPage[] = [
  {
    length: 4,
    path: '/cheksiz/4-harf',
    h1: '4 harfli so‘zlar',
    lead:
      'Eng qisqa taxta va eng tez o‘yin: to‘rt katak, beshta urinish. Bir partiya bir necha daqiqada tugaydi.',
    title: '4 harfli so‘z o‘yini — So‘zgir',
    description:
      'To‘rt harfli yashirin so‘zni beshta urinishda toping. Cheksiz rejim: yangi so‘z darrov boshlanadi, ro‘yxatdan o‘tish shart emas.',
    tagline: 'Eng tez o‘yin — bir partiya bir necha daqiqa',
    body: [
      `To‘rt harfli so‘z — So‘ztopning eng qisqa taxtasi. Javoblar bazasida ${group(WORDS[4]!.answers)} dan ortiq so‘z bor, taxmin sifatida esa ${group(WORDS[4]!.valid)} dan ortiq so‘z qabul qilinadi.`,
      'Qisqa so‘z osonroq tuyuladi, lekin aslida u boshqacha qiyin: harf kam, ya’ni har bir urinish kamroq ma’lumot beradi va ko‘p so‘z bir xil «niqob» ostida qoladi — TOSH, BOSH, QOSH, YOSH. Shuning uchun birinchi ikki urinishda imkon qadar ko‘p turli harfni sinab ko‘rgan ma’qul.',
      'O‘yin cheksiz: so‘z topilgach yangisi darrov boshlanadi, kunlik so‘zni kutish shart emas.',
    ],
  },
  {
    length: 5,
    path: '/cheksiz/5-harf',
    h1: '5 harfli so‘zlar',
    lead:
      'Klassik o‘lcham: beshta katak, oltita urinish. Kunlik so‘z ham aynan shu uzunlikda bo‘ladi.',
    title: '5 harfli so‘z o‘yini — So‘zgir',
    description:
      'Besh harfli yashirin so‘zni oltita urinishda toping. Cheksiz rejim: kunlik so‘zni kutmasdan, xohlagancha o‘ynang.',
    tagline: 'Klassik o‘lcham — kunlik so‘z ham shunday',
    body: [
      `Besh harfli so‘z — o‘yinning asosiy o‘lchami va kunlik so‘z ham shu uzunlikda beriladi. Javoblar bazasida ${group(WORDS[5]!.answers)} dan ortiq so‘z bor, qabul qilinadigan taxminlar esa ${group(WORDS[5]!.valid)} dan oshadi.`,
      'Oltita urinish beshta harf uchun yetarli joy beradi: birinchi ikki so‘zni «razvedka» qilib, faqat keyin javobni yig‘sa bo‘ladi. Shu sabab ko‘pchilik aynan shu uzunlikdan boshlaydi.',
      'Bu yerda o‘yin cheksiz. Kuniga bitta, butun O‘zbekiston uchun bir xil so‘z esa alohida sahifada — natija reytingga ham o‘sha yerdan tushadi.',
    ],
  },
  {
    length: 6,
    path: '/cheksiz/6-harf',
    h1: '6 harfli so‘zlar',
    lead:
      'Oltita katak, yettita urinish. Uzunroq so‘zda qo‘shimchalar ko‘rinadi va ular javobni tezroq ochadi.',
    title: '6 harfli so‘z o‘yini — So‘zgir',
    description:
      'Olti harfli yashirin so‘zni yettita urinishda toping. Cheksiz rejim, bepul va ro‘yxatdan o‘tmasdan — to‘g‘ridan-to‘g‘ri brauzerda.',
    tagline: 'Qo‘shimchalar ko‘rinadigan o‘lcham',
    body: [
      `Olti harfli taxtada javoblar bazasi eng kattasi — ${group(WORDS[6]!.answers)} dan ortiq so‘z, qabul qilinadigan taxminlar esa ${group(WORDS[6]!.valid)} dan oshadi.`,
      'Uzun so‘zning o‘z foydasi bor: o‘zbek tilidagi qo‘shimchalar (-chi, -lik, -moq) oxirida turadi va bitta ochilgan harf butun oxirni taxmin qilishga imkon beradi. Shuning uchun bu yerda birinchi urinishni unli harflarga boy so‘z bilan boshlash odatda foydali.',
      'Urinishlar soni ham ko‘proq — yettita.',
    ],
  },
  {
    length: 7,
    path: '/cheksiz/7-harf',
    h1: '7 harfli so‘zlar',
    lead:
      'Eng uzun taxta: yettita katak, sakkizta urinish. So‘zgirdagi eng qiyin yakka o‘yin.',
    title: '7 harfli so‘z o‘yini — So‘zgir',
    description:
      'Yetti harfli yashirin so‘zni sakkizta urinishda toping. So‘zgirning eng uzun taxtasi — cheksiz rejimda, bepul.',
    tagline: 'Eng uzun taxta va eng katta lug‘at',
    body: [
      `Yetti harfli taxta — eng uzuni. Javoblar bazasida ${group(WORDS[7]!.answers)} dan ortiq so‘z bor, taxmin sifatida esa ${group(WORDS[7]!.valid)} dan ortiq so‘z qabul qilinadi: bu So‘zgirdagi eng katta lug‘at.`,
      'Bu yerda «SH», «CH», «O‘» va «G‘» ayniqsa ko‘p uchraydi va ularning har biri bitta katak egallaydi. «Qorachiq» yozuvda to‘qqizta belgidan iborat, taxtada esa yettita katak: Q-O-R-A-CH-I-Q. Shuning uchun uzun so‘z ko‘ringanidan qisqaroq bo‘lib chiqadi.',
      'Sakkizta urinish beriladi, lekin ularning yarmi odatda harflarni «ochish» uchun ketadi.',
    ],
  },
];

export const lengthPageOf = (path: string): LengthPage | null =>
  LENGTH_PAGES.find((page) => page.path === path) ?? null;
