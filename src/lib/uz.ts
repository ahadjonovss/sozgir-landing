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
