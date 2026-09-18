/** Aqcha va O'lja — ko'rsatish birliklari (`docs/aqcha.md`).
 *
 *  Saqlanadigan son o'zgarmaydi. Uni **tiyin** deymiz: `totalScore`,
 *  `points`, `found_words.score` — hammasi tiyinda, ya'ni migratsiya
 *  yo'q va eski yozuvlar o'z joyida qolaveradi. Ekranga chiqishdan
 *  oldin sonlar shu yerdan o'tadi.
 *
 *  Reyting ham shunday: hujjatda xom Elo turadi, ekranda esa uning
 *  yarim shkalasi — o'lja. Chegaralar (daraja) **xom reytingda**
 *  tekshiriladi, aks holda yaxlitlash chegarani surib qo'yadi.
 *
 *  Funksiyalar ilovadagi `Aqcha` va `Olja` sinflarining aynan nusxasi
 *  (`soztop/docs/aqcha_tz.md`, 2-bo'lim): bir xil son ikki platformada
 *  bir xil ko'rinishi shart.
 *
 *  «Boylik» (aqcha va o'ljani bitta songa yig'ish) saytda yo'q: jamlangan
 *  hisobning nomi har doim **aqcha**. Ikkinchi nom odamni chalkashtirardi
 *  — jadvalda bir son, profilda boshqasi bo'lib qolardi. */

/** Bitta aqchada shuncha tiyin — mukofot hisobi ham shundan. */
export const TIYIN = 10;

/** Saqlangan tiyin → ekrandagi aqcha. Har doim butun son.
 *
 *  `Math.floor`, `Math.trunc` emas: manfiy tomonda ikkisi farq qiladi
 *  va farqi ko'rinadi. */
export const aqcha = (tiyin: number) => Math.floor(tiyin / TIYIN);

/** Ekrandagi aqcha → saqlanadigan tiyin. Mukofot butun aqchada
 *  hisoblanadi va shu yo'l bilan yoziladi — aks holda pastga
 *  yaxlitlash eng kichik mukofotni yeb qo'yardi. */
export const tiyin = (value: number) => Math.round(value) * TIYIN;

/** Xom reyting → o'lja. Ikki reyting — bitta o'lja, 1000 dan og'ish
 *  bo'yicha. Boshlang'ich 1000 ikkala shkalada ham bir xil. */
export const olja = (rating: number) => 1000 + Math.floor((rating - 1000) / 2);

/** Jangdagi o'zgarish — ikki o'ljaning ayirmasi, o'zgarishning yarmi
 *  emas: 12 reytinglik siljish 6 o'lja bo'lib ko'rinadi, lekin
 *  chegaraga tushib qolgan jang 7 ham bo'lishi mumkin. */
export const oljaDelta = (before: number, after: number) => olja(after) - olja(before);

/** Minglar ajratgichi — ingichka bo'shliq (U+2009), vergul emas. */
const THIN = ' ';

const group = (value: number) => {
  const sign = value < 0 ? '-' : '';
  const digits = String(Math.abs(Math.trunc(value)));
  return sign + digits.replace(/\B(?=(\d{3})+(?!\d))/g, THIN);
};

/** Tiyinni ekrandagi songa aylantiradi: `598`, `1 198`. Kasr yo'q. */
export const formatAqcha = (tiyinValue: number) => group(aqcha(tiyinValue));

/** Birligi bilan: `598 aqcha`. */
export const aqchaText = (tiyinValue: number) => `${formatAqcha(tiyinValue)} aqcha`;

/** Xom reytingni o'ljada ko'rsatadi: `1 120`. */
export const formatOlja = (rating: number) => group(olja(rating));

/** Birligi bilan: `1 120 o'lja`. */
export const oljaText = (rating: number) => `${formatOlja(rating)} o‘lja`;

/** Ishorali son — jang natijasidagi o'zgarish uchun: `+6`, `−6`. */
export const signed = (value: number) =>
  `${value > 0 ? '+' : value < 0 ? '−' : ''}${group(Math.abs(value))}`;
