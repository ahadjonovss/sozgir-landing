/** Ochiq hujjatlarni Firestore REST orqali o'qish.
 *
 *  Lug'at va kunlik so'z qoidalarda `allow read: if true` — ya'ni ularni
 *  olish uchun na hisob, na Firebase SDK kerak. Shu sabab sahifa ochilishida
 *  SDK yuklanmaydi (u ~100 KB): u faqat foydalanuvchi kirganda yoki natija
 *  saqlanganda `client.ts` orqali chaqiriladi.
 *
 *  Javob «typed value» shaklida keladi (`{"stringValue":"..."}`), shuning
 *  uchun `decode` bilan oddiy JS qiymatlariga o'giriladi. */
import { firebaseConfig } from './config';

const BASE =
  `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}` +
  '/databases/(default)/documents';

type TypedValue = Record<string, unknown>;

function decode(value: TypedValue): unknown {
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('nullValue' in value) return null;
  if ('timestampValue' in value) return value.timestampValue;
  if ('arrayValue' in value) {
    const values =
      (value.arrayValue as { values?: TypedValue[] } | undefined)?.values ?? [];
    return values.map(decode);
  }
  if ('mapValue' in value) {
    return decodeFields(
      (value.mapValue as { fields?: Record<string, TypedValue> }).fields ?? {},
    );
  }
  return undefined;
}

export interface RestDoc {
  id: string;
  fields: Record<string, unknown>;
}

function decodeFields(fields: Record<string, TypedValue>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) out[key] = decode(value);
  return out;
}

/** Hujjatni o'qiydi. Topilmasa yoki tarmoq yiqilsa — `null`.
 *
 *  Chaqiruvchi har doim `null` ni normal holat deb qaraydi: kunlik so'z
 *  serverda bo'lmasa lokal tanlov ishlaydi, lug'at kelmasa keshdagisi. */
export async function readDoc(
  path: string,
  { timeout = 8000, fields }: { timeout?: number; fields?: string[] } = {},
): Promise<Record<string, unknown> | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  // `fields` — faqat kerakli maydonlar: kategoriya hujjati katta (so'zlar
  // ro'yxati), yorliq uchun esa nom va emoji yetadi.
  const mask = (fields ?? []).map((name) => `&mask.fieldPaths=${name}`).join('');
  try {
    const response = await fetch(
      `${BASE}/${path}?key=${firebaseConfig.apiKey}${mask}`,
      { signal: controller.signal },
    );
    if (!response.ok) return null;
    const body = (await response.json()) as {
      fields?: Record<string, TypedValue>;
    };
    return decodeFields(body.fields ?? {});
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Kolleksiyani o'qiydi — saralash va chegara bilan.
 *
 *  Reyting uchun: `scores` va `daily_results/.../entries` qoidalarda
 *  hammaga ochiq, shuning uchun jadval ham SDK'siz tuziladi. Bitta
 *  maydon bo'yicha saralanadi, ya'ni qo'shimcha indeks kerak emas. */
export async function listDocs(
  path: string,
  {
    orderBy,
    pageSize = 20,
    timeout = 8000,
  }: { orderBy?: string; pageSize?: number; timeout?: number } = {},
): Promise<RestDoc[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const query = new URLSearchParams({
      key: firebaseConfig.apiKey,
      pageSize: String(pageSize),
    });
    if (orderBy) query.set('orderBy', orderBy);

    const response = await fetch(`${BASE}/${path}?${query}`, {
      signal: controller.signal,
    });
    if (!response.ok) return [];

    const body = (await response.json()) as {
      documents?: { name: string; fields?: Record<string, TypedValue> }[];
    };
    return (body.documents ?? []).map((document) => ({
      id: document.name.split('/').pop() ?? '',
      fields: decodeFields(document.fields ?? {}),
    }));
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/** Bir nechta hujjatni bitta so'rovda o'qiydi (`documents:batchGet`).
 *
 *  Avatarlar uchun: reytingdagi o'nlab qator uchun har biriga alohida
 *  so'rov yuborilmaydi. Topilmagan hujjat `null` bilan qaytadi — bu ham
 *  javob («rasmi yo'q»), chaqiruvchi uni keshlaydi. Tarmoq yiqilsa
 *  bo'sh xarita: avatar bezak, bosh harf qolaveradi. */
export async function batchGetDocs(
  paths: string[],
  { fields, timeout = 8000 }: { fields?: string[]; timeout?: number } = {},
): Promise<Record<string, Record<string, unknown> | null>> {
  const out: Record<string, Record<string, unknown> | null> = {};
  if (paths.length === 0) return out;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(`${BASE}:batchGet?key=${firebaseConfig.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        documents: paths.map((path) => `${BASE}/${path}`),
        ...(fields ? { mask: { fieldPaths: fields } } : {}),
      }),
    });
    if (!response.ok) return out;
    const body = (await response.json()) as {
      found?: { name: string; fields?: Record<string, TypedValue> };
      missing?: string;
    }[];
    for (const item of body) {
      if (item.found) {
        out[item.found.name.slice(BASE.length + 1)] = decodeFields(item.found.fields ?? {});
      } else if (item.missing) {
        out[item.missing.slice(BASE.length + 1)] = null;
      }
    }
    return out;
  } catch {
    return out;
  } finally {
    clearTimeout(timer);
  }
}
