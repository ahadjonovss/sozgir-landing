/** G'uncha — yettita harfdan so'z yig'ish o'yini.
 *
 *  Ilovadagi `GunchaLexicon`, `GunchaBuilder`, `GunchaScorer` va
 *  `GunchaJudge` ning veb ko'chirmasi (`docs/guncha.md`). Server tomonida
 *  ham shu algoritmning porti bor (`functions/src/guncha.ts`) — kunlik
 *  g'unchaning harflarini o'sha tanlaydi.
 *
 *  Qoidalar:
 *   1. So'z kamida **4 harfdan** (`sh`, `ch`, `oʻ`, `gʻ` — bitta harf);
 *   2. **yurak harf** albatta qatnashsin;
 *   3. faqat g'unchadagi harflar, lekin har biri necha marta bo'lsa ham;
 *   4. so'z lug'atning **javob so'zlari** ro'yxatida bo'lsin;
 *   5. urinishlar cheklanmagan — xato so'z uchun jarima yo'q.
 *
 *  Harf niqoblari (`mask`) alifbodagi tartibga tayanadi: `uz.ts` dagi
 *  `LETTERS` ilovadagi klaviatura tartibi bilan bir xil, ya'ni saytdagi
 *  hisob serverdagi bilan belgima-belgi mos tushadi. */
import { shuffled } from './daily';
import type { Dictionary } from './dictionary';
import { LETTERS, normalize, split, TUTUQ } from './uz';

const LETTER_INDEX = new Map(LETTERS.map((letter, index) => [letter, index]));

/** G'unchadagi harflar soni: yurak + olti barg. */
export const LETTER_COUNT = 7;

/** Eng qisqa hisoblanadigan so'z. */
export const MIN_LENGTH = 4;

/** 4 harfli so'z uchun ball — ataylab arzon: u eng oson topiladigan so'z
 *  va u bilan ballni «to'ldirib» bo'lmasin. */
const SHORT_WORD_SCORE = 1;

/** Yettala harf ishlatilgan so'z — pangramma. */
const PANGRAM_BONUS = 7;

/** G'uncha shundan kam so'z bersa — tashlanadi. */
const MIN_WORDS = 8;

/** Bir o'tirishda tugatib bo'lmaydigan g'uncha o'yinchini charchatadi. */
const MAX_WORDS = 45;

/** Yurak harf shu songa eng yaqin natija beradigan harfdan tanlanadi. */
const PREFERRED_WORDS = 18;

/** Bitta so'zning balli. */
export function wordScore({
  length,
  pangram,
}: {
  length: number;
  pangram: boolean;
}): number {
  if (length < MIN_LENGTH) return 0;
  const base = length === MIN_LENGTH ? SHORT_WORD_SCORE : length;
  return base + (pangram ? PANGRAM_BONUS : 0);
}

export interface GunchaWord {
  word: string;
  /** Harf-birlikdagi uzunlik (`sh`, `oʻ` — bitta harf). */
  length: number;
  score: number;
  pangram: boolean;
  /** So'z ma'nosi — topilgandan keyin ko'rsatiladi (modulning
   *  o'rgatuvchi qismi shu). */
  meaning?: string;
}

export interface GunchaPuzzle {
  center: string;
  petals: string[];
  /** Topilishi mumkin bo'lgan so'zlar (alifbo tartibida). */
  words: GunchaWord[];
  daily: boolean;
  /** Kunlik o'yin raqami yoki mashq raqami. */
  number: number;
}

export const lettersOf = (puzzle: GunchaPuzzle): string[] => [
  puzzle.center,
  ...puzzle.petals,
];

/** Saqlash va taqqoslash uchun kalit: `daily-124` / `mashq-7`. */
export const puzzleId = (puzzle: GunchaPuzzle) =>
  `${puzzle.daily ? 'daily' : 'mashq'}-${puzzle.number}`;

/** Harflar imzosi — lug'at yangilangach g'uncha o'zgarib ketgan bo'lsa,
 *  saqlangan progressni tashlash uchun. */
export const signatureOf = (puzzle: GunchaPuzzle) =>
  `${puzzle.center}|${[...puzzle.petals].sort(compare).join('')}`;

export const maxScoreOf = (puzzle: GunchaPuzzle) =>
  puzzle.words.reduce((sum, word) => sum + word.score, 0);

export const pangramsOf = (puzzle: GunchaPuzzle) =>
  puzzle.words.filter((word) => word.pangram).length;

export const wordOf = (puzzle: GunchaPuzzle, word: string) =>
  puzzle.words.find((candidate) => candidate.word === word) ?? null;

/** Dart'dagi `String.compareTo` — UTF-16 kod birliklari bo'yicha.
 *
 *  `localeCompare` yaramaydi: u `gʻ` ni `g` ga tenglashtirib yuboradi va
 *  tartib ilovadagidan boshqacha chiqadi. */
function compare(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function maskOf(letters: Iterable<string>): number {
  let mask = 0;
  for (const letter of letters) {
    const index = LETTER_INDEX.get(letter);
    if (index !== undefined) mask |= 1 << index;
  }
  return mask;
}

interface Entry {
  word: string;
  letters: string[];
  length: number;
  mask: number;
  meaning?: string;
}

interface Seed {
  letters: string[];
  mask: number;
}

/** So'z g'unchaga yaraydimi — yaramasa `null`.
 *
 *  Tutuq belgisi (`ʼ`) bor so'zlar umuman kirmaydi: u harf emas, uni
 *  barg qilib qo'yish ham mumkin emas. */
function entryOf(word: string, meaning?: string): Entry | null {
  const normalized = normalize(word);
  const units = split(normalized);
  if (units.length < MIN_LENGTH || units.length > LETTER_COUNT) return null;
  if (units.includes(TUTUQ)) return null;
  if (!units.every((unit) => LETTER_INDEX.has(unit))) return null;

  const letters = [...new Set(units)];
  return {
    word: normalized,
    letters,
    length: units.length,
    mask: maskOf(letters),
    meaning,
  };
}

export interface GunchaLexicon {
  entries: Entry[];
  seeds: Seed[];
}

/** Lug'atlardan g'uncha uchun so'zlar va bo'lajak harf to'plamlari.
 *
 *  Faqat **javob so'zlar** ishlatiladi: `valid` ataylab kengaytirilgan
 *  ro'yxat, unda `addy`, `abab` kabi so'z bo'lmagan yozuvlar ham bor —
 *  ular g'unchada «to'g'ri so'z» bo'lib chiqib qolardi. */
export function buildLexicon(dictionaries: Dictionary[]): GunchaLexicon {
  const entries: Entry[] = [];
  const seeds: Seed[] = [];
  const seedMasks = new Set<number>();
  // Ilova lug'atlarni bitta xaritaga yig'adi, ya'ni takroriy so'z bir
  // marta hisoblanadi. Bu yerda ro'yxatlar qo'shiladi, shuning uchun
  // takror shu yerda kesiladi — aks holda so'zlar soni boshqacha
  // chiqib, yurak harf ham boshqacha tanlanardi.
  const seen = new Set<string>();

  for (const dictionary of dictionaries) {
    for (const answer of dictionary.answers) {
      const entry = entryOf(answer, dictionary.words[answer]?.d);
      if (entry === null || seen.has(entry.word)) continue;
      seen.add(entry.word);
      entries.push(entry);

      // Aynan 7 xil harfdan tuzilgan so'zlar — bo'lajak g'unchalar.
      // Shunda har bir g'unchada kamida bitta pangramma bo'lishi
      // kafolatlanadi (g'uncha aynan shundan yasaladi).
      if (entry.letters.length !== LETTER_COUNT) continue;
      if (seedMasks.has(entry.mask)) continue;
      seedMasks.add(entry.mask);
      seeds.push({ letters: [...entry.letters].sort(compare), mask: entry.mask });
    }
  }

  // Tartib lug'at faylidagi tartibga bog'liq bo'lib qolmasin.
  seeds.sort((a, b) => compare(a.letters.join(''), b.letters.join('')));
  entries.sort((a, b) => compare(a.word, b.word));
  return { entries, seeds };
}

interface Candidate {
  center: string;
  letters: string[];
  words: Entry[];
  pangrams: number;
}

const distance = (candidate: Candidate) =>
  Math.abs(candidate.words.length - PREFERRED_WORDS);

function isBetter(candidate: Candidate, other: Candidate): boolean {
  if (distance(candidate) !== distance(other)) {
    return distance(candidate) < distance(other);
  }
  if (candidate.pangrams !== other.pangrams) {
    return candidate.pangrams > other.pangrams;
  }
  return compare(candidate.center, other.center) < 0;
}

/** Yettita harfdan yurak harfni tanlaydi (deterministik). */
function pickCenter(lexicon: GunchaLexicon, seed: Seed): Candidate | null {
  // `mask & ~seed.mask === 0` ning o'zi: JS'da `~` 32 bitli, shuning
  // uchun ishorasiz shakl ishlatiladi.
  const pool = lexicon.entries.filter(
    (entry) => (entry.mask | seed.mask) === seed.mask,
  );
  if (pool.length === 0) return null;

  let best: Candidate | null = null;
  for (const center of seed.letters) {
    const centerMask = maskOf([center]);
    const words = pool.filter((entry) => (entry.mask & centerMask) !== 0);
    if (words.length === 0) continue;

    const candidate: Candidate = {
      center,
      letters: seed.letters,
      words,
      pangrams: words.filter((entry) => entry.mask === seed.mask).length,
    };
    if (best === null || isBetter(candidate, best)) best = candidate;
  }
  return best;
}

function toPuzzle(
  candidate: Candidate,
  { number, daily, petals }: { number: number; daily: boolean; petals?: string[] },
): GunchaPuzzle {
  const letters = new Set(candidate.letters);
  const words = candidate.words
    .map((entry): GunchaWord => {
      const pangram = entry.letters.length === letters.size;
      return {
        word: entry.word,
        length: entry.length,
        pangram,
        score: wordScore({ length: entry.length, pangram }),
        meaning: entry.meaning,
      };
    })
    .sort((a, b) => compare(a.word, b.word));

  // Barglar alifbo tartibida turmasin — g'uncha «yasalgan»day
  // ko'rinmasin. Aralashtirish ham deterministik.
  const order =
    petals ??
    shuffled(
      candidate.letters.filter((letter) => letter !== candidate.center),
      number * 31 + (daily ? 5 : 11),
    );

  return { center: candidate.center, petals: order, words, daily, number };
}

/** Lug'atdan g'uncha yasaydi — mashq rejimi shundan.
 *
 *  Barcha to'plam ko'rib chiqiladi va **faqat o'ynasa bo'ladiganlari**
 *  ro'yxatga olinadi: birinchi mos kelganini olish yaramaydi — yaroqsiz
 *  to'plamdan keyingi raqam oldingisi bilan aynan bir xil g'unchani
 *  berardi. */
export function buildGuncha({
  lexicon,
  number,
  daily,
}: {
  lexicon: GunchaLexicon;
  number: number;
  daily: boolean;
}): GunchaPuzzle {
  if (lexicon.seeds.length === 0) {
    throw new Error('G‘uncha yasash uchun lug‘at yetarli emas');
  }

  // Kunlik va mashq g'unchalari bir xil ketma-ketlikda bormasin.
  const ordered = shuffled(lexicon.seeds, daily ? 7717 : 3319);

  const playable: Candidate[] = [];
  let fallback: Candidate | null = null;

  for (const seed of ordered) {
    const candidate = pickCenter(lexicon, seed);
    if (candidate === null) continue;

    const count = candidate.words.length;
    if (count >= MIN_WORDS && count <= MAX_WORDS) {
      playable.push(candidate);
      continue;
    }
    // Hech biri chegaraga tushmasa — hech bo'lmasa eng yaqini.
    if (fallback === null || isBetter(candidate, fallback)) fallback = candidate;
  }

  if (playable.length === 0) {
    if (fallback === null) throw new Error('Mos g‘uncha topilmadi');
    return toPuzzle(fallback, { number, daily });
  }

  const index = (number - 1) % playable.length;
  return toPuzzle(playable[index < 0 ? index + playable.length : index]!, {
    number,
    daily,
  });
}

/** Harflari tayyor g'uncha — kunlik g'uncha va jang shundan yasaladi.
 *
 *  Barglar **qayta aralashtirilmaydi**: tartibni ham server beradi,
 *  shunda g'uncha hamma qurilmada aynan bir xil ko'rinadi. */
export function gunchaFromLetters({
  lexicon,
  center,
  petals,
  number,
  daily = true,
}: {
  lexicon: GunchaLexicon;
  center: string;
  petals: string[];
  number: number;
  daily?: boolean;
}): GunchaPuzzle {
  const letters = [center, ...petals];
  const mask = maskOf(letters);
  const centerMask = maskOf([center]);

  const words = lexicon.entries.filter(
    (entry) => (entry.mask | mask) === mask && (entry.mask & centerMask) !== 0,
  );

  // Brauzerdagi lug'at serverdagidan eski bo'lsa, harflar mos kelib so'z
  // topilmasligi mumkin. Bo'sh g'unchani ochib qo'ygandan ko'ra xato
  // ko'rsatgan ma'qul.
  if (words.length === 0) {
    throw new Error('Bu g‘uncha uchun lug‘atda so‘z topilmadi');
  }

  return toPuzzle(
    {
      center,
      letters: [...new Set(letters)],
      words,
      pangrams: words.filter((entry) => entry.mask === mask).length,
    },
    { number, daily, petals },
  );
}

// ── Hukm ────────────────────────────────────────────────────────────────

/** Kiritilgan so'zga berilgan hukm. */
export type GunchaVerdict =
  | 'accepted'
  | 'repeated'
  | 'tooShort'
  | 'missingCenter'
  | 'foreignLetter'
  | 'unknown';

export const VERDICT_TEXT: Record<Exclude<GunchaVerdict, 'accepted'>, string> = {
  repeated: 'Bu so‘zni topgansiz',
  tooShort: 'Kamida 4 harf',
  missingCenter: 'Yurak harf yo‘q',
  foreignLetter: 'Bu harf g‘unchada yo‘q',
  unknown: 'Bunday so‘z lug‘atda yo‘q',
};

/** Kiritilgan so'zni baholaydi.
 *
 *  Tekshiruv tartibi muhim: o'yinchiga **eng foydali** xabar ko'rsatilsin.
 *  Avval o'zi tuzatishi mumkin bo'lgan xatolar, oxirida esa lug'at
 *  haqidagi xabar.
 *
 *  Ilgari `valid` ro'yxatidagi so'zga alohida xabar berilardi («to'g'ri
 *  so'z, lekin bu g'unchada hisoblanmaydi») — u olib tashlangan: kunlik
 *  g'unchalarda bunday so'zlar javoblardan o'rtacha 17 barobar ko'p
 *  chiqardi va ko'pi umuman so'z emas edi. */
export function judge({
  puzzle,
  word,
  found,
}: {
  puzzle: GunchaPuzzle;
  word: string;
  found: Set<string>;
}): GunchaVerdict {
  const normalized = normalize(word);
  const units = split(normalized);
  const letters = new Set(lettersOf(puzzle));

  if (units.length < MIN_LENGTH) return 'tooShort';
  if (!units.every((unit) => letters.has(unit))) return 'foreignLetter';
  if (!units.includes(puzzle.center)) return 'missingCenter';
  if (found.has(normalized)) return 'repeated';
  return wordOf(puzzle, normalized) ? 'accepted' : 'unknown';
}

// ── Darajalar ───────────────────────────────────────────────────────────

/** O'yinchining g'unchadagi darajasi.
 *
 *  Daraja **ballning ulushi** bo'yicha beriladi, so'zlar soni bo'yicha
 *  emas: og'ir g'unchada ham, yengilida ham «Bog'bon» bir xil mehnat
 *  talab qilsin. */
export const RANKS = [
  { key: 'urug', label: 'Urug‘', share: 0 },
  { key: 'nish', label: 'Nish', share: 0.03 },
  { key: 'kurtak', label: 'Kurtak', share: 0.08 },
  { key: 'guncha', label: 'G‘uncha', share: 0.15 },
  { key: 'gul', label: 'Ochilgan gul', share: 0.27 },
  { key: 'gulzor', label: 'Gulzor', share: 0.42 },
  { key: 'bogbon', label: 'Bog‘bon', share: 0.65 },
  /** Barcha so'zlar topilgan — o'yin tugadi. */
  { key: 'mukammal', label: 'Mukammal', share: 1 },
] as const;

export type GunchaRank = (typeof RANKS)[number];

/** Shu darajaga chiqish uchun kerak bo'lgan ball.
 *
 *  Yuqoriga yaxlitlanadi: «42%» yozilgan joyda 41% bilan daraja
 *  berilmasligi kerak. */
export const scoreForRank = (rank: GunchaRank, maxScore: number) =>
  rank.key === 'mukammal' ? maxScore : Math.ceil(maxScore * rank.share);

/** Hozirgi daraja. `allFound` — barcha so'zlar topilganmi (mukammal
 *  daraja faqat shunda beriladi). */
export function rankOf({
  score,
  maxScore,
  allFound,
}: {
  score: number;
  maxScore: number;
  allFound: boolean;
}): GunchaRank {
  if (allFound) return RANKS[RANKS.length - 1]!;
  if (maxScore <= 0) return RANKS[0]!;

  let current: GunchaRank = RANKS[0]!;
  for (const rank of RANKS) {
    if (rank.key === 'mukammal') continue;
    if (score >= scoreForRank(rank, maxScore)) current = rank;
  }
  return current;
}

/** Keyingi daraja (oxirgisida — `null`). */
export function nextRank(rank: GunchaRank): GunchaRank | null {
  const index = RANKS.findIndex((item) => item.key === rank.key);
  return index < 0 || index === RANKS.length - 1 ? null : RANKS[index + 1]!;
}
