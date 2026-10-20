/** So'zjang reytingi — ilovadagi `BattleRating` ning porti.
 *
 *  Yozuvni server har jangdan keyin yangilaydi.
 *
 *  Daraja yo'q. Reytingga bog'langan o'nta unvon (Chopar…Alp)
 *  haftalik ligaga ko'chdi va u yerda pog'onaga ball bilan emas,
 *  guruh tepasida hafta yakunlab chiqiladi
 *  (`soztop/docs/aqcha.md`, 4-bo'lim). Reytingning o'zi qoladi: u
 *  juftlash uchun kerak va ekranda aqcha bo'lib ko'rinadi. */
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

export const played = (value: BattleRating) => value.wins + value.losses + value.draws;

export const winRate = (value: BattleRating) =>
  played(value) === 0 ? 0 : Math.round((value.wins / played(value)) * 100);

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
