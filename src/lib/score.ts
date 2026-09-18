/** Mukofot hisobi — ilovaning `ScoreCalculator` ko'chirmasi
 *  (`docs/aqcha.md`, 4.1).
 *
 *  Mukofot **butun aqchada** hisoblanadi va saqlashga `aqcha × 10`
 *  bo'lib tushadi: ekranda aqcha hech qachon kasr bilan chiqmaydi,
 *  demak u kasr bilan berilmasligi ham kerak.
 *
 *  Uchta shift bor va uchtasi ham butun son: kunlik o'yin — 20 aqcha
 *  (kuniga bir marta, shuning uchun eng qimmat), yakka o'yin — 8
 *  aqchagacha (cheksiz o'ynaladi, shuning uchun arzon), jang esa
 *  umuman aqcha bermaydi — u o'ljaga tushadi va uni server hisoblaydi. */
import { tiyin } from './aqcha';
import type { Mode } from './modes';

/** Kunlik o'yin uchun asos — aqchada. */
const DAILY_BASE = 20;

/** Avval topilgan so'z uchun koeffitsient (40% kamayadi). */
const REPEAT_FACTOR = 0.6;

/** Takror topilgan so'z ham hech bo'lmasa shuncha beradi. */
const REPEAT_MIN = 1;

/** Yakka o'yindagi yuqori chegara — olingan yordam bosqichiga qarab.
 *
 *  Yordam so'zni **tez** topishga yordam beradi, shuning uchun u faqat
 *  tez topishning mukofotini qirqadi: ko'p urinishdan keyin topgan odam
 *  yordam olgan-olmaganidan qat'i nazar bir xil oladi. */
const HINT_CAP = [8, 6, 4] as const;

/** Olingan yordam: 0 — yo'q, 1 — mavzu, 2 — ma'no ham. */
export type HintLevel = 0 | 1 | 2;

/** Eng katta mumkin bo'lgan mukofot — aqchada. Qoida matnlari shu
 *  yerdan oladi, ikkinchi ro'yxat saqlanmasin. */
export const maxAqcha = ({ mode, length }: { mode: Mode; length: number }) =>
  mode === 'daily' ? DAILY_BASE : length + 1;

/** Natija uchun beriladigan mukofot — **tiyinda** (saqlanadigan birlik). */
export function scoreFor({
  mode,
  attempts,
  maxAttempts,
  repeated = false,
  hint = 0,
}: {
  mode: Mode;
  attempts: number;
  maxAttempts: number;
  repeated?: boolean;
  /** Yakka o'yinda olingan yordam. Kunlik o'yinda yordam yo'q. */
  hint?: HintLevel;
}): number {
  if (attempts <= 0 || maxAttempts <= 0 || attempts > maxAttempts) return 0;

  // Kunlik: asos urinish samaradorligiga ko'paytiriladi — 20, 17, 13,
  // 10, 7, 3. Takror koeffitsienti ham, yordam ham yo'q.
  if (mode === 'daily') {
    return tiyin((DAILY_BASE * (maxAttempts - attempts + 1)) / maxAttempts);
  }

  // Yakka o'yin: asos urinishlar soniga teng, ya'ni qoida ko'paytirishsiz
  // aytiladi — qancha urinish qolgan bo'lsa, shuncha aqcha.
  let value = maxAttempts - attempts + 1;
  if (repeated) value = Math.max(REPEAT_MIN, Math.round(value * REPEAT_FACTOR));
  // Chegara oxirida: u yakuniy shift, undan yuqori chiqilmaydi.
  return tiyin(Math.min(HINT_CAP[hint], value));
}
