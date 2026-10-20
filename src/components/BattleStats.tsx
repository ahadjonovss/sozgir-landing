/** O'lja kartochkasi — ilovadagi `RatingCard`.
 *
 *  Raqam asosiy, qolgani unga izoh: daraja, keyingi darajaga qolgan yo'l
 *  va jang / g'alaba / mag'lubiyat soni. Ma'lumot jonli: jang tugagach
 *  server yozadi, kartochka o'zi yangilanadi.
 *
 *  Hujjatda xom reyting turadi, ekranda esa o'lja: chegaralar xom sonda
 *  tekshiriladi, ko'rsatiladigan farq esa o'ljada (`lib/aqcha.ts`). */
import { useEffect, useState } from 'react';
import { battleAqcha } from '../lib/aqcha';
import {
  EMPTY_RATING,
  nextTierAt,
  played,
  tierName,
  tierProgress,
  watchRating,
  winRate,
  type BattleRating,
} from '../lib/battleRating';
import { useCountUp } from '../lib/useCountUp';
import { useDonorTier } from '../lib/donor';
import DonorChip from './DonorChip';
import { BattleAqcha, TierBadge } from './Units';

export default function BattleStats({
  uid,
  compact = false,
  change = null,
}: {
  uid: string;
  compact?: boolean;
  /** Shu jang aqchani qancha o'zgartirgani — xom reytingda.
   *
   *  Natija ekranida kerak: kartochkada yangi yig'indi turadi va
   *  undan «bu jang nima berdi» bilinmasdi. Jadval jang tugagach
   *  yangilanadi, ya'ni farqni undan hisoblab bo'lmaydi — server
   *  jang yozuviga avvalgi va keyingi sonni qo'yadi va ikkisi shu
   *  yerga keladi. */
  change?: { before: number; after: number } | null;
}) {
  const [value, setValue] = useState<BattleRating | null>(null);

  useEffect(() => {
    let alive = true;
    let stop: (() => void) | null = null;
    stop = watchRating(uid, (next) => {
      if (alive) setValue(next);
    });
    return () => {
      alive = false;
      stop?.();
    };
  }, [uid]);

  const rating = value ?? EMPTY_RATING;
  /* Jang tugagach son eski o'ljadan yangisiga sanab o'tadi: shu
     jangda nima bo'lganini raqamning o'zi ko'rsatadi. Boshqa
     joylarda (profil, lobbi) «o'zgarish» degan tushuncha yo'q —
     `change` bo'lmasa son darhol o'z qiymatida turadi. */
  const shown = useCountUp(
    rating.rating,
    // Jadval hali yuklanmagan bo'lsa sanoq boshlanmaydi: aks holda
    // son avval bo'sh qiymatga sakrab, keyin sanalardi.
    change && value ? change.before : null,
  );
  const next = nextTierAt(rating.rating);
  const games = played(rating);
  /** Homiylik darajasi: kartochka daraja ohangida, daraja yonida chip. */
  const donor = useDonorTier(uid);

  return (
    <div
      className={`rating${compact ? ' rating--compact' : ''}${value ? '' : ' rating--loading'}${
        donor ? ` rating--donor rating--${donor}` : ''
      }`}
    >
      <div className="rating__main">
        <span className="rating__label">Jang aqchasi</span>
        <strong className="rating__value">
          {/* Farq bu yerda ko'rsatilmaydi. Jang natijasida u yuqorida,
              kartochkadan oldin, o'z qatorida turibdi
              (`result__delta`) — ikkalasi birga chiqqanda bitta son
              ekranda ikki marta, ikki xil ko'rinishda turardi va
              o'qigan odam ularni boshqa-boshqa narsa deb o'ylardi.
              `change` esa qoladi: sanoq eski qiymatdan yangisiga
              surilib borishi uchun kerak. */}
          <BattleAqcha rating={shown} size="lg" />
        </strong>
        <span className="rating__tiers">
          <span className="rating__tier">
            <TierBadge rating={rating.rating} size={20} />
            {tierName(rating.rating)}
          </span>
          {donor && <DonorChip tier={donor} className="rating__tier rating__donor" />}
        </span>
        <span className="rating__track" aria-hidden="true">
          <i style={{ width: `${Math.round(tierProgress(rating.rating) * 100)}%` }} />
        </span>
        <span className="rating__next">
          {next === null
            ? 'Eng yuqori daraja'
            : `Keyingi darajaga ${battleAqcha(next) - battleAqcha(rating.rating)} aqcha`}
        </span>
      </div>

      <ul className="rating__stats">
        <li>
          <strong>{games}</strong>
          <span>jang</span>
        </li>
        <li className="rating__stat--win">
          <strong>{rating.wins}</strong>
          <span>g‘alaba</span>
        </li>
        <li className="rating__stat--loss">
          <strong>{rating.losses}</strong>
          <span>mag‘lubiyat</span>
        </li>
        <li>
          <strong>{games === 0 ? '—' : `${winRate(rating)}%`}</strong>
          <span>g‘alaba foizi</span>
        </li>
        <li className={rating.streak > 0 ? 'rating__stat--win' : ''}>
          <strong>{rating.streak}</strong>
          <span>ketma-ket</span>
        </li>
      </ul>
    </div>
  );
}
