/** Kunlik hisobot — Yandex Metrika raqamlari Telegram guruhiga.
 *
 *  Kuniga bir marta ishga tushadi (`vercel.json` dagi `crons`) va
 *  kechagi kun bo'yicha qisqa xabar yozadi: tashriflar, odamlar,
 *  ko'rishlar, rad etish foizi, ko'rish chuqurligi, o'rtacha vaqt,
 *  eng ko'p ochilgan sahifalar va manbalar.
 *
 *  **Nega oqimning yonida hisobot ham kerak.** `api/event.ts` jonli
 *  oqim beradi: nima bo'layotgani darhol ko'rinadi. Lekin «kecha
 *  qancha odam keldi, o'tgan haftaga nisbatan ko'pmi» degan savolga
 *  oqim javob bermaydi — uni sanab chiqish kerak bo'lardi. Metrika
 *  esa buni allaqachon sanab qo'ygan.
 *
 *  Muhit o'zgaruvchilari:
 *
 *    YANDEX_METRIKA_TOKEN      OAuth token — `oauth.yandex.com`
 *    YANDEX_METRIKA_COUNTER    hisoblagich raqami (standart: 113700305)
 *    TELEGRAM_SITE_BOT_TOKEN   sayt guruhidagi bot (@splito_alert_bot)
 *    TELEGRAM_BOT_TOKEN        zaxira: ikkala guruhda bitta bot bo'lsa
 *    TELEGRAM_SITE_CHAT_ID     sayt guruhi
 *    TELEGRAM_SITE_DAILY_THREAD «Kunlik hisobot» mavzusi
 *    CRON_SECRET               berilsa, so'rov shu bilan tekshiriladi
 *
 *  Token berilmasa marshrut jim turadi va 204 qaytaradi: hisobot
 *  yo'qligi saytning ishiga ta'sir qilmaydi.
 *
 *  Jadval `vercel.json` da: `0 4 * * *` — 04:00 UTC, ya'ni 09:00
 *  Toshkent. Vercel bepul rejada kuniga bitta cron beradi va vaqtini
 *  aniq kafolatlamaydi: xabar bir-ikki soat kechikishi mumkin va bu
 *  kunlik hisobot uchun ahamiyatsiz. (`vercel.json` — sof JSON,
 *  izoh yozib bo'lmaydi, shuning uchun u shu yerda.)
 *
 *  Marshrut `GET` — Vercel cron aynan shunday chaqiradi. Uni qo'lda
 *  ham ochish mumkin (`/api/daily`), bu sozlashni tekshirishning eng
 *  tez yo'li. */

export const config = { runtime: 'edge' };

const COUNTER = () => process.env.YANDEX_METRIKA_COUNTER || '113700305';

const API = 'https://api-metrika.yandex.net/stat/v1/data';

/** Metrika javobining kerakli qismi.
 *
 *  `totals` — umumiy sonlar, so'ralgan metrikalar tartibida.
 *  `data` — kesim bo'yicha qatorlar: har birida `dimensions` (nomlar)
 *  va `metrics` (sonlar). */
type Report = {
  totals?: number[];
  data?: { dimensions?: { name?: string | null }[]; metrics?: number[] }[];
};

async function ask(token: string, params: Record<string, string>): Promise<Report | null> {
  const query = new URLSearchParams({
    ids: COUNTER(),
    date1: 'yesterday',
    date2: 'yesterday',
    accuracy: 'full',
    ...params,
  });
  try {
    const response = await fetch(`${API}?${query}`, {
      headers: { Authorization: `OAuth ${token}` },
    });
    if (!response.ok) {
      console.error('Metrika', response.status, await response.text());
      return null;
    }
    return (await response.json()) as Report;
  } catch (error) {
    console.error('Metrika', String(error));
    return null;
  }
}

/** Sonni o'qiladigan shaklga keltiradi: `1234` → `1 234`. */
const group = (value: number): string =>
  Math.round(value).toLocaleString('ru-RU').replace(/ /g, ' ');

/** Kasrli ko'rsatkich — bitta raqamdan keyin kesiladi. */
const round = (value: number): string => value.toFixed(1).replace('.0', '');

/** Soniyani `3 daq 20 son` ko'rinishiga keltiradi. */
function duration(seconds: number): string {
  const total = Math.round(seconds);
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return minutes > 0 ? `${minutes} daq ${rest} son` : `${rest} son`;
}

function escape(text: string): string {
  return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

/** Kesim qatorlarini ro'yxatga aylantiradi. */
function list(report: Report | null, limit: number): string[] {
  return (report?.data ?? [])
    .slice(0, limit)
    .map((row) => {
      const name = row.dimensions?.[0]?.name ?? '—';
      const value = row.metrics?.[0] ?? 0;
      return `• ${escape(String(name).slice(0, 60))} — ${group(value)}`;
    });
}

export default async function handler(request: Request): Promise<Response> {
  const done = () => new Response(null, { status: 204 });

  /* Marshrut ochiq, ya'ni uni istagan odam chaqira oladi va guruhga
     ortiqcha hisobot tushirishi mumkin. `CRON_SECRET` berilgan bo'lsa
     Vercel uni har cron so'rovida yuboradi va boshqalar o'tmaydi.
     Berilmasa tekshiruv yo'q — zarari bitta ortiqcha xabar. */
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response(null, { status: 401 });
  }

  const metrika = process.env.YANDEX_METRIKA_TOKEN;
  const token = process.env.TELEGRAM_SITE_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_SITE_CHAT_ID;
  if (!metrika || !token || !chatId) return done();

  const [summary, pages, sources] = await Promise.all([
    ask(metrika, {
      metrics:
        'ym:s:visits,ym:s:users,ym:s:pageviews,ym:s:bounceRate,ym:s:pageDepth,ym:s:avgVisitDurationSeconds',
    }),
    ask(metrika, {
      metrics: 'ym:pv:pageviews',
      dimensions: 'ym:pv:URLPath',
      sort: '-ym:pv:pageviews',
      limit: '5',
    }),
    ask(metrika, {
      metrics: 'ym:s:visits',
      dimensions: 'ym:s:lastTrafficSource',
      sort: '-ym:s:visits',
      limit: '5',
    }),
  ]);

  // Umumiy sonlarsiz hisobotning ma'nosi yo'q: qolgan ikkitasi
  // shularning taqsimoti. Kelmasa jim o'tiladi va ertaga qayta
  // urinib ko'riladi — bir kunlik hisobot yo'qolgani xato emas.
  if (!summary?.totals) return done();

  const [visits = 0, users = 0, views = 0, bounce = 0, depth = 0, time = 0] = summary.totals;

  const yesterday = new Date(Date.now() - 86_400_000).toLocaleDateString('uz-UZ', {
    timeZone: 'Asia/Tashkent',
    day: 'numeric',
    month: 'long',
  });

  const text = [
    `📊 <b>Kunlik hisobot</b> · ${escape(yesterday)}`,
    '',
    `Tashrif: <b>${group(visits)}</b>`,
    `Odam: <b>${group(users)}</b>`,
    `Sahifa ko‘rish: <b>${group(views)}</b>`,
    `Rad etish: <b>${round(bounce)}%</b>`,
    `Chuqurlik: <b>${round(depth)}</b> sahifa`,
    `O‘rtacha vaqt: <b>${duration(time)}</b>`,
    ...(pages?.data?.length ? ['', '<b>Sahifalar</b>', ...list(pages, 5)] : []),
    ...(sources?.data?.length ? ['', '<b>Manbalar</b>', ...list(sources, 5)] : []),
  ].join('\n');

  const threadId = Number(process.env.TELEGRAM_SITE_DAILY_THREAD ?? 0);

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        ...(threadId > 0 ? { message_thread_id: threadId } : {}),
      }),
    });
    if (!response.ok) {
      console.error('Telegram', response.status, await response.text());
    }
  } catch (error) {
    console.error('Telegram', String(error));
  }

  return done();
}
