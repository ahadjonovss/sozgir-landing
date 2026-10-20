/** Eski «tiyin» yozuvlarini bir marta aqchaga o'giradi.
 *
 *  Sayt ilgari ballni `aqcha × 10` qilib saqlardi va ekranda o'nga
 *  bo'lardi (`lib/aqcha.ts` dagi izohni qarang). Shkala olib
 *  tashlandi, lekin odamning brauzerida o'sha o'nlangan sonlar
 *  qolgan: o'girilmasa, ular endi o'n barobar **katta** bo'lib
 *  ko'rinardi — 3 aqchalik so'z 30 bo'lib.
 *
 *  Uch joy o'giriladi:
 *   * `sozgir.found` — topilgan so'zning balli;
 *   * `sozgir.guncha.total` va `sozgir.guncha.round.*` — g'unchaning
 *     hamyonga tushgan ulushi;
 *   * `sozgir.game.*` — tugallangan o'yinning natijasi.
 *
 *  Oxirgisida bitta noaniqlik bor va u ataylab shunday qoldirilgan:
 *  seansga ball ikki manbadan tushadi — o'z hisobimizdan
 *  (o'nlangan) va boshqa qurilmada o'ynalgan bo'lsa serverdan
 *  (o'nlanmagan). Yozuvning o'zida qaysi ekani ko'rinmaydi.
 *  Ko'pchiligi birinchisi, shuning uchun hammasi o'giriladi;
 *  ikkinchisi esa o'zini tuzatadi — kunlik o'yin sahifasi
 *  serverdan qayta so'rab, seansni ustiga yozadi (`useSozTop.ts`).
 *  Qolgani ham bir kunlik: ertaga seans yangisiga almashadi.
 *
 *  Serverdagi nusxa tegilmaydi. `found_words` da sayt yozgan
 *  o'nlangan qatorlar bor, lekin ular ilovaga ham tegishli va
 *  brauzerdan turib tuzatish ikkita haqiqat yasardi: bu yoqda
 *  o'girilgan, u yoqda yo'q. Qaysi qator qayerdan kelganini esa
 *  faqat server ajrata oladi.
 *
 *  Bir martalik ekani `sozgir.aqcha.scale` bilan belgilanadi.
 *  Ikkinchi marta yurgizilsa sonlar yana o'nga bo'linib ketardi. */

/** Shkala bir marta tushirilganini bildiradigan kalit. */
const DONE_KEY = 'sozgir.aqcha.scale';

/** Eski shkaladagi ko'paytiruvchi. */
const OLD_SCALE = 10;

/** Eski sonni yangi shkalaga tushiradi.
 *
 *  `Math.round`, `floor` emas: 5 tiyin — yarim aqcha — nolga
 *  tushib, topilgan so'z ballsiz qolib ketardi. Noldan katta har
 *  qanday ball hech bo'lmasa bir aqcha bo'lib qoladi. */
const down = (value: unknown): number => {
  const number = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  if (number <= 0) return 0;
  return Math.max(1, Math.round(number / OLD_SCALE));
};

function edit(key: string, change: (data: Record<string, unknown>) => void): void {
  const raw = localStorage.getItem(key);
  if (!raw) return;
  try {
    const data = JSON.parse(raw) as Record<string, unknown>;
    if (data === null || typeof data !== 'object') return;
    change(data);
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Buzuq yozuv — o'qiy olmaganni tuzatib ham bo'lmaydi.
  }
}

export function scaleStoredAqcha(): void {
  let done = false;
  try {
    done = localStorage.getItem(DONE_KEY) === '1';
  } catch {
    // Shaxsiy rejimda o'qib bo'lmaydi — saqlangan narsa ham yo'q.
    return;
  }
  if (done) return;

  try {
    edit('sozgir.found', (found) => {
      for (const word of Object.values(found)) {
        if (word && typeof word === 'object') {
          const entry = word as Record<string, unknown>;
          entry.score = down(entry.score);
        }
      }
    });

    // G'uncha: yig'ma hisob va har bir raundning «to'langani».
    // `applied.score` tegilmaydi — u xom ball, hech qachon
    // o'nlanmagan (`gunchaProgress.ts`).
    const gunchaKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key === 'sozgir.guncha.total' || key?.startsWith('sozgir.guncha.round.')) {
        gunchaKeys.push(key);
      }
    }
    for (const key of gunchaKeys) {
      edit(key, (data) => {
        if (key === 'sozgir.guncha.total') {
          data.score = down(data.score);
          return;
        }
        const applied = data.applied;
        if (applied && typeof applied === 'object' && 'paid' in applied) {
          const record = applied as Record<string, unknown>;
          record.paid = down(record.paid);
        }
      });
    }

    const gameKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key?.startsWith('sozgir.game.')) gameKeys.push(key);
    }
    for (const key of gameKeys) {
      edit(key, (session) => {
        if (typeof session.points === 'number') session.points = down(session.points);
      });
    }

    localStorage.setItem(DONE_KEY, '1');
  } catch {
    // Yozib bo'lmadi: belgi ham qo'yilmaydi, keyingi tashrifda
    // yana urinib ko'riladi.
  }
}
