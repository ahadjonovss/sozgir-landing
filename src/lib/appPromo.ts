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
 *  * **`result`** — birinchi o'yin tugagach. Aynan shu payt taklif eng
 *    o'rinli: odam o'yinni sinab ko'rdi, yoqdi yoki yoqmadi degan
 *    qarorini allaqachon qildi. Ochilishdagi taklif esa hali hech
 *    narsa ko'rmagan odamga aytiladi.
 *
 *  Har sababning **o'z kunlik hisobi** bor: ikkalasi bir kunda bir
 *  martadan chiqadi. Ustiga umumiy chegara — oyna endigina yopilgan
 *  bo'lsa (`QUIET_MS`), yangi sabab bilan ham qayta ochilmaydi: «yo'q»
 *  degan odamdan uch daqiqada ikkinchi marta so'rash reklama emas,
 *  bosim bo'lardi. */

export type PromoReason = 'open' | 'result';

const KEYS: Record<PromoReason, string> = {
  open: 'sozgir.app.promo',
  result: 'sozgir.app.promo.game',
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

/** Shu sabab bugun ishlatilganmi. */
export const promoShown = (reason: PromoReason): boolean =>
  read(KEYS[reason]) === new Date().toDateString();

/** Oyna endigina yopilganmi. */
function justClosed(): boolean {
  const at = Number(read(CLOSED_KEY));
  return Number.isFinite(at) && at > 0 && Date.now() - at < QUIET_MS;
}

/** Shu sabab bilan hozir ko'rsatsa bo'ladimi. */
export const canShowPromo = (reason: PromoReason): boolean =>
  !promoShown(reason) && !justClosed();

/** Sabab ishlatilgani yozib qo'yiladi — oyna ochilganda. */
export const markPromoShown = (reason: PromoReason): void =>
  write(KEYS[reason], new Date().toDateString());

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
