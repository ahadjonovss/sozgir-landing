/** Yangiliklar — `/yangiliklar`.
 *
 *  Sayt tez o'zgaradi, lekin o'zgarish odamga ko'rinmaydi: u kecha ham
 *  o'sha taxtani ochadi, bugun ham. Ro'yxat shuni aytadi — «bu yerda ish
 *  ketyapti» degan gapni oylik postlarsiz, o'z joyida.
 *
 *  Sarlavhada o'qilmagan yangiliklar soni turadi (`lib/updates.ts`):
 *  odam ro'yxatni ochgach sanoq o'chadi.
 *
 *  Qoidalar:
 *
 *  * **Faqat odam sezadigan o'zgarish.** Ichki tozalash, kutubxona
 *    yangilash va shunga o'xshash ishlar bu yerga tushmaydi: ular
 *    ro'yxatni uzaytiradi va muhimini ko'mib yuboradi.
 *  * **Bir kun — bitta yozuv.** Kun ichida o'nta commit bo'lsa ham,
 *    odam uchun bu bitta yangilanish.
 *  * **Eng yangisi tepada.** */

export interface Update {
  /** `2026-09-20`. */
  date: string;
  title: string;
  /** Bitta-ikkita jumla — nima o'zgargani va nega. */
  body: string;
  /** Qaysi tomonga tegishli: sayt, ilova yoki ikkalasi. */
  where: 'sayt' | 'ilova' | 'ikkisi';
  /** Qatorlar — aniq o'zgarishlar ro'yxati. */
  items?: string[];
}

export const UPDATES: Update[] = [
  {
    date: '2026-09-20',
    title: 'Sayt o‘yindan boshlanadi',
    where: 'sayt',
    body:
      'Bosh sahifada endi birinchi ekranda taxta turadi: o‘ynash uchun hech qayerga o‘tish va hech narsani surish kerak emas. Tanishtiruv matni o‘yin ostiga tushdi.',
    items: [
      'Javoblar arxivi: bugungi so‘z spoyler ostida, ostida o‘tgan kunlar',
      'Har uzunlik uchun o‘z sahifasi: 4, 5, 6 va 7 harfli so‘zlar',
      'Qo‘llanma: birinchi so‘z, taktika va o‘zbek alifbosidagi qiyin joylar',
      'Bosh sahifada «bugun necha kishi o‘ynadi» — haqiqiy sanoq',
    ],
  },
  {
    date: '2026-09-20',
    title: 'Nishonlar va tasdiqlangan hisob',
    where: 'sayt',
    body:
      'Ilovadagi yigirmata nishon saytga ham keldi va tasdiqlangan hisoblar ro‘yxati endi ikkala platformada bitta joydan o‘qiladi.',
    items: [
      'Nishonlar sahifasi va o‘yin yonidagi kartochka',
      'Tasdiqlangan hisobga reklama ko‘rsatilmaydi, profili premium ko‘rinishda ochiladi',
      'Jadvaldagi son endi boylik: ball va o‘lja ustamasi qo‘shilgan',
      'Taslimdan keyin natija ekrani ochiladi, lobbi emas',
    ],
  },
  {
    date: '2026-09-19',
    title: 'Ilovada nishonlar (1.4.2)',
    where: 'ilova',
    body:
      'Yigirmata nishon: kunlik ketma-ketlik, topilgan so‘zlar, jangdagi g‘alabalar va o‘yinning boshqa burchaklari uchun. Nishon bir marta olingach qaytarib olinmaydi.',
    items: [
      'Robot jangi: kunlik reyting chegarasi olib tashlandi',
      'Robotning soati o‘yinchi bilan birga boshlanadi',
      'Taslim bo‘lgan odam raqibni kutib o‘tirmaydi',
    ],
  },
  {
    date: '2026-09-18',
    title: 'Ball aqchaga, reyting o‘ljaga aylandi',
    where: 'ikkisi',
    body:
      'Sonlar o‘n barobar qisqardi va nom oldi: yig‘ilgan hisob endi aqcha, onlayn jang reytingi esa o‘lja. Saqlangan natijalarga tegilmadi — 5 980 ball 598 aqcha bo‘lib ko‘rinadi, xolos.',
  },
  {
    date: '2026-09-17',
    title: 'Mardu maydon va bitta ekranga sig‘adigan o‘yin',
    where: 'sayt',
    body:
      'Sakkiz kishilik maydon saytda ham o‘ynaladi. Telefonda esa taxta va klaviatura bitta ekranga sig‘adi — o‘ynash uchun surish kerak emas.',
  },
  {
    date: '2026-09-16',
    title: 'Har manzil o‘z sahifasi bilan',
    where: 'sayt',
    body:
      'Ilgari qidiruv roboti va ulashilgan havola butun saytni bitta bo‘sh sahifa deb ko‘rardi. Endi har manzil o‘z sarlavhasi, tavsifi va matni bilan keladi.',
  },
  {
    date: '2026-09-12',
    title: 'G‘uncha saytda',
    where: 'sayt',
    body:
      'Yettita harfdan so‘z yig‘ish: kunlik g‘uncha, mashq va g‘uncha jangi. Telefon raqam bilan kirish ham shu kuni qo‘shildi.',
  },
  {
    date: '2026-09-11',
    title: 'Uch alifbo: lotin, yangi lotin va kirill',
    where: 'sayt',
    body:
      'Butun sayt tanlangan yozuvda ko‘rinadi — sarlavhadagi «O‘» tugmasi orqali. Tanlov brauzerda saqlanadi.',
  },
];

/** Eng yangi yangilikning sanasi — sarlavhadagi sanoq shunga qaraydi. */
export const latestUpdate = (): string => UPDATES[0]?.date ?? '';
