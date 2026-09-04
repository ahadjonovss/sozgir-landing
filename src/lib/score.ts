/** Ball hisobi — ilovaning `ScoreCalculator` ko'chirmasi.
 *
 *  Formula: `asos × urinish samaradorligi × takror koeffitsienti`. */
import type { Mode } from './modes';

/** Kunlik o'yin uchun asos ball — eng yuqori. */
const DAILY_BASE = 100;

/** Boshqa rejimlarda so'z uzunligiga qarab asos ball. */
const LENGTH_BASE: Record<number, number> = { 4: 50, 5: 60, 6: 80, 7: 90 };

/** Avval topilgan so'z uchun koeffitsient (40% kamayadi). */
const REPEAT_FACTOR = 0.6;

export function baseFor({ mode, length }: { mode: Mode; length: number }): number {
  if (mode === 'daily') return DAILY_BASE;
  return LENGTH_BASE[length] ?? DAILY_BASE - 20;
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

  const base = baseFor({ mode, length });
  const efficiency = (maxAttempts - attempts + 1) / maxAttempts;
  const penalty = repeated && mode !== 'daily' ? REPEAT_FACTOR : 1;
  return Math.round(base * efficiency * penalty);
}
