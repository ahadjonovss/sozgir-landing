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
import AdBanner from './AdBanner';

export default function SideAds() {
  return (
    <div className="rails">
      <div className="rails__one rails__one--left">
        <AdBanner placement="game" />
      </div>
      <div className="rails__one rails__one--right">
        <AdBanner placement="guncha" />
      </div>
    </div>
  );
}
