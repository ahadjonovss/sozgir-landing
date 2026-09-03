/** Contact formadan kelgan so'rovni Telegram guruhiga yuboradi.
 *
 *  Xabar formati soztop ilovasidagi `Reporter` bilan bir xil (HTML, `label:
 *  <code>value</code>` qatorlari), shunda ikki oqim bitta guruhda bir ko'rinishda
 *  bo'ladi. Token repozitoriyada saqlanmaydi — Vercel muhit o'zgaruvchilari:
 *
 *    TELEGRAM_BOT_TOKEN      bot tokeni
 *    TELEGRAM_CHAT_ID        guruh yoki kanal ID
 *    TELEGRAM_CONTACT_THREAD mavzu (topic) raqami, ixtiyoriy
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

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
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

  const threadId = Number(process.env.TELEGRAM_CONTACT_THREAD ?? 0);
  const time = new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' });

  const text = [
    '📬 <b>Saytdan yangi so‘rov</b>',
    row('Ism', name),
    row('Email', email),
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
