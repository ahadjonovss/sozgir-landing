/** Lug'at — ilovadagi bilan bir xil manbadan.
 *
 *  Firestore'dagi `dictionaries/uz_{4..7}` hujjatini o'qiydi: ilovaning
 *  `assets/words/uz_5.json` fayli ham, admin panel ham shu hujjatga
 *  tayanadi, ya'ni sayt hech qachon eski so'zlar bilan qolmaydi.
 *
 *  Hujjat ochiq (`allow read: if true`), shuning uchun Firebase SDK kerak
 *  emas — REST yetadi. Siqilgan holda ~74 KB, keyin brauzerda saqlanadi:
 *  ikkinchi tashrifda o'yin darhol boshlanadi.
 *
 *  Versiya tekshiruvi fon rejimida: keshdagi lug'at bilan darhol
 *  o'ynaladi, yangisi bo'lsa keshga yoziladi va **keyingi** o'yindan
 *  qo'llanadi — so'z o'yin o'rtasida almashmasligi kerak. */
import { readDoc } from '../firebase/rest';
import { dictionaryDoc, PATHS } from '../firebase/paths';
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

async function fetchDictionary(length: number): Promise<StoredDictionary | null> {
  const data = await readDoc(`${PATHS.dictionaries}/${dictionaryDoc(length)}`);
  const answers = data?.answers;
  if (!Array.isArray(answers) || answers.length === 0) return null;

  return {
    length: typeof data?.length === 'number' ? data.length : length,
    version: typeof data?.version === 'number' ? data.version : 1,
    answers: answers.filter((word): word is string => typeof word === 'string'),
    valid: Array.isArray(data?.valid)
      ? data.valid.filter((word): word is string => typeof word === 'string')
      : [],
    words: (data?.words as Record<string, WordInfo> | undefined) ?? {},
  };
}

/** Serverdagi versiya yuqori bo'lsa keshni yangilaydi (fon rejimida). */
async function refreshInBackground(length: number, version: number): Promise<void> {
  const manifest = await readDoc(`${PATHS.dictionaries}/${PATHS.manifest}`);
  const versions = manifest?.versions as Record<string, number> | undefined;
  const latest = versions?.[String(length)];
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
 *  deterministik tanlovga o'tadi (ilovadagi mantiq shunday). */
export async function fetchDailyAnswer({
  dateKey,
  length,
}: {
  dateKey: string;
  length: number;
}): Promise<string | null> {
  const data = await readDoc(`${PATHS.daily}/${dateKey}_${length}`);
  const answer = data?.answer;
  return typeof answer === 'string' && answer.length > 0 ? normalize(answer) : null;
}
