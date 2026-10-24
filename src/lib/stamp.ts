/** Serverdan kelgan vaqt belgisi — bitta shaklga keltiriladi.
 *
 *  **Nega kerak.** Sayt Firestore'dan yozilgan va u har sanani
 *  `{ seconds: 1761288000 }` ko'rinishida berardi. Yangi server esa
 *  oddiy `Date` qaytaradi va u JSON'da ISO satrga aylanadi:
 *  `"2026-10-24T06:57:31.689Z"`. Kod `value.seconds` ni o'qishda
 *  davom etardi — satrda bunday maydon yo'q, demak javob **doim
 *  `undefined`**.
 *
 *  Buzilgani jim buzilgan: xato chiqmaydi, shunchaki sanoq umuman
 *  chizilmaydi. Turnir yig'ilishida «boshlanishiga qancha qoldi»
 *  yo'qolgani shundan — ilovada u ko'rinib turardi, saytda esa yo'q
 *  edi.
 *
 *  **Ikkala shakl ham qabul qilinadi.** Faqat yangisiga o'tib
 *  bo'lmaydi: jang va maydon holati veb-soket orqali keladi va u
 *  yerda shakl boshqacha bo'lishi mumkin. Manbalarni birma-bir
 *  tekshirib chiqishdan ko'ra ikkalasini ham tushunadigan bitta
 *  funksiya ishonchliroq — yangi manba qo'shilganda ham o'zi
 *  ishlaydi. */

/** Server beradigan har qanday vaqt belgisi. */
export type Stamp =
  | { seconds?: number }
  | string
  | number
  | null
  | undefined;

/** Belgidan Unix soniyasi. O'qib bo'lmasa — `null`.
 *
 *  Sonli qiymatda o'lchov birligi kattaligidan aniqlanadi:
 *  `1e11` dan katta son millisekund bo'la oladi, soniya esa
 *  3000-yilgacha undan kichik qoladi. */
export function stampSeconds(value: Stamp): number | null {
  if (value === null || value === undefined) return null;

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null;
    return value > 1e11 ? Math.floor(value / 1000) : value;
  }

  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : Math.floor(parsed / 1000);
  }

  const seconds = value.seconds;
  return typeof seconds === 'number' && Number.isFinite(seconds) ? seconds : null;
}

/** Belgidan millisekund — `Date.now()` bilan solishtirish uchun. */
export function stampMs(value: Stamp): number | null {
  const seconds = stampSeconds(value);
  return seconds === null ? null : seconds * 1000;
}
