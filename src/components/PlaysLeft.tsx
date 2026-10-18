/** Kunlik chegara — qancha o'yin qolgani.
 *
 *  Chegara faqat odam bilan o'ynaladigan o'yinlarga tegadi (So'zjang,
 *  g'uncha jangi, mardu, turnir); yakka o'yinlar bepul. Shu sabab
 *  qator o'yin kartochkalarining **tepasida** turadi: u hammasiga
 *  emas, pastdagi bellashuvlarga tegishli va buni matn aytadi.
 *
 *  Kirmagan odamda ko'rinmaydi: sanoq serverda yuritiladi va unga
 *  hisob kerak. Mehmonga avvalgi chegara qo'llanadi (`progress.ts`).
 *
 *  Premiumda ham ko'rinmaydi — chegarasi yo'q odamga chegara haqida
 *  gapirishning ma'nosi yo'q. */
import { usePlays } from '../lib/plays';

export default function PlaysLeft() {
  const plays = usePlays();
  if (plays === null || plays.premium || plays.left === null) return null;

  if (plays.left > 0) {
    return (
      <p className="plays" role="status">
        Bugun yana <strong>{plays.left}</strong> ta bellashuv o‘ynay olasiz.
      </p>
    );
  }

  return (
    <div className="gate" role="status">
      <span className="gate__icon" aria-hidden="true">🔒</span>
      <h3>Bugunga yetdi</h3>
      <p>
        Kuniga {plays.limit} ta bellashuv bepul — bugungisi tugadi. Yakka
        o‘yinlar ochiq qolaveradi: bugungi so‘z, g‘uncha va do‘stingiz
        yashirgan so‘z.
      </p>
      <div className="result__actions">
        <a className="btn btn--sm" href="/qollab">
          Premium olish
        </a>
      </div>
    </div>
  );
}
