/** Reklama — saytdagi bannerlar. Ilovadagi `lib/core/ads/` ning veb
 *  muqobili va o'sha qoidalar bilan ishlaydi.
 *
 *  **Bitta tur — banner.** Oraliq oyna (interstitial), video, pop-up va
 *  «sahifa ustidan chiqadigan» hech narsa yo'q. Reklama sahifaning bir
 *  bo'lagi bo'lib turadi, ishni to'xtatmaydi.
 *
 *  **Bitta tarmoq — Yandex.** Ilovada kaskad bor (Yandex → AdMob),
 *  saytda esa bitta tarmoq: AdSense alohida moderatsiya va alohida
 *  hisob talab qiladi, MDH trafigida esa Yandex baribir oldinda.
 *  Ikkinchi tarmoq kerak bo'lsa `AdBanner` ichiga xuddi ilovadagidek
 *  navbat qo'shiladi.
 *
 *  **Qayerda yo'q.** O'yin taxtasi, klaviatura, jang ekrani va
 *  tanishtiruv sahifasi (`/`) reklamasiz qoladi. Banner faqat odam
 *  o'ynamayotgan joyda turadi: nimani o'ynashni tanlayotgan sahifa, yon
 *  ustun, boshqa o'yinchining profili, jang lobbisi.
 *
 *  **Kim ko'rmaydi.** Loyihani qo'llagan odam ([useAdFree]) — ilovadagi
 *  bilan aynan bir xil shart: oxirgi 7 kunlik qo'llovlar 5 555 so'mga
 *  yetsa, reklama umuman so'ralmaydi.
 *
 *  **Qachon so'raladi.** Faqat banner ekranga yaqinlashganda va varaq
 *  ko'rinib turganda. Shu sababli Yandex skripti sahifa ochilishida
 *  yuklanmaydi: reklamagacha surmagan odamning brauzeriga umuman
 *  tushmaydi. */
import { readDoc } from '../firebase/rest';

/** Banner qaysi sahifada turibdi — ilovadagi `AdPlacement` kabi.
 *
 *  Yandex interfeysida har biriga alohida blok ochilsa hisobot sahifalar
 *  bo'yicha ajraladi; bloki yo'q joylashuv [FALLBACK] blokidan
 *  foydalanadi, ya'ni yangi sahifaga banner qo'yish uchun konsolni
 *  kutish shart emas. */
export type AdPlacement = 'hub' | 'game' | 'guncha' | 'battle' | 'profile';

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
  profile: '',
};

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

/** Firestore'dagi `app/ads` hujjati — ilova bilan **bitta** kalit.
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
 *  Hujjat yo'q yoki Firestore javob bermasa reklama yoqiq qoladi:
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
  return (settings ??= readDoc('app/ads').then((data) =>
    parseAdsSettings(data ?? {}),
  ));
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
  /** To'ldirish topilmadi yoki xato — joy bo'shatiladi. */
  onFailed: () => void;
}

/** Bannerni so'raydi. Skript yiqilsa ham chaqiruvchi javobsiz
 *  qolmaydi: [AdRequest.onFailed] chaqiriladi.
 *
 *  Bitta blok bir sahifada bir necha marta chizilishi mumkin (SPA'da
 *  manzil almashganda shunday bo'ladi) — buning uchun `blockId` o'sha
 *  bo'lib, `renderTo` boshqa bo'lishi kifoya. */
export function requestAd({ blockId, renderTo, onRender, onFailed }: AdRequest): void {
  void loadAds().then((ready) => {
    if (!ready) return onFailed();
    window.yaContextCb?.push(() => {
      try {
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
            if (data?.type !== 'warning') onFailed();
          },
          // Yopiladigan formatlarda (fullscreen, Top Ad, Floor Ad) —
          // yopilgach ajratilgan joy ham qaytariladi.
          onClose: onFailed,
          // Yandex hujjatida `onRender` oxirgi parametr bo'lishi
          // aytilgan, shuning uchun u ro'yxat oxirida turadi.
          onRender,
        });
      } catch {
        onFailed();
      }
    });
  });
}

/* ── Yorliq ─────────────────────────────────────────────────────────── */

/** Banner ustidagi jumlalar — ilovadagi `AppStrings.adsLabelLines` bilan
 *  bir ohangda.
 *
 *  Yorliq bezak emas, talab: Yandex reklamani sayt kontentidan aniq
 *  ajratishni so'raydi. Ajratilmasa tasodifiy bosish ko'payadi va tarmoq
 *  buni qalbaki bosish deb hisoblaydi.
 *
 *  Shu sababli qaysi jumla bo'lmasin, ichida **«reklama» so'zi** turishi
 *  shart. Va hech biri **bosishga chaqirmaydi** — «e'tibor bermasangiz
 *  ham bo'ladi» ko'rish haqida, bosish haqida emas. */
export const AD_LABELS = [
  'Reklama — loyiha yashab qolishi uchun',
  'Reklama — bizga choy puli uchun ☕',
  'Reklama — dasturchi ham ovqat yeydi 🍜',
  'Hech narsa yo‘qotmadingiz, reklama esa yordam berdi',
  'Reklama bor, shuning uchun so‘zlar bepul',
  'Reklama turibdi — e’tibor bermasangiz ham bo‘ladi',
  'Kichkina reklama — katta lug‘at uchun',
];

/** Keyingi banner qaysi jumlani olishi.
 *
 *  Tasodifiy joydan boshlanadi: aks holda saytni har ochganda bir xil
 *  ketma-ketlik chiqardi. Har banner navbatdagisini oladi va uni
 *  **o'zgartirmaydi** — ko'z oldida almashib turgan matn reklamaning
 *  o'zidan ko'ra ko'proq e'tibor tortadi. */
let cursor = Math.floor(Math.random() * AD_LABELS.length);

export function nextAdLabel(): string {
  return AD_LABELS[cursor++ % AD_LABELS.length];
}
