/** Ulashiladigan jang kartochkasidagi bosh gap — ilovadagi
 *  `BattleShareLines` ning ko'chirmasi.
 *
 *  Natija ekranidagi gapdan farqi — **kim o'qiydi**. Ekrandagi gap
 *  o'yinchining o'ziga aytiladi, bu gap esa kartochkada turadi va uni
 *  boshqa odam ko'radi: shuning uchun u o'yinchining o'z tilidan va
 *  maqtanish ohangida yoziladi.
 *
 *  Gap bitta jang uchun bir marta tanlanadi va o'zgarmaydi: kartochka
 *  qayta yasalsa (odam oynani yopib qaytadan ochsa) o'sha rasm chiqishi
 *  kerak — aks holda ulashilgan natija har safar boshqa gap bilan
 *  ko'rinardi. */

/** G'alaba: maqtanadi, lekin raqibni haqoratlamaydi. */
const WIN = [
  'So‘z menga bo‘yin egdi',
  'Harflar bugun mening tarafimda',
  'Bitta so‘z — bitta g‘alaba',
  'Bu so‘zni men birinchi ko‘rdim',
  'Topdim, oldim, ketdim',
  'Raqib lug‘atni qaytadan ochsin',
  'Miya ishladi — natija shu',
];

/** Durang: ikkalasini ham tan oladi. */
const DRAW = [
  'Ikkimiz ham yon bermadik',
  'Teng kuch, teng natija',
  'Bu jangni so‘zning o‘zi yutdi',
  'Hisob teng — qasos qoldi',
  'So‘z ikkalamizni ham hurmat qildi',
];

/** Mag'lubiyat: o'zini masxara qilmaydi, davomini va'da qiladi. */
const LOSS = [
  'Bu safar so‘z raqibniki',
  'Yutqazdim — lug‘at menda qoldi',
  'So‘z qochdi, qasos qoldi',
  'Keyingi jang meniki bo‘ladi',
  'Raqib tez chiqdi, men sekin',
];

/** Maydonda sovrinli uchlik: o'rin g'alabaga teng emas, lekin
 *  maqtanishga arziydi. */
const PODIUM = [
  'Maydonda oldingi qatorda turdim',
  'Ko‘pchilikdan o‘tib chiqdim',
  'Sovrin qo‘l uzatsa yetadigan joyda',
];

/** Maydonda qolgan o'rinlar: mag'lubiyat emas, ohang ham boshqacha. */
const FIELD = [
  'Maydonga chiqdim — keyingisi balandroq',
  'Bu maydonda hali ishim bor',
  'O‘rin kichik, ishtiyoq katta',
];

/** Satrdan barqaror son — ilovadagi `String.hashCode` ning o'rnida. */
function seedOf(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** Jang natijasiga mos gap. `seed` bir xil bo'lsa javob ham bir xil —
 *  urug' sifatida jang raqami beriladi. */
export function punchline(
  outcome: 'win' | 'draw' | 'loss' | 'podium' | 'field',
  seed: string,
): string {
  const lines =
    outcome === 'win'
      ? WIN
      : outcome === 'draw'
        ? DRAW
        : outcome === 'loss'
          ? LOSS
          : outcome === 'podium'
            ? PODIUM
            : FIELD;
  return lines[seedOf(seed) % lines.length]!;
}
