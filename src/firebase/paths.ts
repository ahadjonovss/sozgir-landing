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
  entries: 'entries',
  /** So'zjang reytingi — `battle_ratings/{uid}`, hammaga o'qish ochiq. */
  battleRatings: 'battle_ratings',
  /** So'z haqidagi murojaatlar — moderatsiyaga tushadi. */
  wordReports: 'word_reports',
} as const;

export const dictionaryDoc = (length: number) => `uz_${length}`;

export const dailyDoc = (dateKey: string, length: number) =>
  `${dateKey}_${length}`;

export const statsDoc = (mode: string, length: number) => `${mode}_${length}`;
