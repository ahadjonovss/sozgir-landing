/** Reklama — saytdagi bannerlar. Ilovadagi `lib/core/ads/` ning veb
 *  muqobili va o'sha qoidalar bilan ishlaydi.
 *
 *  **Ikki tur.** Asosiysi — banner: u sahifaning bir bo'lagi bo'lib
 *  turadi va ishni to'xtatmaydi. Ikkinchisi — to'liq ekranli oyna, va
 *  u **faqat bitta nuqtada** chiqadi: onlayn o'yin boshlanishidan
 *  oldin, har beshinchisida (`lib/adGate.ts`). Ilovadagi qoidaning
 *  o'zi, o'sha sonlar bilan.
 *
 *  Ilgari bu yerda «to'liq ekranli hech narsa yo'q» deb yozilgandi.
 *  Qaror o'zgardi, lekin uning sababi o'z joyida qoldi: reklama
 *  o'ynayotgan odamning qo'lidan hech narsa olmasligi kerak. Shuning
 *  uchun u o'yin **oxirida** ham, o'rtasida ham emas — odam hali
 *  o'yinga kirmagan paytda chiqadi.
 *
 *  **Mukofotli (rewarded) reklama yo'q.** Yandex'ning qoidasi:
 *  rewarded faqat odam rozilik berganda chiqadi va mukofot evaziga
 *  bo'ladi. Majburlab chiqarilgani rewarded emas, oddiy oraliq
 *  reklama bo'lib qoladi — ya'ni «har besh o'yinda majburiy rewarded»
 *  degan narsa texnik jihatdan ham, qoida bo'yicha ham mavjud emas.
 *  Ilovadagi `RewardedAdService` izohida ham shu yozilgan.
 *
 *  **Bitta tarmoq — Yandex.** Ilovada kaskad bor (Yandex → AdMob),
 *  saytda esa bitta tarmoq: AdSense alohida moderatsiya va alohida
 *  hisob talab qiladi, MDH trafigida esa Yandex baribir oldinda.
 *  Ikkinchi tarmoq kerak bo'lsa `AdBanner` ichiga xuddi ilovadagidek
 *  navbat qo'shiladi.
 *
 *  **Qayerda yo'q.** O'yin taxtasi va klaviaturaning o'zi reklamasiz:
 *  banner hech qachon o'ynayotgan odamning qo'li yoki ko'zi
 *  tushadigan joyda turmaydi.
 *
 *  **Qayerda bor.** Nimani o'ynashni tanlayotgan sahifa, yon ustun,
 *  boshqa o'yinchining profili, jang lobbisi, maqola va hujjat
 *  sahifalari.
 *
 *  **Chetdagi bo'shliq.** Keng ekranda taxta o'rtada tor ustunda
 *  turadi va ikki yoni butunlay bo'sh qoladi. O'sha bo'shliq ham
 *  ishlatiladi — lekin faqat joy haqiqatan yetganda va faqat taxtadan
 *  ajratilgan holda: bosh sahifada taklif kartochkalari ostida
 *  ([GameAside]), jang davomida esa varaqqa yopishtirilgan ikkita
 *  ustunda ([SideAds]). Tor ekranda ikkalasi ham umuman chizilmaydi.
 *
 *  **Qo'llov sahifasi.** `/qollab` da banner yo'q va bo'lmaydi: pul
 *  so'ralayotgan joyda reklama turishi ikkala iltimosni ham
 *  arzonlashtiradi.
 *
 *  **Kim ko'rmaydi.** Loyihani qo'llagan odam ([isAdFree]) — ilovadagi
 *  bilan aynan bir xil shart: oxirgi 7 kunlik qo'llovlar 5 555 so'mga
 *  yetsa, reklama umuman so'ralmaydi. Tasdiqlangan hisob ham
 *  ([isVerifiedAsync]): nishon bilan birga reklamasizlik keladi va u
 *  muddatsiz — ro'yxatdan chiqmaguncha turadi.
 *
 *  **Qachon so'raladi.** Faqat banner ekranga yaqinlashganda va varaq
 *  ko'rinib turganda. Shu sababli Yandex skripti sahifa ochilishida
 *  yuklanmaydi: reklamagacha surmagan odamning brauzeriga umuman
 *  tushmaydi. */
import { api } from '../api/client';

/** Banner qaysi sahifada turibdi — ilovadagi `AdPlacement` kabi.
 *
 *  Yandex interfeysida har biriga alohida blok ochilsa hisobot sahifalar
 *  bo'yicha ajraladi; bloki yo'q joylashuv [FALLBACK] blokidan
 *  foydalanadi, ya'ni yangi sahifaga banner qo'yish uchun konsolni
 *  kutish shart emas. */
export type AdPlacement =
  | 'hub'
  | 'game'
  | 'guncha'
  | 'battle'
  | 'arena'
  | 'turnir'
  | 'profile';

/** O'z bloki bo'lmagan joylashuv shu blokdan foydalanadi. */
const FALLBACK: AdPlacement = 'hub';

/** Yandex Advertising Network bloklari — `R-A-XXXXXXX-N`.
 *
 *  Blok id'si maxfiy emas (u baribir sahifa kodida ko'rinadi), shuning
 *  uchun `.env` emas, oddiy konstanta: yangi blok qo'shish uchun bitta
 *  faylni tahrirlash kifoya.
 *
 *  Ilovadagi `R-M-…` bloklari bu yerga **yaramaydi** — ular mobil ilova
 *  uchun. Saytga Yandex Partner interfeysida «Sayt» turidagi alohida
 *  bloklar ochiladi.
 *
 *  Bo'sh qoldirilgan joylashuvda banner umuman chizilmaydi: sahifa
 *  reklama yo'qday ko'rinadi. Shu sababli bloklar ochilgunicha ham kod
 *  joyida turaveradi va hech narsani buzmaydi. */
const UNITS: Record<AdPlacement, string> = {
  hub: 'R-A-20055999-1',
  game: '',
  guncha: '',
  battle: '',
  arena: '',
  turnir: '',
  profile: '',
};

/**
 * To'liq ekranli blok (Yandex'da «Полноэкранный», sayt turida).
 *
 * Bannerlardan **alohida** blok: hisobot ham ajraladi, o'chirish ham.
 * Bo'sh qolsa darvoza oynasi umuman chiqmaydi — ya'ni blok
 * ochilgunicha sayt avvalgidek ishlayveradi va hech kim bo'sh
 * va'daga duch kelmaydi.
 *
 * Yandex Partner interfeysida «Sayt» → «Полноэкранный» bilan
 * ochiladi va id shu yerga yoziladi.
 */
const FULLSCREEN_UNIT = '';

/** To'liq ekranli reklama shu yig'ishda bormi. */
export const fullscreenReady = (): boolean =>
  adsSupported ? FULLSCREEN_UNIT !== '' : true;

/**
 * Mukofotli bloklar — har mukofotga alohida.
 *
 * Ilovada ham shunday (`RewardedPlacement`): bitta blok bilan ham
 * ishlardi, lekin o'shanda konsolda qaysi mukofot qancha daromad
 * keltirgani ko'rinmasdi — ya'ni qaysi birini qoldirish, qaysi
 * birini olib tashlash haqidagi qaror raqamsiz qolardi.
 *
 * Yandex Partner interfeysida «Sayt» → «Rewarded» bilan ochiladi.
 * Bo'sh qolgani umuman so'ralmaydi va o'sha mukofot **reklamasiz**
 * ochiladi: ekranda qulf ko'rinmaydi.
 */
const REWARDED_UNITS: Record<string, string> = {
  profileViews: '',
  headToHead: '',
  scoreHistory: '',
  answerReveal: '',
};

/** Shu mukofotning bloki sozlanganmi. */
export const rewardedReady = (name: string): boolean =>
  adsSupported ? (REWARDED_UNITS[name] ?? '') !== '' : true;

/** [placement] uchun blok. Sozlanmagan bo'lsa — bo'sh satr. */
export function adUnit(placement: AdPlacement): string {
  return UNITS[placement] || UNITS[FALLBACK] || '';
}

/** Reklama shu yig'ishda umuman bormi.
 *
 *  Dev serverda hech qachon: o'z reklamangni o'zing yuklashing yoki
 *  bosishing hisobni bloklatadi. `npm run dev` da bannerning o'rnida
 *  uning o'lchamidagi sinov ramkasi turadi — joylashuvni shusiz ham
 *  ko'rish mumkin. */
export const adsSupported = !import.meta.env.DEV;

/* ── Masofadan o'chirish ────────────────────────────────────────────── */

/** Serverdagi `config/ads` kaliti — ilova bilan **bitta** yozuv.
 *
 *  ```
 *  app/ads
 *    enabled: true
 *    web:    { enabled: false }
 *    yandex: { enabled: true, web: { enabled: false } }
 *  ```
 *
 *  `web` bo'limi saytga tegishli va umumiy kalitning ustidan yoziladi:
 *  moderatsiya yoki nosoz reklama chiqsa saytni ilovaga tegmasdan
 *  o'chirish mumkin. Qoida ilovadagi bilan bir xil — **faqat aniq
 *  `false` o'chiradi**: maydon yo'q yoki noto'g'ri turda bo'lsa
 *  yuqoridagi qatlamga tushiladi, oxirida esa standart yoqiq.
 *
 *  Yozuv yo'q yoki server javob bermasa reklama yoqiq qoladi:
 *  tarmoq uzilishi daromadni jimgina nolga tushirmasligi kerak. */
const PLATFORM = 'web';

type Section = Record<string, unknown>;

function section(data: Section, key: string): Section {
  const value = data[key];
  return value !== null && typeof value === 'object' ? (value as Section) : {};
}

/** Bo'limdagi kalit: avval platforma, keyin bo'limning o'zi. */
function flagIn(data: Section): boolean {
  const platform = section(data, PLATFORM).enabled;
  if (typeof platform === 'boolean') return platform;
  const own = data.enabled;
  if (typeof own === 'boolean') return own;
  return true;
}

/** Hujjatni bitta javobga aylantiradi. */
function parseAdsSettings(data: Section): boolean {
  if (!flagIn(data)) return false;
  return flagIn(section(data, 'yandex'));
}

let settings: Promise<boolean> | null = null;

/** Reklama hozir ko'rsatiladimi. Sahifa umrida bir marta o'qiladi. */
export function adsEnabled(): Promise<boolean> {
  if (!adsSupported) return Promise.resolve(false);
  return (settings ??= api
    .get<{ value?: unknown }>('/v1/public/config/ads', { auth: false })
    // 404 ham, tarmoq xatosi ham bir xil ma'noda: sozlama yo'q,
    // demak standart yoqiq.
    .catch(() => ({ value: null }))
    .then((data) => {
      const value = data.value;
      return parseAdsSettings(
        value !== null && typeof value === 'object' ? (value as Section) : {},
      );
    }));
}

/* ── Yandex skripti ─────────────────────────────────────────────────── */

/** Yandex Partner interfeysi beradigan kodda aynan shu manzil turadi.
 *  Interfeysdagi kod o'zgarsa bu yer ham yangilanadi. */
const SCRIPT = 'https://yandex.ru/ads/system/context.js';

declare global {
  interface Window {
    yaContextCb?: (() => void)[];
    Ya?: {
      Context?: {
        AdvManager?: { render(params: Record<string, unknown>): void };
      };
    };
  }
}

let script: Promise<boolean> | null = null;

/** Yandex skriptini yuklaydi — birinchi banner so'ralganda, bir marta.
 *
 *  Navbat (`yaContextCb`) skriptdan oldin qo'yiladi: Yandex aynan shuni
 *  kutadi va skript kelgach navbatdagi hamma ishni bajaradi. Yiqilsa
 *  `false` qaytadi va sahifa reklamasiz ishlayveradi — bu yerdagi xato
 *  hech qachon foydalanuvchiga ko'rinmaydi. */
function loadAds(): Promise<boolean> {
  if (!adsSupported) return Promise.resolve(false);
  return (script ??= new Promise<boolean>((resolve) => {
    window.yaContextCb ??= [];
    const tag = document.createElement('script');
    tag.src = SCRIPT;
    tag.async = true;
    tag.onload = () => resolve(true);
    tag.onerror = () => resolve(false);
    document.head.append(tag);
  }));
}

export interface AdRequest {
  blockId: string;
  /** Konteyner `id` si — Yandex reklamani shu elementga chizadi. */
  renderTo: string;
  /** Reklama chizildi (balandligi bor). */
  onRender: () => void;
  /** Talab aynan shu paytda Yandex'ga uzatildi.
   *
   *  Skript yuklanishi va navbatning o'z navbati chaqiruvchi uchun
   *  ko'rinmas edi, kutish muddati esa o'sha paytdan sanalardi: sekin
   *  tarmoqda yaxshi reklama kelib ulgurmasdan bekor qilinardi. Endi
   *  muddat shu chaqiruvdan boshlanadi — ya'ni faqat auksion vaqti
   *  sanaladi. */
  onSent?: () => void;
  /** To'ldirish topilmadi yoki xato — joy bo'shatiladi.
   *
   *  [reason] nima bo'lganini aytadi. Ilgari hamma holat bitta
   *  «to'ldirish yo'q» bo'lib chiqardi va guruhdagi xabardan
   *  sababni ajratib bo'lmasdi: reklama rostdan topilmadimi,
   *  Yandex skripti umuman yuklanmadimi (reklama bloklagich,
   *  tarmoq) yoki xato qaytdimi — uchalasi bir xil ko'rinardi.
   *  Birinchisi odatiy hol, ikkinchisi esa butunlay boshqa gap. */
  onFailed: (reason: AdFailure) => void;
}

/** Reklama nega chiqmadi. */
export type AdFailure =
  /** Yandex skripti yuklanmadi — bloklagich yoki tarmoq. */
  | 'skript'
  /** Yandex xato qaytardi. */
  | 'xato'
  /** Chizilgan, lekin yopildi (fullscreen va shunga o'xshash). */
  | 'yopildi'
  /** Chizildi, lekin balandligi nol — bo'sh ramka. */
  | 'bo‘sh'
  /** Javob kelmadi: auksionda to'ldirish topilmagan. */
  | 'to‘ldirish yo‘q';

/** Bannerni so'raydi. Skript yiqilsa ham chaqiruvchi javobsiz
 *  qolmaydi: [AdRequest.onFailed] chaqiriladi.
 *
 *  Bitta blok bir sahifada bir necha marta chizilishi mumkin (SPA'da
 *  manzil almashganda shunday bo'ladi) — buning uchun `blockId` o'sha
 *  bo'lib, `renderTo` boshqa bo'lishi kifoya. */
export function requestAd({
  blockId,
  renderTo,
  onRender,
  onFailed,
  onSent,
}: AdRequest): void {
  void loadAds().then((ready) => {
    if (!ready) return onFailed('skript');
    window.yaContextCb?.push(() => {
      try {
        onSent?.();
        window.Ya?.Context?.AdvManager?.render({
          blockId,
          renderTo,
          // Reklama sahifa bilan bir mavzuda bo'lsin: tungi saytdagi oq
          // banner ko'zni qamashtiradi va aynan shu bezovta qiladi.
          darkTheme: document.documentElement.dataset.theme === 'dark',
          // Ogohlantirish (`warning`) reklamani to'xtatmaydi — undan
          // keyin ham `onRender` kelishi mumkin, shuning uchun faqat
          // xato joyni bo'shatadi. Qolganini kutish muddati yopadi.
          onError: (data?: { type?: string }) => {
            if (data?.type !== 'warning') onFailed('xato');
          },
          // Yopiladigan formatlarda (fullscreen, Top Ad, Floor Ad) —
          // yopilgach ajratilgan joy ham qaytariladi.
          onClose: () => onFailed('yopildi'),
          // Yandex hujjatida `onRender` oxirgi parametr bo'lishi
          // aytilgan, shuning uchun u ro'yxat oxirida turadi.
          onRender,
        });
      } catch {
        onFailed('xato');
      }
    });
  });
}

/* ── Yorliq ─────────────────────────────────────────────────────────── */

/** Banner ustidagi yorliq.
 *
 *  Yorliq bezak emas, talab: Yandex reklamani sayt kontentidan aniq
 *  ajratishni so'raydi. Ajratilmasa tasodifiy bosish ko'payadi va tarmoq
 *  buni qalbaki bosish deb hisoblaydi.
 *
 *  Ilgari bu yerda loyiha ohangidagi bir nechta jumla turardi —
 *  «choy puli uchun», «dasturchi ham ovqat yeydi» kabi. Hech biri
 *  bosishga chaqirmasdi, lekin ularning hammasi bitta narsani aytardi:
 *  **reklama saytga daromad keltiradi**. Yandex qoidasi esa
 *  chaqiruvdan kengroq — reklama yonidagi, unga e'tibor qaratishdan
 *  saytga foyda borligini bildiradigan har qanday matn yashirin
 *  rag'batlantirish deb o'qilishi mumkin. Moderatsiyada bu bahsli joy,
 *  bahsli joy esa «иные причины» degan javobga qo'shiladi.
 *
 *  Shuning uchun yorliq bitta va quruq. Loyiha ohangi uchun sayt
 *  bo'ylab boshqa joy yetarli; reklamaning ustidagi uch so'z unga
 *  yaramaydi. */
export const AD_LABEL = 'Reklama';

/** Keyingi banner yorlig'i.
 *
 *  Funksiya ataylab qoldirildi: chaqiruvchi tomonda hech narsa
 *  o'zgarmaydi va yorliq keyinchalik yana xilma-xil bo'lsa (masalan
 *  moderatsiyadan keyin) o'zgarish yana shu yerda bo'ladi. */
export function nextAdLabel(): string {
  return AD_LABEL;
}

/* ── To'liq ekranli reklama ─────────────────────────────────────────── */

/** Reklama o'zi yopilmasa shuncha kutiladi.
 *
 *  Yandex `onClose` ni har doim ham yubormaydi (to'ldirish topilmasa
 *  umuman hech narsa kelmasligi mumkin). Muddat bo'lmasa darvoza
 *  oynasi ochiq qolib, odam o'yinga kira olmasdi. */
const FULLSCREEN_TIMEOUT = 20_000;

/**
 * To'liq ekranli reklamani ko'rsatadi.
 *
 * Javob: `true` — ko'rsatildi (yopilgunicha kutildi), `false` —
 * chiqmadi. Ikkinchi holatda chaqiruvchi odamni **to'xtatmaydi**:
 * tarmoq to'ldirish topolmagani o'yinchining aybi emas va uni o'yinga
 * kiritmay qo'yish reklamaga emas, saytga ziyon qiladi.
 *
 * Banner bilan bitta yo'ldan boradi (`loadAds`), lekin `renderTo`
 * yo'q: to'liq ekranli oyna sahifadagi elementga emas, varaqning
 * ustiga chiziladi.
 */
export function showFullscreen(): Promise<boolean> {
  if (!adsSupported) return Promise.resolve(true);
  if (FULLSCREEN_UNIT === '') return Promise.resolve(false);

  return loadAds().then(
    (ready) =>
      new Promise<boolean>((resolve) => {
        if (!ready) return resolve(false);

        let done = false;
        const finish = (shown: boolean) => {
          if (done) return;
          done = true;
          window.clearTimeout(timer);
          resolve(shown);
        };
        const timer = window.setTimeout(() => finish(false), FULLSCREEN_TIMEOUT);

        window.yaContextCb?.push(() => {
          try {
            window.Ya?.Context?.AdvManager?.render({
              blockId: FULLSCREEN_UNIT,
              type: 'fullscreen',
              darkTheme: document.documentElement.dataset.theme === 'dark',
              onError: (data?: { type?: string }) => {
                if (data?.type !== 'warning') finish(false);
              },
              // Yopilgani — ko'rilgani: shundan keyin o'yin boshlanadi.
              onClose: () => finish(true),
            });
          } catch {
            finish(false);
          }
        });
      }),
  );
}

/**
 * Mukofotli reklamani ko'rsatadi.
 *
 * To'liq ekranlidan farqi ikkitasi: bloki boshqa va u **faqat odam
 * so'raganda** chaqiriladi. Yandex'ning qoidasi ham shu — mukofotli
 * reklama rozilik bilan chiqadi.
 *
 * Javob: `true` — ko'rsatildi. `false` bo'lsa ham chaqiruvchi
 * mukofotni beradi (`lib/rewarded.ts` dagi to'rtinchi qoida), ya'ni
 * bu son faqat daromad uchun.
 */
export function showRewarded(name: string): Promise<boolean> {
  const unit = REWARDED_UNITS[name] ?? '';
  if (!adsSupported) return Promise.resolve(true);
  if (unit === '') return Promise.resolve(false);

  return loadAds().then(
    (ready) =>
      new Promise<boolean>((resolve) => {
        if (!ready) return resolve(false);

        let done = false;
        const finish = (shown: boolean) => {
          if (done) return;
          done = true;
          window.clearTimeout(timer);
          resolve(shown);
        };
        const timer = window.setTimeout(() => finish(false), FULLSCREEN_TIMEOUT);

        window.yaContextCb?.push(() => {
          try {
            window.Ya?.Context?.AdvManager?.render({
              blockId: unit,
              type: 'rewarded',
              darkTheme: document.documentElement.dataset.theme === 'dark',
              onError: (data?: { type?: string }) => {
                if (data?.type !== 'warning') finish(false);
              },
              // Oxirigacha ko'rilgani — mukofot shundan.
              onRewarded: () => finish(true),
              // Yarmida yopilgani ham javob: mukofot baribir
              // beriladi, lekin daromad yo'q.
              onClose: () => finish(false),
            });
          } catch {
            finish(false);
          }
        });
      }),
  );
}
