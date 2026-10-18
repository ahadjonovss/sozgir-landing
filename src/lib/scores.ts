/** O'yin hisobi — endi faqat **o'lchov birligi**.
 *
 *  Ilgari bu fayl ballni o'zi yig'ib `scores/{uid}` ga yozardi va shu
 *  sabab murakkab edi: hujjatni o'qib, faqat shu o'yinning ulushini
 *  almashtirib, umumiy sonni qaytadan yig'ar, ustiga «hech qachon
 *  pasaytirma» qoidasini ham yuritardi (saytdagi ro'yxat telefonnikidan
 *  qisqa bo'lishi mumkin edi).
 *
 *  Endi ball **serverda** hisoblanadi: sayt topilgan so'zni
 *  (`POST /v1/me/words`) va kunlik o'yinda yozilgan taxminlarni
 *  (`POST /v1/daily/submit`) yuboradi, qolganini server qiladi —
 *  reyting ham, haftalik liga ham bir manbadan oziqlanadi. Shu bilan
 *  «pasaytirma» qoidasi ham, kun hisobining brauzerdagi sanog'i ham
 *  keraksiz bo'ldi.
 *
 *  Qolgani — o'yinlarning nomi va bitta o'yindagi xom ballning shakli:
 *  ular ekranda hamon ishlatiladi. Sonlar **tiyinda**, aqcha uning o'ni
 *  (`lib/aqcha.ts`). */

/** Ilovadagi `GameId` — barqaror nomlar. */
export type GameKey = 'soztop' | 'guncha' | 'yangsoz';

/** Bitta o'yindagi xom ball — o'yinning o'z shkalasida.
 *
 *  Yakka va raqib bilan o'ynalgani ajratilmaydi: jangda topilgan so'z
 *  ham o'sha o'yinning balli. */
export interface GameTally {
  /** O'yinda yig'ilgan ball — qayerda o'ynalganidan qat'i nazar. */
  score: number;
  /** Ball bergan hodisalar soni — So'ztopda topilgan so'z. */
  count: number;
}

export const EMPTY_TALLY: GameTally = { score: 0, count: 0 };

/** Kun hisobi brauzerda yuritilardi — hozir u serverda. Kalitlari
 *  eski brauzerlarda qolib ketgan va hisob almashganda tozalanadi:
 *  o'qilmaydigan yozuv ham joy egallaydi. */
const DAY_KEY = 'sozgir.scores.day';
const PUSHED_DAY_KEY = 'sozgir.scores.pushedDay';

export function clearDayTally(): void {
  try {
    localStorage.removeItem(DAY_KEY);
    localStorage.removeItem(PUSHED_DAY_KEY);
  } catch {
    // Tozalanmasa ham hech narsa buzilmaydi: bu yozuvni hech kim o'qimaydi.
  }
}
