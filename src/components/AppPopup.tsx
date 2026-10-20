/** Telefonda chiqadigan ilova taklifi.
 *
 *  Saytga kelgan odamning ko'pchiligi telefondan keladi va ular uchun
 *  ilova saytdan yaxshiroq: internetsiz ishlaydi, eslatma yuboradi va
 *  tezroq ochiladi. Kompyuterda esa taklifning ma'nosi yo'q — u yerda
 *  sayt o'zi to'liq o'yin, shuning uchun oyna umuman chizilmaydi.
 *
 *  **Ikki payt.** Birinchisi — sahifa ochilgandan bir necha soniya
 *  keyin, kuniga bir marta. Ikkinchisi — **har o'yin tugagach**: aynan
 *  o'shanda taklif eng o'rinli, chunki odam o'ynab bo'ldi va hozir
 *  bo'sh. Matn ham ikki xil: ochilishda «bu nima», natijadan keyin
 *  «natijangiz saqlansinmi».
 *
 *  Qachon chiqishini `lib/appPromo.ts` hal qiladi: har sabab kuniga bir
 *  marta, ustiga oyna yopilgandan keyin uch daqiqa jimlik — «yo'q»
 *  degan odamdan darrov qayta so'ralmaydi.
 *
 *  **Do'kon faqat bosilganda ochiladi.** Ilgari oyna ochilgach besh
 *  soniyalik sanoq ketardi va u tugagach do'kon o'zi ochilardi. Buning
 *  ikkita zarari bor edi. Birinchisi odamga: varaqlab turgan odam
 *  saytdan sababsiz olib ketilardi — sanoqni to'xtatish mumkin
 *  bo'lsa ham, buni payqab ulgurish kerak edi. Ikkinchisi saytga:
 *  foydalanuvchi bosmasdan boshqa manzilga o'tkazish reklama
 *  tarmoqlari qoidasida to'g'ridan-to'g'ri taqiqlangan va sayt
 *  «do'konga haydaydigan oraliq sahifa» bo'lib ko'rinadi.
 *
 *  Endi oyna shunchaki turadi va kutadi. Qurilmaning do'koni aniq,
 *  shuning uchun tanlov emas, bitta tugma taklif qilinadi.
 *
 *  Yopish oson: ✕, fon, Escape va «Yopish». Orqaga tugmasi ham
 *  ishlaydi — oyna manzilni o'zgartirmaydi.
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

/** Ochilishdagi taklif shuncha kutadi — sahifa ochilib, birinchi ekran
 *  ko'ringandan keyin. */
const OPEN_DELAY_MS = 4000;

/** Sahifa ochilishidagi taklif yoqilganmi.
 *
 *  Hozir **o'chiq**, va bu vaqtinchalik emas, aniq sababdan.
 *  Reklama tarmog'ining moderatsiyasida rad etish sabablari ro'yxatida
 *  «kontentni to'sadigan qalqib chiquvchi oyna» alohida satr bo'lib
 *  turadi. Telefonda ochilgan har sahifada to'rt soniyadan keyin
 *  chiqadigan va ekranning yarmini egallaydigan oyna aynan shu
 *  ta'rifga tushadi — hatto yopish oson bo'lsa ham, hatto kuniga bir
 *  marta bo'lsa ham: moderator saytni telefonda ochadi va birinchi
 *  ko'rgan narsasi o'sha oyna bo'ladi.
 *
 *  Natijadan keyingi taklif (`result`) o'z joyida qoladi: u o'yin
 *  tugagach, odam bo'sh paytda chiqadi va «natijangiz saqlansinmi»
 *  degan savol o'sha paytda o'rinli. Moderator esa o'yinni oxirigacha
 *  o'ynab chiqmaydi.
 *
 *  Sayt РСЯ dan o'tgach buni qaytarish mumkin — lekin qaytarishdan
 *  oldin o'ylab ko'rish kerak: taklifning foydasi o'sha ro'yxatdagi
 *  satrga arziydimi.
 *
 *  Tarix: `fb1a0c2` dan oldin bu oynada besh soniyalik sanoq bor edi
 *  va u tugagach do'kon **o'zi** ochilardi. U ham xuddi shu
 *  ro'yxatdagi sabab edi va o'shanda olib tashlangan. */
const OPEN_PROMO = false;

/** Natijadan keyingi taklif ham kutadi: avval odam o'z natijasini
 *  ko'rsin, taxta quvonib bo'lsin — keyin taklif. */
const RESULT_DELAY_MS = 1600;

/** So'zTop havolasidan kelgan odam uchun sanoq — shuncha soniya.
 *
 *  Faqat shu bitta yo'lda (`soztop`): odam havola bilan kelgan,
 *  o'ynab bo'ldi va saytda qiladigan boshqa ishi yo'q — davomi
 *  ilovada (so'zni o'zi yashirishi ham faqat u yerda). Qolgan
 *  o'yinlarda oyna avvalgidek kutib turadi va do'kon faqat
 *  bosilganda ochiladi — yuqoridagi sabab o'sha joyda kuchida.
 *
 *  Sanoq to'xtatsa bo'ladi: ✕, fon, Escape va «Yopish» — to'rttasi
 *  ham oynani yopadi, yopilishi bilan vaqtlagich ham o'chadi. */
const STORE_COUNTDOWN = 5;

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
  soztop: {
    title: 'Endi o‘zingiz yashiring',
    text:
      'So‘z yashirish ilovada: so‘zni lug‘atdan tanlaysiz, havolani do‘stlaringizga tashlaysiz va kim necha urinishda topganini ko‘rib turasiz.',
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
  const ios = isIos();

  /** Yopildi — jim turish muddati shundan boshlanadi. */
  const close = useCallback(() => {
    markPromoClosed();
    setReason(null);
  }, []);

  // Sahifa ochilishi — birinchi payt. [OPEN_PROMO] o'chiq bo'lsa yo'q.
  useEffect(() => {
    if (!OPEN_PROMO) return;
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
        setReason((current) => current ?? next);
      }, delay);
    });
    return () => {
      window.clearTimeout(timer);
      stop();
    };
  }, []);

  /** Sanoqda qolgan soniyalar. `null` — sanoq hali boshlanmagan yoki
   *  tugagan; ko'rsatiladigani `STORE_COUNTDOWN` dan boshlanadi. */
  const [left, setLeft] = useState<number | null>(null);
  const storeUrl = ios ? links.appStore : links.playStore;

  /** Sanoq va do'kon — faqat So'zTop havolasidan kelgan odamga.
   *
   *  Qolgan vaqt soatdan hisoblanadi, sanab emas: fon varag'ida
   *  brauzer vaqtlagichni sekinlashtiradi va sanoq haqiqiy besh
   *  soniyadan uzoqroq cho'zilardi. */
  useEffect(() => {
    if (reason !== 'soztop') return;

    const end = Date.now() + STORE_COUNTDOWN * 1000;
    const timer = window.setInterval(() => {
      const rest = Math.ceil((end - Date.now()) / 1000);
      if (rest > 0) {
        setLeft(rest);
        return;
      }
      window.clearInterval(timer);
      setLeft(0);
      /* Do'kon shu oynada ochiladi, yangi varaqda emas: odam ilovaga
         ketyapti va orqada bo'sh varaq qolishi kerak emas. Orqaga
         tugmasi uni saytga qaytaradi. */
      window.location.href = storeUrl;
    }, 250);

    return () => {
      window.clearInterval(timer);
      setLeft(null);
    };
  }, [reason, storeUrl]);

  useEffect(() => {
    if (!reason) return;
    markPromoShown(reason);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [close, reason]);

  if (!reason) return null;

  const copy = COPY[reason];
  /* Qurilmaning do'koni aniq, ya'ni tanlov taklif qilinmaydi: iPhone'da
     App Store, qolganida Google Play. Ikkita tugma odamdan keraksiz
     qaror talab qilardi. */
  const store = ios
    ? { href: storeUrl, label: 'App Store', icon: <AppleIcon size={22} /> }
    : { href: storeUrl, label: 'Google Play', icon: <PlayIcon size={22} /> };
  const counting = reason === 'soztop';

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
        </a>

        {/* Sanoq ochiq aytiladi: do'kon o'zi ochilishi odam uchun
            kutilmagan bo'lmasin va to'xtatish yo'li ko'rinib tursin. */}
        {counting && (
          <p className="app-promo__count" role="status">
            {store.label} <strong>{left ?? STORE_COUNTDOWN}</strong> soniyadan
            so‘ng ochiladi
          </p>
        )}

        <button className="link app-promo__stay" onClick={close}>
          {counting ? 'Bekor qilish' : 'Yopish'}
        </button>
      </div>
    </div>,
    document.body,
  );
}
