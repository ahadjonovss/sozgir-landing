/** O'zbek alifbosi — `lib/core/utils/uz_alphabet.dart` ning veb ko'chirmasi.
 *  Muhim qaror: `sh`, `ch`, `oʻ`, `gʻ` — bitta harf, ya'ni bitta katakcha. */

export const TOVUSH = 'ʻ'; // U+02BB — oʻ, gʻ ichida
export const TUTUQ = 'ʼ'; // U+02BC — maʼno, sanʼat

export const MULTI_LETTERS = ['sh', 'ch', 'oʻ', 'gʻ'] as const;

export const KEYBOARD_ROWS: string[][] = [
  ['q', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', 'oʻ', 'gʻ'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'v', 'b', 'n', 'm', 'sh', 'ch', TUTUQ],
];

export const LETTERS = KEYBOARD_ROWS.flat();

const APOSTROPHES = "'‘’ʻʼ`´′";

/** `to'g'ri` → `toʻgʻri`, `MA'NO` → `maʼno`. */
export function normalize(raw: string): string {
  let out = '';
  let last = '';
  for (const ch of raw.toLowerCase().trim()) {
    if (APOSTROPHES.includes(ch)) {
      const replacement = last === 'o' || last === 'g' ? TOVUSH : TUTUQ;
      out += replacement;
      last = replacement;
      continue;
    }
    out += ch;
    last = ch;
  }
  return out;
}

/** `boshqa` → `['b', 'o', 'sh', 'q', 'a']`. */
export function split(word: string): string[] {
  const w = normalize(word);
  const units: string[] = [];
  let i = 0;
  while (i < w.length) {
    const matched = MULTI_LETTERS.find((l) => w.startsWith(l, i)) ?? w[i];
    units.push(matched);
    i += matched.length;
  }
  return units;
}

export const lengthOf = (word: string) => split(word).length;

/** Ekran uchun: `ʻ` (U+02BB) va `ʼ` (U+02BC) ni tipografik apostroflarga
 *  almashtiradi. Nunito'da bu ikki belgi yo'q — fallback shrift chaqirilib,
 *  matnda bo'shliq paydo bo'ladi. Ma'lumot fayllari kanonik shaklda qoladi. */
export const pretty = (text: string) =>
  text.replaceAll(TOVUSH, '‘').replaceAll(TUTUQ, '’');

export const display = (unit: string) => pretty(unit.toUpperCase());

/** So'z o'yinda ishlatilishi mumkinmi — barcha harflari alifboda bormi. */
export const isPlayable = (word: string) => {
  const units = split(word);
  return units.length > 0 && units.every((unit) => LETTERS.includes(unit));
};

export type Verdict = 'correct' | 'present' | 'absent';

/** Taxminni javob bilan solishtiradi. Takror harflar: avval aniq mosliklar
 *  belgilanadi, qolgan harflar «bor» uchun faqat qolgan sanoqdan oladi. */
export function evaluate(guess: string[], answer: string[]): Verdict[] {
  const result: Verdict[] = guess.map(() => 'absent');
  const rest = new Map<string, number>();

  guess.forEach((unit, i) => {
    if (unit === answer[i]) {
      result[i] = 'correct';
      return;
    }
    rest.set(answer[i], (rest.get(answer[i]) ?? 0) + 1);
  });

  guess.forEach((unit, i) => {
    if (result[i] === 'correct') return;
    const left = rest.get(unit) ?? 0;
    if (left > 0) {
      result[i] = 'present';
      rest.set(unit, left - 1);
    }
  });

  return result;
}

/** Ulashish uchun spoylersiz qator. */
export const EMOJI: Record<Verdict, string> = {
  correct: '\u{1F7E9}',
  present: '\u{1F7E8}',
  absent: '\u{2B1C}',
};

/** Fizik klaviatura bosilishi — o'yin tugmasiga aylantirilgan.
 *
 *  Ikki taxta (So'ztop va So'zjang) shu bitta qoidaga tayanadi: `sh`,
 *  `ch`, `oʻ`, `gʻ` oldingi harf bilan birikadi, apostrof esa `o`/`g`
 *  dan keyin tovush belgisi, qolgan joyda tutuq belgisi bo'ladi.
 *
 *  `null` — bosilgan tugma o'yinga tegishli emas. */
export type KeyAction =
  | { kind: 'enter' }
  | { kind: 'back' }
  | { kind: 'letter'; unit: string }
  /** Oldingi katak bilan qo'shiladi (`s` + `h` → `sh`). */
  | { kind: 'combine'; unit: string };

export function keyAction(key: string, last: string | undefined): KeyAction | null {
  if (key === 'Enter') return { kind: 'enter' };
  if (key === 'Backspace') return { kind: 'back' };

  const char = key.toLowerCase();
  if (char.length !== 1) return null;

  if (char === 'h' && (last === 's' || last === 'c')) {
    return { kind: 'combine', unit: `${last}h` };
  }
  if (`'\`‘’${TOVUSH}${TUTUQ}`.includes(char)) {
    return last === 'o' || last === 'g'
      ? { kind: 'combine', unit: `${last}${TOVUSH}` }
      : { kind: 'letter', unit: TUTUQ };
  }
  return LETTERS.includes(char) ? { kind: 'letter', unit: char } : null;
}
