/** So'zjang reytingi — ilovadagi `BattleRating` ning porti.
 *
 *  Hujjat `battle_ratings/{uid}`: server har jangdan keyin yangilaydi,
 *  o'qish hammaga ochiq. Darajalar va chegaralar ilova bilan bir xil,
 *  aks holda saytda «Havaskor», telefonda «Tajribali» bo'lib qolardi. */
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

/** Darajalar chegarasi — reyting shu ballardan o'tganda daraja o'zgaradi. */
const TIERS = [1000, 1200, 1400, 1600];

export const played = (value: BattleRating) => value.wins + value.losses + value.draws;

export const winRate = (value: BattleRating) =>
  played(value) === 0 ? 0 : Math.round((value.wins / played(value)) * 100);

/** Keyingi darajaga yetish uchun kerakli ball. Eng yuqorida `null`. */
export function nextTierAt(rating: number): number | null {
  for (const threshold of TIERS) if (rating < threshold) return threshold;
  return null;
}

/** Joriy darajadan keyingisiga qadar bosilgan yo'l (0..1). */
export function tierProgress(rating: number): number {
  const next = nextTierAt(rating);
  if (next === null) return 1;
  const index = TIERS.indexOf(next);
  const from = index === 0 ? next - 200 : TIERS[index - 1];
  return Math.min(1, Math.max(0, (rating - from) / (next - from)));
}

export function tierName(rating: number): string {
  if (rating < 1000) return 'Yangi';
  if (rating < 1200) return 'Havaskor';
  if (rating < 1400) return 'Tajribali';
  if (rating < 1600) return 'Ustoz';
  return 'So‘z ustasi';
}

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
