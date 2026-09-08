/** Yordam — ilovadagi `hintLevel` mantig'ining porti.
 *
 *  Cheksiz rejimda o'ylash cho'zilganda yordam o'zi paydo bo'ladi: so'z
 *  uzunligiga qarab 15·(n−1) soniyadan keyin **mavzu** (kategoriya), undan
 *  ikki barobar keyin **ma'no** ochiladi. Undan oldin qancha qolgani sanab
 *  turiladi — tugma birdan paydo bo'lgandan ko'ra, kutilayotgani ko'rinib
 *  turgani yaxshi. Kunlik o'yinda yordam yo'q: so'z hamma uchun bir xil,
 *  reyting adolatli bo'lishi kerak.
 *
 *  Mavzu nomi `categories/{id}` dan olinadi (ochiq hujjat, faqat `name`
 *  va `emoji` maydonlari) va brauzerda eslab qolinadi. */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PATHS } from '../firebase/paths';
import { readDoc } from '../firebase/rest';
import type { Puzzle, Phase } from './useSozTop';

/** Mavzu shuncha vaqtdan keyin — ilovadagi `hintDelayFor`. */
export const hintDelayMs = (length: number) => 15 * (length - 1) * 1000;
/** Ma'no — ikki barobar uzoqroq o'ylagandan keyin. */
export const descriptionDelayMs = (length: number) => hintDelayMs(length) * 2;

export interface CategoryLabel {
  name: string;
  emoji: string;
}

const CACHE_KEY = 'sozgir.categories';
const memory = new Map<string, CategoryLabel>();

function readCache(): Record<string, CategoryLabel> {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? '{}') as Record<string, CategoryLabel>;
  } catch {
    return {};
  }
}

export async function categoryLabel(id: string): Promise<CategoryLabel | null> {
  const cached = memory.get(id) ?? readCache()[id];
  if (cached) {
    memory.set(id, cached);
    return cached;
  }
  const data = await readDoc(`${PATHS.categories}/${id}`, { fields: ['name', 'emoji'] });
  if (!data || typeof data.name !== 'string') return null;
  const label = { name: data.name, emoji: typeof data.emoji === 'string' ? data.emoji : '' };
  memory.set(id, label);
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ...readCache(), [id]: label }));
  } catch {
    // kesh shart emas
  }
  return label;
}

export interface Hint {
  /** Yordam umuman bormi (kunlikda va tugagan o'yinda — yo'q). */
  enabled: boolean;
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

export function useHint(puzzle: Puzzle | null, phase: Phase): Hint {
  const allowed = !!puzzle && puzzle.mode !== 'daily';
  const hasCategory = !!puzzle?.categoryId;
  const hasDescription = !!puzzle?.description;

  // Sanoq komponent yaratilgan paytdan — ilovadagi kabi (saqlangan o'yin
  // qaytarilganda ham).
  const [startedAt] = useState(() => Date.now());
  const [level, setLevel] = useState(0);
  const [categoryShown, setCategoryShown] = useState(false);
  const [descriptionShown, setDescriptionShown] = useState(false);
  const [category, setCategory] = useState<CategoryLabel | null>(null);

  useEffect(() => {
    if (!allowed || !puzzle || phase !== 'playing') return;
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
    if (!playing || !puzzle) return null;
    if (level < 1 && hasCategory && !categoryShown) return startedAt + hintDelayMs(puzzle.length);
    if (level < 2 && hasDescription && !descriptionShown) return startedAt + descriptionDelayMs(puzzle.length);
    return null;
  }, [categoryShown, descriptionShown, hasCategory, hasDescription, level, playing, puzzle, startedAt]);

  const reveal = useCallback(() => {
    if (canCategory) setCategoryShown(true);
    else if (canDescription) setDescriptionShown(true);
  }, [canCategory, canDescription]);

  // Ma'no mavzudan ustun — u ko'proq aytadi.
  const line = descriptionShown && puzzle?.description
    ? puzzle.description
    : categoryShown
      ? `Mavzu: ${category ? `${category.emoji} ${category.name}`.trim() : '…'}`
      : null;

  return {
    enabled: allowed,
    ready: playing && (canCategory || canDescription),
    nextAt,
    line: allowed ? line : null,
    reveal,
  };
}
