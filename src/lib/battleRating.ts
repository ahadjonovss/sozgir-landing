/** So'zjang reytingi — ilovadagi `BattleRating` ning porti.
 *
 *  Yozuvni server har jangdan keyin yangilaydi. Darajalar va
 *  chegaralar ilova bilan bir xil, aks holda saytda bir daraja,
 *  telefonda boshqasi ko'rinardi.
 *
 *  Yozuvdagi son — **xom reyting**. Ekranga u `battleAqcha()` dan o'tib
 *  chiqadi (`lib/aqcha.ts`), chegaralar esa xom sonda tekshiriladi. */
import { api } from '../api/client';
import { poll, type Unsubscribe } from '../api/poll';

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
 *  Ekranda ko'rsatiladigan farq `battleAqcha()` dan o'tkaziladi. */
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

const ratingOf = (data: Record<string, unknown> | null | undefined): BattleRating =>
  !data
    ? EMPTY_RATING
    : {
        rating: int(data.rating, START_RATING),
        wins: int(data.wins),
        losses: int(data.losses),
        draws: int(data.draws),
        streak: int(data.streak),
      };

/** Reytingni darhol qayta so'raydiganlar.
 *
 *  Jang tugagan zahoti chaqiriladi: natija ekrani shu kartochkani
 *  ko'rsatadi va o'n besh soniya kutish uni eski son bilan chizardi —
 *  endigina yutgan odam «0 jang» ni ko'rardi. */
const listeners = new Set<() => void>();

export function refreshRating(): void {
  for (const listener of [...listeners]) listener();
}

/** Reytingni kuzatish: jang tugagach server yozadi va kartochka
 *  darhol yangilanadi. Yozuv yo'q bo'lsa — hali jang qilmagan.
 *
 *  `null` — hali kelmagani: chaqiruvchi uni **bo'sh reytingdan**
 *  ajratishi kerak, aks holda yuklanish payti haqiqiy ma'lumotday
 *  ko'rinadi. */
export function watchRating(
  uid: string,
  onData: (value: BattleRating) => void,
): Unsubscribe {
  const stop = poll<BattleRating>(
    async () => {
      const reply = await api.get<{ rating?: Record<string, unknown> | null }>(
        '/v1/web/me/battle-rating',
        { query: { uid } },
      );
      return ratingOf(reply.rating);
    },
    onData,
    // Reyting faqat jang yakunida o'zgaradi — tez-tez so'rashning
    // ma'nosi yo'q. Yakun esa [refreshRating] bilan darhol keladi.
    { period: 15_000 },
  );

  const again = () => {
    void api
      .get<{ rating?: Record<string, unknown> | null }>('/v1/web/me/battle-rating', {
        query: { uid },
      })
      .then((reply) => onData(ratingOf(reply.rating)))
      .catch(() => undefined);
  };
  listeners.add(again);

  return () => {
    listeners.delete(again);
    stop();
  };
}

/** So'zjang jadvalidagi taxallus endi **o'zi** to'g'ri bo'ladi.
 *
 *  Firestore'da nom har jadvalga nusxa ko'chirilardi va taxallus
 *  o'zgarganda eskisi qolib ketardi: odam kunlik jadvalda o'z ismi
 *  bilan, So'zjangda esa mehmon bo'lib turardi. Shu sabab sayt
 *  yozuvni qo'lda tuzatardi.
 *
 *  Serverda reyting so'rovi `users` ga qo'shiladi (`SELECT_RATING`),
 *  ya'ni nom har doim joriy nom. Funksiya chaqiruv joylari
 *  o'zgarmasin deb qoldirilgan va hech narsa qilmaydi. */
export async function patchBattleNickname(): Promise<void> {
  // Ataylab bo'sh.
}
