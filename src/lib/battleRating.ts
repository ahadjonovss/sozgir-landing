/** So'zjang reytingi — ilovadagi `BattleRating` ning porti.
 *
 *  Hujjat `battle_ratings/{uid}`: server har jangdan keyin yangilaydi,
 *  o'qish hammaga ochiq. Darajalar va chegaralar ilova bilan bir xil,
 *  aks holda saytda bir daraja, telefonda boshqasi ko'rinardi.
 *
 *  Hujjatdagi son — **xom reyting**. Ekranga u `olja()` dan o'tib
 *  chiqadi (`lib/aqcha.ts`), chegaralar esa xom sonda tekshiriladi. */
import { client } from '../firebase/client';
import { PATHS } from '../firebase/paths';
import { watchDoc, type Unsubscribe } from '../firebase/live';

export interface BattleRating {
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  /** Ketma-ket g'alabalar (mag'lubiyatda nolga tushadi). */
  streak: number;
}

export const START_RATING = 1000;

export const EMPTY_RATING: BattleRating = {
  rating: START_RATING,
  wins: 0,
  losses: 0,
  draws: 0,
  streak: 0,
};

/** Darajalar — o'nta pog'ona, turkiy nomlar (`docs/aqcha.md`, 5).
 *
 *  Chegara **xom reytingda** tekshiriladi, ekranda esa o'lja turadi:
 *  yaxlitlash chegarani surib qo'ymasin. Eng pastki chegara 100 —
 *  reytingning quyi chegarasi, ya'ni «Chopar»da ham yo'l ko'rinadi. */
const TIERS: ReadonlyArray<{ from: number; name: string; slug: string }> = [
  { from: 100, name: 'Chopar', slug: 'chopar' },
  { from: 800, name: 'Cherik', slug: 'cherik' },
  { from: 1000, name: 'Navkar', slug: 'navkar' },
  { from: 1100, name: 'O‘nboshi', slug: 'onboshi' },
  { from: 1250, name: 'Yuzboshi', slug: 'yuzboshi' },
  { from: 1400, name: 'Mingboshi', slug: 'mingboshi' },
  { from: 1600, name: 'Botir', slug: 'botir' },
  { from: 1800, name: 'Bahodir', slug: 'bahodir' },
  { from: 2100, name: 'Tarxon', slug: 'tarxon' },
  { from: 2500, name: 'Alp', slug: 'alp' },
];

/** Reyting shu daraja ichida — ro'yxatdagi tartib raqami. */
function tierIndex(rating: number): number {
  let index = 0;
  for (let i = 0; i < TIERS.length; i++) if (rating >= TIERS[i].from) index = i;
  return index;
}

export const played = (value: BattleRating) => value.wins + value.losses + value.draws;

export const winRate = (value: BattleRating) =>
  played(value) === 0 ? 0 : Math.round((value.wins / played(value)) * 100);

/** Keyingi darajaning chegarasi — **xom reytingda**. Eng yuqorida `null`.
 *  Ekranda ko'rsatiladigan farq `olja()` dan o'tkaziladi. */
export function nextTierAt(rating: number): number | null {
  const next = TIERS[tierIndex(rating) + 1];
  return next ? next.from : null;
}

/** Joriy darajadan keyingisiga qadar bosilgan yo'l (0..1). */
export function tierProgress(rating: number): number {
  const next = nextTierAt(rating);
  if (next === null) return 1;
  const from = TIERS[tierIndex(rating)].from;
  return Math.min(1, Math.max(0, (rating - from) / (next - from)));
}

export const tierName = (rating: number) => TIERS[tierIndex(rating)].name;

/** Daraja nishonining fayli: `public/daraja/{slug}.png`. */
export const tierSlug = (rating: number) => TIERS[tierIndex(rating)].slug;

const int = (value: unknown, fallback = 0) =>
  typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : fallback;

/** Reytingni jonli kuzatish: jang tugagach server yozadi va kartochka
 *  o'zi yangilanadi. Hujjat yo'q bo'lsa — hali jang qilmagan. */
export function watchRating(
  uid: string,
  onData: (value: BattleRating) => void,
): Promise<Unsubscribe> {
  return watchDoc<Record<string, unknown>>(`${PATHS.battleRatings}/${uid}`, (data) => {
    if (!data) return onData(EMPTY_RATING);
    onData({
      rating: int(data.rating, START_RATING),
      wins: int(data.wins),
      losses: int(data.losses),
      draws: int(data.draws),
      streak: int(data.streak),
    });
  });
}

/** So'zjang jadvalidagi taxallusni yangilaydi — ilovadagi
 *  `patchBattleNickname`.
 *
 *  Hujjatni server jang yakunida yozadi va u paytdagi nomni qo'yadi.
 *  Taxallus keyin o'zgarsa u yerda eski nom (ko'pincha «Mehmon») qolib
 *  ketardi: odam kunlik jadvalda o'z ismi bilan, So'zjangda esa mehmon
 *  bo'lib turardi. Faqat mavjud hujjat: jang o'ynamagan odam jadvalga
 *  tushmasin, shuning uchun `not-found` jimgina o'tkaziladi. */
export async function patchBattleNickname(uid: string, nickname: string): Promise<void> {
  const { db } = await client();
  const { doc, updateDoc } = await import('firebase/firestore/lite');
  try {
    await updateDoc(doc(db, PATHS.battleRatings, uid), { nickname });
  } catch (error) {
    if ((error as { code?: string })?.code === 'not-found') return;
    throw error;
  }
}
