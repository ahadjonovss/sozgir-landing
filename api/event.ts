/** Saytdagi hodisalarni Telegram guruhiga yuboradi.
 *
 *  Ilovadagi `Reporter` ning (`lib/core/report/reporter.dart`) sayt
 *  tarafdagi juftligi: o'sha guruh tartibi — bitta guruh, har turkum
 *  o'z mavzusida.
 *
 *  **Nega oraliq funksiya kerak.** Ilova tokenni o'zi bilan olib
 *  yuradi va to'g'ridan-to'g'ri Telegram'ga yozadi. Saytda bunday
 *  qilib bo'lmaydi: brauzerga tushgan hamma narsa ochiq matn, ya'ni
 *  token JavaScript to'plamidan o'qib olinadi va bot begona qo'lga
 *  o'tadi. Shuning uchun sahifa shu funksiyaga yozadi, token esa
 *  Vercel muhitida qoladi.
 *
 *  **Sahifa xabarning shaklini hal qilmaydi.** Mijoz faqat hodisa
 *  turini va qatorlarni yuboradi; sarlavha, teg, mavzu va ovoz shu
 *  yerdagi [EVENTS] jadvalidan olinadi. Aks holda saytga yuborilgan
 *  istalgan so'rov guruhga istalgan matnni istalgan sarlavha bilan
 *  chiqara olardi — marshrut ochiq, uni hamma topadi.
 *
 *  Muhit o'zgaruvchilari:
 *
 *    TELEGRAM_SITE_BOT_TOKEN     sayt guruhidagi bot (@splito_alert_bot)
 *    TELEGRAM_BOT_TOKEN          zaxira: ikkala guruhda bitta bot bo'lsa
 *    TELEGRAM_SITE_CHAT_ID       sayt guruhi — `-100…`
 *    TELEGRAM_SITE_<X>_THREAD    mavzu raqamlari, `tool/telegram-topics.mjs`
 *    TELEGRAM_SITE_VISIT         `0` — tashrif xabarlarini o'chiradi
 *
 *  Guruh yoki token berilmasa funksiya jim turadi: dev va preview
 *  yig'ilishlarida guruh shovqin bo'lmaydi. */

export const config = { runtime: 'edge' };

/** Hodisa turlari — mijoz faqat shu kalitlardan birini yubora oladi.
 *
 *  `loud` — telefonni jiringlatadimi. Faqat xatolar: qolgani kuzatuv
 *  oqimi va har biri bildirishnoma bo'lsa guruh o'chirib qo'yiladi,
 *  keyin xatolar ham ko'rinmay ketadi. */
const EVENTS: Record<string, { tag: string; title: string; thread: string; loud?: boolean }> = {
  visit: { tag: '#tashrif', title: 'Saytga kirildi', thread: 'VISIT' },
  error: { tag: '#xato', title: 'Saytda xato', thread: 'ERRORS', loud: true },
  ad: { tag: '#reklama', title: 'Reklama', thread: 'ADS' },
  share: { tag: '#ulashish', title: 'Ulashildi', thread: 'SHARE' },
  get: { tag: '#yuklab_olish', title: 'Do‘kon havolasi', thread: 'GET' },
  game: { tag: '#oyin', title: 'O‘yin', thread: 'GAME' },
};

/** Bitta xabardagi eng ko'p qator va har birining uzunligi.
 *
 *  Cheklov himoya uchun: marshrut ochiq va unga istalgan hajmdagi
 *  so'rov kelishi mumkin. Telegram xabarning o'zini 4096 belgida
 *  kesadi, bu yerdagi sonlar esa undan ancha past — guruhga o'qib
 *  bo'lmaydigan devor tushmasin. */
const LIMITS = { rows: 12, label: 40, value: 300 } as const;

type Payload = {
  type?: unknown;
  rows?: unknown;
};

function escape(text: string): string {
  return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function clean(value: unknown, limit: number): string {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'boolean') return value ? 'ha' : 'yo‘q';
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, limit);
}

/** Qatorlarni `[label, value]` juftliklaridan yig'adi. */
function body(rows: unknown): string[] {
  if (!Array.isArray(rows)) return [];
  const out: string[] = [];
  for (const row of rows.slice(0, LIMITS.rows)) {
    if (!Array.isArray(row)) continue;
    const label = clean(row[0], LIMITS.label);
    const value = clean(row[1], LIMITS.value);
    if (!label || !value) continue;
    out.push(`${escape(label)}: <code>${escape(value)}</code>`);
  }
  return out;
}

/** Odam qayerdan ulangan — shahar va davlat.
 *
 *  Sarlavhalarni Vercel chekkasi o'zi qo'yadi: mijoz hech narsa
 *  yubormaydi va yubora ham olmaydi (bu sarlavhalar tashqaridan
 *  kelsa ham ustidan yoziladi). Shuning uchun bu qator xabardagi
 *  yagona ishonchli ma'lumot.
 *
 *  IP yozilmaydi — u shaxsiy ma'lumot va xabarni o'qiyotgan odamga
 *  hech narsa bermaydi. Shahar va davlat «kimlar kiryapti» degan
 *  savolga yetarli javob.
 *
 *  Shahar nomi foizli kodlangan holda keladi (`Tashkent`,
 *  `Nukus`, lekin `San%20Francisco` ham) — ochib beriladi. */
function place(request: Request): string {
  const head = (name: string) => request.headers.get(name) ?? '';
  let city = head('x-vercel-ip-city');
  try {
    city = decodeURIComponent(city);
  } catch {
    // Kodlash buzuq — borini olamiz.
  }
  const country = head('x-vercel-ip-country');
  return [city, country].filter(Boolean).join(', ');
}

/** So'rov saytning o'zidan keldimi.
 *
 *  Bu to'siq emas — `Origin` ni istalgan skript qo'lda qo'ya oladi va
 *  buni yashirmayapmiz. U tasodifiy va havaskor shovqinni to'xtatadi:
 *  marshrutni ko'rib qolgan odam brauzerning boshqa sahifasidan
 *  yuborolmaydi. Jiddiyroq himoya kerak bo'lsa imzolangan nonce
 *  qo'shiladi, lekin bu yerdagi ma'lumot shunga arzimaydi. */
function sameSite(request: Request): boolean {
  const origin = request.headers.get('origin');
  // Beacon ba'zan `Origin` yubormaydi (sahifa yopilayotgan payt) —
  // bunday so'rov ham o'tkaziladi, aks holda eng kerakli xabarlar
  // (sahifadan chiqishdagi xato) yo'qolardi.
  if (!origin) return true;
  try {
    const host = new URL(origin).hostname;
    return host === 'sozgir.uz' || host.endsWith('.sozgir.uz') || host === 'localhost';
  } catch {
    return false;
  }
}

export default async function handler(request: Request): Promise<Response> {
  // Beacon javobni kutmaydi va kutsa ham o'qimaydi, shuning uchun har
  // holatda 204: sahifada xato ko'rinmasin va qayta urinish bo'lmasin.
  const done = () => new Response(null, { status: 204 });

  if (request.method !== 'POST' || !sameSite(request)) return done();

  /* Sayt guruhida **boshqa** bot turibdi (@splito_alert_bot), ilova
     guruhidagi @sozgirbot esa unga a'zo emas. Shuning uchun token ham
     alohida: eskisini ishlatish «chat not found» degan jim xatoga
     olib kelardi. Zaxira baribir qoldirildi — keyinchalik ikkala
     guruhga bitta bot qo'yilsa, bitta o'zgaruvchi yetadi. */
  const token = process.env.TELEGRAM_SITE_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_SITE_CHAT_ID;
  if (!token || !chatId) return done();

  let payload: Payload;
  try {
    payload = (await request.json()) as Payload;
  } catch {
    return done();
  }

  const type = typeof payload.type === 'string' ? payload.type : '';
  const event = EVENTS[type];
  if (!event) return done();

  // Tashriflar oqimini bitta kalit bilan o'chirish mumkin: trafik
  // o'sganda u kuniga minglab xabarga aylanadi va guruhni bosib
  // ketadi. Qolgan oqimlar o'z joyida qoladi.
  if (type === 'visit' && process.env.TELEGRAM_SITE_VISIT === '0') return done();

  const rows = body(payload.rows);
  /* Joy oxirida: mijoz yuborgan qatorlar birinchi o'rinda turadi,
     chunki xabarning mazmuni o'sha yerda. */
  const where = place(request);
  if (where) rows.push(`Joy: <code>${escape(where)}</code>`);

  const text = [`${event.tag} <b>${escape(event.title)}</b>`, ...rows].join('\n');
  const threadId = Number(process.env[`TELEGRAM_SITE_${event.thread}_THREAD`] ?? 0);

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        disable_notification: event.loud !== true,
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
