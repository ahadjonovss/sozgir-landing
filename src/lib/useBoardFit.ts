/** Taxtaga qolgan joy — **o'lchab**, taxmin qilib emas.
 *
 *  Ilgari bu CSS da yozilgan edi: `100svh` dan sarlavha, kunlik so'z
 *  qatori, klaviatura va hoshiyalar ayirilardi. Har bir son qo'lda
 *  o'lchab qo'yilgandi va shuning uchun **bitta** ekranda to'g'ri
 *  chiqardi: boshqa balandlikda, kirgan-kirmagan odamda, boshqa
 *  sahifada o'sha sonlar yolg'on bo'lib qolar — taxta yo ekrandan
 *  chiqib ketar, yo o'rtada kichkina bo'lib qolib, atrofida bo'sh
 *  joy turardi.
 *
 *  Endi o'lchov bitta va u haqiqiy: `flex: 1` bilan cho'ziladigan
 *  o'ramning **o'z balandligi**. Brauzer qolgan hamma narsani
 *  (sarlavha, qator, klaviatura, hoshiya) o'zi hisoblab bo'lgach
 *  nima qolganini aytadi — hech narsa taxmin qilinmaydi.
 *
 *  Halqa yo'q: o'ram `flex: 1` bo'lgani uchun uning balandligi
 *  ichidagi taxtaga bog'liq emas, aksincha. */
import { useLayoutEffect, useRef } from 'react';

export function useBoardFit<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  /* `useLayoutEffect`: o'lchov chizilishdan **oldin** qo'yiladi,
     aks holda birinchi kadrda zaxira o'lcham ko'rinib, taxta
     ko'z oldida sakrab kattalashardi. */
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    /* Oxirgi yozilgan qiymat — **halqadan qutqaradi**.
       `--fit` yozilishi taxtani qayta o'lchaydi, o'lchov esa shu
       kuzatuvchini yana uyg'otadi. Qiymat o'zgarmagan bo'lsa
       yozilmaydi va zanjir shu yerda uziladi; brauzer aks holda
       «ResizeObserver loop» deb ogohlantirardi. */
    let last = 0;

    const sync = () => {
      const height = Math.round(el.getBoundingClientRect().height);
      // Nol — hali chizilmagan yoki yashirilgan: o'shanda CSS dagi
      // zaxira qoladi, aks holda taxta bir lahzaga g'oyib bo'lardi.
      if (height <= 0 || height === last) return;
      last = height;
      el.style.setProperty('--fit', `${height}px`);
    };

    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}

/** Ekranning qolganini to'ldiradigan o'ram.
 *
 *  Balandlik **o'lchanadi**: oynaning bo'yidan o'ramning o'z usti
 *  ayiriladi. Sarlavhaning balandligi, ustidagi bannerning bor-yo'qligi,
 *  bo'lim hoshiyasi — hech biri bu yerda yozilmaydi, hammasi o'sha
 *  bitta sondan chiqadi. CSS da bu mumkin emas edi: `100svh` dan
 *  ayiriladigan sonlar qo'lda o'lchab qo'yilgandi va bitta ekranda
 *  to'g'ri, qolganida yolg'on bo'lardi.
 *
 *  `min` — juda past oyna uchun: u yerda sig'dirishdan voz kechib
 *  surishga ruxsat beriladi, aks holda kataklar nuqtaga aylanardi. */
export function useScreenFill<T extends HTMLElement>(min = 720, active = true) {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    /* O'chirilgan paytda balandlik **tozalanadi**: bitta o'ram ham
       o'yin ekranini, ham lobbini ushlab turishi mumkin va lobbi
       ekranga cho'zilib turishi kerak emas. */
    if (!active) {
      el.style.height = '';
      return;
    }

    /* Yuqoridagi bilan bir xil qo'riq: balandlik yozilishi ota
       elementni qayta o'lchaydi, u esa shu kuzatuvchini uyg'otadi.
       O'zgarmagan qiymat yozilmasa, zanjir uziladi. */
    let last = 0;

    const sync = () => {
      const top = el.getBoundingClientRect().top + window.scrollY;
      const left = window.innerHeight - top - 16;
      /* Chegara faqat kompyuterda: u past oyna uchun — u yerda
         sig'dirishdan voz kechib surishga ruxsat beriladi, aks
         holda kataklar nuqtaga aylanardi. Telefonda esa aksincha,
         sig'ish muhim: ekran baribir baland va chegara faqat
         sahifani keraksiz suriladigan qilib qo'yardi. */
      const floor = window.innerWidth > 900 ? min : 0;
      const height = Math.round(Math.max(floor, left));
      if (height === last) return;
      last = height;
      el.style.height = `${height}px`;
    };

    sync();
    window.addEventListener('resize', sync);
    /* Ustidagi narsa o'zgarsa (masalan kunlik so'z qatori kelsa)
       o'ram ham qayta o'lchanadi. Kuzatuv **ota elementda**, lekin
       o'lchov o'ramning o'z ustidan olinadi: shu sabab yuqoridagi
       qo'riq shart. */
    const observer = new ResizeObserver(sync);
    if (el.parentElement) observer.observe(el.parentElement);
    return () => {
      window.removeEventListener('resize', sync);
      observer.disconnect();
    };
  }, [min, active]);

  return ref;
}
