/** O'lja kartochkasi — ilovadagi `RatingCard`.
 *
 *  Raqam asosiy, qolgani unga izoh: daraja, keyingi darajaga qolgan yo'l
 *  va jang / g'alaba / mag'lubiyat soni. Ma'lumot jonli: jang tugagach
 *  server yozadi, kartochka o'zi yangilanadi.
 *
 *  Hujjatda xom reyting turadi, ekranda esa o'lja: chegaralar xom sonda
 *  tekshiriladi, ko'rsatiladigan farq esa o'ljada (`lib/aqcha.ts`). */
import { useEffect, useState } from 'react';
import { olja } from '../lib/aqcha';
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
import { useDonorTier } from '../lib/donor';
import DonorChip from './DonorChip';
import { Olja } from './Units';
import { TierBadge } from './Units';

export default function BattleStats({ uid, compact = false }: { uid: string; compact?: boolean }) {
  const [value, setValue] = useState<BattleRating | null>(null);

  useEffect(() => {
    let alive = true;
    let stop: (() => void) | null = null;
    void watchRating(uid, (next) => {
      if (alive) setValue(next);
    }).then((unsubscribe) => {
      if (alive) stop = unsubscribe;
      else unsubscribe();
    });
    return () => {
      alive = false;
      stop?.();
    };
  }, [uid]);

  const rating = value ?? EMPTY_RATING;
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
        <span className="rating__label">O‘lja</span>
        <strong className="rating__value">
          <Olja rating={rating.rating} size="lg" />
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
            : `Keyingi darajaga ${olja(next) - olja(rating.rating)} O‘lja`}
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
