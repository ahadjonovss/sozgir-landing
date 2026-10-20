/** Boshqa o'yinchining ochiq profili — ilovadagi `PublicProfile` va
 *  `PublicProfileDataSource` ning porti.
 *
 *  Hammasi bitta so'rovda (`/v1/public/profiles/:uid`): ball, o'rin, bugungi
 *  natija, donat va nishonlar. Firestore'da bu beshta hujjatdan beshta
 *  o'qish edi.
 *
 *  Jang reytingi alohida so'raladi — u boshqa jadvalda va profilga
 *  kirmagan.
 *
 *  Marshrut **ochiq**: sahifa havola bilan ochiladi va kirish ekrani
 *  chiqishi kerak emas. Mobil `/v1/profiles/:uid` dan farqi bitta
 *  maydonda — oxirgi faollik vaqti bu yerda berilmaydi.
 *
 *  Jang reytingi esa hamon tokenli (`/v1/web/me/battle-rating`): u ochiq
 *  ro'yxatga kirmagan. Kirmagan tashrifchida o'lja ko'rinmaydi,
 *  qolgan profil to'liq chiqadi — manbalarning biri xato bersa ham
 *  ikkinchisi qaytadi. */
import { api } from '../api/client';
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
  /** Yalang ball — faqat o'yinlarda yig'ilgani (`scores/{uid}.totalScore`).
   *  Ekranda u ko'rinmaydi: jadvalda ham, profilda ham [wealth] turadi. */
  totalScore: number;
  /** Ekrandagi son: ball va o'lja ustamasining yig'indisi, aqchada
   *  (server uni `aqcha` deb yuboradi). */
  wealth: number;
  wordsFound: number;
  /** Umumiy reytingdagi o'rni (1 — birinchi). Sanab bo'lmasa `null`. */
  scoreRank: number | null;
  /** O'lja (hujjatda xom reyting). Jang o'ynamagan bo'lsa `null` — 1000
   *  «qozonilgan» reyting taassurotini bermasin. */
  battle: BattleRating | null;
  battleRank: number | null;
  /** Bugungi kunlik natija. O'ynamagan bo'lsa `null`. */
  today: PublicDailyResult | null;
  donated: number;
  donations: number;
  /** Homiy o'zi tanlagan profil ko'rinishining kaliti
   *  (`donors/{uid}.look`) — masalan `koshin`, `oqsuyak`.
   *
   *  Tanlamagan bo'lsa `null` va ko'rinish yig'indidan olinadi
   *  (`lib/profileSkin.ts`). Ilovada ham shunday: tanlov faqat
   *  bezakka tegadi, daraja o'z holicha qoladi. */
  look: string | null;
}

/** Hech qayerda izi yo'q: raqamlar o'rniga izoh chiqadi. */
export const isEmptyProfile = (profile: PublicProfile) =>
  profile.wealth === 0 &&
  profile.wordsFound === 0 &&
  profile.battle === null &&
  profile.today === null &&
  profile.donated === 0;

const int = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : 0;

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

const EMPTY: Omit<PublicProfile, 'uid'> = {
  nickname: '',
  totalScore: 0,
  wealth: 0,
  wordsFound: 0,
  scoreRank: null,
  battle: null,
  battleRank: null,
  today: null,
  donated: 0,
  donations: 0,
  look: null,
};

interface ApiProfile {
  nickname?: unknown;
  aqcha?: unknown;
  wordsFound?: unknown;
  rank?: unknown;
  today?: { won?: unknown; attempts?: unknown; points?: unknown } | null;
  donated?: unknown;
  look?: unknown;
}

export async function loadPublicProfile(uid: string): Promise<PublicProfile> {
  const [profile, rating] = await Promise.all([
    // Javob o'ralmagan: marshrut profilning o'zini qaytaradi.
    // Topilmagan yoki robot bo'lsa 404 — u ham bo'sh profil.
    api
      .get<ApiProfile>(`/v1/public/profiles/${encodeURIComponent(uid)}`, {
        query: { day: dailyKey(), length: DAILY_LENGTH },
        auth: false,
      })
      .catch(() => null),
    api
      .get<{ rating?: Record<string, unknown> | null }>('/v1/web/me/battle-rating', {
        query: { uid },
      })
      .then((reply) => reply.rating ?? null)
      .catch(() => null),
  ]);

  if (profile === null) return { uid, ...EMPTY };

  const full: BattleRating | null = rating
    ? {
        rating: int(rating.rating) || EMPTY_RATING.rating,
        wins: int(rating.wins),
        losses: int(rating.losses),
        draws: int(rating.draws),
        streak: int(rating.streak),
      }
    : null;

  const wealth = int(profile.aqcha);
  const rank = profile.rank;

  return {
    uid,
    nickname: text(profile.nickname),
    // Serverda yalang ball alohida saqlanmaydi — `aqcha` ning o'zi
    // ball bilan o'lja ustamasining yig'indisi. Ekranda baribir
    // [wealth] turadi, shuning uchun ikkalasi bir xil.
    totalScore: wealth,
    wealth,
    wordsFound: int(profile.wordsFound),
    // O'rin serverda hisoblanadi va **birdan** boshlanadi.
    scoreRank: typeof rank === 'number' ? rank : null,
    battle: full && played(full) > 0 ? full : null,
    // Jang jadvalidagi o'rin serverda sanalmaydi: `battle_ratings` da
    // o'rin so'rovi yo'q va uni mijozda hisoblash butun jadvalni
    // yuklashni talab qilardi.
    battleRank: null,
    today: profile.today
      ? {
          won: profile.today.won === true,
          attempts: int(profile.today.attempts),
          points: int(profile.today.points),
          // Kunlik o'yinning tartib raqami javobda yo'q.
          number: 0,
        }
      : null,
    donated: int(profile.donated),
    /* Tanlangan ko'rinish — serverdan shu nom bilan keladi
       (`app/public_profile.ts`). Tanlanmagan bo'lsa `null`. */
    look: typeof profile.look === 'string' && profile.look ? profile.look : null,
    // Donatlar **soni** serverda qaytmaydi, faqat yig'indisi. Nol
    // emas, bor-yo'qligi bo'yicha: yig'indisi bo'lsa kamida bitta.
    donations: int(profile.donated) > 0 ? 1 : 0,
  };
}
