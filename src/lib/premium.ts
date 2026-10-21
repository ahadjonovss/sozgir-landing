/** Premium — reklamasiz vaqt. Ilovadagi `AdFreePlan` ning ko'zgusi.
 *
 *  Bu obuna emas: qo'llov **vaqt sotib oladi**. Bir hafta [price]
 *  so'm, uzunroq ulushlar arzonroq. Muddat tugaydi va o'zi so'nadi.
 *  Sabab texnik: to'lov inPAY orqali bir martalik bo'ladi, ya'ni
 *  takrorlanuvchi to'lovni qurib ham bo'lmaydi. Vaqt sotish esa
 *  oddiy to'lovni muddatga aylantiradi — hech kimdan pul yechilmaydi
 *  va hech kim «bekor qilish» tugmasini qidirmaydi.
 *
 *  **Narxlar ikki joyda yozilmaydi.** Ular adminkadan keladi
 *  (`app/support` hujjatining `premium` bo'limi) va saytga
 *  `/v1/public/support` orqali tushadi — ilova ham **o'sha**
 *  hujjatni o'qiydi. Shuning uchun narx o'zgarganda sayt ham, ilova
 *  ham keyingi o'qishda birga o'zgaradi va ularning ekranidagi son
 *  hech qachon ayri tushmaydi.
 *
 *  Hujjat o'qilmaguncha yoki yozuv yaroqsiz bo'lsa [FALLBACK]
 *  ishlaydi: narx har doim bor va «yuklanmoqda» degan bo'sh ekran
 *  chiqmaydi. */

/** Bitta ulush: shuncha hafta — shuncha so'm. */
export interface Pack {
  weeks: number;
  price: number;
  /** O'sha paytdagi bir haftalik narx — chegirma shundan o'lchanadi.
   *
   *  Ulushning o'zida turadi, umumiy narxdan o'qilmaydi: ro'yxat
   *  serverdan butunligicha almashadi va yarim-yangi hisob («eski
   *  ulush, yangi haftalik narx») chiqmasligi kerak. */
  weekPrice: number;
}

/** Bir ulush shuncha kun. */
export const WEEK_DAYS = 7;

/** Eng ko'p qo'llov — inPAY chegarasi (serverda `MAX_AMOUNT`). */
export const DONATION_MAX = 10_000_000;

/** Kirish tarifi — eng arzon yo'l, bir haftadan qisqa.
 *
 *  Ro'yxatdan tashqarida, chunki ro'yxat **haftalarda** o'lchanadi va
 *  ikki kunlik ulush u yerga sig'maydi. Bu narx hamma taklifda turadi
 *  (reklama ustidagi tugma, to'lov oynasining birinchi ustuni): odam
 *  birinchi marta ko'radigan son eng past bo'lishi kerak. */
export const ENTRY_PRICE = 2499;

/** Kirish tarifi shuncha kun **va'da qiladi**.
 *
 *  Nisbat bundan ko'proq beradi (2 499 so'm aslida ~2,6 kun). Farq
 *  odamning foydasiga qoladi va ekranda ko'rinmaydi — yorliq kunni
 *  pastga yaxlitlaydi. Kam va'da qilib ko'p berish ataylab:
 *  qarama-qarshisi yolg'on bo'lardi. */
export const ENTRY_DAYS = 2;

/** Narxlar yangilanishidan oldingi haftaning narxi.
 *
 *  Shu summadan yuqori har qanday qo'llov kamida bir hafta beradi:
 *  eski ilovada summa maydoni shu narx bilan to'ldirilgan va u odamga
 *  «bir hafta» deb yozib turadi. */
export const LEGACY_PRICE = 5555;

const pack = (weeks: number, price: number, weekPrice: number): Pack => ({
  weeks,
  price,
  weekPrice,
});

/** Saytning o'zidagi narxlar — server javobigacha va u yaroqsiz
 *  bo'lganda. Ilovadagi `AdFreeTariff.fallback` ning aynan o'zi. */
export const FALLBACK: Pack[] = [
  pack(1, 6666, 6666),
  pack(2, 12222, 6666),
  pack(4, 22222, 6666),
  pack(10, 55550, 6666),
];

/** Amaldagi narxlar. Yozuvchi bitta — sozlamani o'qigan joy
 *  (`loadBalance`). */
let packs: Pack[] = FALLBACK;
let minimum = ENTRY_PRICE;

export const premiumPacks = (): Pack[] => packs;

/** Bir haftaning narxi. */
export const weekPrice = (): number => packs[0].price;

/** Eng kam qo'llov.
 *
 *  Zaxirasi kirish tarifi: ekranda ko'rsatilgan eng past summani
 *  to'lab bo'lmasligi kerak emas. */
export const minDonation = (): number => minimum;

/** Chegirmasiz narx — haftalik narx shuncha haftaga. */
export const fullPrice = (item: Pack): number => item.weekPrice * item.weeks;

/** Chegirma (so'm). Bir haftalikda nol. */
export const saveSum = (item: Pack): number => fullPrice(item) - item.price;

/** Chegirma foizda — **pastga** yaxlitlanadi.
 *
 *  22,8% «23%» bo'lib chiqsa, yozuv aslida berilganidan ko'proq
 *  chegirma va'da qilgan bo'lardi. Kam ko'rsatish — xato tomoni
 *  to'g'ri tomon. */
export function savePercent(item: Pack): number {
  const full = fullPrice(item);
  return full <= 0 ? 0 : Math.floor((saveSum(item) * 100) / full);
}

/** Summa qaysi tarif narxida hisoblanishi — narxi undan oshmaydigan
 *  **eng katta** ulush.
 *
 *  Shunda chegirma tayyor tugmani bosganga ham, o'sha summani qo'lda
 *  yozganga ham tegadi. */
export function packFor(amount: number): Pack {
  let best = packs[0];
  for (const item of packs) if (item.price <= amount) best = item;
  return best;
}

/** Shu summa necha kun beradi.
 *
 *  Nisbat to'g'ri: tarif narxining yarmi o'sha tarifning yarmini
 *  beradi. Qoldiq tashlanmaydi — to'langan pulning bir qismi
 *  yo'qolmasligi kerak. */
export function grantDays(amount: number): number {
  if (amount <= 0) return 0;

  // Eski ilovalar yuboradigan summa — to'liq hafta. Narx ko'tarilgan,
  // lekin ularning ekranida hamon eskisi turibdi va odam aynan shunga
  // rozi bo'lib to'laydi.
  if (amount >= LEGACY_PRICE && amount < weekPrice()) return WEEK_DAYS;

  const item = packFor(amount);
  const days = (item.weeks * WEEK_DAYS * amount) / item.price;

  // Kirish tarifi — **pol**: ekranda «2 499 so'm — 2 kun» deb turgan
  // ekan, shu summadan kam bermaslik kerak. Hozirgi narxda u
  // ishlamaydi (nisbat ko'proq beradi); pol haftalik narx ko'tarilgan
  // kun uchun.
  if (amount >= ENTRY_PRICE && days < ENTRY_DAYS) return ENTRY_DAYS;
  return days;
}

/** Summa qancha vaqt berishi — «1 hafta», «10 hafta», «3 kun».
 *
 *  Haftada yoziladi, agar son butun chiqsa: «70 kun» degani odamga
 *  «10 hafta» chalik aniq gapirmaydi. Butun chiqmasa kun qoladi —
 *  «1,4 hafta» degan yozuv umuman o'qilmaydi. */
export function grantLabel(amount: number): string {
  const exact = grantDays(amount);
  if (exact <= 0) return '';

  const days = Math.floor(exact);
  if (days >= WEEK_DAYS && days % WEEK_DAYS === 0) {
    return `${days / WEEK_DAYS} hafta`;
  }
  if (days >= 1) return `${days} kun`;
  const hours = Math.floor(exact * 24);
  return `${hours < 1 ? 1 : hours} soat`;
}

/** Adminka yozgan ro'yxatdan tarif yasaydi; yaroqsiz bo'lsa `null`.
 *
 *  Shartlar qattiq va ataylab shunday: narxni adminkadan yozish oson,
 *  xato yozish ham shunchalik oson. Yaroqsiz ro'yxat e'tiborga
 *  olinmagani ma'qul — teskari tartibdagi yoki nol narxli tarif
 *  ekranda ham, hisobda ham tuzatib bo'lmaydigan narsa qilardi.
 *  Tekshiruv ilovadagi `AdFreeTariff.of` bilan bir xil:
 *
 *    * birinchisi — aynan bir haftalik (narx shundan olinadi);
 *    * muddat ham, narx ham qat'iy o'sib boradi;
 *    * hech bir ulush chegirmasizdan qimmat emas. */
export function tariffOf(rows: { weeks: number; price: number }[]): Pack[] | null {
  if (rows.length === 0 || rows[0].weeks !== 1) return null;

  const week = rows[0].price;
  if (week <= 0) return null;

  const out: Pack[] = [];
  for (const row of rows) {
    if (row.weeks < 1 || row.price <= 0) return null;
    const last = out[out.length - 1];
    if (last && (row.weeks <= last.weeks || row.price <= last.price)) return null;
    if (row.price > week * row.weeks) return null;
    out.push(pack(row.weeks, row.price, week));
  }
  return out;
}

/** `premium` bo'limini o'qib, amaldagi narxlarni almashtiradi.
 *
 *  Pol narxlardan **alohida** o'qiladi: ro'yxatdagi xato polni,
 *  poldagi xato ro'yxatni yiqitmasin. */
export function applyPremium(section: unknown): void {
  const data = (section ?? {}) as { min?: unknown; packs?: unknown };

  const min = Number(data.min);
  if (Number.isFinite(min) && min > 0 && min <= DONATION_MAX) minimum = min;

  if (!Array.isArray(data.packs)) return;
  const rows: { weeks: number; price: number }[] = [];
  for (const row of data.packs) {
    const weeks = Number((row as { weeks?: unknown })?.weeks);
    const price = Number((row as { price?: unknown })?.price);
    if (!Number.isFinite(weeks) || !Number.isFinite(price)) return;
    rows.push({ weeks: Math.round(weeks), price: Math.round(price) });
  }
  const next = tariffOf(rows);
  if (next) packs = next;
}
