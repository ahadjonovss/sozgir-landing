/** Saytdagi hodisalar — Telegram guruhiga.
 *
 *  Ilovadagi `Reporter` ning (`lib/core/report/reporter.dart`) sayt
 *  tarafdagi juftligi va o'sha qoidalar bilan ishlaydi:
 *
 *  * **Hech qachon sahifani sekinlashtirmaydi.** Yuborish javobni
 *    kutmaydi, xatolar yutiladi — bu yerdagi nosozlik hech qachon
 *    foydalanuvchiga ko'rinmaydi.
 *  * **Dev serverda jim.** O'z yig'ishingdagi har bosish guruhga
 *    tushsa, guruh bir kunda o'qib bo'lmaydigan holga keladi.
 *  * **Takror yuborilmaydi.** Bir xil hodisa seans davomida bir
 *    marta ketadi (`once`).
 *
 *  **Token bu yerda yo'q.** Hodisa `/api/event` ga boradi va u yerdan
 *  Telegram'ga ketadi; sarlavha, mavzu va ovozni ham o'sha funksiya
 *  hal qiladi. Sabab oddiy: brauzerga tushgan token ochiq matn va
 *  uni istagan odam o'qiydi. */
import { adUnit, type AdFailure, type AdPlacement } from './ads';
import { compactLogin } from './loginId';

/** Hodisa turlari — `api/event.ts` dagi jadval bilan bir xil. */
export type TrackEvent = 'visit' | 'error' | 'ad' | 'share' | 'get' | 'game';

/** Xabardagi bitta qator: yorliq va qiymat. */
type Row = [string, string | number | boolean | null | undefined];

const supported = !import.meta.env.DEV;

/** Shu varaqda allaqachon yuborilgan hodisalar — takror bo'lmasin. */
const sent = new Set<string>();

/** Bo'sh qiymatli qatorlar tushib qoladi: «Qurilma: —» hech narsa
 *  aytmaydi, faqat xabarni uzaytiradi. */
function rowsOf(rows: Row[]): [string, string][] {
  const out: [string, string][] = [];
  for (const [label, value] of rows) {
    if (value === null || value === undefined || value === '') continue;
    out.push([label, String(value)]);
  }
  return out;
}

/** Hodisani yuboradi.
 *
 *  `sendBeacon` birinchi navbatda: u sahifa yopilayotganda ham
 *  yetkazadi, oddiy `fetch` esa o'sha paytda uzilib qoladi — aynan
 *  eng kerakli xabar (chiqib ketishdagi xato) yo'qolardi. Beacon
 *  bo'lmasa yoki navbat to'lgan bo'lsa `keepalive` li `fetch`
 *  zaxirada turadi. */
export function track(type: TrackEvent, rows: Row[] = []): void {
  if (!supported) return;

  const payload = JSON.stringify({ type, rows: rowsOf(rows) });

  try {
    if (navigator.sendBeacon?.(
      '/api/event',
      new Blob([payload], { type: 'application/json' }),
    )) {
      return;
    }
  } catch {
    // Beacon ishlamadi — pastdagi `fetch` ga tushiladi.
  }

  void fetch('/api/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    keepalive: true,
  }).catch(() => {
    // Hodisa yetib bormadi. Bu sahifada hech narsani o'zgartirmaydi.
  });
}

/** Hodisani shu varaqda **bir marta** yuboradi.
 *
 *  [key] — takrorni aniqlaydigan kalit. Masalan reklama uchun
 *  joylashuv: bitta sahifada ikkita banner bo'lsa ikkalasi ham
 *  yoziladi, lekin bittasi ikki marta chizilsa — yo'q. */
export function trackOnce(key: string, type: TrackEvent, rows: Row[] = []): void {
  if (sent.has(key)) return;
  sent.add(key);
  track(type, rows);
}

/* ── Tashrif ────────────────────────────────────────────────────────── */

const VISIT_KEY = 'sozgir.visit';

/** Qurilma haqidagi qisqa ta'rif — xabarni o'qiyotgan odam uchun.
 *
 *  To'liq `userAgent` yozilmaydi: u ikki qatorni egallaydi va undagi
 *  foydali narsa shu uchtadan iborat. */
function device(): string {
  const ua = navigator.userAgent;
  const system = /iPhone|iPad|iPod/.test(ua)
    ? 'iOS'
    : /Android/.test(ua)
      ? 'Android'
      : /Macintosh/.test(ua)
        ? 'macOS'
        : /Windows/.test(ua)
          ? 'Windows'
          : /Linux/.test(ua)
            ? 'Linux'
            : 'boshqa';
  const browser = /Firefox\//.test(ua)
    ? 'Firefox'
    : /Edg\//.test(ua)
      ? 'Edge'
      : /OPR\/|Opera/.test(ua)
        ? 'Opera'
        : /Chrome\//.test(ua)
          ? 'Chrome'
          : /Safari\//.test(ua)
            ? 'Safari'
            : 'boshqa';
  return `${system} · ${browser}`;
}

/** Odam qayerdan keldi. Bo'sh bo'lsa — to'g'ridan-to'g'ri. */
function source(): string {
  const referrer = document.referrer;
  if (!referrer) return 'to‘g‘ridan-to‘g‘ri';
  try {
    const host = new URL(referrer).hostname;
    return host.endsWith('sozgir.uz') ? 'sayt ichidan' : host;
  } catch {
    return referrer.slice(0, 60);
  }
}

/** Saytga kirildi — **seans boshiga bir marta**.
 *
 *  Sahifadan sahifaga o'tish yangi tashrif emas: SPA'da odam o'nta
 *  manzilni aylanib chiqadi va har biri xabar bo'lsa, bitta odamdan
 *  o'nta xabar tushardi. Belgisi `sessionStorage` da — u varaq yopilsa
 *  o'chadi, ya'ni ertasi kuni qaytgan odam yana sanaladi.
 *
 *  Yashirin oynada yoki saqlash bloklangan brauzerda `sessionStorage`
 *  xato beradi. Bunda hodisa baribir yuboriladi: bitta ortiqcha xabar
 *  umuman yo'q xabardan yaxshiroq. */
export function trackVisit(
  who?: { uid: string; nickname: string; email?: string | null } | null,
): void {
  try {
    if (sessionStorage.getItem(VISIT_KEY)) return;
    sessionStorage.setItem(VISIT_KEY, '1');
  } catch {
    // Saqlab bo'lmadi — pastdagi yuborish baribir ishlaydi.
  }

  track('visit', [
    /* Kim kirgani birinchi qatorda: xabarni o'qiyotgan odam avval
       shuni qidiradi. Kirmagan odamda taxallus yo'q — «mehmon».
       Hisob raqamining boshi ham yoziladi: bir xil taxalluslar
       uchrashi mumkin va qaysi hisob ekanini ajratish kerak. */
    ['Kim', who ? `${who.nickname || 'nomsiz'} · ${who.uid.slice(0, 6)}` : 'mehmon'],
    /* Telefon raqami yoki pochta — hisob nima bilan ochilgan bo'lsa.
       Raqam bilan kirgan odamning manzili `901234567@gmail.com`
       ko'rinishida saqlanadi va [compactLogin] uni yana raqamga
       qaytaradi; haqiqiy pochta esa o'z holicha qoladi.

       Bo'shliqsiz ataylab: guruhda bu qator `<code>` ga
       o'ralmaydi va Telegram raqamni o'zi havolaga aylantiradi —
       xabarni o'qigan odam bosib qo'ng'iroq qila oladi
       (`api/event.ts` dagi `wrap`). */
    ['Aloqa', who?.email ? compactLogin(who.email) : null],
    ['Sahifa', location.pathname],
    ['Qayerdan', source()],
    ['Qurilma', device()],
    ['Ekran', `${window.screen.width}×${window.screen.height}`],
    ['Til', navigator.language],
  ]);
}

/* ── Xatolar ────────────────────────────────────────────────────────── */

/** Sahifadagi tutilmagan xatolar — guruhga.
 *
 *  Ikkala manba ham kerak: `error` — oddiy istisno, `unhandledrejection`
 *  — kutilmay qolgan va'da. Ikkinchisi saytda ko'proq uchraydi, chunki
 *  butun tarmoq qatlami `Promise` ustida.
 *
 *  Har xato **bir marta** yoziladi: tsiklda yiqilayotgan kod bir
 *  soniyada yuzlab xabar yuborardi va guruh ham, Telegram cheklovi ham
 *  buni ko'tarmaydi. Kalit — xabarning o'zi, ya'ni boshqa xato
 *  baribir ko'rinadi. */
export function watchErrors(): void {
  if (!supported) return;

  const report = (message: string, where: string) => {
    const text = message.slice(0, 300);
    trackOnce(`error:${text}`, 'error', [
      ['Xato', text],
      ['Qayerda', where],
      ['Sahifa', location.pathname],
      ['Qurilma', device()],
    ]);
  };

  window.addEventListener('error', (event) => {
    // Rasm yoki skript yuklanmaganda ham shu hodisa keladi, lekin
    // `message` bo'sh bo'ladi — bunday xabardan foyda yo'q.
    if (!event.message) return;
    const at = event.filename
      ? `${event.filename.split('/').pop()}:${event.lineno}`
      : 'noma’lum';
    report(event.message, at);
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const message =
      reason instanceof Error ? reason.message : String(reason ?? 'noma’lum');
    report(message, 'promise');
  });
}

/* ── Qolgan hodisalar ───────────────────────────────────────────────── */

/** Reklama: so'raldi, keldi yoki to'ldirish topilmadi.
 *
 *  Joylashuv ham, blok ham yoziladi: bitta blok bir necha joylashuvga
 *  xizmat qilishi mumkin (`ads.ts` dagi `FALLBACK`) va qaysi sahifada
 *  to'ldirish yo'qligini faqat shu ikkisidan bilinadi. */
export function trackAd(
  placement: AdPlacement,
  result: 'so‘raldi' | 'keldi' | AdFailure,
): void {
  trackOnce(`ad:${placement}:${result}`, 'ad', [
    ['Holat', result],
    ['Joy', placement],
    ['Blok', adUnit(placement)],
    ['Sahifa', location.pathname],
  ]);
}

/** Ulashish tugmasi bosildi. */
export function trackShare(button: string, detail?: string): void {
  track('share', [
    ['Tugma', button],
    ['Nima', detail],
    ['Sahifa', location.pathname],
  ]);
}

/** Do'kon havolasi ochildi — ilovaning saytdan tarqalishi. */
export function trackGet(store: string, where: string): void {
  track('get', [
    ['Do‘kon', store],
    ['Qayerdan', where],
    ['Qurilma', device()],
  ]);
}

/** Tashqi havolalar: do'konlar va Telegram.
 *
 *  Har tugmaga alohida `onClick` osish o'rniga bitta delegatsiya:
 *  do'kon havolasi sakkizdan ortiq joyda turibdi (bosh sahifa,
 *  `/ol`, ilova taklifi, footer, yon ustun) va ularning ro'yxati
 *  o'sib boradi. Delegatsiya yangi joyni o'zi qamrab oladi, qo'lda
 *  osilgan tinglovchi esa unutiladi.
 *
 *  Hodisa bosilganda yuboriladi, havola ochilishini kutmasdan:
 *  bosilgandan keyin varaq do'konga ketishi mumkin va o'shanda
 *  oddiy so'rov uzilib qolardi — `track` aynan shuning uchun
 *  `sendBeacon` dan foydalanadi.
 *
 *  Takror filtri yo'q: so'ralgani aynan har bir bosish. */
export function watchLinks(): void {
  if (!supported) return;

  document.addEventListener('click', (event) => {
    const link = (event.target as Element | null)?.closest('a');
    const href = link?.getAttribute('href') ?? '';
    if (!href) return;

    const store = href.includes('apps.apple.com')
      ? 'App Store'
      : href.includes('play.google.com')
        ? 'Google Play'
        : href.startsWith('https://t.me/')
          ? 'Telegram'
          : '';
    if (!store) return;

    // Havolaning ko'rinadigan matni «qayerdan bosilgani» savoliga
    // manzildan ko'ra aniqroq javob beradi: bir sahifada bir nechta
    // bir xil havola bo'lishi mumkin.
    const label = (link?.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 40);
    trackGet(store, `${location.pathname}${label ? ` · ${label}` : ''}`);
  });
}

/** O'yin tugadi. */
export function trackGame(rows: Row[]): void {
  track('game', rows);
}
