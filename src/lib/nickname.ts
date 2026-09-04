/** Taxallus tekshiruvi — ilovaning `nickname_filter.dart` ko'chirmasi.
 *
 *  Bir xil bo'lishi shart: Firestore qoidalari ham xuddi shu ro'yxatni
 *  tekshiradi, ya'ni filtrdan o'tmagan taxallus bilan yozuv **serverda**
 *  rad etiladi. Mijozda tekshirish — foydalanuvchiga tushunarli xabar
 *  ko'rsatish uchun. */

export const NICKNAME_MIN = 2;
export const NICKNAME_MAX = 24;
export const GUEST = 'Mehmon';

/** Kirill, raqam-almashtirish va ajratgichlarni tozalab, faqat lotin
 *  harflarini qoldiradi: `s0k` → `sok`, `ф-а-к` → `fak`. */
const LOOK_ALIKE: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'j', з: 'z',
  и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'x', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sh',
  ъ: '', ы: 'i', ь: '', э: 'e', ю: 'yu', я: 'ya', ў: 'o', қ: 'q', ғ: 'g',
  ҳ: 'h', '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't',
  '@': 'a', $: 's', '!': 'i', '|': 'i',
};

/** Matn ichida qay joyda uchrasa ham taqiqlanadigan so'zlar. */
const BANNED_PARTS = [
  'jalab', 'qanjiq', 'dalbayob', 'dalbayop', 'siktir', 'sikish', 'sikaman',
  'sikkan', 'sikvol', 'qotoq', 'kotoq', 'qutoq', 'padarlanat', 'ambosh',
  'pizd', 'ebal', 'ebat', 'eban', 'yebat', 'yebal', 'pidor', 'pidar',
  'mudak', 'mudila', 'gandon', 'zaebal', 'nahuy', 'naxuy', 'ohuel',
  'oxuel', 'shlyuha', 'shluha', 'suchara', 'zalupa',
  'fuck', 'fuk', 'bitch', 'cunt', 'whore', 'slut', 'nigger', 'nigga',
  'faggot', 'asshole', 'bastard', 'dickhead', 'motherf',
  'penis', 'vagina', 'rapist', 'pedofil', 'pedophil', 'prostitut', 'porno',
];

/** Faqat butun so'z bo'lganda taqiqlanadi — «eshit» ichidagi «shit»
 *  tutilmasligi kerak. */
const BANNED_WORDS = new Set([
  'shit', 'ass', 'anal', 'anus', 'dick', 'sik', 'kot', 'koton', 'am',
  'suka', 'suchka', 'blya', 'blyad', 'blyat', 'hui', 'huy', 'xui', 'xuy',
  'manda', 'mandavoshka', 'gavno', 'govno', 'pizda',
]);

function plain(value: string): string {
  let out = '';
  for (const ch of value.toLowerCase()) out += LOOK_ALIKE[ch] ?? ch;
  return out.replace(/[^a-z]/g, '');
}

/** Takrorlangan harflarni bittaga tushiradi: `fuuuck` → `fuck`. */
function squeeze(value: string): string {
  let out = '';
  for (let i = 0; i < value.length; i++) {
    if (i === 0 || value[i] !== value[i - 1]) out += value[i];
  }
  return out;
}

function hasBannedWord(value: string): boolean {
  const joined = plain(value);
  const squeezed = squeeze(joined);
  for (const token of BANNED_PARTS) {
    if (joined.includes(token) || squeezed.includes(token)) return true;
  }
  for (const part of value.split(/[^\p{L}\p{N}]+/u)) {
    const word = plain(part);
    if (!word) continue;
    if (BANNED_WORDS.has(word) || BANNED_WORDS.has(squeeze(word))) return true;
  }
  return false;
}

/** Xato matni, hammasi joyida bo'lsa `null`. */
export function nicknameError(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'Taxallus kiriting';
  if (trimmed.length < NICKNAME_MIN) {
    return `Taxallus kamida ${NICKNAME_MIN} belgidan iborat bo‘lsin`;
  }
  if (trimmed.length > NICKNAME_MAX) {
    return `Taxallus ${NICKNAME_MAX} belgidan oshmasin`;
  }
  if (hasBannedWord(trimmed)) {
    return 'Bu taxallus nomaqbul so‘z saqlaydi — boshqasini tanlang';
  }
  return null;
}

/** Ketma-ket bo'shliqlar bittaga tushadi, uzunligi cheklanadi. */
export function sanitizeNickname(value: string): string {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (!trimmed) return GUEST;
  return trimmed.length > NICKNAME_MAX
    ? trimmed.slice(0, NICKNAME_MAX)
    : trimmed;
}

/** Brauzerdagi tanlangan nom. Ilovada bu sozlamada turadi, saytda esa
 *  `localStorage` da — kalit admin panel bilan bir uslubda. */
const NICKNAME_KEY = 'sozgir.nickname';

export function readStoredNickname(): string {
  try {
    return localStorage.getItem(NICKNAME_KEY)?.trim() ?? '';
  } catch {
    return '';
  }
}

export function writeStoredNickname(value: string): void {
  try {
    localStorage.setItem(NICKNAME_KEY, value);
  } catch {
    // Shaxsiy rejimda yozib bo'lmaydi — nom faqat shu sessiyada qoladi.
  }
}
