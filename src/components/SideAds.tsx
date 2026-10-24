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
  /** Oxirgi talab qachon ketgani. Boshlang'ich qiymati —
   *  o'rnashish payti: birinchi effekt ham sanoqqa tushadi, aks
   *  holda banner o'rnashgan zahoti ikkinchi marta so'ralardi. */
  const last = useRef(Date.now());

  useEffect(() => {
    const now = Date.now();
    if (now - last.current < COOLDOWN) return;
    last.current = now;
    setKey((n) => n + 1);
  }, [route]);

  return (
    <div className="rails">
      <div className="rails__one rails__one--left">
        <AdBanner key={`l${key}`} placement="game" />
      </div>
      <div className="rails__one rails__one--right">
        <AdBanner key={`r${key}`} placement="guncha" />
      </div>
    </div>
  );
}
