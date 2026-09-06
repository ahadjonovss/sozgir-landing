/** Saytdagi matn va havolalar. Store havolalari chiqqanda faqat `links`
 *  yangilanadi — dizaynga tegish shart emas. */

export const links = {
  appStore: '',
  playStore: '',
  telegram: 'https://t.me/sozgir_uz',
  support: 'mailto:samandar.ahadjonov@alif.uz',
};

/** Raqamlar `public/words/` dagi lug'atdan olingan (ilova bilan bir xil
 *  fayllar): javoblar 439+951+848+660, tan olinadigan so'zlar esa
 *  7065+13515+18027+25442. `npm run words:sync` ularni qayta hisoblaydi. */
export const stats = [
  { value: '2 898', label: 'yashirin so‘z', hint: '4–7 harfli javoblar bazasi' },
  { value: '64 049', label: 'tan olinadigan so‘z', hint: 'taxmin sifatida qabul qilinadi' },
  { value: '10', label: 'kategoriya', hint: 'tabiatdan tushunchagacha' },
  { value: '29', label: 'harf-tugma', hint: 'to‘liq o‘zbek klaviaturasi' },
];

export type ModuleInfo = {
  id: string;
  name: string;
  tagline: string;
  points: string[];
  tone: string;
  to: string;
  badge?: string;
  /** Saytda o'ynaladimi yoki faqat ilovadami — ochiq aytiladi. */
  onWeb: boolean;
};

export const modules: ModuleInfo[] = [
  {
    id: 'soztop',
    name: 'So‘ztop',
    tagline: 'Yashirin so‘zni urinishlar tugagunicha toping.',
    points: [
      'Kunlik — bir kunga bitta so‘z, butun O‘zbekistonda bir xil',
      'Cheksiz — 4 dan 7 harfgacha, xohlagancha mashq',
      'Kategoriya — mavzu tanlab o‘ynash',
      'Topilgan harflar keyingi qatorga o‘zi yoziladi',
    ],
    tone: 'var(--green)',
    to: '/soztop',
    onWeb: true,
  },
  {
    id: 'sozjang',
    name: 'So‘zjang',
    tagline: 'Bir so‘z, ikki o‘yinchi. Kim kamroq urinishda topadi?',
    points: [
      'Do‘stga havola yuboring — u 24 soat ichida o‘ynaydi',
      'Tezkor jang: reytingi yaqin tasodifiy raqib',
      'Raqibning kataklari harfsiz — faqat ranglar ko‘rinadi',
      'Elo reytingi bilan kuchingiz o‘lchanadi',
    ],
    tone: 'var(--accent)',
    to: '/jang',
    badge: 'Jonli',
    onWeb: false,
  },
  {
    id: 'yangsoz',
    name: 'Yangso‘z',
    tagline: 'Tilda yo‘q tushunchaga o‘zingiz so‘z o‘ylab toping.',
    points: [
      'Har hafta yangi tushuncha e’lon qilinadi',
      'So‘zingizni izoh bilan taklif qilasiz',
      'Boshqalar ovoz beradi, moderator tasdiqlaydi',
      'G‘olib so‘zlar alohida ro‘yxatda qoladi',
    ],
    tone: 'var(--yellow)',
    to: '/yangsoz',
    badge: 'Haftalik',
    onWeb: false,
  },
  {
    id: 'organish',
    name: 'O‘rganish',
    tagline: 'Har so‘zning ta’rifi bor — o‘ynab turib lug‘at boyitasiz.',
    points: [
      'Tasodifiy so‘z va uning ma’nosi',
      'Uzunlik bo‘yicha qidiruv',
      'Bilim darajasi: lug‘atning necha foizini topgansiz',
      'Topilgan so‘zlar tarixi — sana va ball bilan',
    ],
    tone: 'var(--violet)',
    to: '/organish',
    onWeb: true,
  },
  {
    id: 'reyting',
    name: 'Reyting',
    tagline: 'Kam urinish — ko‘p ball. Ballar reytingga yig‘iladi.',
    points: [
      'Kunlik reyting — bugungi ball bo‘yicha',
      'Umumiy reyting — jamlangan ball bo‘yicha',
      'Statistika: g‘alaba foizi, seriya, urinishlar taqsimoti',
      'Natijani spoylersiz ulashish',
    ],
    tone: 'var(--orange)',
    to: '/reyting',
    onWeb: true,
  },
  {
    id: 'qollab',
    name: 'Qo‘llab-quvvatlash',
    tagline: 'Reklama yo‘q, xarid yo‘q. Loyihani hamjamiyat ko‘taradi.',
    points: [
      'Loyiha hisobi ochiq ko‘rinadi',
      'Hissa qo‘shganlar ro‘yxati',
      'Hamma pul lug‘at va serverga ketadi',
    ],
    tone: 'var(--teal)',
    to: '/donat/',
    onWeb: true,
  },
];

/** Ilovada bor, saytda yo'q imkoniyatlar — yuklab olish sahifasi uchun. */
export const appFeatures = [
  'So‘zjang: do‘st bilan yoki tasodifiy raqib bilan jonli bellashuv',
  'Yangso‘z: haftalik tushunchaga so‘z o‘ylab topish va ovoz berish',
  'Kunlik va umumiy reyting — natijangiz hisobingizga bog‘lanadi',
  'Kunlik eslatma va ketma-ketlik qo‘riqchisi',
  'Internetsiz ishlaydi: lug‘at ilova bilan birga keladi',
  'Qattiq rejim, tebranish va so‘z haqida xabar berish',
];

export const faq = [
  {
    q: 'Saytdagi kunlik so‘z ilovadagi bilan bir xilmi?',
    a: 'Ha. Sayt ilovaning lug‘atidan foydalanadi va kunlik so‘zni xuddi shu qoida bo‘yicha tanlaydi — sana raqamidan deterministik, so‘ng server nusxasi bilan solishtiriladi. Ya’ni brauzerda ham, telefonda ham aynan bir so‘z chiqadi.',
  },
  {
    q: 'SH, CH, O‘ va G‘ bitta katakchami?',
    a: 'Ha. Bular o‘zbek tilida bitta tovush, shuning uchun o‘yinda ham bitta harf — bitta katakcha va klaviaturada bitta tugma. Ya’ni «boshqa» besh harfli so‘z: B-O-SH-Q-A.',
  },
  {
    q: 'Natijalarim saqlanadimi?',
    a: 'Saytda natija shu brauzerda saqlanadi — tugallanmagan o‘yin ham joyidan davom etadi. Ilovada esa natija hisobingizga bog‘lanadi va boshqa telefondan ham ko‘rinadi.',
  },
  {
    q: 'So‘zjang nega saytda o‘ynalmaydi?',
    a: 'Jang haqiqiy vaqtda ketadi va ikkala o‘yinchining hisobiga bog‘lanadi. Chaqiruv havolasi (sozgir.uz/jang/KOD) saytda ochilsa, kod ko‘rsatiladi va bir bosishda ilovaga o‘tiladi.',
  },
  {
    q: 'Internetsiz ishlaydimi?',
    a: 'Ilova — ha: lug‘at u bilan birga keladi va o‘yin butunlay qurilmada hisoblanadi. Saytda esa lug‘at bir marta yuklab olinadi va brauzer keshida qoladi.',
  },
  {
    q: 'Ro‘yxatdan o‘tish shartmi?',
    a: 'Yo‘q. Saytda ham, ilovada ham mehmon sifatida darhol o‘ynash mumkin. Hisob ochsangiz natijalaringiz saqlanadi va reytingda ko‘rinasiz.',
  },
  {
    q: 'Reklama yoki pullik xaridlar bormi?',
    a: 'Yo‘q. Ilova butunlay bepul, reklama va ilova ichi xaridlari yo‘q. Xohlovchilar «Qo‘llab-quvvatlash» bo‘limi orqali hissa qo‘shishi mumkin.',
  },
  {
    q: 'Ball qanday hisoblanadi?',
    a: 'Ball = asos ball × urinish samaradorligi × takror koeffitsienti. Kunlik o‘yinda asos 100, cheksizda so‘z uzunligiga qarab 50 dan 90 gacha. Qancha kam urinishda topsangiz, ball shuncha yuqori.',
  },
];
