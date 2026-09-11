/** Alifbo (yozuv) — ilovadagi `lib/core/script/` bo'limining veb ko'chirmasi.
 *
 *  **Asosiy qaror ilovadagidek:** lug'at, Firestore, sessiya — hammasi
 *  **eski lotinda** (`toʻgʻri`, `boshqa`) saqlanadi. Alifbo faqat ekranga
 *  chiqishda almashtiriladi, kiritishda esa darhol eski lotinga
 *  qaytariladi. Shu sababli kunlik so'z, reyting, jang va ulashish uch
 *  alifboda ham bir xil ishlaydi.
 *
 *  Ikki xil ko'chirish bor va ularni aralashtirib bo'lmaydi:
 *
 *  * **harfma-harf** ([lettersToScript]) — o'yin so'zlari uchun. Bitta
 *    harf-birlik doim bitta birlikka aylanadi, ya'ni katak soni
 *    o'zgarmaydi: `yosh` → `ЙОШ` (3 katak), `ЁШ` emas;
 *  * **to'g'ri imlo** ([proseToScript]) — interfeys matnlari uchun, u yerda
 *    katak tushunchasi yo'q: `yosh` → `ёш`, `eshik` → `эшик`. */
import { MULTI_LETTERS, normalize, TOVUSH, TUTUQ } from './uz';

export type UzScript = 'latin' | 'newLatin' | 'cyrillic';

/** Tanlash ro'yxati. Har bir nom va namuna **o'z alifbosida** yozilgan —
 *  odam o'qimasdan ham qaysi biri ekanini ko'radi. Shu sababli bu matnlar
 *  hech qachon ko'chirilmaydi (`data-script="off"`). */
export const SCRIPTS: ReadonlyArray<{
  key: UzScript;
  label: string;
  sample: string;
  /** Sarlavhadagi tugmada turadigan bitta harf — uchala alifboda bir xil
   *  tovush, shuning uchun almashuv ko'zga tashlanadi. */
  badge: string;
}> = [
  { key: 'latin', label: 'Lotin', sample: 'O‘zbek tili', badge: 'O‘' },
  { key: 'newLatin', label: 'Yangi lotin', sample: 'Özbek tili', badge: 'Ö' },
  { key: 'cyrillic', label: 'Кирилл', sample: 'Ўзбек тили', badge: 'Ў' },
];

/** `localStorage` kaliti — ilovadagi `storageKey` bilan bir xil qiymatlar. */
const STORAGE: Record<UzScript, string> = {
  latin: 'latin',
  newLatin: 'new_latin',
  cyrillic: 'cyrillic',
};

export const storageKey = (script: UzScript) => STORAGE[script];

export const fromStorageKey = (key: string | null | undefined): UzScript =>
  key === 'new_latin' ? 'newLatin' : key === 'cyrillic' ? 'cyrillic' : 'latin';

/* ── Harf jadvallari ──────────────────────────────────────────────────── */

/** Eski lotin → takomillashtirilgan lotin. Faqat to'rt birlik o'zgaradi. */
const TO_NEW_LATIN: Record<string, string> = {
  'oʻ': 'ö',
  'gʻ': 'ğ',
  sh: 'ş',
  ch: 'ç',
};

/** Eski lotin → kirill. To'liq jadval, 29 birlik — o'zaro 1:1, ya'ni
 *  orqaga qaytarish aniq. */
const TO_CYRILLIC: Record<string, string> = {
  a: 'а',
  b: 'б',
  d: 'д',
  e: 'е',
  f: 'ф',
  g: 'г',
  'gʻ': 'ғ',
  h: 'ҳ',
  i: 'и',
  j: 'ж',
  k: 'к',
  l: 'л',
  m: 'м',
  n: 'н',
  o: 'о',
  'oʻ': 'ў',
  p: 'п',
  q: 'қ',
  r: 'р',
  s: 'с',
  sh: 'ш',
  ch: 'ч',
  t: 'т',
  u: 'у',
  v: 'в',
  x: 'х',
  y: 'й',
  z: 'з',
  [TUTUQ]: 'ъ',
};

const FORWARD: Record<UzScript, Record<string, string>> = {
  latin: {},
  newLatin: TO_NEW_LATIN,
  cyrillic: TO_CYRILLIC,
};

const flip = (table: Record<string, string>) =>
  Object.fromEntries(Object.entries(table).map(([from, to]) => [to, from]));

const BACKWARD: Record<UzScript, Record<string, string>> = {
  latin: {},
  newLatin: flip(TO_NEW_LATIN),
  cyrillic: flip(TO_CYRILLIC),
};

/** Teskari jadvaldagi birliklar — uzundan qisqaga: matnni bo'lishda
 *  uzunrog'i birinchi tekshirilishi kerak. */
const BACKWARD_UNITS: Record<UzScript, string[]> = {
  latin: [],
  newLatin: Object.keys(BACKWARD.newLatin).sort((a, b) => b.length - a.length),
  cyrillic: Object.keys(BACKWARD.cyrillic).sort((a, b) => b.length - a.length),
};

/** Kirill klaviaturasidan kelishi mumkin, lekin alifbo jadvalida yo'q
 *  belgilar. `ь` va `ы` o'zbekchada ishlatilmaydi: biri tashlanadi,
 *  ikkinchisi `i` ga o'tadi. */
const CYRILLIC_EXTRA: Record<string, string> = {
  ё: 'yo',
  ю: 'yu',
  я: 'ya',
  э: 'e',
  ц: 'ts',
  щ: 'sh',
  ы: 'i',
  ь: '',
};

const MULTI: readonly string[] = MULTI_LETTERS;
const APOSTROPHES = "'‘’ʻʼ`´′";
const LETTER = /\p{L}/u;

const isLetter = (ch: string | undefined) => !!ch && LETTER.test(ch);

/** Manba belgining registrini natijaga ko'chiradi: `Ў` → `Oʻ`,
 *  `Sh` → `Ш`, `ЁШ` → `YOSH`. */
function matchCase(value: string, source: string): string {
  if (!value) return value;
  const first = source[0];
  if (first.toUpperCase() !== first || first.toLowerCase() === first) return value;
  const allUpper = source.length > 1 && source === source.toUpperCase();
  if (allUpper || value.length === 1) return value.toUpperCase();
  return value[0].toUpperCase() + value.slice(1);
}

/** Apostrof shakllarini kanonik `ʻ`/`ʼ` ga keltiradi — registrni saqlab.
 *  `uz.ts` dagi `normalize` hammasini kichik harfga tushiradi, bu yerda esa
 *  `O‘rganish` kabi bosh harfli so'zlar ko'p. */
function canonicalApostrophes(text: string): string {
  let out = '';
  let last = '';
  for (const ch of text) {
    if (APOSTROPHES.includes(ch)) {
      const lower = last.toLowerCase();
      const mark = lower === 'o' || lower === 'g' ? TOVUSH : TUTUQ;
      out += mark;
      last = mark;
      continue;
    }
    out += ch;
    last = ch;
  }
  return out;
}

/* ── Harfma-harf: o'yin so'zlari ──────────────────────────────────────── */

/** Eski lotindagi matnni tanlangan alifboga **harfma-harf** ko'chiradi.
 *
 *  To'r, klaviatura, natija va hisobot shu yerdan o'tadi: birliklar soni
 *  o'zgarmasligi kerak. Alifboda yo'q belgilar (raqam, tinish belgisi)
 *  o'zgarishsiz qoladi. */
export function lettersToScript(text: string, script: UzScript): string {
  if (script === 'latin' || !text) return text;
  const table = FORWARD[script];
  let out = '';
  let i = 0;
  // Tutuq belgisining o'z registri yo'q, kirillda esa u `ъ` — harf.
  // `MAʼNO` → `МАЪНО` bo'lishi uchun undan oldingi harfning registri
  // eslab boriladi.
  // Matnda kichik harf bo'lmasa — bosh harfli kontekst (klaviaturadagi
  // yolg'iz tutuq tugmasi ham shu yo'l bilan `Ъ` bo'ladi).
  let upper = !/\p{Ll}/u.test(text);
  const write = (mapped: string, source: string) => {
    const first = source[0];
    if (first.toLowerCase() === first.toUpperCase()) {
      return upper ? mapped.toUpperCase() : mapped;
    }
    upper = first === first.toUpperCase();
    return matchCase(mapped, source);
  };
  while (i < text.length) {
    const pair = text.slice(i, i + 2);
    if (pair.length === 2 && MULTI.includes(normalize(pair))) {
      out += write(table[normalize(pair)] ?? pair, pair);
      i += 2;
      continue;
    }
    const ch = text[i];
    const mapped = table[normalize(ch)];
    out += mapped === undefined ? write(ch, ch) : write(mapped, ch);
    i += 1;
  }
  return out;
}

/** Bitta harf-birlik — katak va klaviatura tugmasi uchun. */
export const unitToScript = (unit: string, script: UzScript) =>
  lettersToScript(unit, script);

/** Kiritilgan matnni bazadagi eski lotinga qaytaradi.
 *
 *  Jadvalda yo'q kirill belgilari ([CYRILLIC_EXTRA]) rad etilmaydi —
 *  lotinchadagi muqobiliga yoyiladi, aks holda odam yozgan so'z lug'atda
 *  topilmay qolardi. Registr saqlanadi: taxallus ham shu yerdan o'tadi. */
export function inputToLatin(text: string, script: UzScript): string {
  if (script === 'latin' || !text) return text;
  const back = BACKWARD[script];
  const units = BACKWARD_UNITS[script];
  const lower = text.toLowerCase();
  let out = '';
  let i = 0;
  while (i < text.length) {
    const unit = units.find((u) => lower.startsWith(u, i));
    if (unit) {
      out += matchCase(back[unit], text.slice(i, i + unit.length));
      i += unit.length;
      continue;
    }
    const extra = script === 'cyrillic' ? CYRILLIC_EXTRA[lower[i]] : undefined;
    if (extra !== undefined) {
      out += matchCase(extra, text[i]);
      i += 1;
      continue;
    }
    out += text[i];
    i += 1;
  }
  return canonicalApostrophes(out);
}

/** Fizik klaviaturada bosilgan belgini o'yin birligiga aylantiradi:
 *  `ш` → `sh`, `ў` → `oʻ`, `ö` → `oʻ`. Tanilmagan belgi o'zicha qaytadi va
 *  `keyAction` uni o'zi rad etadi. */
export function physicalKey(key: string, script: UzScript): string {
  if (script === 'latin' || key.length !== 1) return key;
  const lower = key.toLowerCase();
  const unit = BACKWARD[script][lower];
  if (unit) return matchCase(unit, key);
  return key;
}

/* ── To'g'ri imlo: interfeys matnlari ─────────────────────────────────── */

/** Brend va nomlar — kirillda ham lotinda qoladi. */
export const PROTECTED_WORDS = [
  'Telegram',
  'Instagram',
  'Google',
  'Play',
  'App Store',
  'AdMob',
  'Firebase',
  'Wordle',
  'iOS',
  'Android',
  'Apple',
  'YouTube',
  'Payme',
  'Click',
  'Elo',
  'Vercel',
  'Uzcard',
  'Humo',
  'Visa',
] as const;

const escapeRe = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** URL, email va brendlar. Ataylab `lookbehind`siz yozilgan — eski
 *  Safari uni tushunmaydi va butun modul yiqilardi; so'z chegarasi
 *  [boundary] da qo'lda tekshiriladi. */
const PROTECTED = new RegExp(
  [
    'https?://[^\\s]+',
    '[\\w.+-]+@[\\w-]+\\.[\\w.]+',
    // Havolasiz yozilgan domen (`sozgir.uz`) va Telegram manzili
    // (`@sozgir_uz`) — ular ham lotinda qolishi kerak.
    '[\\w-]+(?:\\.[\\w-]+)*\\.(?:uz|com|me|org|net|io|app|dev|ru)(?:/[^\\s]*)?',
    '@[A-Za-z][\\w.]*',
    PROTECTED_WORDS.map((word) => escapeRe(word).replace(/ /g, '\\s')).join('|'),
  ].join('|'),
  'giu',
);

const boundary = (text: string, start: number, end: number) =>
  !isLetter(text[start - 1]) && !isLetter(text[end]);

/** Himoyalangan bo'laklar (URL, email, brend) o'zgarishsiz qoladi,
 *  qolgani `convert` orqali o'tadi. */
function withProtected(text: string, convert: (chunk: string) => string): string {
  let out = '';
  let last = 0;
  for (const match of text.matchAll(PROTECTED)) {
    const start = match.index ?? 0;
    const end = start + match[0].length;
    if (start < last || !boundary(text, start, end)) continue;
    out += convert(text.slice(last, start)) + match[0];
    last = end;
  }
  return out + convert(text.slice(last));
}

type Rule = readonly [string, string];

/** Kirill uchun qoidalar — tartib muhim: uzunrog'i va istisnosi avval
 *  tekshiriladi. `yoʻ` → `йў` (aks holda `yoʻl` → `ёʻл` bo'lardi), keyin
 *  `ye/yo/yu/ya`, so'ng digraflar, oxirida yolg'iz harflar. */
const TO_CYRILLIC_RULES: Rule[] = [
  // `tsiya` digraflardan oldin: `informatsiya` → `информация`. Yolg'iz `ts`
  // ataylab yo'q — u `ketsa` ni `кеца` qilib buzardi.
  ['tsiya', 'ция'],
  ['yoʻ', 'йў'],
  ['ye', 'е'],
  ['yo', 'ё'],
  ['yu', 'ю'],
  ['ya', 'я'],
  ['oʻ', 'ў'],
  ['gʻ', 'ғ'],
  ['sh', 'ш'],
  ['ch', 'ч'],
  ['a', 'а'],
  ['b', 'б'],
  ['d', 'д'],
  ['e', 'е'],
  ['f', 'ф'],
  ['g', 'г'],
  ['h', 'ҳ'],
  ['i', 'и'],
  ['j', 'ж'],
  ['k', 'к'],
  ['l', 'л'],
  ['m', 'м'],
  ['n', 'н'],
  ['o', 'о'],
  ['p', 'п'],
  ['q', 'қ'],
  ['r', 'р'],
  ['s', 'с'],
  ['t', 'т'],
  ['u', 'у'],
  ['v', 'в'],
  ['x', 'х'],
  ['y', 'й'],
  ['z', 'з'],
  [TUTUQ, 'ъ'],
  // `c` yolg'iz o'zbekchada yo'q, lekin matnda uchrab qolsa — `к` ga yaqin.
  ['c', 'к'],
];

/** Kirilldan lotinga — kiritilgan interfeys matni uchun. `е` so'z boshida
 *  `ye`, o'rtasida `e`: `Европа` → `Yevropa`, `кел` → `kel`. */
const FROM_CYRILLIC_RULES: Rule[] = [
  ['ё', 'yo'],
  ['ю', 'yu'],
  ['я', 'ya'],
  ['э', 'e'],
  ['ц', 'ts'],
  ['ў', 'oʻ'],
  ['ғ', 'gʻ'],
  ['ш', 'sh'],
  ['ч', 'ch'],
  ['а', 'a'],
  ['б', 'b'],
  ['д', 'd'],
  ['е', 'e'],
  ['ф', 'f'],
  ['г', 'g'],
  ['ҳ', 'h'],
  ['и', 'i'],
  ['ж', 'j'],
  ['к', 'k'],
  ['л', 'l'],
  ['м', 'm'],
  ['н', 'n'],
  ['о', 'o'],
  ['п', 'p'],
  ['қ', 'q'],
  ['р', 'r'],
  ['с', 's'],
  ['т', 't'],
  ['у', 'u'],
  ['в', 'v'],
  ['х', 'x'],
  ['й', 'y'],
  ['з', 'z'],
  ['ъ', TUTUQ],
  ['ь', ''],
  ['щ', 'sh'],
  ['ы', 'i'],
];

/** `i` dagi `ts` o'zlashma so'zdagi `ц` mi: so'z boshida (`tsex`) yoki
 *  `-tsiya` / `-tsent` (`militsiya`, `protsent`). O'zbekcha fe'l
 *  shakllarida `t`+`s` alohida tovushlar — `ketsin`, `qaytsa` `тс` bo'lib
 *  qoladi. */
function cyrillicTs(text: string, i: number, last: string): boolean {
  if (text[i + 1]?.toLowerCase() !== 's') return false;
  if (!isLetter(last)) return true;
  const rest = text.slice(i + 2).toLowerCase();
  return rest.startsWith('iya') || rest.startsWith('ent');
}

/** Qoidalarni chapdan o'ngga, ro'yxat tartibida qo'llaydi. So'z boshini
 *  bilish uchun oxirgi yozilgan belgi yetadi. */
function applyRules(text: string, rules: Rule[]): string {
  let out = '';
  let last = '';
  let i = 0;
  while (i < text.length) {
    let hit: Rule | null = null;
    let source = '';
    for (const rule of rules) {
      const end = i + rule[0].length;
      if (end > text.length) continue;
      source = text.slice(i, end);
      if (source.toLowerCase() === rule[0]) {
        hit = rule;
        break;
      }
    }
    if (!hit) {
      out += text[i];
      last = text[i];
      i += 1;
      continue;
    }
    if (hit[0] === 't' && cyrillicTs(text, i, last)) {
      out += matchCase('ц', text.slice(i, i + 2));
      last = 'ц';
      i += 2;
      continue;
    }
    let value = hit[1];
    // `e` so'z boshida `э` (`eshik` → `эшик`), teskari yo'lda `е` → `ye`.
    if (hit[0] === 'e' && !isLetter(last)) value = 'э';
    if (hit[0] === 'е' && !isLetter(last)) value = 'ye';
    const written = matchCase(value, source);
    out += written;
    if (written) last = written[written.length - 1];
    i += hit[0].length;
  }
  return out;
}

/** Eski lotindagi interfeys matnini tanlangan alifboga ko'chiradi —
 *  to'g'ri imloda. */
export function proseToScript(text: string, script: UzScript): string {
  if (script === 'latin' || !text) return text;
  if (script !== 'cyrillic') {
    return withProtected(text, (chunk) => lettersToScript(chunk, script));
  }
  const out = withProtected(text, (chunk) =>
    applyRules(canonicalApostrophes(chunk), TO_CYRILLIC_RULES),
  );
  // Himoyalangan so'zdan keyingi qo'shimcha apostrofi (`Google Play’dan`)
  // tutuq belgisi deb `ъ` ga aylanib qolardi: `Playъдан`. Lotin harfidan
  // keyin kelgan `ъ` — aynan shu holat, u tashlanadi.
  return out.replace(/([A-Za-z])ъ/g, '$1');
}

/** Boshqa alifbodagi interfeys matnini eski lotinga qaytaradi. */
export function proseToLatin(text: string, script: UzScript): string {
  if (script === 'latin' || !text) return text;
  if (script === 'newLatin') return inputToLatin(text, script);
  return canonicalApostrophes(applyRules(text, FROM_CYRILLIC_RULES));
}
