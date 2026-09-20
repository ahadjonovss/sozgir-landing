/** Nishonlar kartochkasi — o'yin sahifasining yon ustunida.
 *
 *  Ilovadagi `BadgesCard` bilan bir xil ish: nishonlar sahifasiga yo'l
 *  ochadi va yo'lda turgan bittasini ko'rsatadi. To'liq ro'yxat
 *  `/nishonlar` da — kartochka faqat «sizda nima bor va keyingisi
 *  nima» degan savolga javob beradi.
 *
 *  Olingan nishonlar birinchi qatorda, ularning ketidan **eng yaqini**:
 *  yo'lakcha to'lgani. Hech nima olinmagan bo'lsa ham kartochka bo'sh
 *  qolmaydi — birinchi nishonning sharti ko'rinadi. */
import { links } from '../data/site';
import { badgeArt } from '../lib/badges';
import { useBadges } from '../lib/useBadges';
import { pretty } from '../lib/uz';

/** Kartochkada shuncha nishon ko'rinadi — qolgani sahifada. */
const SHOWN = 6;

export default function BadgesCard() {
  const { badges, earned } = useBadges();

  const mine = badges.filter((status) => status.earned);
  /** Keyingisi — eng yaqini. Bir martalik nishonlar (yo'lakchasi yo'q)
   *  oxirida qoladi: ular haqida «qancha qoldi» deb bo'lmaydi. */
  const next = badges
    .filter((status) => !status.earned)
    .sort((a, b) => b.progress - a.progress)[0];

  const shown = mine.slice(-SHOWN);

  return (
    <div className="panel nishon-card">
      <div className="panel__head">
        <h3>Nishonlar</h3>
        <span className="panel__tag">
          {earned} / {badges.length}
        </span>
      </div>

      {shown.length > 0 && (
        <ul className="nishon-card__row">
          {shown.map((status) => (
            <li key={status.badge.id}>
              <img
                src={badgeArt(status.badge)}
                alt={pretty(status.badge.label)}
                title={pretty(status.badge.label)}
                width={40}
                height={40}
                loading="lazy"
                decoding="async"
              />
            </li>
          ))}
        </ul>
      )}

      {next && (
        <div className="nishon-card__next">
          <img
            className="nishon__art--off"
            src={badgeArt(next.badge)}
            alt=""
            width={36}
            height={36}
            loading="lazy"
            decoding="async"
          />
          <div>
            <strong>{pretty(next.badge.label)}</strong>
            <span className="panel__note">{pretty(next.badge.hint)}</span>
          </div>
          {next.badge.target > 1 && (
            <span className="nishon-card__score">
              {next.value}/{next.badge.target}
            </span>
          )}
        </div>
      )}

      <a className="btn btn--sm btn--ghost" href={links.badges}>
        Hammasini ko‘rish
      </a>
    </div>
  );
}
