/** Jang aqchasi kartochkasi — ilovadagi `RatingCard`.
 *
 *  Raqam asosiy, qolgani unga izoh: jang / g'alaba / mag'lubiyat
 *  soni. Ma'lumot jonli: jang tugagach server yozadi, kartochka
 *  o'zi yangilanadi.
 *
 *  Daraja yo'q. Reytingga bog'langan o'nta unvon haftalik ligaga
 *  ko'chdi (`soztop/docs/aqcha.md`, 4-bo'lim) — reytingning o'zi
 *  esa ekranda aqcha bo'lib ko'rinaveradi. */
import { useEffect, useState } from 'react';
import {
  EMPTY_RATING,
  played,
  watchRating,
  winRate,
  type BattleRating,
} from '../lib/battleRating';
import { useDonorTier } from '../lib/donor';
import DonorChip from './DonorChip';
import { BattleAqcha } from './Units';

/** Jang aqchasi: yig'indi, daraja va uchta sanoq.
 *
 *  Ilgari bu yerda `change` ham bor edi — shu jang aqchani qancha
 *  o'zgartirgani. U faqat natija ekrani uchun edi, u yerda esa farq
 *  endi o'yinchilarning o'z kartochkasida, taxtasi ustida turadi
 *  (`BattlePage` dagi `aqchaOf`) va bu kartochkaning o'zi ko'rsatilmaydi.
 *  Shu sababli `change` bilan birga sanoq animatsiyasi ham ketdi:
 *  kartochka ko'rinadigan joylarda (profil, lobbi, `/oynash`)
 *  «o'zgarish» degan tushuncha yo'q. */
export default function BattleStats({
  uid,
  compact = false,
}: {
  uid: string;
  compact?: boolean;
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
          <BattleAqcha rating={rating.rating} size="lg" />
        </strong>
        {/* Daraja nishoni, zinapoya va «keyingi darajaga N aqcha»
            bu yerdan olib tashlandi. Reytingga bog'langan o'nta
            unvon (Chopar…Alp) endi yo'q: ular haftalik ligaga
            ko'chdi va u yerda pog'onaga ball bilan emas, guruh
            tepasida hafta yakunlab chiqiladi (`soztop/docs/aqcha.md`,
            4-bo'lim; `docs/liga.md`). Elo reytingining o'zi qoldi —
            u juftlash uchun kerak va ekranda aqcha bo'lib ko'rinadi,
            faqat uning nomi yo'q.

            Homiylik chipi qoladi: u reytingdan emas, hissadan
            keladi. */}
        {donor && (
          <span className="rating__tiers">
            <DonorChip tier={donor} className="rating__tier rating__donor" />
          </span>
        )}
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
