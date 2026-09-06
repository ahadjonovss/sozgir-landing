/** Lug'at — ilova bilan bir xil fayllar (`assets/words/uz_*.json` ning
 *  nusxasi `public/words/` da). Shuning uchun saytdagi kunlik so'z ham,
 *  tan olinadigan so'zlar ro'yxati ham ilovadagining aynan o'zi.
 *
 *  Fayl bir marta olinadi va xotirada qoladi: brauzer keshi bilan birga
 *  ikkinchi o'yin darhol boshlanadi. */

import { normalize } from './uz';

export type WordInfo = { c: string; d: string };

export type Dictionary = {
  length: number;
  version: number;
  /** Yashirin so'zlar — tartibi barqaror, kunlik tanlov shunga tayanadi. */
  answers: string[];
  /** Taxmin sifatida qabul qilinadigan barcha so'zlar. */
  valid: Set<string>;
  /** Har javob so'zining mavzusi va ta'rifi. */
  words: Record<string, WordInfo>;
};

export type Category = {
  id: string;
  name: string;
  emoji: string;
  order: number;
  counts: Record<string, number>;
};

const cache = new Map<number, Promise<Dictionary>>();
let categoriesCache: Promise<Category[]> | null = null;

export function loadDictionary(length: number): Promise<Dictionary> {
  const cached = cache.get(length);
  if (cached) return cached;

  const request = fetch(`/words/uz_${length}.json`)
    .then((response) => {
      if (!response.ok) throw new Error(`Lug'at yuklanmadi: ${response.status}`);
      return response.json();
    })
    .then((raw): Dictionary => ({
      length: raw.length,
      version: raw.version,
      answers: raw.answers,
      valid: new Set<string>(raw.valid),
      words: raw.words ?? {},
    }))
    .catch((error) => {
      // Xato keshda qolib ketmasin — keyingi urinish qaytadan so'raydi.
      cache.delete(length);
      throw error;
    });

  cache.set(length, request);
  return request;
}

export function loadCategories(): Promise<Category[]> {
  categoriesCache ??= fetch('/words/categories.json')
    .then((response) => response.json())
    .then((raw) => (raw.categories as Category[]).sort((a, b) => a.order - b.order))
    .catch((error) => {
      categoriesCache = null;
      throw error;
    });
  return categoriesCache;
}

/** So'z lug'atda bormi (taxmin sifatida qabul qilinadimi). */
export const isValidGuess = (dictionary: Dictionary, word: string) =>
  dictionary.valid.has(normalize(word));

/** Kategoriya bo'yicha javob so'zlari. */
export const answersOfCategory = (dictionary: Dictionary, categoryId: string) =>
  dictionary.answers.filter((word) => dictionary.words[word]?.c === categoryId);
