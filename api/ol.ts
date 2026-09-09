/** Ulashish havolasi ochilganini qayd qiladi.
 *
 *  Sahifa (`public/ol/index.html`) ochilganda bitta `sendBeacon` yuboradi,
 *  qolgan hammasi shu yerda:
 *
 *    1. **Telegram** — alohida mavzuga (topic) xabar: qaysi manba, qaysi
 *       joydan, qanday qurilma va OS. Birinchi qator heshteglar bilan,
 *       shunda guruhda `#telegram` yoki `#ios` bo'yicha filtrlash mumkin.
 *    2. **Firestore** — `link_hits/{manba}_{sana}` hujjatidagi hisoblagich
 *       bittaga oshadi. Admin panel shu hujjatlardan statistika yig'adi.
 *
 *  Nega server tomonida: sahifa telefonda 400 ms dan keyin do'konga
 *  yo'naltiriladi, ya'ni unda ikki so'rovga vaqt yo'q. Bitta beacon
 *  yuboriladi, javob kutilmaydi — funksiya esa ikki ishni parallel
 *  bajaradi.
 *
 *  Vercel muhit o'zgaruvchilari:
 *
 *    TELEGRAM_BOT_TOKEN   bot tokeni (contact.ts bilan bir xil)
 *    TELEGRAM_CHAT_ID     guruh yoki kanal ID
 *    TELEGRAM_OL_THREAD   havolalar uchun mavzu (topic) raqami
 *
 *  Telegram sozlanmagan bo'lsa faqat hisoblagich yoziladi — sahifa
 *  baribir ishlaydi.
 */

export const config = { runtime: 'edge' };

/** Firebase web konfiguratsiyasining shu yerda kerakli qismi.
 *
 *  `src/firebase/config.ts` bilan bir xil bo'lishi kerak — biri
 *  o'zgarsa, ikkinchisi ham. Bu kalit mijozda ham ochiq (Firebase web
 *  config), haqiqiy himoya Firestore qoidalarida: `link_hits` ga faqat
 *  «bitta bosish qo'shildi» shaklidagi yozuv o'tadi. */
const PROJECT_ID = 'soztop-prod';
const API_KEY = 'AIzaSyCWqqyVZdjBY6FSonDLfjXhfWBt_RODcfQ';

const ROOT = `projects/${PROJECT_ID}/databases/(default)/documents`;

/** Manba kalitlari — sahifadagi va Firestore qoidalaridagi ro'yxat bilan
 *  bir xil. Kalit URL'ning birinchi bo'lagidan keladi: `/t/ol` →
 *  `telegram`, `/ol` → `web`. */
const SOURCES: Record<string, { name: string; emoji: string }> = {
  web: { name: 'To‘g‘ridan-to‘g‘ri', emoji: '🌐' },
  telegram: { name: 'Telegram', emoji: '✈️' },
  x: { name: 'X (Twitter)', emoji: '🐦' },
  threads: { name: 'Threads', emoji: '🧵' },
  instagram: { name: 'Instagram', emoji: '📸' },
  tiktok: { name: 'TikTok', emoji: '🎵' },
  youtube: { name: 'YouTube', emoji: '▶️' },
  facebook: { name: 'Facebook', emoji: '📘' },
  other: { name: 'Boshqa', emoji: '🔗' },
};

const PLATFORMS = ['ios', 'android', 'desktop'] as const;
type Platform = (typeof PLATFORMS)[number];

/** Eng ko'p uchraydigan davlatlar — qolganlari kod bilan qoladi. */
const COUNTRIES: Record<string, string> = {
  UZ: 'O‘zbekiston',
  RU: 'Rossiya',
  KZ: 'Qozog‘iston',
  KG: 'Qirg‘iziston',
  TJ: 'Tojikiston',
  TM: 'Turkmaniston',
  TR: 'Turkiya',
  AZ: 'Ozarbayjon',
  US: 'AQSH',
  DE: 'Germaniya',
  GB: 'Buyuk Britaniya',
  KR: 'Koreya',
  AE: 'BAA',
  SA: 'Saudiya Arabistoni',
  PL: 'Polsha',
  UA: 'Ukraina',
  CN: 'Xitoy',
  IN: 'Hindiston',
  JP: 'Yaponiya',
};

type Payload = {
  source?: unknown;
  path?: unknown;
  platform?: unknown;
  ua?: unknown;
  lang?: unknown;
  screen?: unknown;
  dpr?: unknown;
  referrer?: unknown;
  tz?: unknown;
};

function clean(value: unknown, limit: number): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, limit);
}

/** Telegram HTML rejimida `<`, `>`, `&` belgilarini himoyalash. */
function escape(text: string): string {
  return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function row(label: string, value: string): string {
  return `${label}: <code>${escape(value)}</code>`;
}

/** Toshkent vaqtidagi sana kaliti — hisoblagich kunlar bo'yicha. */
function dateKey(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Tashkent' });
}

/** Qurilma, OS va brauzer — `User-Agent` satridan.
 *
 *  Ilova ichidagi brauzerlar alohida ajratiladi (Instagram, Facebook,
 *  X): ular manbani URL'dan mustaqil ravishda tasdiqlaydi, ya'ni havola
 *  qayerdan bosilganini ikki tomondan ko'rish mumkin. */
function parseAgent(ua: string): { device: string; os: string; browser: string } {
  let device = 'Noma’lum';
  let os = 'Noma’lum';

  const ios = /(?:iPhone|CPU) OS (\d+(?:[._]\d+)*)/.exec(ua);
  const android = /Android (\d+(?:\.\d+)*)/.exec(ua);
  const mac = /Mac OS X (\d+(?:[._]\d+)*)/.exec(ua);
  const windows = /Windows NT (\d+(?:\.\d+)*)/.exec(ua);

  if (/iPhone|iPad|iPod/.test(ua)) {
    device = /iPad/.test(ua) ? 'iPad' : /iPod/.test(ua) ? 'iPod' : 'iPhone';
    os = ios ? `iOS ${ios[1].replaceAll('_', '.')}` : 'iOS';
  } else if (android) {
    // `Build/` dan oldingi bo'lak — qurilma modeli (masalan SM-A546E).
    const model = /;\s*([^;)]+?)\s+Build\//.exec(ua) ?? /Android[^;)]*;\s*([^;)]+?)\)/.exec(ua);
    device = model ? clean(model[1], 40) : 'Android';
    os = `Android ${android[1]}`;
  } else if (mac) {
    device = 'Mac';
    os = `macOS ${mac[1].replaceAll('_', '.')}`;
  } else if (windows) {
    device = 'Windows';
    os = windows[1] === '10.0' ? 'Windows 10/11' : `Windows NT ${windows[1]}`;
  } else if (/Linux/.test(ua)) {
    device = 'Linux';
    os = 'Linux';
  }

  let browser = 'Noma’lum';
  const version = (pattern: RegExp) => pattern.exec(ua)?.[1] ?? '';

  if (/Instagram/i.test(ua)) browser = 'Instagram ichida';
  else if (/FBAN|FBAV|FB_IAB/.test(ua)) browser = 'Facebook ichida';
  else if (/Twitter/i.test(ua)) browser = 'X ichida';
  else if (/TikTok|BytedanceWebview|musical_ly/i.test(ua)) browser = 'TikTok ichida';
  else if (/Telegram/i.test(ua)) browser = 'Telegram ichida';
  else if (/Edg\//.test(ua)) browser = `Edge ${version(/Edg\/([\d.]+)/)}`;
  else if (/OPR\//.test(ua)) browser = `Opera ${version(/OPR\/([\d.]+)/)}`;
  else if (/YaBrowser/.test(ua)) browser = `Yandex ${version(/YaBrowser\/([\d.]+)/)}`;
  else if (/Firefox\//.test(ua)) browser = `Firefox ${version(/Firefox\/([\d.]+)/)}`;
  else if (/Chrome\//.test(ua)) browser = `Chrome ${version(/Chrome\/([\d.]+)/)}`;
  else if (/Safari\//.test(ua)) browser = `Safari ${version(/Version\/([\d.]+)/)}`;

  return { device, os, browser: browser.trim() };
}

/** Preview botlari (Telegram, Facebook, X) — sanamaymiz va xabar
 *  yubormaymiz. Ular JS ishlatmaydi, ya'ni bu yerga faqat manzil qo'lda
 *  chaqirilganda kelib qoladi. */
function isBot(ua: string): boolean {
  return /bot|crawler|spider|preview|facebookexternalhit|slurp|headless/i.test(ua);
}

/** Hisoblagichni bittaga oshiradi.
 *
 *  Bitta `commit`: `source` va `date` maydonlari `updateMask` bilan
 *  yoziladi (ya'ni qo'shiladi, hujjatni almashtirmaydi), hisoblagichlar
 *  esa `increment` bilan oshadi. Hujjat bo'lmasa shu yozuv uni yaratadi:
 *  yo'q maydonga `increment` 0 dan boshlaydi. */
async function countHit(source: string, platform: Platform): Promise<void> {
  const date = dateKey();
  const document = `${ROOT}/link_hits/${source}_${date}`;
  const increments = PLATFORMS.map((name) => ({
    fieldPath: name,
    increment: { integerValue: name === platform ? '1' : '0' },
  }));

  const response = await fetch(
    `https://firestore.googleapis.com/v1/${ROOT}:commit?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        writes: [
          {
            update: {
              name: document,
              fields: {
                source: { stringValue: source },
                date: { stringValue: date },
              },
            },
            updateMask: { fieldPaths: ['source', 'date'] },
            updateTransforms: [
              { fieldPath: 'hits', increment: { integerValue: '1' } },
              ...increments,
              { fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' },
            ],
          },
        ],
      }),
    },
  );

  if (!response.ok) {
    console.error('link_hits', response.status, await response.text());
  }
}

async function notify(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const threadId = Number(process.env.TELEGRAM_OL_THREAD ?? 0);
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      disable_notification: true,
      ...(threadId > 0 ? { message_thread_id: threadId } : {}),
    }),
  });

  if (!response.ok) {
    console.error('Telegram', response.status, await response.text());
  }
}

export default async function handler(request: Request): Promise<Response> {
  // Beacon javobni kutmaydi, shuning uchun har holatda 204 qaytadi:
  // sahifada xato ko'rinmasin va qayta urinish bo'lmasin.
  const done = () => new Response(null, { status: 204 });

  if (request.method !== 'POST') return done();

  let payload: Payload;
  try {
    payload = (await request.json()) as Payload;
  } catch {
    return done();
  }

  const key = clean(payload.source, 20);
  const source = key in SOURCES ? key : 'other';
  const platform = (PLATFORMS as readonly string[]).includes(clean(payload.platform, 10))
    ? (payload.platform as Platform)
    : 'desktop';

  const ua = clean(payload.ua, 400) || request.headers.get('user-agent') || '';
  if (isBot(ua)) return done();

  const { device, os, browser } = parseAgent(ua);

  // Joy — Vercel'ning chegaradagi sarlavhalaridan. IP yozilmaydi:
  // statistikaga shahar va davlat yetadi, maxfiylik siyosati ham shunday.
  const country = (request.headers.get('x-vercel-ip-country') ?? '').toUpperCase();
  const city = decodeURIComponent(request.headers.get('x-vercel-ip-city') ?? '').trim();
  const region = decodeURIComponent(
    request.headers.get('x-vercel-ip-country-region') ?? '',
  ).trim();

  const place =
    [city, COUNTRIES[country] ?? country].filter(Boolean).join(' · ') || 'Noma’lum';

  const info = SOURCES[source];
  const path = clean(payload.path, 60) || '/ol';
  const screen = clean(payload.screen, 20);
  const dpr = clean(payload.dpr, 6);
  const referrer = clean(payload.referrer, 120);
  const store = platform === 'ios' ? 'App Store' : platform === 'android' ? 'Google Play' : '—';
  const time = new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' });

  // Birinchi qator — heshteglar: guruhda manba, platforma va davlat
  // bo'yicha qidirish shu bilan ishlaydi.
  const tags = ['#ol', `#${source}`, `#${platform}`, country ? `#${country}` : '']
    .filter(Boolean)
    .join(' ');

  const text = [
    tags,
    `${info.emoji} <b>${escape(info.name)} — havola ochildi</b>`,
    '',
    row('Sahifa', path),
    row('Joy', place),
    ...(region && region !== city ? [row('Viloyat', region)] : []),
    row('Qurilma', device),
    row('OS', os),
    row('Brauzer', browser),
    ...(screen ? [row('Ekran', dpr ? `${screen} @${dpr}x` : screen)] : []),
    ...(clean(payload.lang, 20) ? [row('Til', clean(payload.lang, 20))] : []),
    ...(clean(payload.tz, 40) ? [row('Mintaqa', clean(payload.tz, 40))] : []),
    ...(referrer ? [row('Yo‘naltirgan', referrer)] : []),
    row('Do‘kon', store),
    '',
    `<i>sozgir.uz${path} · ${time}</i>`,
  ].join('\n');

  // Ikki ish bir-biriga bog'liq emas: biri yiqilsa, ikkinchisi bajariladi.
  await Promise.allSettled([notify(text), countHit(source, platform)]);

  return done();
}
