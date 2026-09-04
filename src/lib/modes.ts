/** O'yin rejimi va qoidalari — ilovaning `GameMode` va `GameConstants`
 *  bilan bir xil nomlar (`storageKey` shu nomlar bilan yoziladi). */
export type Mode = 'daily' | 'endless';

/** Tanlash mumkin bo'lgan so'z uzunliklari (harf-birlikda). */
export const LENGTHS = [4, 5, 6, 7] as const;

/** Kunlik o'yin uzunligi — hamma uchun bir xil va o'zgarmaydi. */
export const DAILY_LENGTH = 5;

export const DEFAULT_LENGTH = 5;

/** Urinishlar soni: so'z uzunligidan bitta ko'p (5 harf → 6 urinish). */
export const attemptsFor = (length: number) => length + 1;
