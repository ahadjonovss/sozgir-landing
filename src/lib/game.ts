/** O'yin qoidalari — ilovadagi `core/constants/game_constants.dart` va
 *  `game/domain/services/*` ning veb ko'chirmasi. Raqamlar ataylab shu
 *  yerda takrorlangan: sayt ilova bilan bir xil so'zni ko'rsatishi kerak. */

export const LENGTHS = [4, 5, 6, 7] as const;
export const DEFAULT_LENGTH = 5;

/** Kunlik so'z uzunligi o'zgarmaydi — hamma bir xil so'zni topadi. */
export const DAILY_LENGTH = 5;

/** Urinishlar soni: uzunlikdan bitta ko'p. */
export const attemptsFor = (length: number) => length + 1;

/** №1 kunlik o'yin sanasi (ilovadagi `dailyEpoch`). */
const EPOCH = Date.UTC(2026, 7, 3);

const dayStart = (date: Date) =>
  Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());

/** Kunlik o'yin tartib raqami (№35 kabi). */
export function dailyNumberFor(date: Date = new Date()): number {
  return Math.round((dayStart(date) - EPOCH) / 86_400_000) + 1;
}

/** Kunlik kalit — `2026-09-06` ko'rinishida. */
export function dailyKeyFor(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Yarim tungacha qolgan millisekundlar — kunlik sanoq uchun. */
export function msUntilTomorrow(now: Date = new Date()): number {
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return next.getTime() - now.getTime();
}

/** Mavzu (yordam) qancha o'ylagandan keyin taklif qilinadi. */
export const hintDelayMs = (length: number) => 15_000 * (length - 1);

/** So'z ma'nosi — ikki barobar uzoqroq o'ylagandan keyin. */
export const descriptionDelayMs = (length: number) => hintDelayMs(length) * 2;

/* ── Kunlik so'z tanlovi ──────────────────────────────────────────────
   Ilovadagi `DailyWordSelector` bilan **bir xil** natija berishi shart:
   Lehmer generatori kichik sonlar bilan ishlaydi, shuning uchun Dart va
   JS bir xil ketma-ketlikni chiqaradi. */

const MODULUS = 2147483647;
const MULTIPLIER = 48271;

class Lehmer {
  private state: number;

  constructor(seed: number) {
    this.state = Math.min(Math.max(Math.abs(seed) % MODULUS, 1), MODULUS - 1);
  }

  nextInt(max: number): number {
    this.state = (this.state * MULTIPLIER) % MODULUS;
    return this.state % max;
  }
}

function shuffled(source: readonly string[], seed: number): string[] {
  const items = [...source];
  const random = new Lehmer(seed);
  for (let i = items.length - 1; i > 0; i--) {
    const j = random.nextInt(i + 1);
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

/** Kun raqami bo'yicha kunlik so'z — ilovadagi tanlovning aynan o'zi. */
export function selectDaily(
  answers: readonly string[],
  number: number,
  length: number,
): string {
  const ordered = shuffled(answers, length * 7919 + 13);
  const index = (number - 1) % ordered.length;
  return ordered[index < 0 ? index + ordered.length : index];
}

/* ── Ball ────────────────────────────────────────────────────────────
   `ScoreCalculator` ning ko'chirmasi: asos × samaradorlik × takror. */

const DAILY_BASE = 100;
const LENGTH_BASE: Record<number, number> = { 4: 50, 5: 60, 6: 80, 7: 90 };
const REPEAT_FACTOR = 0.6;

export type Mode = 'daily' | 'endless' | 'category';

export function baseScore(mode: Mode, length: number): number {
  return mode === 'daily' ? DAILY_BASE : (LENGTH_BASE[length] ?? DAILY_BASE - 20);
}

export function scoreFor({
  mode,
  length,
  attempts,
  maxAttempts,
  repeated = false,
}: {
  mode: Mode;
  length: number;
  attempts: number;
  maxAttempts: number;
  repeated?: boolean;
}): number {
  if (attempts <= 0 || maxAttempts <= 0 || attempts > maxAttempts) return 0;
  const efficiency = (maxAttempts - attempts + 1) / maxAttempts;
  const penalty = repeated && mode !== 'daily' ? REPEAT_FACTOR : 1;
  return Math.round(baseScore(mode, length) * efficiency * penalty);
}
