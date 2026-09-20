/** Telefonda chiqadigan ilova taklifi.
 *
 *  Saytga kelgan odamning ko'pchiligi telefondan keladi va ular uchun
 *  ilova saytdan yaxshiroq: internetsiz ishlaydi, eslatma yuboradi va
 *  tezroq ochiladi. Kompyuterda esa taklifning ma'nosi yo'q — u yerda
 *  sayt o'zi to'liq o'yin, shuning uchun oyna umuman chizilmaydi.
 *
 *  **Ikki payt.** Birinchisi — sahifa ochilgandan bir necha soniya
 *  keyin. Ikkinchisi — **birinchi o'yin tugagach**: aynan o'shanda
 *  taklif eng o'rinli, chunki odam o'yinni sinab ko'rdi va yoqqan-
 *  yoqmaganini allaqachon biladi. Matn ham ikki xil: ochilishda
 *  «bu nima», natijadan keyin «natijangiz saqlansinmi».
 *
 *  Qachon chiqishini `lib/appPromo.ts` hal qiladi: har sabab kuniga bir
 *  marta, ustiga oyna yopilgandan keyin uch daqiqa jimlik — «yo'q»
 *  degan odamdan darrov qayta so'ralmaydi.
 *
 *  **Sanoq.** Qurilmaning do'koni aniq, shuning uchun tanlov emas,
 *  bitta tugma taklif qilinadi va besh soniyadan keyin do'kon o'zi
 *  ochiladi. Sanoq ko'rinib turadi va uni to'xtatsa bo'ladi
 *  («Saytda davom etish»): aks holda odam saytdan sababsiz olib
 *  ketilgandek his qilardi. Oynaning yopilishi ham sanoqni
 *  to'xtatadi — yopilgan oynadan keyin do'kon ochilishi eng yomon
 *  natija bo'lardi.
 *
 *  Yopish oson: ✕, fon, Escape va «Saytda davom etish». Orqaga tugmasi
 *  ham ishlaydi — oyna manzilni o'zgartirmaydi.
 *
 *  Do'kon qurilmaga qarab tanlanadi: iPhone'da App Store, qolganida
 *  Google Play birinchi turadi (`DownloadPromo` dagi bilan bir xil
 *  qoida). */
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { links } from '../data/site';
import {
  askAppPromo,
  canShowPromo,
  markPromoClosed,
  markPromoShown,
  onAppPromo,
  type PromoReason,
} from '../lib/appPromo';
import { AppleIcon, PlayIcon } from './StoreIcons';
import { Bulb, Chart, Close, Trophy } from './Icons';

/** Oyna ochilgach do'kon shuncha soniyadan keyin o'zi ochiladi. */
const COUNTDOWN = 5;

/** Ochilishdagi taklif shuncha kutadi — sahifa ochilib, birinchi ekran
 *  ko'ringandan keyin. */
const OPEN_DELAY_MS = 4000;

/** Natijadan keyingi taklif ham kutadi: avval odam o'z natijasini
 *  ko'rsin, taxta quvonib bo'lsin — keyin taklif. */
const RESULT_DELAY_MS = 1600;

/** Har sabab uchun o'z matni. Ochilishda odam hali hech narsa
 *  ko'rmagan, natijadan keyin esa o'ynab bo'lgan — ikkalasiga bir xil
 *  gap aytish ikkinchisini bekorga sarflash bo'lardi. */
const COPY: Record<PromoReason, { title: string; text: string }> = {
  open: {
    title: 'Mantiq. Bilim. G‘alaba.',
    text:
      'Telefonda o‘ynayapsizmi? Ilovada qulayroq: internetsiz ham ishlaydi va kunlik so‘z esdan chiqmasligi uchun eslatma keladi.',
  },
  result: {
    title: 'O‘yin yoqdimi?',
    text:
      'Ilovada natijangiz saqlanadi, kunlik so‘z uchun eslatma keladi va o‘yin internetsiz ham ishlaydi.',
  },
};

function isIos(): boolean {
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

/** Qurilma telefon yoki planshetmi.
 *
 *  Uchta shart birga: sensorli ekran, tor oyna va mobil `userAgent`.
 *  Yolg'iz sensor yetmaydi (sensorli monitorli kompyuterlar bor),
 *  yolg'iz kenglik ham yetmaydi (kompyuterda oynani toraytirib qo'ygan
 *  odam telefonda emas). */
function isPhone(): boolean {
  if (typeof window === 'undefined') return false;
  const touch = navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
  const narrow = window.matchMedia('(max-width: 900px)').matches;
  const mobileUa = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  return touch && narrow && mobileUa;
}

export default function AppPopup() {
  const [reason, setReason] = useState<PromoReason | null>(null);
  /** Do'kon o'zi ochilishiga qolgan soniya. */
  const [left, setLeft] = useState(COUNTDOWN);
  /** Sanoq ketyaptimi. «Saytda davom etish» uni to'xtatadi, oynaning
   *  o'zi esa ochiq qolishi mumkin — odam keyin o'zi bosadi. */
  const [counting, setCounting] = useState(true);
  const ios = isIos();

  /** Yopildi — jim turish muddati shundan boshlanadi. */
  const close = useCallback(() => {
    markPromoClosed();
    setCounting(false);
    setReason(null);
  }, []);

  // Sahifa ochilishi — birinchi payt.
  useEffect(() => {
    const timer = window.setTimeout(() => askAppPromo('open'), OPEN_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  // Chaqiruvlar: ochilish ham, o'yin natijasi ham shu yerga keladi.
  useEffect(() => {
    let timer = 0;
    const stop = onAppPromo((next) => {
      if (!isPhone() || !canShowPromo(next)) return;
      // Natijadan keyin biroz kutiladi: avval odam o'z natijasini
      // ko'rsin va taxta quvonib bo'lsin. Ochilishdagi taklif esa
      // allaqachon kutib kelgan.
      const delay = next === 'result' ? RESULT_DELAY_MS : 0;
      timer = window.setTimeout(() => {
        // Sanoq har ochilishda boshidan: bir marta to'xtatilgan bo'lsa
        // ham, keyingi safar u yana ishlaydi.
        setLeft(COUNTDOWN);
        setCounting(true);
        setReason((current) => current ?? next);
      }, delay);
    });
    return () => {
      window.clearTimeout(timer);
      stop();
    };
  }, []);

  useEffect(() => {
    if (!reason) return;
    markPromoShown(reason);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [close, reason]);

  /** Sanoq: oyna ochilgach do'kon o'zi ochiladi.
   *
   *  Sanoq **ko'rinib turadi** va uni to'xtatsa bo'ladi — bu shart, aks
   *  holda odam saytdan sababsiz olib ketilgandek his qilardi. Oyna
   *  yopilishi (✕, fon, Escape, «Saytda davom etish») sanoqni ham
   *  to'xtatadi: yopilgan oynadan keyin do'kon ochilishi eng yomon
   *  natija bo'lardi. */
  useEffect(() => {
    if (!reason || !counting) return;
    if (left <= 0) {
      // O'sha oynaning o'zida: `window.open` brauzerda bloklanadi,
      // manzilni almashtirish esa telefonda do'kon ilovasini ochadi.
      window.location.href = ios ? links.appStore : links.playStore;
      return;
    }
    const timer = window.setTimeout(() => setLeft((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [counting, ios, left, reason]);

  if (!reason) return null;

  const copy = COPY[reason];
  /* Qurilmaning do'koni aniq, ya'ni tanlov taklif qilinmaydi: iPhone'da
     App Store, qolganida Google Play. Ikkita tugma odamdan keraksiz
     qaror talab qilardi. */
  const store = ios
    ? { href: links.appStore, label: 'App Store', icon: <AppleIcon size={22} /> }
    : { href: links.playStore, label: 'Google Play', icon: <PlayIcon size={22} /> };

  return createPortal(
    <div
      className="app-promo"
      role="dialog"
      aria-modal="true"
      aria-label="So‘zgir ilovasi"
    >
      <button className="app-promo__veil" onClick={close} aria-label="Yopish" />
      <div className="app-promo__card">
        <button className="icon-btn app-promo__close" onClick={close} aria-label="Yopish">
          <Close size={18} />
        </button>

        {/* Brend qatori — afishadagi kabi: nishon, nom va bir qatorlik
            shior. Nishon `public/icon.png`, ya'ni do'kondagi bilan
            bir xil rasm. */}
        <div className="app-promo__brand">
          <img
            className="app-promo__icon"
            src="/icon.png"
            alt=""
            width={56}
            height={56}
            decoding="async"
          />
          <span className="app-promo__name">
            <strong>So‘zgir</strong>
            <span>So‘zlar olamida sinovdan o‘t!</span>
          </span>
        </div>

        <strong className="app-promo__title">{copy.title}</strong>
        <p className="app-promo__text">{copy.text}</p>

        {/* Uchta afzallik — afishadagi uchtasi. Har biri bitta jumla:
            ro'yxat uzaygani sari o'qilmay qoladi. */}
        <ul className="app-promo__perks">
          <li>
            <span className="app-promo__perk-icon app-promo__perk-icon--green">
              <Bulb size={18} />
            </span>
            Bilimingizni sinang
          </li>
          <li>
            <span className="app-promo__perk-icon app-promo__perk-icon--yellow">
              <Chart size={18} />
            </span>
            Reytingda yuksalang
          </li>
          <li>
            <span className="app-promo__perk-icon app-promo__perk-icon--blue">
              <Trophy size={18} />
            </span>
            Maxsus nishonlarni qo‘lga kiriting
          </li>
        </ul>

        <a className="app-promo__store" href={store.href} onClick={close}>
          {store.icon}
          <span>
            Yuklab olish
            <small>{store.label}</small>
          </span>
          {counting && <span className="app-promo__count">{left}</span>}
        </a>

        {counting ? (
          <p className="app-promo__timer" role="status">
            <span className="app-promo__bar" aria-hidden="true">
              <i style={{ animationDuration: `${COUNTDOWN}s` }} />
            </span>
            {left} soniyadan keyin {store.label} o‘zi ochiladi
          </p>
        ) : (
          <p className="app-promo__timer app-promo__timer--off">
            Do‘kon o‘zi ochilmaydi — tayyor bo‘lsangiz tugmani bosing.
          </p>
        )}

        <button
          className="link app-promo__stay"
          onClick={() => (counting ? setCounting(false) : close())}
        >
          {counting ? 'Saytda davom etish' : 'Yopish'}
        </button>
      </div>
    </div>,
    document.body,
  );
}
