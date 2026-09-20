/** Telefonda ochilganda chiqadigan ilova taklifi.
 *
 *  Saytga kelgan odamning ko'pchiligi telefondan keladi va ular uchun
 *  ilova saytdan yaxshiroq: internetsiz ishlaydi, eslatma yuboradi va
 *  tezroq ochiladi. Kompyuterda esa taklifning ma'nosi yo'q — u yerda
 *  sayt o'zi to'liq o'yin, shuning uchun oyna umuman chizilmaydi.
 *
 *  Uchta qoida bilan:
 *
 *  1. **Sahifa avval ochiladi.** Oyna bir necha soniyadan keyin
 *     chiqadi: birinchi ekranda o'yin turishi kerak, aks holda odam
 *     nimani rad etayotganini ham bilmaydi.
 *  2. **Kuniga bir marta.** Yopilgan oyna o'sha kuni qaytib chiqmaydi
 *     (`sozgir.app.promo`) — har sahifada qayta chiqsa, u reklama
 *     emas, to'siq bo'lib qolardi.
 *  3. **Yopish oson.** ✕, «Saytda davom etish», fon bosilishi va
 *     Escape — hammasi yopadi. Orqaga tugmasi ham ishlaydi, chunki
 *     oyna manzilni o'zgartirmaydi.
 *
 *  Do'kon qurilmaga qarab tanlanadi: iPhone'da App Store, qolganida
 *  Google Play birinchi turadi (`DownloadPromo` dagi bilan bir xil
 *  qoida). */
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { links } from '../data/site';
import { AppleIcon, PlayIcon } from './StoreIcons';
import { Close } from './Icons';

const KEY = 'sozgir.app.promo';

/** Oyna shuncha kutib turadi — sahifa ochilib, birinchi ekran
 *  ko'ringandan keyin. */
const DELAY_MS = 4000;

function isIos(): boolean {
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

/** Qurilma telefon yoki planshetmi.
 *
 *  Ikkita shart birga: sensorli ekran **va** tor oyna. Yolg'iz sensor
 *  yetmaydi (sensorli monitorli kompyuterlar bor), yolg'iz kenglik ham
 *  yetmaydi (kompyuterda oynani toraytirib qo'ygan odam telefonda
 *  emas). */
function isPhone(): boolean {
  if (typeof window === 'undefined') return false;
  const touch = navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
  const narrow = window.matchMedia('(max-width: 900px)').matches;
  const mobileUa = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  return touch && narrow && mobileUa;
}

/** Bugun ko'rsatilganmi. */
function shownToday(): boolean {
  try {
    return localStorage.getItem(KEY) === new Date().toDateString();
  } catch {
    return false;
  }
}

function remember(): void {
  try {
    localStorage.setItem(KEY, new Date().toDateString());
  } catch {
    // Kesh yo'q — oyna keyingi sahifada yana chiqadi, zarari yo'q.
  }
}

export default function AppPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isPhone() || shownToday()) return;
    const timer = window.setTimeout(() => setOpen(true), DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!open) return;
    remember();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;

  const ios = isIos();
  const stores = [
    { href: links.appStore, label: 'App Store', icon: <AppleIcon size={18} />, first: ios },
    { href: links.playStore, label: 'Google Play', icon: <PlayIcon size={18} />, first: !ios },
  ].sort((a, b) => Number(b.first) - Number(a.first));

  return createPortal(
    <div
      className="app-promo"
      role="dialog"
      aria-modal="true"
      aria-label="So‘zgir ilovasi"
    >
      <button
        className="app-promo__veil"
        onClick={() => setOpen(false)}
        aria-label="Yopish"
      />
      <div className="app-promo__card">
        <button
          className="icon-btn app-promo__close"
          onClick={() => setOpen(false)}
          aria-label="Yopish"
        >
          <Close size={18} />
        </button>

        <img
          className="app-promo__icon"
          src="/icon.png"
          alt=""
          width={64}
          height={64}
          decoding="async"
        />
        <strong className="app-promo__title">So‘zgir ilovasi</strong>
        <p className="app-promo__text">
          Telefonda o‘ynayapsizmi? Ilovada qulayroq: internetsiz ham ishlaydi,
          kunlik so‘z esdan chiqmasligi uchun eslatma keladi va Yangso‘z,
          kategoriyalar, g‘uncha — hammasi bir joyda.
        </p>

        <div className="app-promo__stores">
          {stores.map((store) => (
            <a
              key={store.label}
              className={`btn${store.first ? '' : ' btn--ghost'} app-promo__store`}
              href={store.href}
              target="_blank"
              rel="noreferrer"
              onClick={() => setOpen(false)}
            >
              {store.icon}
              {store.label}
            </a>
          ))}
        </div>

        <button className="link app-promo__stay" onClick={() => setOpen(false)}>
          Saytda davom etish
        </button>
      </div>
    </div>,
    document.body,
  );
}
