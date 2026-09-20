/** Ilova taklifi — qachon chiqishi.
 *
 *  Oynaning o'zi `components/AppPopup.tsx` da; bu yerda faqat qaror:
 *  **kimga** va **qachon** ko'rsatiladi. Ikkisi ajratilgan, chunki
 *  chaqiruvchi (o'yin natijasi) oynaning o'zini bilmasligi kerak —
 *  u shunchaki «o'yin tugadi» deb aytadi.
 *
 *  Ikkita sabab bor:
 *
 *  * **`open`** — sahifa ochilgan zahoti (bir necha soniyadan keyin);
 *  * **`result`** — o'yin tugagach, har safar. Aynan shu payt taklif eng
 *    o'rinli: odam o'ynab bo'ldi, yoqdi yoki yoqmadi degan qarorini
 *    allaqachon qildi va hozir bo'sh. Ochilishdagi taklif esa hali hech
 *    narsa ko'rmagan odamga aytiladi.
 *
 *  Chegaralar ikki sabab uchun ikki xil:
 *
 *  * **`open` — kuniga bir marta.** Sahifa har ochilganda chiqsa, u
 *    reklama emas, to'siq bo'lardi: odam hali hech narsa qilmagan.
 *    Ustiga oyna endigina yopilgan bo'lsa (`QUIET_MS`) u ham
 *    ochilmaydi — «yo'q» degan odamdan uch daqiqada qayta so'rash
 *    bosim bo'lardi.
 *  * **`result` — har o'yindan keyin.** Bu ongli qaror: o'yin tugagani
 *    taklif uchun eng kuchli payt va u har safar takrorlanadi. Odam
 *    nima qilayotganini biladi — o'yinni o'zi tugatdi, oyna esa uning
 *    ustiga chiqadi, ishini bo'lmaydi. */

export type PromoReason = 'open' | 'result';

/** Kunlik hisobi bor sabablar. `result` bu yerda yo'q: u har o'yindan
 *  keyin chiqadi, ya'ni sanab turishning ma'nosi yo'q. */
const KEYS: Partial<Record<PromoReason, string>> = {
  open: 'sozgir.app.promo',
};

/** Oxirgi yopilgan vaqt — sabablarning hammasi uchun umumiy. */
const CLOSED_KEY = 'sozgir.app.promo.at';

/** Oyna yopilgandan keyin shuncha vaqt hech qanday taklif chiqmaydi. */
const QUIET_MS = 3 * 60 * 1000;

const listeners = new Set<(reason: PromoReason) => void>();

function read(key: string): string {
  try {
    return localStorage.getItem(key) ?? '';
  } catch {
    return '';
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Shaxsiy rejim — taklif keyingi sahifada yana chiqishi mumkin.
  }
}

/** Shu sabab bugun ishlatilganmi. Kunlik hisobi yo'q sabab — hech
 *  qachon «ishlatilgan» bo'lmaydi. */
export const promoShown = (reason: PromoReason): boolean => {
  const key = KEYS[reason];
  return !!key && read(key) === new Date().toDateString();
};

/** Oyna endigina yopilganmi. */
function justClosed(): boolean {
  const at = Number(read(CLOSED_KEY));
  return Number.isFinite(at) && at > 0 && Date.now() - at < QUIET_MS;
}

/** Shu sabab bilan hozir ko'rsatsa bo'ladimi.
 *
 *  O'yin natijasi chegarasiz: u har tugagan o'yinda chiqadi. Sahifa
 *  ochilishi esa kuniga bir marta va oyna endigina yopilgan bo'lsa
 *  umuman chiqmaydi. */
export const canShowPromo = (reason: PromoReason): boolean =>
  reason === 'result' || (!promoShown(reason) && !justClosed());

/** Sabab ishlatilgani yozib qo'yiladi — oyna ochilganda. Kunlik hisobi
 *  yo'q sababda yozadigan narsa ham yo'q. */
export function markPromoShown(reason: PromoReason): void {
  const key = KEYS[reason];
  if (key) write(key, new Date().toDateString());
}

/** Oyna yopildi — jim turish muddati shundan boshlanadi. */
export const markPromoClosed = (): void => write(CLOSED_KEY, String(Date.now()));

/** Oynaga «chiq» deydi. Oynaning o'zi yana bir marta tekshiradi:
 *  qurilma telefonmi va bugun bu sabab ishlatilganmi. */
export function askAppPromo(reason: PromoReason): void {
  for (const listener of listeners) listener(reason);
}

export function onAppPromo(listener: (reason: PromoReason) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
