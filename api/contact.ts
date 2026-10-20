/** Contact formadan kelgan so'rovni Telegram guruhiga yuboradi.
 *
 *  Xabar formati soztop ilovasidagi `Reporter` bilan bir xil (HTML, `label:
 *  <code>value</code>` qatorlari), shunda ikki oqim bitta guruhda bir ko'rinishda
 *  bo'ladi. Token repozitoriyada saqlanmaydi — Vercel muhit o'zgaruvchilari:
 *
 *    TELEGRAM_SITE_BOT_TOKEN      sayt guruhidagi bot va
 *    TELEGRAM_SITE_CHAT_ID        sayt guruhi — **ikkalasi birga**
 *    TELEGRAM_SITE_CONTACT_THREAD sayt guruhidagi «Aloqa» mavzusi
 *    TELEGRAM_BOT_TOKEN           ilova guruhidagi bot va
 *    TELEGRAM_CHAT_ID             eski guruh — zaxira
 *    TELEGRAM_CONTACT_THREAD      eski guruhdagi mavzu
 *
 *  Sayt guruhi sozlangandan keyin so'rovlar o'sha yerga tushadi: sayt
 *  bilan bog'liq hamma narsa (tashrif, xato, reklama, aloqa) bir
 *  joyda bo'lsin. Sozlanmagan bo'lsa eski guruh ishlaydi — preview
 *  yig'ilishida ham forma ishlab turadi va xabar yo'qolmaydi.
 *
 *  Token va guruh **juft** olinadi, alohida emas. Ikkala guruhda
 *  ikki xil bot turibdi va aralashtirilsa forma jimgina yiqilardi:
 *  bot a'zo bo'lmagan guruhga yozmoqchi bo'lib, Telegram'dan
 *  «chat not found» olardi — foydalanuvchi esa «yuborildi» degan
 *  javobni ko'rardi.
 */

export const config = { runtime: 'edge' };

type Payload = {
  name?: unknown;
  email?: unknown;
  topic?: unknown;
  message?: unknown;
};

const LIMITS = { name: 80, email: 120, topic: 60, message: 2000 } as const;

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Telegram HTML rejimida `<`, `>`, `&` belgilarini himoyalash. */
function escape(text: string): string {
  return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function clean(value: unknown, limit: number): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, limit);
}

function row(label: string, value: string): string {
  return `${label}: <code>${escape(value)}</code>`;
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return json(405, { error: 'Faqat POST' });
  }

  // Sayt guruhi ustun, lekin faqat **to'liq** sozlangan bo'lsa:
  // token ham, guruh ham. Yarimta sozlama eskisiga tushadi.
  const siteToken = process.env.TELEGRAM_SITE_BOT_TOKEN;
  const siteChat = process.env.TELEGRAM_SITE_CHAT_ID;
  const site = Boolean(siteToken && siteChat);

  const token = site ? siteToken : process.env.TELEGRAM_BOT_TOKEN;
  const chatId = site ? siteChat : process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    return json(503, { error: 'Telegram sozlanmagan' });
  }

  let payload: Payload;
  try {
    payload = (await request.json()) as Payload;
  } catch {
    return json(400, { error: 'JSON o‘qilmadi' });
  }

  const name = clean(payload.name, LIMITS.name);
  const email = clean(payload.email, LIMITS.email);
  const topic = clean(payload.topic, LIMITS.topic) || 'Boshqa';
  const message = typeof payload.message === 'string' ? payload.message.trim().slice(0, LIMITS.message) : '';

  if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || message.length < 10) {
    return json(422, { error: 'Maydonlar to‘liq emas' });
  }

  // Mavzu ham guruh bilan birga tanlanadi: boshqa guruhning mavzu
  // raqami bilan yozilgan xabar umuman ketmaydi.
  const threadId = Number(
    (site
      ? process.env.TELEGRAM_SITE_CONTACT_THREAD
      : process.env.TELEGRAM_CONTACT_THREAD) ?? 0,
  );
  const time = new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' });

  // Birinchi qator — manba tegi: guruhda ilova va sayt xabarlari bir
  // oqimda, `#web` bo'yicha qidirish va ajratish oson. Ostida kim
  // yozgani: ism va email.
  const text = [
    '#web',
    `<b>${escape(name)}</b> · ${escape(email)}`,
    '',
    '📬 <b>Saytdan yangi so‘rov</b>',
    row('Mavzu', topic),
    '',
    escape(message),
    '',
    `<i>sozgir.uz · ${time}</i>`,
  ].join('\n');

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
    // Tafsilot faqat logda qoladi — foydalanuvchiga token yoki chat ko'rinmaydi.
    console.error('Telegram', response.status, await response.text());
    return json(502, { error: 'Telegramga yuborilmadi' });
  }

  return json(200, { ok: true });
}
