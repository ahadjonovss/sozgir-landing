/** Lug'at — ilovadagi bilan bir xil manbadan.
 *
 *  Serverdagi `/v1/dictionary/{uzunlik}` ni o'qiydi: ilova ham, admin
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
 *  So'z **ma'nolari serverda yo'q**: Postgres'dagi `dictionary_words`
 *  da faqat so'zning o'zi, uzunligi va javob bo'la olishi saqlanadi
 *  (`backend/src/tools/migrate.ts` ma'nolarni ataylab ko'chirmagan).
 *  Shu sabab `words` bo'sh qoladi va `wordMeaning` `null` qaytaradi —
 *  chaqiruvchilar buni allaqachon odatiy hol deb qaraydi. */
import { api } from '../api/client';
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

const cacheKey = (length: number) => `sozgir.dict.${length}`;

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
}

const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

async function fetchDictionary(length: number): Promise<StoredDictionary | null> {
  let data: ApiDictionary;
  try {
    data = await api.get<ApiDictionary>(`/v1/dictionary/${length}`, { auth: false });
  } catch {
    // Tarmoq yoki server yiqildi — chaqiruvchi keshdagisi bilan qoladi.
    return null;
  }

  const answers = strings(data.answers);
  if (answers.length === 0) return null;

  return {
    length: typeof data.length === 'number' ? data.length : length,
    version: typeof data.version === 'number' ? data.version : 1,
    answers,
    valid: strings(data.valid),
    words: {},
  };
}

/** Serverdagi versiya yuqori bo'lsa keshni yangilaydi (fon rejimida). */
async function refreshInBackground(length: number, version: number): Promise<void> {
  let manifest: { versions?: Record<string, number> };
  try {
    manifest = await api.get<{ versions?: Record<string, number> }>(
      '/v1/dictionary/manifest',
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
    const data = await api.get<{ answer?: unknown }>('/v1/daily/answer', {
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
