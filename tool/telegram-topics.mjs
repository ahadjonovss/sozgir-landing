/** Sayt guruhida mavzularni (forum topic) ochadi — bir marta.
 *
 *  Telegram mavzuni faqat Bot API orqali ochishga ruxsat beradi va
 *  har mavzuning `message_thread_id` si javobdan chiqadi. Qo'lda
 *  ochilsa bu raqamni topish uchun mavzudagi xabarni ochib, havoladan
 *  ko'chirib olish kerak — sakkizta mavzu uchun sakkiz marta. Shuning
 *  uchun skript: u mavzularni ochadi va tayyor env satrlarini chop
 *  etadi.
 *
 *  Ishlatish:
 *
 *      TELEGRAM_BOT_TOKEN=... TELEGRAM_SITE_CHAT_ID=-100... \
 *        node tool/telegram-topics.mjs
 *
 *  Bot guruhda **administrator** bo'lishi va «Manage topics» huquqi
 *  bo'lishi shart, aks holda Telegram `CHAT_ADMIN_REQUIRED` qaytaradi.
 *
 *  Skript **takror ochmaydi**: guruhdagi mavzular ro'yxatini oldindan
 *  o'qib bo'lmaydi (Bot API bunday marshrut bermaydi), shuning uchun
 *  qayta ishga tushirilsa o'sha nomdagi ikkinchi mavzu paydo bo'ladi.
 *  Bir marta ishga tushiring va natijani Vercel'ga ko'chiring. */

/** Mavzular — nomi, rangi va qaysi env'ga yozilishi.
 *
 *  Tartib ahamiyatli: Telegram mavzularni ochilish tartibida
 *  ko'rsatadi, ya'ni eng ko'p qaraladigani yuqorida tursin. */
const TOPICS = [
  { env: 'TELEGRAM_SITE_DAILY_THREAD', name: '📊 Kunlik hisobot', color: 0x6fb9f0 },
  { env: 'TELEGRAM_SITE_ERRORS_THREAD', name: '⚠️ Xatolar', color: 0xff93b2 },
  { env: 'TELEGRAM_SITE_CONTACT_THREAD', name: '📨 Aloqa', color: 0xffd67e },
  { env: 'TELEGRAM_SITE_GAME_THREAD', name: '🎮 O‘yin', color: 0x8eee98 },
  { env: 'TELEGRAM_SITE_ADS_THREAD', name: '📣 Reklama', color: 0xfb6f5f },
  { env: 'TELEGRAM_SITE_SHARE_THREAD', name: '🔗 Ulashish', color: 0xcb86db },
  { env: 'TELEGRAM_SITE_GET_THREAD', name: '⬇️ Yuklab olish', color: 0x6fb9f0 },
  { env: 'TELEGRAM_SITE_VISIT_THREAD', name: '👁 Tashriflar', color: 0x8eee98 },
];

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_SITE_CHAT_ID;

if (!token || !chatId) {
  console.error(
    'TELEGRAM_BOT_TOKEN va TELEGRAM_SITE_CHAT_ID kerak.\n' +
      'Masalan: TELEGRAM_BOT_TOKEN=… TELEGRAM_SITE_CHAT_ID=-100… node tool/telegram-topics.mjs',
  );
  process.exit(1);
}

const lines = [];

for (const topic of TOPICS) {
  const response = await fetch(`https://api.telegram.org/bot${token}/createForumTopic`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      chat_id: chatId,
      name: topic.name,
      icon_color: topic.color,
    }),
  });

  const data = await response.json();
  if (!data.ok) {
    console.error(`✗ ${topic.name}: ${data.description ?? response.status}`);
    continue;
  }

  const id = data.result.message_thread_id;
  console.error(`✓ ${topic.name} — ${id}`);
  lines.push(`${topic.env}=${id}`);
}

if (lines.length === 0) process.exit(1);

// Natija `stdout` ga, jarayon haqidagi xabarlar `stderr` ga: shunda
// chiqishni to'g'ridan-to'g'ri faylga yo'naltirish mumkin.
console.log('');
console.log(`TELEGRAM_SITE_CHAT_ID=${chatId}`);
for (const line of lines) console.log(line);
