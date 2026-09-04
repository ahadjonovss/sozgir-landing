/** Sahifadagi barcha matn va havolalar shu yerda — dizaynga tegmasdan
 *  tahrirlash uchun. Store havolalari chiqqanda faqat `links` yangilanadi. */

export const email = 'uzmobdev@gmail.com';

export const links = {
  appStore: '',
  playStore: '',
  telegram: 'https://t.me/sozgir_uz',
  support: `mailto:${email}`,
  play: '/oyin',
  privacy: '/privacy',
  contact: '/contact',
};

export const stats = [
  { value: '2 164', label: 'yashirin so‘z', hint: '4–7 harfli javoblar bazasi' },
  { value: '72 000+', label: 'tan olinadigan so‘z', hint: 'taxmin sifatida qabul qilinadi' },
  { value: '10', label: 'kategoriya', hint: 'tabiatdan tushunchagacha' },
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
    ],
    accent: 'green',
  },
  {
    id: 'sozjang',
    emoji: '⚔️',
    name: 'So‘zjang',
    tagline: 'Bir so‘z, ikki o‘yinchi. Kim kamroq urinishda topadi?',
    points: [
      'Do‘stga havola yuboring — u 24 soat ichida o‘ynaydi',
      'Tezkor jang: tasodifiy raqib, 90 soniya',
      'Raqibning kataklari harfsiz — faqat ranglar ko‘rinadi',
      'Elo reytingi bilan kuchingiz o‘lchanadi',
    ],
    accent: 'orange',
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
    id: 'organish',
    emoji: '📖',
    name: 'O‘rganish',
    tagline: 'Har so‘zning ta’rifi bor — o‘ynab turib lug‘at boyitasiz.',
    points: [
      'Tasodifiy so‘z va uning ma’nosi',
      'Uzunlik bo‘yicha qidiruv',
      'Bilim darajasi: lug‘atning necha foizini topgansiz',
      'Topilgan so‘zlar tarixi — sana va ball bilan',
    ],
    accent: 'teal',
  },
  {
    id: 'reyting',
    emoji: '🏆',
    name: 'Reyting',
    tagline: 'Kam urinish — ko‘p ball. Ballar reytingga yig‘iladi.',
    points: [
      'Kunlik reyting — bugungi ball bo‘yicha',
      'Umumiy reyting — jamlangan ball bo‘yicha',
      'Statistika: g‘alaba foizi, streak, urinishlar taqsimoti',
      'Natijani spoylersiz ulashish',
    ],
    accent: 'yellow',
  },
  {
    id: 'qollab',
    emoji: '🤝',
    name: 'Qo‘llab-quvvatlash',
    tagline: 'Reklama yo‘q, xarid yo‘q. Loyihani hamjamiyat ko‘taradi.',
    points: [
      'Loyiha hisobi ochiq ko‘rinadi',
      'Hissa qo‘shganlar ro‘yxati',
      'Hamma pul lug‘at va serverga ketadi',
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
    a: 'Yo‘q. Ilova butunlay bepul, reklama va ilova ichi xaridlari yo‘q. Xohlovchilar «Qo‘llab-quvvatlash» bo‘limi orqali hissa qo‘shishi mumkin.',
  },
  {
    q: 'Kunlik so‘z hammaga bir xilmi?',
    a: 'Ha. Bir kunga bitta so‘z va u barcha qurilmalarda bir xil — shu sababli kunlik reyting adolatli bo‘ladi.',
  },
  {
    q: 'Ball qanday hisoblanadi?',
    a: 'Qancha kam urinishda topsangiz, shuncha ko‘p ball. So‘z uzunligi ham hisobga olinadi, takroriy o‘ynashda koeffitsiyent pasayadi.',
  },
];
