/** Banner reklama — saytdagi yagona reklama shakli.
 *
 *  Ishlatish: `<AdBanner placement="hub" />`. Kenglikni o'rab turgan
 *  konteynerdan oladi, balandligini kelgan reklamaga moslaydi.
 *
 *  Ilovadagi `BannerAdView` ning veb muqobili va bir xil qoidalar bilan
 *  ishlaydi:
 *
 *  * **Ekran sakramaydi.** Joy reklama kelishidan **oldin** band
 *    qilinadi: talab yuborilishi bilan ramka to'liq o'lchamida turadi,
 *    faqat ko'rinmaydi. Reklama kelganda faqat shaffoflik o'zgaradi.
 *  * **Tekshiruvlar oldin, joy keyin.** «Reklama shu odamga
 *    ko'rsatiladimi» degan savol komponent o'rnashishi bilan so'raladi,
 *    joy esa faqat javob «ha» bo'lganda band qilinadi. Shu sababli
 *    qo'llagan odam bo'sh joyning paydo bo'lib yo'qolishini ko'rmaydi.
 *  * **So'ralmagan joyda so'ralmaydi.** Talab banner ekranga
 *    yaqinlashgandagina ketadi (`IntersectionObserver`) va varaq fonda
 *    turgan bo'lsa kutiladi.
 *  * **To'ldirish bo'lmasa iz ham qolmaydi.** Reklama kelmasa komponent
 *    butunlay yo'qoladi — bo'sh ramka turib qolmaydi.
 *
 *  Yangilanish taymeri ataylab yo'q. Ilovada banner har 60 soniyada
 *  qayta so'raladi, saytda esa almashinishni blokning o'zi (Yandex
 *  interfeysidagi sozlama) hal qiladi: qo'lda qayta chizish ko'z oldida
 *  «o'chib-yonadigan» reklama yasaydi va bu eng bezovta qiladigan
 *  narsa. */
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../lib/auth';
import { isAdFree } from '../lib/donor';
import { isVerifiedAsync } from '../lib/verified';
import {
  adUnit,
  adsEnabled,
  adsSupported,
  nextAdLabel,
  requestAd,
  type AdPlacement,
} from '../lib/ads';

/** Ramka qayerda turibdi.
 *
 *  `inline` — o'z chekkasi bor ustun ichida (yon ustun, profil);
 *  `edge` — bo'limning o'zida, sahifa kengligida. */
type AdFit = 'inline' | 'edge';

/** Reklama kutiladigan eng uzoq vaqt.
 *
 *  Yandex to'ldirish topolmaganda har doim ham xabar bermaydi —
 *  shunchaki jim qoladi. Shusiz ajratilgan joy sahifa yopilguncha bo'sh
 *  turardi. */
const TIMEOUT = 8000;

/** Banner ekranga shuncha yaqinlashganda talab ketadi: reklama
 *  ko'rinadigan payt tayyor bo'ladi, sahifa ochilishida esa hech narsa
 *  yuklanmaydi. */
const ROOT_MARGIN = '400px';

/** Konteyner `id` si takrorlanmasin — manzil almashganda eskisi hali
 *  daraxtdan chiqib ulgurmagan bo'ladi.
 *
 *  Bitta blokni bir sahifada bir necha marta chizish yo'li aynan shu:
 *  `blockId` o'sha qoladi, `renderTo` esa har safar boshqa bo'ladi. */
let slotNumber = 0;

type Phase =
  /** Hali hech narsa so'ralmagan — joy ham band emas. */
  | 'idle'
  /** Talab ketdi: joy band, ramka ko'rinmaydi. */
  | 'asked'
  /** Reklama keldi. */
  | 'shown'
  /** Ko'rsatilmaydi yoki to'ldirish yo'q — komponent yo'qoladi. */
  | 'gone';

export default function AdBanner({
  placement,
  fit = 'inline',
}: {
  placement: AdPlacement;
  fit?: AdFit;
}) {
  const { account, ready } = useAuth();
  const unit = adUnit(placement);
  const [id] = useState(() => `yandex_rtb_${unit || 'demo'}-${++slotNumber}`);
  const [label] = useState(nextAdLabel);
  const [phase, setPhase] = useState<Phase>('idle');
  const slot = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  /** Talab bir marta ketadi. `phase` ni bog'liqliklarga qo'shib
   *  bo'lmaydi: effekt qayta ishga tushsa tozalovchi eski yopilmani
   *  o'ldiradi va Yandex'ning javobi hech kimga yetib bormaydi. */
  const asked = useRef(false);

  /** Blok sozlanganmi. Sozlanmagan bo'lsa komponent umuman chizilmaydi
   *  — sahifa reklama yo'qday ko'rinadi.
   *
   *  Dev serverda blok talab qilinmaydi: u yerda baribir haqiqiy reklama
   *  so'ralmaydi, ramka esa joylashuvni ko'rsatib turishi kerak. */
  const allowed = adsSupported ? unit !== '' : true;

  useEffect(() => {
    // Hisob aniqlanmaguncha kutiladi: reklamasiz rejim hisobga bog'liq.
    if (!allowed || !ready || asked.current) return;
    const node = slot.current;
    if (!node) return;

    let alive = true;
    let timer = 0;
    /** Banner ko'rinishga yaqinlashdimi. */
    let near = false;
    /** Tekshiruvlar javobi: `null` — hali ma'lum emas. */
    let cleared: boolean | null = null;

    const finish = (next: Phase) => {
      if (!alive) return;
      window.clearTimeout(timer);
      setPhase(next);
    };

    /** Ikkala shart ham bajarilgandagina talab ketadi: reklama shu
     *  odamga ko'rsatiladi **va** banner ko'rinishga yaqin. */
    const request = () => {
      if (!alive || asked.current || !near || cleared !== true) return;
      asked.current = true;

      // Dev serverda haqiqiy reklama so'ralmaydi: o'z reklamangni o'zing
      // yuklashing yoki bosishing hisobni bloklatadi. O'rnida o'sha
      // o'lchamdagi sinov ramkasi turadi.
      if (!adsSupported) return finish('shown');

      // Joy shu yerda band qilinadi — reklama kelishidan oldin.
      setPhase('asked');
      timer = window.setTimeout(() => finish('gone'), TIMEOUT);

      requestAd({
        blockId: unit,
        renderTo: id,
        // Yandex «chizdim» deydi, lekin balandligi nol bo'lishi mumkin.
        // Bunda ham joy bo'shatiladi: bo'sh ramka reklamadan yomonroq.
        onRender: () =>
          requestAnimationFrame(() =>
            finish((box.current?.offsetHeight ?? 0) > 0 ? 'shown' : 'gone'),
          ),
        onFailed: () => finish('gone'),
      });
    };

    /* Tekshiruvlar o'rnashish bilan boshlanadi, ko'rinishni kutmasdan:
       javob «yo'q» bo'lsa komponent hali surib kelinmasidan yo'qoladi va
       sahifada bo'sh joy paydo bo'lib qolmaydi. */
    void (async () => {
      // Qo'llagan odamga ham, tasdiqlangan hisobga ham talab **umuman**
      // yuborilmaydi. Ikkalasi ham hisobga bog'liq, shuning uchun javob
      // birga kutiladi: `Promise` ataylab — ro'yxat kelmasidan avval
      // so'ralgan banner belgi egasiga ko'rinib ketardi.
      const [adFree, verified] = await Promise.all([
        isAdFree(account?.uid),
        isVerifiedAsync(account?.uid),
      ]);
      if (adFree || verified) return finish('gone');
      if (!alive) return;
      // Adminkadagi kalit. O'chiq bo'lsa Yandex skripti ham yuklanmaydi:
      // shunda hech qanday so'rov ham, kuzatuv ham bo'lmaydi.
      const enabled = adsSupported ? await adsEnabled() : true;
      if (!alive) return;
      cleared = enabled;
      if (!enabled) return finish('gone');
      request();
    })();

    /** Varaq fonda bo'lsa kutiladi: ko'rinmagan reklama ko'rsatish
     *  bermaydi, faqat tarmoq statistikasini buzadi. */
    const wake = () => {
      if (document.hidden) return;
      document.removeEventListener('visibilitychange', wake);
      near = true;
      request();
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        if (document.hidden) {
          document.addEventListener('visibilitychange', wake);
          return;
        }
        near = true;
        request();
      },
      { rootMargin: ROOT_MARGIN },
    );
    observer.observe(node);

    return () => {
      alive = false;
      window.clearTimeout(timer);
      observer.disconnect();
      document.removeEventListener('visibilitychange', wake);
    };
  }, [allowed, ready, account?.uid, unit, id]);

  if (!allowed || phase === 'gone') return null;

  return (
    <div
      className={`ad ad--${fit}${phase === 'idle' ? '' : ' ad--live'}${
        phase === 'shown' ? ' ad--on' : ''
      }`}
      ref={slot}
    >
      <div className="ad__frame">
        {/* Yorliq bezak emas, talab: tarmoq reklamani sayt kontentidan
            aniq ajratishni so'raydi. */}
        <span className="ad__label">{label}</span>
        {/* `data-script="off"` — alifbo ko'chiruvchisi reklama matniga
            tegmasligi kerak: u begona kontent va uni o'zgartirish tarmoq
            qoidasini buzadi. */}
        <div className="ad__slot" id={id} ref={box} data-script="off">
          {!adsSupported && <span className="ad__demo">Reklama shu yerda turadi</span>}
        </div>
      </div>
    </div>
  );
}
