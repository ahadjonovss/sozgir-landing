/** Sahifadagi barcha matn va havolalar shu yerda — dizaynga tegmasdan
 *  tahrirlash uchun. Store havolalari chiqqanda faqat `links` yangilanadi. */

export const email = 'uzmobdev@gmail.com';

export const site = 'https://sozgir.uz';

export const links = {
  /** Do'kon manzili joy (storefront) ko'rsatilmasdan beriladi: Apple uni
   *  foydalanuvchining hisobiga qarab o'zi tanlaydi, aks holda `/us/`
   *  bilan o'zbek foydalanuvchi Amerika do'koniga tushib qolardi. */
  appStore: 'https://apps.apple.com/app/id6807138456',
  playStore: 'https://play.google.com/store/apps/details?id=uz.ahadjonovss.soztop',
  telegram: 'https://t.me/sozgir_uz',
  /** Hamjamiyat guruhi — o'yinchilar bir-birini topadi, takliflar,
   *  yangiliklar. Banner `/oynash`, `/oyin` va `/sozjang` da. */
  telegramGroup: 'https://t.me/+_dbBWMhlXqFiMjYy',
  /** Parol roboti — parolni tiklaydigan yagona yo'l.
   *
   *  Xat yuborish kanali yo'q va raqam bilan kirganlarda pochtaning
   *  o'zi yo'q. Robot raqamni Telegram orqali tasdiqlaydi
   *  (`backend/src/parolbot`). Ilovadagi `AppLinks.parolBot` ning
   *  o'zi. */
  parolBot: 'https://t.me/sozgirbot',
  /** Telegram orqali kirish — o'sha robot, boshqa niyat.
   *
   *  `?start=kirish` robotga niyatni aytadi: u kontakt so'raydi va
   *  olti xonali kod beradi. Kod saytdagi oynaga teriladi
   *  (`/v1/web/auth/tg/confirm`). Ilovadagi `AppLinks.loginBot` ning
   *  o'zi — ikkalasi bitta robotga boradi. */
  loginBot: 'https://t.me/sozgirbot?start=kirish',
  support: `mailto:${email}`,
  /** «O'ynash» tugmasi — nimani o'ynashni tanlash sahifasi. */
  hub: '/oynash',
  play: '/oyin',
  battle: '/sozjang',
  /** So'zjang — raqib qidirishni **o'zi boshlaydigan** havola.
   *
   *  `/oynash` dagi kartochka shu yerga olib boradi: lobbi ochilib,
   *  qidiruv darhol ketadi. Ilgari odam bosh sahifadan jangga
   *  yetguncha uch marta bosardi — «O'ynash», «Jangga kirish»,
   *  «Raqib qidirish» — va oxirgisi lobbida uni kutib turardi.
   *  Do'st bilan o'ynash yo'li o'z joyida: oddiy `/sozjang`. */
  battleQuick: '/sozjang?tezkor=1',
  /** G'uncha — yettita harfdan so'z yig'ish. */
  guncha: '/guncha',
  /** G'uncha jangi: bir xil g'uncha, uch daqiqa, kim ko'p to'plasa. */
  gunchaBattle: '/gunchajang',
  /** Mardu maydon — yangi o'yin emas, yangi shakl: o'sha So'zjang yoki
   *  G'uncha, lekin sakkiztagacha odam bir vaqtda o'ynaydi. */
  mardu: '/maydon',
  /** Turnir — ketma-ket bir necha mardu maydoni: har davradan yuqori
   *  yarmi o'tadi. Kod bilan kiriladigan sahifasi `/turnir/{KOD}`. */
  turnir: '/turnir',
  /** Ulashilgan natija bosilganda odam darhol o'ynay olishi kerak —
   *  tanishtiruv sahifasi emas, o'yinning o'zi ochiladi. */
  share: `${site}/oyin`,
  /** Nishonlar — yutuq belgilari ro'yxati. */
  badges: '/nishonlar',
  /** Javoblar: bugungi so'z va o'tgan kunlar arxivi. */
  answers: '/javoblar',
  /** Qo'llanmalar — qanday o'ynash va qanday yutish. */
  guides: '/qollanma',
  /** Lug'at — o'yindagi so'zlar bosh harfi bo'yicha, ma'nosi bilan. */
  lugat: '/lugat',
  /** Yangiliklar — saytda va ilovada nima o'zgardi. */
  updates: '/yangiliklar',
  privacy: '/privacy',
  deletion: '/hisob-ochirish',
  contact: '/contact',
  /** Ulashish uchun qisqa havola — `public/ol/index.html`. Telefonda
   *  ochilganda o'sha qurilmaning do'koni birinchi tugma bo'ladi. */
  get: '/ol',
  /** Donat bo'limi: hisob, qo'llab-quvvatlaganlar va to'lov. */
  donate: '/qollab',
  /** O'yinchining ochiq profili — `/oyinchi/{uid}`. */
  player: '/oyinchi',
};

/** Ochiq profil havolasi — reyting, natija va donatchilar ro'yxatidan. */
export const playerLink = (uid: string) => `${links.player}/${encodeURIComponent(uid)}`;

/* Sonlar lug'atning o'zidan olingan (`dictionaries/uz_{4..7}`,
   `categories`) va vaqti-vaqti bilan tekshirilishi kerak: lug'at
   to'ldiriladi, ya'ni ular faqat o'sadi. Oxirgi tekshiruv: 2026-yil
   20-sentabr. */
export const stats = [
  { value: '5 900+', label: 'yashirin so‘z', hint: '4–7 harfli javoblar bazasi' },
  { value: '54 000+', label: 'tan olinadigan so‘z', hint: 'taxmin sifatida qabul qilinadi' },
  { value: '22', label: 'mavzu', hint: 'sahifada o‘nta guruhga yig‘ilgan' },
  { value: '29', label: 'harf-tugma', hint: 'to‘liq o‘zbek klaviaturasi' },
];

export type Module = {
  id: string;
  emoji: string;
  name: string;
  tagline: string;
  points: string[];
  accent: 'green' | 'yellow' | 'accent' | 'violet' | 'orange' | 'teal';
};

export const modules: Module[] = [
  {
    id: 'soztop',
    emoji: '🟩',
    name: 'So‘ztop',
    tagline: 'Yashirin so‘zni urinishlar tugagunicha toping.',
    points: [
      'Kunlik — bir kunga bitta so‘z, butun O‘zbekistonda bir xil',
      'Cheksiz — 4 dan 7 harfgacha, xohlagancha mashq',
      'Kategoriya — mavzu tanlab o‘ynash',
      'Qattiq rejim: ochilgan harfni keyingi taxminda ishlatish shart',
      'Kunlik so‘z — 20 aqchagacha, cheksiz rejimda 8 aqchagacha',
    ],
    accent: 'green',
  },
  {
    id: 'sozjang',
    emoji: '⚔️',
    name: 'So‘zjang',
    tagline: 'Bir so‘z, ikki o‘yinchi. Kim birinchi topadi?',
    points: [
      'Saytda ham o‘ynaladi: do‘stga kod yuboring yoki tasodifiy raqib toping',
      'Tezkor jang: tasodifiy raqib, 90 soniya',
      'G‘olib — so‘zni birinchi topgan: jang poyga, urinishlar sanalmaydi',
      'Raqibning kataklari harfsiz — faqat ranglar ko‘rinadi',
      'Aqcha bilan kuchingiz o‘lchanadi: bir jangda eng ko‘pi ±10',
    ],
    accent: 'orange',
  },
  {
    id: 'turnir',
    emoji: '🥇',
    name: 'Turnir',
    tagline: 'Ketma-ket bir necha maydon: har davradan yuqori yarmi o‘tadi.',
    points: [
      'Saytda ham o‘ynaladi: kod, havola yoki QR bilan qo‘shiladi',
      'Hajmi uchta: 8 kishi — uch davra, 16 — to‘rt, 32 — besh davra',
      'Sakkiztadan ko‘p bo‘lsa guruhlarga bo‘linadi va ular bir vaqtda o‘ynaydi',
      'Har guruh jangi — oddiy mardu maydonining o‘zi: o‘sha so‘z, o‘sha aqcha',
      'Yig‘ilish ikki soat davom etadi, boshlashni tashkilotchi bosadi',
    ],
    accent: 'green',
  },
  {
    id: 'yangsoz',
    emoji: '💡',
    name: 'Yangso‘z',
    tagline: 'Tilda yo‘q tushunchaga o‘zingiz so‘z o‘ylab toping.',
    points: [
      'Har hafta yangi tushuncha e’lon qilinadi',
      'So‘zingizni izoh bilan taklif qilasiz',
      'Boshqalar ovoz beradi, moderator tasdiqlaydi',
      'G‘olib so‘zlar alohida ro‘yxatda qoladi',
    ],
    accent: 'violet',
  },
  {
    id: 'guncha',
    emoji: '🌸',
    name: 'G‘uncha',
    tagline: 'Yettita harfdan iloji boricha ko‘p so‘z yasang.',
    points: [
      'Saytda ham o‘ynaladi: kunlik g‘uncha va cheksiz mashq',
      'O‘rtadagi yurak harf har bir so‘zda qatnashadi',
      'Yettala harf ishlatilgan so‘z — pangramma: qo‘shimcha hisob',
      'To‘liq yechilgan kunlik g‘uncha — 20 aqcha',
      'Har topilgan so‘zning ma’nosi shu yerda: o‘ynab turib lug‘at boyitasiz',
    ],
    accent: 'teal',
  },
  {
    id: 'reyting',
    emoji: '🏆',
    name: 'Reyting',
    tagline: 'Kam urinish — ko‘p aqcha. Aqcha reytingga yig‘iladi.',
    points: [
      'Kunlik reyting — bugun ishlangan aqcha bo‘yicha',
      'Umumiy reyting — jamlangan aqcha bo‘yicha',
      'Statistika: g‘alaba foizi, streak, urinishlar taqsimoti',
      'Natijani spoylersiz ulashish',
    ],
    accent: 'yellow',
  },
  {
    id: 'qollab',
    emoji: '🤝',
    name: 'Qo‘llab-quvvatlash',
    tagline: 'Xarid ham, obuna ham yo‘q. Loyihani hamjamiyat ko‘taradi.',
    points: [
      'Loyiha hisobi ochiq ko‘rinadi',
      'Hissa qo‘shganlar ro‘yxati',
      'Pul loyihani rivojlantirishga va muallifga choy puliga ketadi',
    ],
    accent: 'accent',
  },
];

export const categories = [
  { emoji: '🧑', name: 'Inson va tana' },
  { emoji: '🏠', name: 'Uy va buyum' },
  { emoji: '🍽️', name: 'Taom va mahsulot' },
  { emoji: '🌿', name: 'Tabiat' },
  { emoji: '🐾', name: 'Hayvonlar' },
  { emoji: '🚕', name: 'Shahar va safar' },
  { emoji: '📚', name: 'Ilm, ish va pul' },
  { emoji: '🏃', name: 'Harakat va fe’l' },
  { emoji: '🎨', name: 'Sifat va rang' },
  { emoji: '💭', name: 'Tushuncha va vaqt' },
];

export const faq = [
  {
    q: 'Bugungi so‘z qanday topiladi?',
    a: 'Yashirin so‘zni oltita urinishda topasiz. Har urinishdan keyin kataklar rang oladi: yashil — harf o‘z joyida, sariq — so‘zda bor, lekin boshqa joyda, kulrang — bunday harf yo‘q. Kunlik so‘z butun O‘zbekistonda bir xil va yarim tunda almashadi.',
  },
  {
    q: 'Bugungi javobni qayerdan ko‘rsam bo‘ladi?',
    a: 'Javoblar sahifasida: bugungi so‘z spoyler ostida turadi, o‘tgan kunlarniki esa ochiq ro‘yxatda — raqami, sanasi va ma’nosi bilan. Ertangi so‘z ko‘rsatilmaydi.',
  },
  {
    q: 'Kuniga nechta o‘yin o‘ynasa bo‘ladi?',
    a: 'Kunlik so‘z kuniga bitta. Cheksiz rejimda esa chegara yo‘q: 4 dan 7 harfgacha xohlagancha o‘ynaysiz, yangi so‘z o‘yin tugagach darrov boshlanadi.',
  },
  {
    q: 'Hisob ochish shartmi?',
    a: 'Kunlik so‘z uchun — ha: u butun O‘zbekiston uchun bitta so‘z va natija reytingga tushadi, shuning uchun hisobga bog‘lanadi. Cheksiz rejim, g‘uncha va mashq esa hisobsiz ham ochiq: natija brauzeringizda qoladi.',
  },
  {
    q: 'Saytdagi o‘yin ilovadagisi bilan bir xilmi?',
    a: 'Ha. Kunlik so‘z ikkalasida aynan bitta, lug‘at ham o‘sha: hisob ochsangiz natijalar sinxronlanadi va reyting umumiy bo‘ladi.',
  },
  {
    q: 'Natijani qanday ulashaman?',
    a: 'O‘yin tugagach «Ulashish» tugmasi chiqadi: u ranglar to‘rini nusxalaydi — so‘zning o‘zi ko‘rinmaydi, ya’ni do‘stingizga spoyler bo‘lmaydi.',
  },
  {
    q: 'So‘zim qabul qilinmadi, nega?',
    a: 'Lug‘at katta, lekin cheksiz emas: 5 harfli rejimda 9 600 dan ortiq so‘z qabul qilinadi. Noo‘rin rad etilgan so‘zni o‘yin oxiridagi «So‘z haqida xabar berish» orqali yuboring — lug‘at aynan shu xabarlar bilan to‘ldiriladi.',
  },
  {
    q: 'SH, CH, O‘ va G‘ bitta katakchami?',
    a: 'Ha. Bular o‘zbek tilida bitta tovush, shuning uchun o‘yinda ham bitta harf — bitta katakcha va klaviaturada bitta tugma. Ya’ni «boshqa» besh harfli so‘z: B-O-SH-Q-A.',
  },
  {
    q: 'Internetsiz ishlaydimi?',
    a: 'Ha. Lug‘at ilova bilan birga keladi, o‘yin butunlay qurilmada hisoblanadi. Aloqa paydo bo‘lganda yangi so‘zlar va reyting o‘zi sinxronlanadi.',
  },
  {
    q: 'Ro‘yxatdan o‘tish shartmi?',
    a: 'Yo‘q. Mehmon sifatida darhol o‘ynash mumkin. Hisob ochsangiz natijalaringiz saqlanadi va boshqa telefondan ham ko‘rinadi.',
  },
  {
    q: 'Reklama yoki pullik xaridlar bormi?',
    a: 'Ilova bepul. Bosh ekran ostida bitta reklama banneri turadi — o‘yin taxtasiga, kategoriyalarga va reytingga reklama tushmaydi. Oraliq reklama, video reklama, ilova ichi xaridlari va obuna yo‘q. Xohlovchilar «Qo‘llab-quvvatlash» bo‘limi orqali hissa qo‘shishi mumkin.',
  },
  {
    q: 'Ballarim qayerga ketdi?',
    a: 'Hech qayerga — ular aqchaga aylandi: 10 ball = 1 aqcha, ya’ni 5 980 ball endi 598 aqcha bo‘lib ko‘rinadi. Saqlangan natijalarga tegilmadi. Onlayn jangdagi son ham aqcha — u yo‘qdan paydo bo‘lmaydi, raqibdan olinadi.',
  },
  {
    q: 'Kunlik so‘z hammaga bir xilmi?',
    a: 'Ha. Bir kunga bitta so‘z va u barcha qurilmalarda bir xil — shu sababli kunlik reyting adolatli bo‘ladi.',
  },
  {
    q: 'Aqcha qanday hisoblanadi?',
    a: 'Kunlik so‘z birinchi urinishda 20 aqcha beradi, keyingi urinishlarda kamayadi: 17, 13, 10, 7, 3. Cheksiz rejimda qancha urinish qolsa — shuncha aqcha, eng ko‘pi 8. Avval topilgan so‘z 60 % beradi, yordam olinsa shift 6 yoki 4 aqchaga tushadi. Jang ham aqcha beradi: bir jangda eng ko‘pi ±10.',
  },
];

/** Yon ustundagi taklif kartochkalari — o'yin maydonining chap va o'ng
 *  tomonidagi bo'sh joyda turadigan «yana nima bor» ro'yxati.
 *
 *  Ro'yxat bitta joyda: uni ishlatadigan `GameAside` joriy o'yinni
 *  `id` bo'yicha chiqarib tashlaydi, ya'ni odamga o'zi o'ynab turgan
 *  o'yin taklif qilinmaydi.
 *
 *  Matn o'ylab topilmagan: So'ztop, So'zjang va G'unchaning bir
 *  qatorlik tavsifi `modules` dagi o'sha tavsifning aynan o'zi —
 *  bosh sahifadagi yozuv bilan bu yerdagisi hech qachon ayri
 *  tushmaydi. Mardu va Cheksiz `modules` da yo'q (biri shakl, ikkinchisi
 *  So'ztopning rejimi), shuning uchun ular `links` dagi izohlarda
 *  aytilgan narsani qisqa qilib takrorlaydi.
 *
 *  So'zjang havolasi `battleQuick` emas, oddiy `/sozjang`: bu yerdagi
 *  kartochka taklif, qidiruvni o'zi boshlab yuboradigan tugma emas. */
export type GameLink = {
  id: string;
  emoji: string;
  name: string;
  tagline: string;
  href: string;
};

/** `modules` dagi tavsifni nomi bo'yicha olish — matn ikki joyda
 *  yozilib qolmasligi uchun. */
const moduleTagline = (id: string) =>
  modules.find((item) => item.id === id)?.tagline ?? '';

/** O'yin sahifalarining yon ustunidagi taklif kartochkalari
 *  (`GameAside`) va `/oynash` dagi ro'yxat.
 *
 *  So'ztop bu yerda **yo'q**: uning taxtasi bosh sahifada ham,
 *  `/oyin` da ham ochiq turadi va mashq qilmoqchi odam «Cheksiz»
 *  orqali o'sha yerga boradi. Kartochka esa o'ynab turgan odamga
 *  «yana nima bor» degan savolga javob berishi kerak — So'ztop esa
 *  javob emas, u allaqachon ko'rilgan. O'rnida turnir turadi: u
 *  eng kam ko'rinadigan va eng ko'p tushuntirish talab qiladigan
 *  shakl.
 *
 *  Tartib ham shu mantiqda: avval jonli jang, keyin turnir. */
export const gameLinks: GameLink[] = [
  {
    id: 'sozjang',
    emoji: '⚔️',
    name: 'So‘zjang',
    tagline: moduleTagline('sozjang'),
    href: links.battle,
  },
  {
    id: 'turnir',
    emoji: '🥇',
    name: 'Turnir',
    tagline: moduleTagline('turnir'),
    href: links.turnir,
  },
  {
    /* G'uncha bu yerda **jang** bo'lib turadi, yakka o'yin emas.
     *
     *  Yakka g'unchaga taxtaning ustidagi belgi olib boradi (bir
     *  bosishda, `Play` dagi almashtirgich), ya'ni u yaqin joyda.
     *  Yonidagi kartochka esa «yana nima bor» degan savolga javob
     *  beradi va o'sha savolga jonli jang qiziqroq javob: odam
     *  allaqachon yolg'iz o'ynab o'tiribdi.
     *
     *  Nomi ham shu sababdan «G'uncha jangi» — kartochka qayerga olib
     *  borsa, o'sha yozilishi kerak. */
    id: 'guncha',
    emoji: '🌸',
    name: 'G‘uncha jangi',
    tagline: 'Ikkalangizga bir xil g‘uncha va uch daqiqa: kim ko‘p to‘plasa.',
    href: links.gunchaBattle,
  },
  {
    id: 'mardu',
    emoji: '🏟️',
    name: 'Mardu maydon',
    tagline: 'O‘sha So‘zjang yoki G‘uncha, lekin sakkiztagacha odam bilan.',
    href: links.mardu,
  },
  {
    id: 'cheksiz',
    emoji: '♾️',
    name: 'Cheksiz',
    tagline: '4 dan 7 harfgacha, xohlagancha mashq — hisobsiz ham.',
    href: '/cheksiz/5-harf',
  },
];
