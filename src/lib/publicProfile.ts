/** Boshqa o'yinchining ochiq profili — ilovadagi `PublicProfile` va
 *  `PublicProfileDataSource` ning porti.
 *
 *  Faqat hammaga ochiq ma'lumot yig'iladi: umumiy ball (`scores/{uid}`),
 *  bellashuv reytingi (`battle_ratings/{uid}`), bugungi kunlik natija va
 *  loyihaga qo'shgan hissasi (`donations`). Shaxsiy statistika
 *  (`users/{uid}` va ichidagi hujjatlar) o'qilmaydi — u faqat egasiga
 *  ochiq, shuning uchun bu yerda ketma-ketlik yoki urinishlar taqsimoti
 *  yo'q.
 *
 *  Hammasi ochiq hujjatlar, ya'ni REST bilan, SDK'siz: uch hujjat bitta
 *  `batchGet` da, o'rinlar `count()` bilan, donatlar `runQuery` bilan.
 *  Manbalarning biri xato bersa ham qolgani qaytadi — ekran yarim
 *  ma'lumot bilan ham foydali. */
import { PATHS, dailyDoc } from '../firebase/paths';
import { batchGetDocs, countAbove, queryDocs } from '../firebase/rest';
import { EMPTY_RATING, played, type BattleRating } from './battleRating';
import { dailyKey } from './daily';
import { DAILY_LENGTH } from './modes';

export interface PublicDailyResult {
  won: boolean;
  /** Nechanchi urinishda topgani. Topmagan bo'lsa ahamiyatsiz. */
  attempts: number;
  points: number;
  /** Kunlik o'yin tartib raqami (№29 kabi). */
  number: number;
}

export interface PublicProfile {
  uid: string;
  /** Ochiq jadvallardagi taxallus. Hech qayerda yo'q bo'lsa bo'sh — u
   *  holda sahifa chaqiruvchi bergan ismni ko'rsatadi. */
  nickname: string;
  totalScore: number;
  wordsFound: number;
  /** Umumiy reytingdagi o'rni (1 — birinchi). Sanab bo'lmasa `null`. */
  scoreRank: number | null;
  /** Bellashuv reytingi. Jang o'ynamagan bo'lsa `null` — 1000 ball
   *  «qozonilgan» reyting taassurotini bermasin. */
  battle: BattleRating | null;
  battleRank: number | null;
  /** Bugungi kunlik natija. O'ynamagan bo'lsa `null`. */
  today: PublicDailyResult | null;
  donated: number;
  donations: number;
}

/** Hech qayerda izi yo'q: raqamlar o'rniga izoh chiqadi. */
export const isEmptyProfile = (profile: PublicProfile) =>
  profile.totalScore === 0 &&
  profile.wordsFound === 0 &&
  profile.battle === null &&
  profile.today === null &&
  profile.donated === 0;

/** Bir odamning donatlari — tarixi uzun bo'lsa ham yig'indi shuncha
 *  yozuvdan hisoblanadi. */
const DONATION_LIMIT = 50;

const int = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : 0;

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

export async function loadPublicProfile(uid: string): Promise<PublicProfile> {
  const scorePath = `${PATHS.scores}/${uid}`;
  const ratingPath = `${PATHS.battleRatings}/${uid}`;
  const dailyPath = `${PATHS.dailyResults}/${dailyDoc(dailyKey(), DAILY_LENGTH)}/${PATHS.entries}/${uid}`;

  const docs = await batchGetDocs([scorePath, ratingPath, dailyPath]);
  const score = docs[scorePath] ?? null;
  const ratingDoc = docs[ratingPath] ?? null;
  const daily = docs[dailyPath] ?? null;

  const totalScore = int(score?.totalScore);
  const rating: BattleRating | null = ratingDoc
    ? {
        rating: int(ratingDoc.rating) || EMPTY_RATING.rating,
        wins: int(ratingDoc.wins),
        losses: int(ratingDoc.losses),
        draws: int(ratingDoc.draws),
        streak: int(ratingDoc.streak),
      }
    : null;
  const battle = rating && played(rating) > 0 ? rating : null;

  // O'rinlar ball ma'lum bo'lgach sanaladi, donatlar esa mustaqil —
  // uchalasi baravar ketadi.
  const [scoreRank, battleRank, donations] = await Promise.all([
    totalScore > 0
      ? countAbove(PATHS.scores, { field: 'totalScore', value: totalScore })
      : Promise.resolve(null),
    battle
      ? countAbove(PATHS.battleRatings, { field: 'rating', value: battle.rating })
      : Promise.resolve(null),
    queryDocs('donations', { field: 'uid', equals: uid, limit: DONATION_LIMIT }),
  ]);

  let donated = 0;
  let count = 0;
  for (const doc of donations) {
    const amount = int(doc.fields.amount);
    if (amount <= 0) continue;
    donated += amount;
    count += 1;
  }

  // Jadvallarda nomi bo'lmagan donatchi (o'yin o'ynamagan) donatdagi
  // ismi bilan chiqadi — «O'yinchi» o'rniga.
  const donorName = donations.map((doc) => text(doc.fields.name)).find(Boolean) ?? '';

  return {
    uid,
    nickname:
      text(score?.nickname) || text(ratingDoc?.nickname) || text(daily?.nickname) || donorName,
    totalScore,
    wordsFound: int(score?.wordsFound),
    scoreRank: scoreRank === null ? null : scoreRank + 1,
    battle,
    battleRank: battleRank === null ? null : battleRank + 1,
    today: daily
      ? {
          won: daily.won === true,
          attempts: int(daily.attempts),
          points: int(daily.points),
          number: int(daily.number),
        }
      : null,
    donated,
    donations: count,
  };
}
