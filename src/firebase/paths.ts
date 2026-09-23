/** Firestore yo'llari — ilovaning `firestore_paths.dart` bilan bir xil.
 *  Saytda kerak bo'lgan qismi: profil, statistika, topilgan so'zlar,
 *  reyting va kunlik so'z. */
export const PATHS = {
  dictionaries: 'dictionaries',
  manifest: 'manifest',
  daily: 'daily',
  users: 'users',
  stats: 'stats',
  foundWords: 'found_words',
  scores: 'scores',
  dailyResults: 'daily_results',
  /** Bugun ishlab topilgan ball — `daily_scores/{sana}/entries/{uid}`.
   *  Yig'indi hujjatidan ajratilgan: u butun tarixni saqlaydi va undan
   *  «bugun qancha» degan savolga javob chiqmaydi. */
  dailyScores: 'daily_scores',
  entries: 'entries',
  /** G'unchaning yig'ma hisobi — `users/{uid}/guncha/totals`.
   *
   *  Xom ball o'yinning o'zida, ya'ni brauzerda turadi (`docs/scores.md`).
   *  Buluddagi nusxa ikki ish uchun: yangi qurilmada ball tiklanadi va
   *  hisob almashganda son **o'z egasida** qoladi — ilgari u joyida
   *  qolib, yangi hisobning balliga qo'shilib ketardi. */
  guncha: 'guncha',
  gunchaTotals: 'totals',
  /** So'zjang reytingi — `battle_ratings/{uid}`, hammaga o'qish ochiq. */
  battleRatings: 'battle_ratings',
  /** Homiylar hujjati — `donors/{uid}`: yig'indi (server yozadi) va
   *  odam tanlagan muhr (`mark`, faqat egasi yozadi). */
  donors: 'donors',
  /** So'z haqidagi murojaatlar — moderatsiyaga tushadi. */
  wordReports: 'word_reports',
  /** Qo'lda taklif qilingan yangi so'zlar — `word_suggestions` dan
   *  alohida navbat: u yerga o'yin paytida kiritilgan so'zlar ta'rifsiz
   *  tushadi, bu yerga esa odam ataylab, ma'nosi bilan yozadi. */
  wordProposals: 'word_proposals',
  /** Kategoriyalar — yordamda mavzu nomi shundan olinadi. */
  categories: 'categories',
  /** Profil rasmi: `avatars/{uid}` (64 px `thumb`) va
   *  `avatars/{uid}/sizes/full` (256 px `data`) — base64 JPEG, ilova
   *  bilan bir xil. */
  avatars: 'avatars',
  avatarSizes: 'sizes',
  avatarFull: 'full',
} as const;

export const dictionaryDoc = (length: number) => `uz_${length}`;

export const dailyDoc = (dateKey: string, length: number) =>
  `${dateKey}_${length}`;

export const statsDoc = (mode: string, length: number) => `${mode}_${length}`;
