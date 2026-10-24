/** Chetdagi ikkita banner — faqat jang paytida va faqat keng ekranda.
 *
 *  Jang ekrani tor: taxta, raqibning taxtachasi va klaviatura 980
 *  pikselga sig'adi, undan kengi esa ikki yonda bo'sh qoladi. Shu
 *  bo'shliq reklamaning joyi.
 *
 *  Qoidalar o'zgarmaydi:
 *
 *  * **Taxtaga tegmaydi.** Bannerlar varaq chetiga yopishtirilgan va
 *    o'rtadagi ustunga kirmaydi. Joy yetmasa (`1560px` dan tor ekran)
 *    umuman chizilmaydi — telefonda ham, planshetda ham yo'q.
 *  * **Ekran sakramaydi.** Ular `fixed`, ya'ni sahifa oqimidan
 *    tashqarida: paydo bo'lishi ham, yo'qolishi ham matnni surmaydi.
 *  * **Bosilishi mumkin bo'lgan narsa ustida turmaydi.** Markazdagi
 *    ustun ulardan baland `z-index` bilan ajratilmagan — ular unga
 *    yetmaydi.
 *
 *  **Keng ekranda reklama faqat shu yerda.** Ilgari chekka faqat jang
 *  paytida chizilardi, lobbida esa banner sahifaning o'rtasida,
 *  kontent ustunining ichida turardi — va o'sha paytda ikki yonda
 *  yuzlab piksel bo'sh qolardi. Endi teskari: joy yetadigan ekranda
 *  banner chetga chiqadi, o'rtadagisi esa yashiriladi (`play.css`,
 *  `1560px`).
 *
 *  Shu bilan ekrandagi banner soni ikkitadan oshmaydi — «kontentga
 *  nisbatan reklama ko'p» Yandex moderatsiyasida rad etish
 *  sabablaridan biri.
 *
 *  Tor ekranda — telefon, planshet, oddiy noutbuk — chekka umuman
 *  chizilmaydi va o'rtadagi banner o'z joyida qoladi. Trafikning
 *  ko'pi o'sha yerdan keladi, ya'ni asosiy banner o'zgarmadi. */
import { useEffect, useRef, useState } from 'react';
import AdBanner from './AdBanner';
import { useRoute } from '../lib/useRoute';

/** Yangi reklama shu vaqtdan tez so'ralmaydi.
 *
 *  Yandex qoidasi: bir ekranda turgan blok **30 soniyada bir
 *  martadan tez-tez** yangilanmasligi kerak. Saytda sahifa
 *  almashuvi tez bo'ladi — odam uch tabni besh soniyada aylanib
 *  chiqishi mumkin — ya'ni chegara kerak. */
const COOLDOWN = 30_000;

/** Birinchi banner sahifaning tepasidan shuncha pastda boshlanadi —
 *  `play.css` dagi `.rails__one { top }` bilan bir xil. */
const TOP = 100;

/** Ustunning oxiri sahifaning tagidan shuncha yuqorida tugaydi:
 *  pastdagi banner footer bilan yonma-yon turmasligi kerak. */
const FOOT = 520;

/** Bitta ustunda shuncha bannerdan ortiq chizilmaydi.
 *
 *  Chegara moderatsiya uchun: sahifa qancha uzun bo'lmasin,
 *  reklama soni kontentdan oshib ketmasligi kerak. */
const MAX = 4;

export default function SideAds() {
  const route = useRoute();

  /* Reklama **sahifa almashganda** yangilanadi.
   *
   *  Chetdagi ustun `App` darajasida chiziladi, ya'ni u marshrut
   *  bilan birga almashmaydi: bir marta so'ralgan reklama butun
   *  seans davomida turardi. Ilgari banner sahifaning ichida edi
   *  va har o'tishda o'zi qayta so'ralardi — chetga ko'chirishda
   *  o'sha xususiyat yo'qolgan edi.
   *
   *  Yandex vaqt uchun emas, **ko'rsatish** uchun to'laydi (CPM):
   *  ochiq turgan banner qancha tursa ham qo'shimcha bermaydi.
   *  Yangi sahifa esa haqiqiy yangi ko'rsatish.
   *
   *  Kalit almashsa React eski bannerni butunlay tashlab, yangisini
   *  chizadi — ya'ni yangi talab ketadi. Taymer qo'yilmadi: o'zi
   *  aylanadigan reklama tarmoq qoidasida alohida cheklangan va
   *  bu yerdagi maqsad ham u emas. */
  const [key, setKey] = useState(0);
  /** Oxirgi talab qachon ketgani.
   *
   *  `null` — hali hech narsa so'ralmagan. Vaqt render paytida
   *  emas, effekt ichida olinadi: `Date.now()` har chaqiruvda
   *  boshqa javob beradi va uni render ichiga qo'yish komponentni
   *  oldindan aytib bo'lmaydigan qiladi. */
  const last = useRef<number | null>(null);

  useEffect(() => {
    const now = Date.now();
    /* Birinchi o'rnashish faqat vaqtni belgilaydi: banner shu
       zahoti chizilyapti, uni darhol ikkinchi marta so'rash
       ortiqcha talab bo'lardi. */
    if (last.current === null) {
      last.current = now;
      return;
    }
    if (now - last.current < COOLDOWN) return;
    last.current = now;
    setKey((n) => n + 1);
  }, [route]);

  /* Nechta banner chiziladi — **sahifaning bo'yiga** qarab.
   *
   *  Ustun endi ekranga yopishtirilmagan, sahifa bilan birga
   *  suriladi: bitta banner tepada qolib, undan pastdagi butun
   *  bo'shliq — ba'zi sahifalarda bir necha ekran bo'yi — quruq
   *  qolardi. Shuning uchun ular pastga qarab taqsimlanadi.
   *
   *  Oraliq bitta ekran bo'yi: surilayotgan odamning ko'z oldida
   *  bir vaqtning o'zida bittadan ortiq banner turmaydi. */
  const [slots, setSlots] = useState(1);
  /** Ustunning joyi va bo'yi — **kontentning** o'ziga tenglashtiriladi.
   *
   *  Ilgari o'lchov `document.scrollHeight` dan olinardi va bu
   *  o'zini-o'zi quvadigan halqa yasardi: ustun `absolute`, ya'ni
   *  uning bo'yi ham sahifaning surilish bo'yiga qo'shiladi.
   *  Har o'lchov sahifani uzaytirardi, uzaygan sahifa esa keyingi
   *  o'lchovda yana balandroq ustun berardi. Natijada ekranda
   *  uzun bo'm-bo'sh joy paydo bo'lardi va reklama footerning
   *  ostiga tushib ketardi, vaholanki tepada joy bo'sh turardi.
   *
   *  `<main>` esa reklamani o'z ichiga olmaydi, ya'ni o'lchov
   *  barqaror: ustun qayerda boshlanib qayerda tugashini kontent
   *  hal qiladi. */
  const [box, setBox] = useState<{ top: number; height: number } | null>(null);

  useEffect(() => {
    const main = document.querySelector('main');
    if (!main) return;

    const measure = () => {
      const rect = main.getBoundingClientRect();
      const top = Math.round(rect.top + window.scrollY) + TOP;
      /* Pastda ham hoshiya: oxirgi banner footerga yonma-yon
         turmasligi kerak. */
      const height = Math.max(0, Math.round(rect.height) - TOP - FOOT);
      setBox({ top, height });
      /* Nechta banner sig'adi: oraliq bitta ekran bo'yi, ya'ni
         surilayotgan odamning ko'z oldida bir vaqtda bittadan
         ortiq reklama turmaydi. `MAX` dan oshmaydi — uzun
         sahifada reklama soni kontentdan oshib ketishi Yandex
         moderatsiyasida rad etish sabablaridan biri. */
      const fit = Math.floor(height / window.innerHeight);
      setSlots(Math.max(1, Math.min(MAX, fit)));
    };

    measure();
    window.addEventListener('resize', measure);
    /* Kontentning bo'yi keyin ham o'zgaradi: ro'yxatlar yuklanadi,
       jang boshlanadi, tab almashadi. Kuzatiladigani — faqat
       `<main>`: `body` ni kuzatish reklamaning o'z bo'yini ham
       hisobga olib, yuqoridagi halqani qaytarardi. */
    const watch = new ResizeObserver(measure);
    watch.observe(main);
    return () => {
      window.removeEventListener('resize', measure);
      watch.disconnect();
    };
  }, [route]);

  const list = Array.from({ length: slots }, (_, index) => index);

  return (
    <div className="rails">
      <div className="rails__one rails__one--left" style={box ? { top: box.top, height: box.height } : undefined}>
        {list.map((index) => (
          <AdBanner key={`l${key}-${index}`} placement="game" />
        ))}
      </div>
      <div className="rails__one rails__one--right" style={box ? { top: box.top, height: box.height } : undefined}>
        {list.map((index) => (
          <AdBanner key={`r${key}-${index}`} placement="guncha" />
        ))}
      </div>
    </div>
  );
}
