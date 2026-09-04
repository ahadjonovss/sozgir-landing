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
  { timeout = 8000 }: { timeout?: number } = {},
): Promise<Record<string, unknown> | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(
      `${BASE}/${path}?key=${firebaseConfig.apiKey}`,
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
