/** Aqcha va o'lja — son va uning yonidagi belgi.
 *
 *  Raqamli joylarda birlik **so'z bilan emas, belgi bilan** ko'rsatiladi:
 *  jadvalda o'nta qatorda «aqcha» so'zi takrorlansa, u ma'no bermay
 *  qo'yadi va qatorni cho'zadi. Matn ichida esa (qoidalar, savollar)
 *  so'zning o'zi qoladi — belgi jumlaning o'rtasida o'qishni buzadi.
 *
 *  Rasm `public/` da turadi, ya'ni manzili barqaror va keshlanadi.
 *  `alt` bo'sh emas: ekran o'quvchisi «598 aqcha» deb o'qishi kerak,
 *  shuning uchun belgi matnning bir qismi. */
import { formatAqcha, formatOlja, signed } from '../lib/aqcha';
import { tierName, tierSlug } from '../lib/battleRating';
import { donorLabel, donorSlug, type DonorTier } from '../lib/donor';

type Size = 'sm' | 'md' | 'lg';

function Unit({
  src,
  alt,
  size,
  children,
}: {
  src: string;
  alt: string;
  size: Size;
  children: React.ReactNode;
}) {
  return (
    <span className={`unit unit--${size}`}>
      <img className="unit__icon" src={src} alt={alt} width={20} height={20} loading="lazy" decoding="async" />
      {children}
    </span>
  );
}

/** Tiyinni aqcha belgisi bilan ko'rsatadi: «belgi 598».
 *
 *  `sign` — mukofot uchun: qo'shuv ishorasi belgidan **keyin** turadi
 *  («belgi +20»), aks holda u belgidan ajralib, ikkita alohida narsadek
 *  o'qilardi. */
export function Aqcha({
  tiyin,
  size = 'md',
  sign = false,
}: {
  tiyin: number;
  size?: Size;
  sign?: boolean;
}) {
  return (
    <Unit src="/aqcha.png" alt="Aqcha" size={size}>
      {sign ? `+${formatAqcha(tiyin)}` : formatAqcha(tiyin)}
    </Unit>
  );
}

/** Xom reytingni o'lja belgisi bilan ko'rsatadi. */
export function Olja({ rating, size = 'md' }: { rating: number; size?: Size }) {
  return (
    <Unit src="/olja.png" alt="O‘lja" size={size}>
      {formatOlja(rating)}
    </Unit>
  );
}

/** Jangdagi o'zgarish: +6, −6 — belgisi bilan. */
export function OljaDelta({ value, size = 'sm' }: { value: number; size?: Size }) {
  return (
    <Unit src="/olja.png" alt="O‘lja" size={size}>
      {signed(value)}
    </Unit>
  );
}

/** Jangdagi daraja nishoni — o'nta pog'onaning har biriga o'z belgisi.
 *
 *  Nom yonida kichik, profil kartochkasida kattaroq turadi. Chegara
 *  **xom reytingda** tekshiriladi (`tierSlug`), ya'ni nishon bilan
 *  ko'rsatilgan o'lja hech qachon zid bo'lmaydi. */
export function TierBadge({ rating, size = 22 }: { rating: number; size?: number }) {
  return (
    <img
      className="badge"
      src={`/daraja/${tierSlug(rating)}.png`}
      alt={tierName(rating)}
      title={tierName(rating)}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
    />
  );
}

/** Homiylik darajasining nishoni — yurakli beshta belgi. */
export function DonorBadge({ tier, size = 18 }: { tier: DonorTier; size?: number }) {
  return (
    <img
      className="badge"
      src={`/homiy/${donorSlug(tier)}.png`}
      alt={donorLabel(tier)}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
    />
  );
}
