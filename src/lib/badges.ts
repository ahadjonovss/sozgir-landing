/** Nishonlar — ilovadagi `AppBadge`, `BadgeEvaluator` va `BadgeStore`
 *  ning veb ko'chirmasi (`soztop/docs/nishonlar.md`).
 *
 *  Nishon — bir martalik yutuq belgisi. Darajalardan (jang darajasi,
 *  homiylik darajasi) farqi shunda: nishon **qaytib olinmaydi**. Reyting
 *  tushsa daraja ham tushadi, nishon esa qo'lga kiritilgan hodisa
 *  haqida — u o'chmaydi.
 *
 *  Shu sababli nishonlar yangi shkala yasamaydi: sanoqlar allaqachon bor
 *  joyidan o'qiladi ([BadgeSnapshot]), brauzerda esa faqat «olingan»
 *  ro'yxati saqlanadi. Ro'yxat ikki narsa uchun kerak: hisob pasaysa
 *  nishon qaytarib olinmasin va **hodisa** nishonlari (g'uncha to'liq
 *  yechildi, murojaat yuborildi, tong sahar o'ynaldi) bilinsin — ular
 *  hech qanday sanoqda qolmaydi.
 *
 *  Ro'yxat serverga yozilmaydi. Ilovada ham shunday edi; u yerda endi
 *  ochiq profil uchun `player_badges` ga nusxa yozilyapti, lekin bu ish
 *  hali tugallanmagan — sayt o'sha qotgach qo'shiladi.
 *
 *  Nishonlarning nomi, izohi va chegarasi ilovadagi ro'yxatning aynan
 *  o'zi: bir xil nishon ikki platformada bir xil shart bilan berilishi
 *  shart. `id` — barqaror nom: rasm fayli ham shu nom bilan
 *  (`public/nishon/{id}.png`). */

/** Nishonning soni qayerdan olinadi. */
export type BadgeSource =
  | 'dailyStreak'
  | 'wordsFound'
  | 'firstTryWins'
  | 'battleWins'
  | 'battleStreak'
  | 'battleRating'
  | 'gamesScored'
  | 'categories'
  | 'shares'
  /** Hodisa: sanoqda qolmaydi, yuz bergan joyda [unlockBadge] chaqiriladi. */
  | 'event';

export interface Badge {
  /** Barqaror nom — saqlanadigan ro'yxatda ham, rasm faylida ham shu. */
  id: string;
  label: string;
  /** Nima qilish kerak — bir jumlada. */
  hint: string;
  /** Nom nimani anglatadi. Nishonlar turkiy nom bilan atalgan, ya'ni
   *  «Yasovul» yoki «Kuntug'mish» nimaligini aytib qo'yish kerak — aks
   *  holda nishon shunchaki chiroyli rasm bo'lib qoladi. */
  story: string;
  /** Kerakli son. Hodisa nishonlarida 1 — «bo'ldi yoki bo'lmadi». */
  target: number;
  source: BadgeSource;
}

export const BADGES: Badge[] = [
  // ── O'choq: kunlik ketma-ketlik ───────────────────────────────────
  {
    id: 'chog',
    label: 'Cho‘g‘',
    hint: '7 kun ketma-ket o‘ynang',
    story: 'Olov endi tutashdi: kul ostidagi cho‘g‘ — uzoq seriyaning boshi.',
    target: 7,
    source: 'dailyStreak',
  },
  {
    id: 'alanga',
    label: 'Alanga',
    hint: '30 kun ketma-ket o‘ynang',
    story:
      'Olov ochiq yonyapti — bir oy davomida bironta kun tashlab ketilmadi.',
    target: 30,
    source: 'dailyStreak',
  },
  {
    id: 'mashal',
    label: 'Mash’al',
    hint: '100 kun ketma-ket o‘ynang',
    story:
      'Yuz kun yonib turgan olov endi o‘ziga emas, boshqalarga yo‘l ko‘rsatadi.',
    target: 100,
    source: 'dailyStreak',
  },

  // ── So'z: topilgan so'zlar ───────────────────────────────────────
  {
    id: 'tilga_kirgan',
    label: 'Tilga kirgan',
    hint: 'Birinchi so‘zni toping',
    story: 'Har lug‘atning birinchi so‘zi bo‘ladi — bu sizniki.',
    target: 1,
    source: 'wordsFound',
  },
  {
    id: 'termachi',
    label: 'Termachi',
    hint: '100 ta so‘z toping',
    story: 'Dala kezib so‘z teradigan odam: birinchi yuztasi yig‘ildi.',
    target: 100,
    source: 'wordsFound',
  },
  {
    id: 'koshgariy',
    label: 'Koshg‘ariy',
    hint: '1 000 ta so‘z toping',
    story:
      'Ilk turkiy lug‘at «Devonu lug‘otit turk» muallifi Mahmud Koshg‘ariy sharafiga.',
    target: 1000,
    source: 'wordsFound',
  },

  // ── Mahorat ──────────────────────────────────────────────────────
  {
    id: 'mergan',
    label: 'Mergan',
    hint: 'So‘zni birinchi urinishda toping',
    story: 'Bitta o‘q, bitta nishon: so‘z birinchi urinishdayoq topildi.',
    target: 1,
    source: 'firstTryWins',
  },
  {
    id: 'yengilmas',
    label: 'Yengilmas',
    hint: '10 ta jangni ketma-ket yuting',
    story: 'O‘n jang, o‘n g‘alaba — oralig‘ida bitta ham mag‘lubiyat yo‘q.',
    target: 10,
    source: 'battleStreak',
  },

  // ── Jang ─────────────────────────────────────────────────────────
  {
    id: 'ilk_olja',
    label: 'Ilk o‘lja',
    hint: 'Bellashuvda birinchi g‘alabani qo‘lga kiriting',
    story: 'Bellashuvdagi birinchi g‘alaba va u bilan kelgan birinchi o‘lja.',
    target: 1,
    source: 'battleWins',
  },
  {
    id: 'tug_kotargan',
    label: 'Tug‘ ko‘targan',
    hint: 'Botir darajasiga chiqing',
    story:
      'Tug‘ — xon bayrog‘i. Uni maydonda o‘z o‘rnini topgan jangchi ko‘taradi.',
    target: 1800,
    source: 'battleRating',
  },
  {
    id: 'yovqur',
    label: 'Yovqur',
    hint: '50 ta jang g‘alabasiga yeting',
    story: 'Ellik jangdan qaytmagan odam — qilichi ham, so‘zi ham o‘tkir.',
    target: 50,
    source: 'battleWins',
  },

  // ── Kenglik: o'yinning boshqa burchaklari ────────────────────────
  {
    id: 'yolchi',
    label: 'Yo‘lchi',
    hint: 'Uchala o‘yinda ham ball yig‘ing',
    story:
      'Bir joyda o‘tirmagan odam: So‘ztop ham, G‘uncha ham, Yangso‘z ham sinab ko‘rilgan.',
    target: 3,
    source: 'gamesScored',
  },
  {
    id: 'elkezar',
    label: 'Elkezar',
    hint: 'Har mavzudan kamida bitta so‘z toping',
    story:
      'El kezgan odam — lug‘atning yigirma ikki mavzusining hammasiga bosh suqqan.',
    target: 22,
    source: 'categories',
  },
  {
    id: 'yalavoch',
    label: 'Yalavoch',
    hint: 'Lug‘at uchun birinchi murojaatingizni yuboring',
    story:
      'Eski turkiychada elchi, xabar tashuvchi: lug‘atdagi kamchilikni birinchi bo‘lib aytgan odam.',
    target: 1,
    source: 'event',
  },
  {
    id: 'jarchi',
    label: 'Jarchi',
    hint: 'Natijangizni 5 marta ulashing',
    story: 'Xabarni elga yetkazuvchi: natijasini o‘ziga saqlab qolmaydi.',
    target: 5,
    source: 'shares',
  },

  // ── Kun vaqti ────────────────────────────────────────────────────
  {
    id: 'tongotar',
    label: 'Tongotar',
    hint: 'Tong sahar (05:00–07:00) o‘ynang',
    story:
      'Xo‘roz qichqirganda o‘yinni ochgan odam: kun so‘z bilan boshlanadi.',
    target: 1,
    source: 'event',
  },
  {
    id: 'boyqush',
    label: 'Boyqush',
    hint: 'Yarim tundan keyin (00:00–04:00) o‘ynang',
    story: 'Hamma uxlaganda ham so‘z topib o‘tirgan odam.',
    target: 1,
    source: 'event',
  },

  // ── Hodisa sodir bo'lgan joyda belgilanadi ───────────────────────
  {
    id: 'gulchambar',
    label: 'Gulchambar',
    hint: 'G‘unchadagi barcha so‘zni toping',
    story: 'G‘unchaning bitta ham so‘zi qolmadi — chambar yopildi.',
    target: 1,
    source: 'event',
  },
  {
    id: 'yasovul',
    label: 'Yasovul',
    hint: 'Yangso‘zda so‘zingiz g‘olib chiqsin',
    story:
      'Siz yasagan so‘z ovoz berishda g‘olib chiqdi va endi lug‘atda qoladi.',
    target: 1,
    source: 'event',
  },
  {
    id: 'kuntugmish',
    label: 'Kuntug‘mish',
    hint: 'Bir kunning eng zo‘ri bo‘ling',
    story:
      'Turkiy dostondagi ism — «kundan tug‘ilgan». Bir kun butunlay sizniki bo‘ldi.',
    target: 1,
    source: 'event',
  },
];

export const badgeById = (id: string): Badge | null =>
  BADGES.find((badge) => badge.id === id) ?? null;

/** Nishon rasmi — `public/nishon/{id}.png`. */
export const badgeArt = (badge: Badge) => `/nishon/${badge.id}.png`;

/** Nishonlar hisoblanadigan sonlar — bir joyda.
 *
 *  Yangi sanoq saqlanmaydi: hammasi mavjud manbalardan (statistika,
 *  topilgan so'zlar, jang reytingi, ballar kitobi) yig'iladi. Yagona
 *  istisno — ulashish: u hech qayerda saqlanmasdi. */
export interface BadgeSnapshot {
  /** Kunlik rejimdagi eng uzun ketma-ketlik. */
  dailyStreak: number;
  /** Topilgan takrorlanmas so'zlar soni. */
  wordsFound: number;
  /** Birinchi urinishda topilgan so'zlar soni. */
  firstTryWins: number;
  battleWins: number;
  /** Ketma-ket jang g'alabalari (mag'lubiyatda nolga tushadi). */
  battleStreak: number;
  battleRating: number;
  /** Nechta o'yinda ball yig'ilgan (So'ztop, G'uncha, Yangso'z). */
  gamesScored: number;
  /** Nechta mavzudan so'z topilgan. */
  categories: number;
  /** Natija necha marta ulashilgan. */
  shares: number;
}

export const EMPTY_SNAPSHOT: BadgeSnapshot = {
  dailyStreak: 0,
  wordsFound: 0,
  firstTryWins: 0,
  battleWins: 0,
  battleStreak: 0,
  battleRating: 0,
  gamesScored: 0,
  categories: 0,
  shares: 0,
};

export interface BadgeStatus {
  badge: Badge;
  earned: boolean;
  /** Hozirgi son (olingan nishonda ham xom son turadi). */
  value: number;
  /** 0..1 — yo'lakcha uchun. */
  progress: number;
}

/** Sonlardan nishonlarni hisoblaydi.
 *
 *  Sof funksiya: tarmoq ham, saqlash ham yo'q. `unlocked` — brauzerda
 *  saqlangan ro'yxat: bir marta olingan nishon son pasaysa ham qaytarib
 *  olinmaydi (ketma-ketlik uziladi, reyting tushadi). */
export function evaluateBadges(
  snapshot: BadgeSnapshot,
  unlocked: Set<string> = new Set(),
): BadgeStatus[] {
  return BADGES.map((badge) => {
    const saved = unlocked.has(badge.id);
    const raw = badge.source === 'event' ? 0 : snapshot[badge.source];
    const value = saved && raw < badge.target ? badge.target : raw;
    const earned = saved || value >= badge.target;
    return {
      badge,
      earned,
      value,
      progress: earned ? 1 : Math.min(1, Math.max(0, value / badge.target)),
    };
  });
}

/* ── Brauzerdagi ro'yxat ──────────────────────────────────────────── */

const EARNED_KEY = 'sozgir.badges.earned';
const SHARES_KEY = 'sozgir.badges.shares';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Shaxsiy rejim — nishonlar faqat shu sahifada qoladi.
  }
}

const listeners = new Set<() => void>();

/** Nishon ro'yxati o'zgarganini kuzatish — sahifa ochiq turganda
 *  o'yin tugasa yangi nishon shu zahoti ko'rinsin. */
export function onBadgesChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const earnedBadges = (): Set<string> =>
  new Set(read<string[]>(EARNED_KEY, []).filter(Boolean));

export const shareCount = (): number => read<number>(SHARES_KEY, 0);

/** Ro'yxatga qo'shadi. Allaqachon bor bo'lsa hech narsa yozilmaydi. */
export function unlockBadge(...ids: string[]): void {
  const current = earnedBadges();
  const fresh = ids.filter((id) => id && !current.has(id));
  if (fresh.length === 0) return;
  write(EARNED_KEY, [...current, ...fresh]);
  for (const listener of listeners) listener();
}

/** Ulashish sanog'ini bittaga oshiradi — «Jarchi» uchun.
 *
 *  Yagona yangi sanoq: qolgan nishonlarning hammasi mavjud sonlardan
 *  hisoblanadi. */
export function countShare(): void {
  write(SHARES_KEY, shareCount() + 1);
  for (const listener of listeners) listener();
}

/** O'ynalgan payt bo'yicha nishon: tong sahar yoki yarim tundan keyin.
 *
 *  Brauzerning soati bo'yicha — ilovadagi kabi. Soatni odam o'zgartira
 *  oladi, lekin bu yerda yutuq yo'q: nishon hech narsani ochmaydi. */
export function markPlayedAt(now = new Date()): void {
  const hour = now.getHours();
  if (hour >= 5 && hour < 7) unlockBadge('tongotar');
  if (hour >= 0 && hour < 4) unlockBadge('boyqush');
}
