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
  /** Ustunning bo'yi — sahifanikiga teng (pastda bir oz hoshiya).
   *  Bannerlar shu bo'y bo'ylab teng taqsimlanadi, ya'ni oxirgisi
   *  sahifaning oxirida turadi, hammasi tepada to'planib qolmaydi. */
  const [tall, setTall] = useState(0);

  useEffect(() => {
    const measure = () => {
      const page = document.documentElement.scrollHeight;
      const step = window.innerHeight;
      setTall(Math.max(0, page - TOP - FOOT));
      /* `TOP` — birinchi bannergacha bo'lgan masofa (`play.css`).
         Qolgan bo'yga nechta oraliq sig'sa — shuncha banner, lekin
         `MAX` dan oshmaydi: uzun sahifada reklama soni kontentdan
         oshib ketishi Yandex moderatsiyasida rad etish sabablaridan
         biri. */
      const fit = Math.floor((page - TOP) / step);
      setSlots(Math.max(1, Math.min(MAX, fit)));
    };
    measure();
    window.addEventListener('resize', measure);
    /* Sahifaning bo'yi keyin ham o'zgaradi: ro'yxatlar yuklanadi,
       jang boshlanadi, tab almashadi. */
    const watch = new ResizeObserver(measure);
    watch.observe(document.body);
    return () => {
      window.removeEventListener('resize', measure);
      watch.disconnect();
    };
  }, [route]);

  const list = Array.from({ length: slots }, (_, index) => index);

  return (
    <div className="rails">
      <div className="rails__one rails__one--left" style={{ height: tall || undefined }}>
        {list.map((index) => (
          <AdBanner key={`l${key}-${index}`} placement="game" />
        ))}
      </div>
      <div className="rails__one rails__one--right" style={{ height: tall || undefined }}>
        {list.map((index) => (
          <AdBanner key={`r${key}-${index}`} placement="guncha" />
        ))}
      </div>
    </div>
  );
}
