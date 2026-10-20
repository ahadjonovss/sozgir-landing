/** Yandex Metrika — saytning tashrif hisoblagichi.
 *
 *  **Nega kerak.** Faqat statistika uchun emas. Yandex Advertising
 *  Network saytni moderatsiyadan o'tkazayotganda uning auditoriyasini
 *  va foydalanuvchi ko'rsatkichlarini (tashriflar, ko'rish chuqurligi,
 *  rad etishlar) aynan Metrika orqali ko'radi. O'zbekcha saytni Yandex
 *  qidiruvi deyarli indekslamaydi, ya'ni boshqa ma'lumot manbasi yo'q:
 *  hisoblagichsiz sozgir.uz moderator uchun trafigi o'lchab
 *  bo'lmaydigan sayt bo'lib qoladi. Saytning uch marta «иные причины»
 *  bilan rad etilishining eng ehtimolli sababi shu.
 *
 *  **Reklama bilan bir xil qoidalar.** Hisoblagich ham `lib/ads.ts`
 *  dagi tartibda ishlaydi va bu tasodif emas — ikkalasi ham begona
 *  skript yuklaydi, demak ikkalasi ham bir xil ehtiyot talab qiladi:
 *
 *  * **Dev serverda yo'q.** O'z yig'ishingdagi tashriflar statistikani
 *    ifloslantiradi va moderatsiyada ko'riladigan ko'rsatkichlarni
 *    buzadi.
 *  * **Sahifa ochilishini sekinlashtirmaydi.** Skript bo'sh vaqtda
 *    (`requestIdleCallback`) yuklanadi, ya'ni birinchi chizishga
 *    ulgurmaydi va uni kutib turmaydi ham.
 *  * **Yiqilsa hech kim bilmaydi.** Tarmoq xatosi sahifaga chiqmaydi.
 *  * **Hisoblagich sozlanmagan bo'lsa umuman yuklanmaydi** — bo'sh
 *    [COUNTER] bilan bu fayl hech narsa qilmaydi va saytga tegmaydi.
 *
 *  **Vebvizor ataylab o'chirilgan.** U odamning ekranidagi harakatini
 *  yozib oladi — hisob ochish va kod kiritish oynalari ham shunga
 *  tushadi. Moderatsiya uchun tashriflar soni yetarli, qolgani esa
 *  o'ylab ko'rmasdan yoqib qo'yiladigan va keyin maxfiylik siyosatini
 *  yolg'onga aylantiradigan narsa. */

/** Metrika hisoblagichining raqami — `metrika.yandex.com` da sayt
 *  qo'shilganda beriladi.
 *
 *  Raqam maxfiy emas (u baribir brauzerga tushadi), shuning uchun
 *  `.env` emas, `lib/ads.ts` dagi blok id'lari kabi oddiy konstanta:
 *  o'zgartirish uchun bitta satr yetadi.
 *
 *  Bo'sh qoldirilsa hisoblagich butunlay o'chiq — sayt xuddi u yo'qday
 *  ishlayveradi. Shu sababli kod hisoblagich ochilgunicha ham joyida
 *  turaveradi va hech narsani buzmaydi. */
const COUNTER = '';

/** Hisoblagich shu yig'ishda bormi. */
const supported = !import.meta.env.DEV && COUNTER !== '';

declare global {
  interface Window {
    ym?: {
      (id: string, action: string, ...rest: unknown[]): void;
      a?: unknown[][];
      l?: number;
    };
  }
}

/** Metrika kutadigan manzil. Interfeysdagi kod o'zgarsa bu yer ham. */
const SCRIPT = 'https://mc.yandex.ru/metrika/tag.js';

let started = false;

/** Brauzer bo'sh qolguncha kutadi.
 *
 *  `requestIdleCallback` hamma joyda yo'q (Safari'ga u yaqinda keldi),
 *  shuning uchun oddiy taymer zaxirada turadi. */
function whenIdle(run: () => void): void {
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(run, { timeout: 4000 });
  } else {
    window.setTimeout(run, 2000);
  }
}

/** Hisoblagichni yoqadi — sahifa umrida bir marta.
 *
 *  Navbat (`ym.a`) skriptdan **oldin** tayyorlanadi: Metrika aynan
 *  shuni kutadi va skript kelgach navbatdagi hamma chaqiruvni
 *  bajaradi. Shu sababli `hit` ni skript yuklanishini kutmasdan
 *  yuborish mumkin.
 *
 *  Birinchi sahifani bu funksiya **sanamaydi**: `defer: true` da uni
 *  chaqiruvchi [trackPage] bilan o'zi yuboradi va shu bitta joyda
 *  sarlavha tayyor bo'lishi kafolatlanadi. */
export function startMetrika(): void {
  if (!supported || started) return;
  started = true;

  const queue: unknown[][] = [];
  const ym = ((...args: unknown[]) => {
    queue.push(args);
  }) as NonNullable<Window['ym']>;
  ym.a = queue;
  ym.l = Date.now();
  window.ym = ym;

  window.ym(COUNTER, 'init', {
    // Bosishlar xaritasi va tashqi havolalar — moderatsiyada
    // ko'riladigan «odam saytda nima qilyapti» savoliga javob beradi.
    clickmap: true,
    trackLinks: true,
    // Bir sahifada uzoq turgan odam «rad etish» deb sanalmasin:
    // So'ztopda odam bitta sahifada o'ynab o'tiradi va shusiz butun
    // sayt rad etishlardan iborat bo'lib ko'rinardi.
    accurateTrackBounce: true,
    // SPA: manzil almashuvini o'zimiz xabar qilamiz ([trackPage]).
    defer: true,
    // Yozib olish yo'q — yuqoridagi izohga qarang.
    webvisor: false,
  });

  whenIdle(() => {
    const tag = document.createElement('script');
    tag.src = SCRIPT;
    tag.async = true;
    document.head.append(tag);
  });
}

/** Oxirgi sanalgan manzil — keyingisining «qayerdan kelgani».
 *
 *  Birinchi sahifada u tashqi manba (`document.referrer`), keyin esa
 *  saytning o'z sahifasi. `document.referrer` SPA'da **o'zgarmaydi**:
 *  u sayt ochilgandagi tashqi manbada qotib qoladi, ya'ni uni har
 *  o'tishda berish Metrikaga «har safar tashqaridan keldi» deb
 *  aytardi. */
let previous = '';

/** Manzil almashdi — SPA'da buni hech kim o'zi aytmaydi.
 *
 *  `referer` zanjiri shuning uchun qo'lda yuritiladi: usiz Metrika
 *  sayt ichidagi har o'tishni alohida tashrif deb hisoblardi va
 *  ko'rish chuqurligi — moderatsiyada qaraladigan ko'rsatkich — har
 *  doim bittada qotib qolardi. */
export function trackPage(): void {
  if (!supported || !started) return;
  const url = window.location.href;
  window.ym?.(COUNTER, 'hit', url, {
    title: document.title,
    referer: previous || document.referrer,
  });
  previous = url;
}
