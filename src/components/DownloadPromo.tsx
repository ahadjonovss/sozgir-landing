/** Natija ostidagi taklif — mehmon uchun.
 *
 *  Hisobsiz o'ynagan odam natijasini saqlay olmaydi; ilova esa uni
 *  bepul saqlaydi, ustiga Yangso'z, kategoriyalar va eslatmalar beradi.
 *  Har o'yin tugagach shu yerda ko'rinadi. Telefonda qurilmaning do'koni
 *  birinchi tugma bo'ladi. */
import { links } from '../data/site';
import { AppleIcon, PlayIcon } from './StoreIcons';

function isIos(): boolean {
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

/** `title`/`text` — chaqiruvchi matnni almashtiradi.
 *
 *  Sukutdagi matn mehmonga qaratilgan («natijalar saqlanadi»), turnir
 *  esa hisobsiz o'ynalmaydi: u yerda o'sha gap yolg'on bo'lib
 *  chiqardi. `top` — kartochka sahifaning eng boshida tursa, ustidagi
 *  oraliq keraksiz. */
export default function DownloadPromo({
  title,
  text,
  top = false,
}: {
  title?: string;
  text?: string;
  top?: boolean;
} = {}) {
  const ios = isIos();
  const stores = [
    { href: links.appStore, label: 'App Store', icon: <AppleIcon size={18} />, first: ios },
    { href: links.playStore, label: 'Google Play', icon: <PlayIcon size={18} />, first: !ios },
  ].sort((a, b) => Number(b.first) - Number(a.first));

  return (
    <div className={`promo${top ? ' promo--top' : ''}`}>
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
  );
}
