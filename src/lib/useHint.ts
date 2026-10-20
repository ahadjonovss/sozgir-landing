/** Yordam — ilovadagi `hintLevel` mantig'ining porti.
 *
 *  Cheksiz rejimda o'ylash cho'zilganda yordam o'zi paydo bo'ladi: so'z
 *  uzunligiga qarab 15·(n−1) soniyadan keyin **mavzu** (kategoriya), undan
 *  ikki barobar keyin **ma'no** ochiladi. Undan oldin qancha qolgani sanab
 *  turiladi — tugma birdan paydo bo'lgandan ko'ra, kutilayotgani ko'rinib
 *  turgani yaxshi. Kunlik o'yinda yordam yo'q: so'z hamma uchun bir xil,
 *  reyting adolatli bo'lishi kerak.
 *
 *  Sanoq **birinchi urinishdan keyin** boshlanadi. Ilgari u taxta
 *  ochilgan zahoti ketardi: odam hali bitta harf ham termasdan
 *  ekranning tepasida soat sanab turardi va yordam ko'pincha u
 *  o'ylay boshlaganda emas, sahifani ochib qo'yib ketganda kelardi.
 *  Yordam o'ylaganga beriladi, ochganga emas — shuning uchun sanoq
 *  birinchi so'z yozilgandan keyin boshlanadi.
 *
 *  Mavzu nomi `/v1/public/categories` dan olinadi va brauzerda eslab qolinadi
 *  (`categories.ts`). */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { categoryLabel, type CategoryLabel } from './categories';
import type { HintLevel } from './score';
import type { Puzzle, Phase } from './useSozTop';
import { play } from './sounds';

/** Mavzu shuncha vaqtdan keyin — ilovadagi `hintDelayFor`. */
export const hintDelayMs = (length: number) => 15 * (length - 1) * 1000;
/** Ma'no — ikki barobar uzoqroq o'ylagandan keyin. */
export const descriptionDelayMs = (length: number) => hintDelayMs(length) * 2;

export type { CategoryLabel };

export interface Hint {
  /** Yordam umuman bormi (kunlikda va tugagan o'yinda — yo'q). */
  enabled: boolean;
  /** Olingan yordam bosqichi: 0 — yo'q, 1 — mavzu, 2 — ma'no ham.
   *  Mukofotning yuqori chegarasi shunga qarab tushadi (`score.ts`). */
  used: HintLevel;
  /** Hozir bosib ochish mumkin. */
  ready: boolean;
  /** Keyingi yordam paydo bo'ladigan payt (ms) — sanoq uchun; yo'q bo'lsa `null`. */
  nextAt: number | null;
  /** Ochilgan qator: mavzu yoki ma'no. Ochilmagan bo'lsa `null`. */
  line: string | null;
  reveal: () => void;
}

/** Holat yangi so'zda noldan boshlanishi uchun chaqiruvchi komponent
 *  `key={puzzleKey(puzzle)}` bilan qayta yaratiladi — shunda sanoq va
 *  ochilgan yordamlar o'z-o'zidan tozalanadi. */
export const puzzleKey = (puzzle: Puzzle | null) =>
  puzzle ? `${puzzle.mode}.${puzzle.length}.${puzzle.number}` : '';

export function useHint(
  puzzle: Puzzle | null,
  phase: Phase,
  /** Yozib bo'lingan urinishlar soni — sanoq shundan boshlanadi. */
  attempts: number,
): Hint {
  const allowed = !!puzzle && puzzle.mode !== 'daily';
  const hasCategory = !!puzzle?.categoryId;
  const hasDescription = !!puzzle?.description;

  /** Sanoq boshlangan payt — birinchi urinish yozilganda qo'yiladi.
   *
   *  `null` — hali hech narsa yozilmagan: yordam ham, sanoq ham yo'q.
   *  Saqlangan o'yin qaytarilganda urinishlar allaqachon bor, ya'ni
   *  sanoq o'sha zahoti boshlanadi — odam o'ylashda davom etyapti. */
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [level, setLevel] = useState(0);
  const [categoryShown, setCategoryShown] = useState(false);
  const [descriptionShown, setDescriptionShown] = useState(false);
  const [category, setCategory] = useState<CategoryLabel | null>(null);

  /* Soat birinchi urinish yozilganda yurgiziladi.
     Effektda: vaqtni o'qish chizish paytida qilinadigan ish emas,
     u har renderda boshqa javob beradi. Bitta ortiqcha render
     bo'ladi va u ko'rinmaydi — sanoq baribir soniyada bir marta
     yangilanadi (`useHintCountdown`). */
  useEffect(() => {
    if (attempts > 0) setStartedAt((at) => at ?? Date.now());
  }, [attempts]);

  useEffect(() => {
    if (!allowed || !puzzle || phase !== 'playing' || startedAt === null) return;
    const length = puzzle.length;
    const timers = [
      window.setTimeout(() => setLevel((v) => Math.max(v, 1)), Math.max(0, startedAt + hintDelayMs(length) - Date.now())),
      window.setTimeout(() => setLevel((v) => Math.max(v, 2)), Math.max(0, startedAt + descriptionDelayMs(length) - Date.now())),
    ];
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [allowed, phase, puzzle, startedAt]);

  // Mavzu nomi ochilganda olinadi — oldin kerak emas.
  useEffect(() => {
    if (!categoryShown || !puzzle?.categoryId || category) return;
    let alive = true;
    void categoryLabel(puzzle.categoryId).then((label) => {
      if (alive) setCategory(label ?? { name: 'noma‘lum', emoji: '' });
    });
    return () => {
      alive = false;
    };
  }, [category, categoryShown, puzzle?.categoryId]);

  const canCategory = level >= 1 && hasCategory && !categoryShown;
  const canDescription = level >= 2 && hasDescription && !descriptionShown;
  const playing = allowed && phase === 'playing';

  const nextAt = useMemo(() => {
    if (!playing || !puzzle || startedAt === null) return null;
    if (level < 1 && hasCategory && !categoryShown) return startedAt + hintDelayMs(puzzle.length);
    if (level < 2 && hasDescription && !descriptionShown) return startedAt + descriptionDelayMs(puzzle.length);
    return null;
  }, [categoryShown, descriptionShown, hasCategory, hasDescription, level, playing, puzzle, startedAt]);

  const reveal = useCallback(() => {
    // Ilovadagi `Sounds.hint()` — «yopiq narsa ochilyapti» chimirlashi.
    // Ovoz ochilganda chalinadi: tugma bosilib hech narsa ochilmasa
    // (ikkala yordam ham tugagan) jim qoladi.
    if (canCategory) {
      play('hint');
      setCategoryShown(true);
    } else if (canDescription) {
      play('hint');
      setDescriptionShown(true);
    }
  }, [canCategory, canDescription]);

  // Ma'no mavzudan ustun — u ko'proq aytadi.
  const line = descriptionShown && puzzle?.description
    ? puzzle.description
    : categoryShown
      ? `Mavzu: ${category ? `${category.emoji} ${category.name}`.trim() : '…'}`
      : null;

  return {
    enabled: allowed,
    used: allowed ? (descriptionShown ? 2 : categoryShown ? 1 : 0) : 0,
    ready: playing && (canCategory || canDescription),
    nextAt,
    line: allowed ? line : null,
    reveal,
  };
}
