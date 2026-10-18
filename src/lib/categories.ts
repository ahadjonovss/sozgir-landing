/** «O'rganish» mavzulari — so'zlari bilan.
 *
 *  Ilgari mavzu nomi `categories/{id}` hujjatidan, so'zning mavzusi esa
 *  lug'atdagi `words[word].c` maydonidan olinardi. Yangi serverda
 *  lug'at jadvalida bunday maydon yo'q (`dictionary_words` da faqat
 *  so'z, uzunligi va javob bo'la olishi), lekin mavzular **alohida**
 *  turadi va ular so'zlari bilan keladi: `/v1/categories` → 22 mavzu,
 *  ~6 000 so'z, ~57 KB.
 *
 *  Shu sabab yo'nalish teskari aylantirildi: ro'yxat bir marta olinadi
 *  va undan «so'z → mavzu» jadvali yasaladi. Natija o'sha-o'sha —
 *  yordamning birinchi bosqichi (mavzu) ishlaydi.
 *
 *  So'zning **ma'nosi** esa tiklanmaydi: u serverda hech qayerda yo'q
 *  (`dictionary.ts` ning sarlavhasiga qarang). */
import { api } from '../api/client';

export interface CategoryLabel {
  name: string;
  emoji: string;
}

export interface Categories {
  /** Mavzu kaliti → nomi va belgisi. */
  labels: Record<string, CategoryLabel>;
  /** So'z → mavzu kaliti. */
  wordCategory: Record<string, string>;
}

const CACHE_KEY = 'sozgir.categories';

const EMPTY: Categories = { labels: {}, wordCategory: {} };

let memory: Categories | null = null;
let loading: Promise<Categories> | null = null;

function readCache(): Categories | null {
  try {
    const raw = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null') as
      | Categories
      | null;
    return raw?.labels && raw.wordCategory ? raw : null;
  } catch {
    return null;
  }
}

interface ApiCategory {
  id?: unknown;
  name?: unknown;
  emoji?: unknown;
  words?: unknown;
}

function build(items: unknown): Categories {
  const labels: Record<string, CategoryLabel> = {};
  const wordCategory: Record<string, string> = {};

  for (const row of Array.isArray(items) ? items : []) {
    const category = row as ApiCategory;
    const id = String(category.id ?? '').trim();
    if (!id) continue;

    labels[id] = {
      name: String(category.name ?? '').trim(),
      emoji: typeof category.emoji === 'string' ? category.emoji : '',
    };

    // So'zlar uzunlik bo'yicha guruhlangan (`{"5": [...]}`) — bu yerda
    // uzunlik ahamiyatsiz, hammasi bitta jadvalga tushadi.
    const groups = category.words;
    if (groups === null || typeof groups !== 'object') continue;
    for (const list of Object.values(groups as Record<string, unknown>)) {
      if (!Array.isArray(list)) continue;
      for (const word of list) {
        if (typeof word === 'string' && word) wordCategory[word] = id;
      }
    }
  }

  return { labels, wordCategory };
}

/** Mavzular. Sahifa umrida bir marta olinadi va brauzerda saqlanadi.
 *
 *  Xato bo'lsa bo'sh jadval qaytadi: mavzusiz yordam ham ishlaydi, u
 *  shunchaki birinchi bosqichni o'tkazib yuboradi. */
export function loadCategories(): Promise<Categories> {
  if (memory !== null) return Promise.resolve(memory);

  const cached = readCache();
  if (cached !== null) {
    memory = cached;
    return Promise.resolve(cached);
  }

  loading ??= api
    .get<{ items?: unknown }>('/v1/categories', { auth: false })
    .then((data) => {
      const built = build(data.items);
      memory = built;
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(built));
      } catch {
        // Joy yetmasa har tashrifda qayta olinadi.
      }
      return built;
    })
    .catch(() => EMPTY)
    .finally(() => {
      loading = null;
    });

  return loading;
}

export async function categoryLabel(id: string): Promise<CategoryLabel | null> {
  const { labels } = await loadCategories();
  return labels[id] ?? null;
}
