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
 *  Jang tugab lobbiga qaytilganda ikkalasi ham yo'qoladi: lobbining o'z
 *  banneri bor va uchtasi bir ekranda ortiqcha bo'lardi. */
import AdBanner from './AdBanner';
import { useStage } from '../lib/stage';

export default function SideAds() {
  const live = useStage();
  if (!live) return null;

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
