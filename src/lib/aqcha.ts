/** Aqcha va O'lja — ko'rsatish birliklari (`docs/aqcha.md`).
 *
 *  **Aqcha butun son.** Kasr ham, tiyin ham yo'q — ilovadagi
 *  `Aqcha` sinfining o'zi (`soztop/lib/core/economy/aqcha.dart`).
 *  Saqlanadigan son ekrandagi sonning aynan o'zi, ya'ni hech
 *  qayerda ko'paytirish ham, bo'lish ham yo'q.
 *
 *  Ilgari sayt ichida «tiyin» degan shkala yurardi: saqlashga
 *  `aqcha × 10` tushar, ekranda esa o'nga bo'linardi. Server va
 *  ilova esa hech qachon unday hisoblamagan — ular aqchani butun
 *  yuritadi. Natijada serverdan kelgan har bir son saytda o'n
 *  barobar kichrayib ko'rinardi: jadvalda 6 aqcha ishlagan odamning
 *  yonida nol turardi. Yomoni, sayt o'sha o'nlangan sonni
 *  `/v1/me/words` ga ham yozardi va uni ilova o'z shkalasida
 *  o'qib, ballni o'n barobar katta ko'rsatardi.
 *
 *  O'lja ham shunday: u **reytingning o'zi**. Ilgari sayt uning
 *  yarmini ko'rsatardi (`1000 + floor((reyting − 1000) / 2)`) va
 *  bitta odam ikki joyda ikki xil son bo'lib chiqardi. Ilovada bu
 *  yarimlash olib tashlangan, saytda ham shunday.
 *
 *  Brauzerda qolgan eski (o'nlangan) yozuvlar bir marta
 *  o'giriladi — `aqchaScale.ts`. */

/** Saqlangan son → ekrandagi aqcha. Bir xil son.
 *
 *  Funksiya ataylab qoldirilgan: chaqirilgan joylarda «bu son
 *  aqcha» degan ma'no ko'rinib tursin, kelajakda shkala
 *  o'zgarsa ham bitta joy tahrirlansin. */
export const aqcha = (value: number) => Math.trunc(value);

/** Ekrandagi aqcha → saqlanadigan son. Bir xil son.
 *
 *  Yaxlitlash qoladi: mukofot formulalari bo'lish bilan hisoblanadi
 *  va kasr son hech qayerga yozilmasligi kerak. */
export const toStored = (value: number) => Math.round(value);

/** Xom reyting → o'lja. Bir xil son — ilovadagidek. */
export const battleAqcha = (rating: number) => Math.trunc(rating);

/** Jangdagi o'zgarish — ikki o'ljaning ayirmasi. */
export const battleAqchaDelta = (before: number, after: number) =>
  battleAqcha(after) - battleAqcha(before);

/** Minglar ajratgichi — ingichka bo'shliq (U+2009), vergul emas. */
const THIN = ' ';

const group = (value: number) => {
  const sign = value < 0 ? '-' : '';
  const digits = String(Math.abs(Math.trunc(value)));
  return sign + digits.replace(/\B(?=(\d{3})+(?!\d))/g, THIN);
};

/** Ekrandagi son: `598`, `1 198`. Kasr yo'q. */
export const formatAqcha = (value: number) => group(aqcha(value));

/** Birligi bilan: `598 aqcha`. */
export const aqchaText = (value: number) => `${formatAqcha(value)} aqcha`;

/** Xom reytingni o'ljada ko'rsatadi: `1 120`. */
export const formatBattleAqcha = (rating: number) => group(battleAqcha(rating));

/** Birligi bilan: `1 120 aqcha`. */
export const battleAqchaText = (rating: number) => `${formatBattleAqcha(rating)} aqcha`;

/** Ishorali son — jang natijasidagi o'zgarish uchun: `+6`, `−6`. */
export const signed = (value: number) =>
  `${value > 0 ? '+' : value < 0 ? '−' : ''}${group(Math.abs(value))}`;
