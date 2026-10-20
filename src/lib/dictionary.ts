/** Lug'at — ilovadagi bilan bir xil manbadan.
 *
 *  Serverdagi `/v1/public/dictionary/{uzunlik}` ni o'qiydi: ilova ham, admin
 *  panel ham shu jadvalga tayanadi, ya'ni sayt hech qachon eski so'zlar
 *  bilan qolmaydi.
 *
 *  Marshrut ochiq — token kerak emas, shuning uchun Firebase SDK
 *  yuklanmaydi. Siqilgan holda ~74 KB, keyin brauzerda saqlanadi:
 *  ikkinchi tashrifda o'yin darhol boshlanadi.
 *
 *  Versiya tekshiruvi fon rejimida: keshdagi lug'at bilan darhol
 *  o'ynaladi, yangisi bo'lsa keshga yoziladi va **keyingi** o'yindan
 *  qo'llanadi — so'z o'yin o'rtasida almashmasligi kerak.
 *
 *  **So'z ma'nolari serverda bor.** Bir vaqtlar yo'q edi: yangi
 *  serverga ko'chishda `dictionary_words` ga faqat so'z, uzunligi va
 *  javob bo'la olishi ko'chgan edi, shuning uchun bu fayl javobdagi
 *  `words` ni umuman o'qimay, jadvalni mavzular ro'yxatidan qayta
 *  yasardi. Marshrut o'shandan beri to'ldirilgan va endi har so'z
 *  ma'nosi (`d`) bilan keladi, eski kod esa uni **tashlab yuborardi**:
 *  saytda o'yin tugagach ma'no chiqmay qo'ygani va `wordMeaning` doim
 *  `null` qaytargani shundan.
 *
 *  Endi javobdagi `words` asos qilib olinadi. Mavzu (`c`) esa
 *  avvalgidek alohida marshrutdan to'ldiriladi: u lug'at jadvalida
 *  yo'q va `categories.ts` dagi «so'z → mavzu» jadvali o'z o'rnida
 *  qoladi. */
import { api } from '../api/client';
import { loadCategories } from './categories';
import { normalize } from './uz';

export interface WordInfo {
  /** Kategoriya (`tabiat`, `taom`, …). */
  c: string;
  /** So'z ma'nosi — o'yin tugagach ko'rsatiladi. */
  d?: string;
}

export interface Dictionary {
  length: number;
  version: number;
  /** Javob bo'lishi mumkin bo'lgan so'zlar — tartibi barqaror bo'lishi
   *  shart, kunlik tanlov shunga tayanadi. */
  answers: string[];
  /** Qabul qilinadigan barcha taxminlar. */
  valid: Set<string>;
  words: Record<string, WordInfo>;
}

interface StoredDictionary {
  length: number;
  version: number;
  answers: string[];
  valid: string[];
  words: Record<string, WordInfo>;
}

/** Keshning kaliti. Oxiridagi raqam — **saqlanadigan shaklning**
 *  versiyasi, lug'atniki emas.
 *
 *  U `2` ga ko'tarildi, chunki eski kesh ma'nosiz yozilgan edi va uni
 *  fon tekshiruvi tuzatmasdi: u faqat server versiyasi o'sganda
 *  ishlaydi, lug'at esa o'zgarmagan bo'lishi mumkin. Yangi kalit bilan
 *  eski yozuv shunchaki e'tiborsiz qoladi va lug'at bir marta qaytadan
 *  olinadi. */
const cacheKey = (length: number) => `sozgir.dict2.${length}`;

const memory = new Map<number, Dictionary>();
const inflight = new Map<number, Promise<Dictionary>>();

function hydrate(stored: StoredDictionary): Dictionary {
  const answers = stored.answers.map(normalize);
  const valid = new Set(stored.valid.map(normalize));
  // Javoblar har doim tan olinadi, ro'yxatda alohida turmasa ham.
  for (const answer of answers) valid.add(answer);
  return {
    length: stored.length,
    version: stored.version,
    answers,
    valid,
    words: stored.words,
  };
}

function readCache(length: number): StoredDictionary | null {
  try {
    const raw = localStorage.getItem(cacheKey(length));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredDictionary;
    return parsed.answers?.length ? parsed : null;
  } catch {
    return null;
  }
}

function writeCache(stored: StoredDictionary): void {
  try {
    localStorage.setItem(cacheKey(stored.length), JSON.stringify(stored));
  } catch {
    // Joy yetmasa yoki shaxsiy rejim bo'lsa — har tashrifda yuklanadi.
  }
}

interface ApiDictionary {
  length?: number;
  version?: number;
  answers?: unknown;
  valid?: unknown;
  words?: unknown;
}

const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

async function fetchDictionary(length: number): Promise<StoredDictionary | null> {
  let data: ApiDictionary;
  try {
    data = await api.get<ApiDictionary>(`/v1/public/dictionary/${length}`, { auth: false });
  } catch {
    // Tarmoq yoki server yiqildi — chaqiruvchi keshdagisi bilan qoladi.
    return null;
  }

  const answers = strings(data.answers);
  if (answers.length === 0) return null;

  // Mavzular alohida keladi va faqat javob bo'la oladigan so'zlar uchun
  // kerak: yordam **javobning** mavzusini ochadi, taxminnikini emas.
  // Lug'at jadvalida mavzu yo'q, shuning uchun u serverdagi ma'noning
  // ustiga emas, yoniga qo'yiladi.
  const { wordCategory } = await loadCategories();
  const from = data.words;
  const given: Record<string, unknown> =
    from !== null && typeof from === 'object' ? (from as Record<string, unknown>) : {};

  const words: Record<string, WordInfo> = {};
  for (const answer of answers) {
    const row = given[answer];
    const meaning =
      row !== null && typeof row === 'object' ? (row as { d?: unknown }).d : undefined;
    const category = wordCategory[answer];
    // Na mavzu, na ma'no bo'lsa yozuvning ma'nosi yo'q — jadval
    // bo'sh obyektlar bilan to'lib ketmasin.
    if (!category && typeof meaning !== 'string') continue;
    words[answer] = { c: category ?? '' };
    if (typeof meaning === 'string' && meaning.trim() !== '') {
      words[answer]!.d = meaning.trim();
    }
  }

  return {
    length: typeof data.length === 'number' ? data.length : length,
    version: typeof data.version === 'number' ? data.version : 1,
    answers,
    valid: strings(data.valid),
    words,
  };
}

/** Serverdagi versiya yuqori bo'lsa keshni yangilaydi (fon rejimida). */
async function refreshInBackground(length: number, version: number): Promise<void> {
  let manifest: { versions?: Record<string, number> };
  try {
    manifest = await api.get<{ versions?: Record<string, number> }>(
      '/v1/public/dictionary/manifest',
      { auth: false },
    );
  } catch {
    return;
  }

  const latest = manifest.versions?.[String(length)];
  if (typeof latest !== 'number' || latest <= version) return;

  const fresh = await fetchDictionary(length);
  if (fresh) writeCache(fresh);
}

export function loadDictionary(length: number): Promise<Dictionary> {
  const ready = memory.get(length);
  if (ready) return Promise.resolve(ready);

  const running = inflight.get(length);
  if (running) return running;

  const task = (async () => {
    const cached = readCache(length);
    if (cached) {
      const dictionary = hydrate(cached);
      memory.set(length, dictionary);
      void refreshInBackground(length, dictionary.version);
      return dictionary;
    }

    const fresh = await fetchDictionary(length);
    if (!fresh) {
      throw new Error('Lug‘atni yuklab bo‘lmadi');
    }
    writeCache(fresh);
    const dictionary = hydrate(fresh);
    memory.set(length, dictionary);
    return dictionary;
  })().finally(() => inflight.delete(length));

  inflight.set(length, task);
  return task;
}

/** Backend belgilagan kunlik so'z. Bo'lmasa `null` — chaqiruvchi lokal
 *  deterministik tanlovga o'tadi (ilovadagi mantiq shunday).
 *
 *  Firestore'da bu hujjat hammaga ochiq edi, serverda esa marshrut
 *  token talab qiladi. Kirmagan odam uchun `null` qaytadi va o'sha
 *  lokal tanlov ishlaydi — ya'ni kirmasdan o'ynash avvalgidek qoladi,
 *  faqat so'z serverdagisi bilan bir xil bo'lishi kafolatlanmaydi. */
export async function fetchDailyAnswer({
  dateKey,
  length,
}: {
  dateKey: string;
  length: number;
}): Promise<string | null> {
  try {
    const data = await api.get<{ answer?: unknown }>('/v1/web/daily/answer', {
      query: { day: dateKey, length },
    });
    const answer = data.answer;
    return typeof answer === 'string' && answer.length > 0 ? normalize(answer) : null;
  } catch {
    return null;
  }
}

/** So'zning ma'nosi — lug'atdagi ta'rif. Topilmasa (yoki lug'at
 *  yuklanmasa) `null`.
 *
 *  Jang tugagach javob so'zi ochiq turadi; ilovadagi natija ekranida
 *  uning ma'nosi ham shu yerda bo'ladi, ya'ni lug'atga alohida kirishning
 *  hojati yo'q. Sayt shu paytgacha faqat so'zning o'zini ko'rsatardi. */
export async function wordMeaning(word: string, length: number): Promise<string | null> {
  try {
    const dictionary = await loadDictionary(length);
    return dictionary.words[normalize(word)]?.d ?? null;
  } catch {
    return null;
  }
}
