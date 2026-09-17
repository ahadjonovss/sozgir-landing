/** Sahifalar ro'yxati — manzil, sarlavha va statik matn.
 *
 *  Uch joyda ishlatiladi va shuning uchun shu yerda turadi:
 *
 *  1. `useRoute.ts` — router shu ro'yxatdagi manzillarni biladi;
 *  2. `App.tsx` — `document.title` shu yerdan olinadi;
 *  3. `vite.config.ts` — build paytida har manzilga alohida HTML fayl
 *     va `sitemap.xml` yasaladi.
 *
 *  **Nega statik matn kerak.** Sayt — SPA: serverdan kelgan HTML'da
 *  `<div id="root"></div>` dan boshqa hech narsa yo'q edi va JavaScript
 *  ishlatmaydigan har qanday tekshiruvchi (qidiruv roboti, moderator
 *  tizimi, ulashishdagi ko'rinish) butun saytni bo'sh deb ko'rardi —
 *  hamma manzilda bir xil, bir xil sarlavha bilan. Endi har manzil o'z
 *  sarlavhasi, tavsifi va matni bilan keladi.
 *
 *  Matn **odam ko'radigani bilan bir xil** bo'lishi shart: bu yerdagi
 *  `h1` va `lead` sahifadagi `h1` va `section__lead` dan ko'chirilgan.
 *  Robotga boshqa, odamga boshqa matn ko'rsatish — klouking, va u
 *  saytni qidiruvdan ham, reklama tarmog'idan ham chiqarib yuboradi. */

export interface Page {
  /** Manzil — router uchun ham shu. */
  path: string;
  /** `<title>` va brauzer yorlig'i. */
  title: string;
  /** `<meta name="description">`. */
  description: string;
  /** Havolalar ro'yxatidagi qisqa nom — footer'dagi yorliq bilan bir
   *  xil. To'liq `title` havolada uzun va takroriy ko'rinadi. */
  nav: string;
  /** Sahifadagi sarlavha — statik HTML uchun. */
  h1: string;
  /** Sarlavha ostidagi izoh. */
  lead: string;
  /** Qo'shimcha xatboshilar — sahifa nima qilishini tushuntiradi. */
  body?: string[];
  /** Manzil `sitemap.xml` ga va statik faylga tushadimi.
   *
   *  Parametrli manzil (`/oyinchi/{uid}`) uchun `false`: uning mazmuni
   *  har o'yinchida boshqacha va oldindan yasab bo'lmaydi. */
  listed?: boolean;
}

export const PAGES = [
  {
    path: '/',
    title: 'So‘zgir — o‘zbekcha so‘z o‘yinlari',
    description:
      'So‘zgir — o‘zbek tilidagi so‘z o‘yinlari ilovasi. Kuniga bitta so‘z, hamma uchun bir xil. SH, CH, O‘ va G‘ bitta harf. Bepul, internetsiz ham ishlaydi, ilova ichi xaridlari yo‘q.',
    nav: 'Bosh sahifa',
    h1: 'Kuniga bitta so‘z. Butun O‘zbekiston bilan birga.',
    lead:
      'Yashirin so‘zni oltita urinishda toping, do‘stingiz bilan jonli jang qiling va har topgan so‘zingizning ma’nosini o‘rganing. SH, CH, O‘ va G‘ — bitta harf, xuddi maktabda o‘rgangandek.',
    body: [
      'So‘zgir — bitta o‘yin emas, o‘zbek tilidagi so‘z o‘yinlari to‘plami: So‘ztop (yashirin so‘zni topish), So‘zjang (ikki o‘yinchi bir so‘z ustida bellashadi), G‘uncha (yettita harfdan so‘z yig‘ish), Yangso‘z (tilda yo‘q tushunchaga yangi so‘z o‘ylab topish) va reyting.',
      'Kunlik so‘z butun mamlakatda bir xil va u telefondagi ilovada ham, saytda ham aynan bitta. Hisob ochmasdan ham o‘ynash mumkin — natija shunda faqat brauzeringizda qoladi.',
      'O‘yin o‘zbek alifbosiga moslangan: SH, CH, O‘ va G‘ bitta tovush, shuning uchun bitta katakcha va klaviaturada bitta tugma. Yozuvni lotin, yangi lotin yoki kirillga almashtirish mumkin.',
    ],
  },
  {
    path: '/oynash',
    title: 'O‘ynash — So‘zgir',
    description:
      'Bugungi so‘zni yolg‘iz toping, harflardan so‘z yig‘ing yoki do‘stingiz bilan bellashing — hammasi brauzerda, ro‘yxatdan o‘tmasdan.',
    nav: 'O‘ynash',
    h1: 'Nimani o‘ynaymiz?',
    lead:
      'Bugungi so‘zni yolg‘iz toping, harflardan so‘z yig‘ing yoki do‘stingiz bilan bellashing. Hammasi shu yerda, brauzerda.',
    body: [
      'So‘ztop — kuniga bitta 5 harfli so‘z, butun O‘zbekiston uchun bir xil. Topgach cheksiz rejimda 4 dan 7 harfgacha mashq qilasiz.',
      'So‘zjang — bir so‘z, ikki o‘yinchi: do‘stingizni kod bilan chaqiring yoki tezkor jangda tasodifiy raqib toping.',
      'G‘uncha — yettita harf, o‘rtadagi yurak harf har bir so‘zda qatnashadi.',
    ],
  },
  {
    path: '/oyin',
    title: 'So‘zgir — bugungi so‘zni toping',
    description:
      'So‘ztopning kunlik so‘zi: butun O‘zbekistonda bir xil, ilovadagi bilan aynan bitta. Cheksiz rejimda 4 dan 7 harfgacha mashq.',
    nav: 'Bugungi so‘z',
    h1: 'Bugungi so‘zni toping',
    lead:
      'Kunlik so‘z butun O‘zbekistonda bir xil va ilovadagi bilan aynan bitta. Cheksiz rejimda esa 4 dan 7 harfgacha xohlagancha mashq qilasiz.',
    body: [
      'Har taxmindan keyin kataklar rang oladi: yashil — harf o‘z joyida, sariq — so‘zda bor lekin boshqa joyda, kulrang — yo‘q.',
      'Sahifada o‘z statistikangiz, kunlik va umumiy reyting ham ko‘rinadi. Hisobga kirsangiz ball reytingga tushadi va boshqa qurilmadan ham ko‘rinadi.',
    ],
  },
  {
    path: '/sozjang',
    title: 'So‘zjang — do‘st bilan so‘z jangi | So‘zgir',
    description:
      'Ikki o‘yinchiga bitta yashirin so‘z: kim kamroq urinishda topsa — o‘sha yutadi. Do‘stni kod bilan chaqiring yoki tezkor jangda raqib toping.',
    nav: 'So‘zjang',
    h1: 'Bir so‘z, ikki o‘yinchi',
    lead: 'Ikkalangizga bir xil yashirin so‘z. Kim kamroq urinishda topsa — yutadi.',
    body: [
      'Raqibning taxtasida harflar ko‘rinmaydi — faqat ranglar, ya’ni javobni undan o‘qib bo‘lmaydi.',
      'Natija Elo reytingiga yoziladi: 1000 dan boshlanadi, darajalar — Yangi, Havaskor, Tajribali, Ustoz, So‘z ustasi.',
      'Saytda yaratilgan chaqiruvga telefondagi ilovadan ham qo‘shilish mumkin.',
    ],
  },
  {
    path: '/guncha',
    title: 'G‘uncha — yettita harfdan so‘z yig‘ing | So‘zgir',
    description:
      'Yettita harf beriladi, o‘rtadagi yurak harf har bir so‘zda qatnashadi. Topilgan har bir so‘zning ma’nosi ham shu yerda.',
    nav: 'G‘uncha',
    h1: 'Yettita harfdan so‘z yig‘ing',
    lead:
      'O‘rtadagi yurak harf har bir so‘zda qatnashadi, qolgan oltitasi xohlagancha takrorlanadi. Topilgan har bir so‘zning ma’nosi ham shu yerda — o‘ynab turib lug‘at boyitasiz.',
    body: [
      'Yettala harf ishlatilgan so‘z — pangramma, u qo‘shimcha ball beradi.',
      'Kunlik g‘uncha hamma uchun bir xil; undan tashqari cheksiz mashq rejimi ham bor.',
    ],
  },
  {
    path: '/gunchajang',
    title: 'G‘uncha jangi — uch daqiqa, bir g‘uncha | So‘zgir',
    description:
      'Ikki o‘yinchiga bir xil g‘uncha va uch daqiqa vaqt: kim ko‘p ball yig‘sa — o‘sha yutadi.',
    nav: 'G‘uncha jangi',
    h1: 'G‘uncha jangi',
    lead:
      'Ikkalangizga bir xil g‘uncha beriladi va uch daqiqa vaqt bo‘ladi. Kim ko‘p ball yig‘sa — o‘sha yutadi.',
    body: [
      'Do‘stingizni olti raqamli kod bilan chaqirishingiz yoki tezkor jangda tasodifiy raqib topishingiz mumkin.',
    ],
  },
  {
    path: '/maydon',
    title: 'Mardu maydon — sakkiz kishilik so‘z jangi | So‘zgir',
    description:
      'Bir xil so‘z yoki bir xil g‘uncha, lekin ikki kishi emas: sakkiztagacha odam bir vaqtda o‘ynaydi va oxirida jadval tuziladi.',
    nav: 'Mardu maydon',
    h1: 'Mardu maydon',
    lead:
      'Yangi o‘yin emas — yangi shakl. O‘sha So‘zjang yoki G‘uncha, lekin ikki kishi emas: sakkiztagacha odam bir vaqtda o‘ynaydi va oxirida jadval tuziladi.',
    body: [
      'Ikki yo‘l bor: tezkor maydonga kirib notanish odamlar bilan o‘ynaysiz (ikkinchi odam kirgach 60 soniyalik sanoq boshlanadi) yoki bitta havola bilan butun davrani bir joyga yig‘asiz.',
      'O‘yin o‘zgarmaydi — o‘sha so‘z yoki o‘sha g‘uncha, faqat raqib ko‘p. Vaqtni server hisoblaydi, oxirida jadval tuziladi va reyting o‘rin bo‘yicha o‘zgaradi.',
    ],
  },
  {
    path: '/qollab',
    title: 'Qo‘llab-quvvatlash — So‘zgir',
    description:
      'Ilova ichi xaridlari ham, obuna ham yo‘q. Loyihani hamjamiyat ko‘taradi: hisob ochiq turadi, qo‘llaganlar o‘yinda ajralib turadi.',
    nav: 'Qo‘llab-quvvatlash',
    h1: 'Loyihani hamjamiyat ko‘taradi',
    lead:
      'Ilova ichi xaridlari yo‘q, obuna yo‘q. Yig‘ilgan pul loyihani rivojlantirishga ketadi, hisob ochiq turadi. Qo‘llaganlar o‘yinda ajralib turadi — homiylik darajasi bilan.',
    body: [
      'Sahifada loyiha hisobi, qo‘llab-quvvatlaganlar ro‘yxati va homiylik darajalari ko‘rinadi.',
    ],
  },
  {
    path: '/privacy',
    title: 'Maxfiylik siyosati — So‘zgir',
    description:
      'So‘zgir qanday ma’lumot yig‘adi, nima uchun yig‘adi va uni qanday o‘chirish mumkin — o‘zbek, rus va ingliz tillarida.',
    nav: 'Maxfiylik siyosati',
    h1: 'Maxfiylik siyosati',
    lead:
      'Ilova va sayt qanday ma’lumot yig‘adi, nima uchun yig‘adi va uni qanday o‘chirish mumkin.',
  },
  {
    path: '/hisob-ochirish',
    title: 'Hisobni o‘chirish — So‘zgir',
    description:
      'So‘zgir hisobini va u bilan bog‘liq ma’lumotni qanday o‘chirish mumkin — ilova orqali ham, ilovasiz ham.',
    nav: 'Hisobni o‘chirish',
    h1: 'Hisobni o‘chirish',
    lead:
      'Bu sahifada So‘zgir ilovasining hisobini va u bilan bog‘liq ma’lumotni qanday o‘chirish mumkinligi yozilgan.',
    body: [
      'Eng tez yo‘l — ilovaning o‘zidan: profil bo‘limini oching, «Hisobni o‘chirish» tugmasini bosing va so‘ralgan tasdiqni bering.',
      'Telefoningizda ilova qolmagan bo‘lsa, hisob qaysi pochtaga ro‘yxatdan o‘tgan bo‘lsa o‘sha pochtadan bizga yozing — so‘rovni 30 kun ichida bajaramiz.',
    ],
  },
  {
    path: '/contact',
    title: 'Aloqa — So‘zgir',
    description:
      'Taklif, xatolik yoki hamkorlik bo‘yicha bizga yozing — odatda bir-ikki kun ichida javob beramiz.',
    nav: 'Aloqa',
    h1: 'Bizga yozing',
    lead:
      'Taklif, xatolik yoki hamkorlik — hammasini o‘qiymiz. Odatda bir-ikki kun ichida javob beramiz.',
  },
  {
    path: '/oyinchi',
    title: 'O‘yinchi — So‘zgir',
    description:
      'O‘yinchining ochiq profili: umumiy ball, bugungi kunlik natija, bellashuv reytingi va loyihaga qo‘shgan hissasi.',
    nav: 'O‘yinchi profili',
    h1: 'O‘yinchi profili',
    lead:
      'Umumiy ball, bugungi kunlik natija, bellashuv reytingi va loyihaga qo‘shgan hissasi. Shaxsiy statistika faqat egasiga ko‘rinadi.',
    // Manzil parametrli (`/oyinchi/{uid}`) — oldindan yasab bo'lmaydi.
    listed: false,
  },
] as const satisfies readonly Page[];

/** Manzillar — router va `sitemap.xml` uchun. */
export type Route = (typeof PAGES)[number]['path'];

export const pageOf = (path: string): Page | undefined =>
  PAGES.find((page) => page.path === path);

/** Manzil `sitemap.xml` ga va o'z HTML fayliga tushadimi.
 *
 *  Yordamchi kerak, chunki `PAGES` — `as const`: maydoni yo'q yozuvda
 *  `listed` xususiyati ham bo'lmaydi va uni to'g'ridan-to'g'ri o'qib
 *  bo'lmaydi. Bu yerda esa yozuv avval `Page` ga keltiriladi. */
export const isListed = (page: Page): boolean => page.listed !== false;
