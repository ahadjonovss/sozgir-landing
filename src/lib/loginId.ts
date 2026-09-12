/** Kirish maydoniga yozilgan matnni Firebase kutadigan **emailga**
 *  aylantiradi — ilovadagi `LoginIdentifier` ning veb ko'chirmasi.
 *
 *  Nima uchun: ko'p foydalanuvchida email yo'q yoki uni eslamaydi,
 *  telefon raqami esa yodida. Shu sabab maydonga raqam ham yozish mumkin —
 *  u jimgina `<raqam>@gmail.com` ko'rinishiga o'giriladi.
 *
 *  Muhim: bu **faqat kirish chegarasidagi** o'girish. Firebase Auth'da va
 *  bazada hech narsa o'zgarmaydi — u yerda avvalgidek yagona `email`
 *  maydoni turadi, ichida shunchaki raqamdan yasalgan manzil bo'ladi.
 *  Shuning uchun alohida telefon provayderi ham, SMS kodi ham kerak emas.
 *
 *  Qoida ilova bilan **belgima-belgi** bir xil bo'lishi shart: telefonda
 *  raqam bilan ro'yxatdan o'tgan odam saytga ham o'sha raqam bilan kirishi
 *  kerak. Kanonik shakl ham shuning uchun: bir odam bugun
 *  `+998 90 123 45 67`, ertaga `901234567` yozsa ham ayni bir hisobga
 *  tushadi. */

/** Raqamdan yasalgan manzilning domeni. */
const PHONE_DOMAIN = 'gmail.com';

/** O'zbekiston kodi — kanonik shaklda saqlanmaydi. */
const COUNTRY_CODE = '998';

/** Milliy raqamning uzunligi: `90 123 45 67`. */
export const PHONE_LENGTH = 9;
const NATIONAL_LENGTH = PHONE_LENGTH;

/** Raqamda uchraydigan ajratgichlar. Bulardan boshqa belgi bo'lsa, matn
 *  telefon emas — email deb qaraladi. */
const PHONE_SHAPE = /^\+?[\d\s()-]+$/;

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const digitsOf = (value: string) => value.replace(/\D/g, '');

/** Matn telefon raqam sifatida yozilganmi (to'g'ri-noto'g'riligidan
 *  qat'i nazar). `@` bo'lsa — bu email urinishi, raqam emas. */
export function looksLikePhone(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed.includes('@')) return false;
  return PHONE_SHAPE.test(trimmed) && digitsOf(trimmed).length > 0;
}

/** Raqamning kanonik shakli — 9 xonali milliy raqam, yoki `null`. */
export function canonicalPhone(value: string): string | null {
  if (!looksLikePhone(value)) return null;

  let digits = digitsOf(value);
  if (
    digits.length === COUNTRY_CODE.length + NATIONAL_LENGTH &&
    digits.startsWith(COUNTRY_CODE)
  ) {
    digits = digits.slice(COUNTRY_CODE.length);
  }
  return digits.length === NATIONAL_LENGTH ? digits : null;
}

/** Raqamdan yasalgan email, yoki `null` — matn raqam bo'lmasa. */
export function emailFromPhone(value: string): string | null {
  const phone = canonicalPhone(value);
  return phone === null ? null : `${phone}@${PHONE_DOMAIN}`;
}

/** Maydondagi matnni Firebase'ga yuboriladigan emailga aylantiradi.
 *
 *  Noto'g'ri raqamni ham o'zgartirmay qaytaradi: xatoni shakl tekshiruvi
 *  aytadi, bu yer jimgina buzib yubormaydi. */
export const toLoginEmail = (value: string): string =>
  emailFromPhone(value) ?? value.trim().toLowerCase();

/** Maydonga yozilgani yaroqlimi — email ham, raqam ham bo'lishi mumkin. */
export function isValidLogin(value: string): boolean {
  if (looksLikePhone(value)) return canonicalPhone(value) !== null;
  return EMAIL_SHAPE.test(value.trim());
}

/** Ekranda ko'rsatish uchun: raqamdan yasalgan manzil yana raqamga
 *  qaytadi (`901234567@gmail.com` → `+998 90 123 45 67`). Odam o'zining
 *  hisobini emailga o'xshagan narsadan emas, raqamidan taniydi. */
export function prettyLogin(email: string | null | undefined): string {
  const value = (email ?? '').trim();
  const [name, domain] = value.split('@');
  if (domain !== PHONE_DOMAIN || !name || !/^\d{9}$/.test(name)) return value;
  return `+${COUNTRY_CODE} ${name.slice(0, 2)} ${name.slice(2, 5)} ${name.slice(5, 7)} ${name.slice(7)}`;
}

/** Ekran uchun guruhlab yozadi: `901234567` → `90 123 45 67`. Yarim
 *  yozilgan raqam ham bo'linadi — maydon terilayotganda ham o'qiladi. */
export function formatPhone(digits: string): string {
  return [
    digits.slice(0, 2),
    digits.slice(2, 5),
    digits.slice(5, 7),
    digits.slice(7, 9),
  ]
    .filter(Boolean)
    .join(' ');
}
