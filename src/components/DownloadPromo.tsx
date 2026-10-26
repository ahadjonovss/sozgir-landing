/** Natija ostidagi taklif — mehmon uchun.
 *
 *  Hisobsiz o'ynagan odam natijasini saqlay olmaydi; ilova esa uni
 *  bepul saqlaydi, ustiga Yangso'z, kategoriyalar va eslatmalar beradi.
 *  Har o'yin tugagach shu yerda ko'rinadi. Telefonda qurilmaning do'koni
 *  birinchi tugma bo'ladi. */
import { useMemo } from 'react';
import { links, site } from '../data/site';
import { qrMatrix, qrPath } from '../lib/qr';
import { AppleIcon, PlayIcon } from './StoreIcons';

function isIos(): boolean {
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

/** Qisqa havola — QR ichiga shu yoziladi. To'g'ridan-to'g'ri do'kon
 *  havolasi emas: `/ol` telefonni o'zi taniydi, ya'ni bitta QR ikkala
 *  do'kon uchun ishlaydi va matni ham qisqa (QR yirikroq kataklar
 *  bilan chiqadi — kamera uzoqdan ham o'qiydi). */
const getLink = `${site}${links.get}`;

/** `title`/`text` — chaqiruvchi matnni almashtiradi.
 *
 *  Sukutdagi matn mehmonga qaratilgan («natijalar saqlanadi»), turnir
 *  esa hisobsiz o'ynalmaydi: u yerda o'sha gap yolg'on bo'lib
 *  chiqardi. `top` — kartochka sahifaning eng boshida tursa, ustidagi
 *  oraliq keraksiz. `qr` — o'ng chekkada QR kod: kompyuterda o'tirgan
 *  odam uchun do'kon tugmasidan foydaliroq, chunki ilova baribir
 *  telefonga kerak. Telefonda QR bekor (o'z ekranini o'zi o'qiy
 *  olmaydi) — u yerda CSS uni yashiradi. */
export default function DownloadPromo({
  title,
  text,
  top = false,
  qr = false,
}: {
  title?: string;
  text?: string;
  top?: boolean;
  qr?: boolean;
} = {}) {
  const ios = isIos();
  const stores = [
    { href: links.appStore, label: 'App Store', icon: <AppleIcon size={18} />, first: ios },
    { href: links.playStore, label: 'Google Play', icon: <PlayIcon size={18} />, first: !ios },
  ].sort((a, b) => Number(b.first) - Number(a.first));

  // QR hisobi arzon emas (sakkiz maska baholanadi), havola esa
  // o'zgarmaydi — bir marta hisoblanadi.
  const code = useMemo(() => {
    if (!qr) return null;
    const matrix = qrMatrix(getLink);
    return matrix ? { d: qrPath(matrix), size: matrix.length } : null;
  }, [qr]);

  return (
    <div className={`promo${top ? ' promo--top' : ''}${code ? ' promo--qr' : ''}`}>
      <div className="promo__body">
        <div className="promo__text">
          <strong>{title ?? 'Ilovada davom eting'}</strong>
          <span>
            {text ??
              'Natijalar saqlanadi, kunlik eslatma keladi. Yangso‘z, kategoriyalar va g‘uncha — internetsiz ham.'}
          </span>
        </div>
        <div className="promo__stores">
          {stores.map((store) => (
            <a
              key={store.label}
              className={`promo__store${store.first ? ' promo__store--first' : ''}`}
              href={store.href}
              target="_blank"
              rel="noreferrer"
            >
              {store.icon}
              {store.label}
            </a>
          ))}
        </div>
      </div>
      {code && (
        <a className="promo__qr" href={links.get}>
          {/* `shape-rendering` muhim: silliqlangan chekka belgilarni
              xiralashtiradi va QR o'qilmay qoladi. */}
          <svg
            viewBox={`-2 -2 ${code.size + 4} ${code.size + 4}`}
            shapeRendering="crispEdges"
            role="img"
            aria-label={`${getLink} havolasining QR kodi`}
          >
            <rect x={-2} y={-2} width={code.size + 4} height={code.size + 4} fill="#fff" />
            <path d={code.d} fill="#000" />
          </svg>
          <span>sozgir.uz/ol</span>
        </a>
      )}
    </div>
  );
}
