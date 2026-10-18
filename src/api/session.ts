/** Seans — kirish va yangilash token'lari.
 *
 *  Ilovadagi `token_store.dart` ning ko'zgusi va qoidalari o'sha:
 *
 *   * **kirish token'i** qisqa umrli (bir soat) va har so'rovga
 *     qo'shiladi;
 *   * **yangilash token'i** uzoq umrli (90 kun). Muddati o'tganda
 *     undan yangi juftlik olinadi va eskisi serverda bekor qilinadi.
 *
 *  Ikkalasi `localStorage` da. Bu tanlov emas, shart: server token'ni
 *  javob tanasida beradi, `Set-Cookie` bilan emas — ya'ni uni
 *  JavaScript'dan boshqa joyga qo'yib bo'lmaydi. Shundan kelib
 *  chiqadigan narsa ochiq aytilsin: saytda XSS bo'lsa, token ham
 *  o'g'irlanadi. Himoya — yangilash token'ining **aylanishi**:
 *  har ishlatilganda almashtiriladi, ya'ni o'g'irlangani bir marta
 *  ishlaydi va egasining navbatdagi yangilashi yiqilib, o'g'irlik
 *  ko'rinadi.
 *
 *  Yangilash so'rovi `api/client.ts` orqali ketmaydi — u token
 *  so'rab yana shu yerga qaytardi. Shuning uchun oddiy `fetch`. */
import { API_BASE } from './config';

const KEY = 'sozgir.auth';

export interface Session {
  uid: string;
  accessToken: string;
  refreshToken: string;
  /** Kirish token'i qachongacha yaroqli — millisekundda. */
  expiresAt: number;
}

type Listener = (session: Session | null) => void;
const listeners = new Set<Listener>();

/** Seans o'zgarganda xabar beradi — kirish, chiqish va muddat
 *  tugaganda. `AuthProvider` shunga obuna bo'ladi: seans serverda
 *  bekor qilinsa, ekran ham o'zi chiqib qoladi. */
export function watchSession(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function announce(session: Session | null): void {
  for (const listener of listeners) listener(session);
}

function valid(value: unknown): value is Session {
  const data = value as Partial<Session> | null;
  return (
    !!data &&
    typeof data.uid === 'string' &&
    data.uid.length > 0 &&
    typeof data.accessToken === 'string' &&
    data.accessToken.length > 0 &&
    typeof data.refreshToken === 'string' &&
    data.refreshToken.length > 0 &&
    typeof data.expiresAt === 'number'
  );
}

/** Xotiradagi nusxa: `localStorage` har so'rovda o'qilmasin. */
let current: Session | null = null;
let loaded = false;

export function readSession(): Session | null {
  if (loaded) return current;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    current = valid(parsed) ? parsed : null;
  } catch {
    // Shaxsiy rejim yoki buzilgan yozuv — kirmagan deb hisoblanadi.
    current = null;
  }
  return current;
}

/** Serverning javobidan seans yasaydi. */
export function sessionFrom(data: {
  uid?: unknown;
  accessToken?: unknown;
  refreshToken?: unknown;
  expiresIn?: unknown;
}): Session | null {
  const seconds = Number(data.expiresIn);
  const session = {
    uid: String(data.uid ?? ''),
    accessToken: String(data.accessToken ?? ''),
    refreshToken: String(data.refreshToken ?? ''),
    // Besh daqiqa zaxira: yo'ldagi so'rov eskirgan token bilan
    // yetib bormasin.
    expiresAt:
      Date.now() + (Number.isFinite(seconds) ? seconds : 3600) * 1000 - 5 * 60 * 1000,
  };
  return valid(session) ? session : null;
}

export function saveSession(session: Session): void {
  current = session;
  loaded = true;
  try {
    localStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    // Yozilmasa seans shu sahifa ochiq turguncha yashaydi.
  }
  announce(session);
}

export function clearSession(): void {
  current = null;
  loaded = true;
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Tozalanmasa ham xotiradagi nusxa bo'sh — so'rovlar tokensiz ketadi.
  }
  announce(null);
}

/** Bir vaqtda bitta yangilash: jangda so'rovlar tez-tez ketadi va
 *  token eskirgan payt ularning hammasi birdan yangilashga urinardi. */
let refreshing: Promise<Session | null> | null = null;

async function renew(token: string): Promise<Session | null> {
  try {
    const response = await fetch(`${API_BASE}/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Soztop-Client': 'web' },
      body: JSON.stringify({ refreshToken: token, platform: 'web' }),
    });

    if (!response.ok) {
      // Server «bunday seans yo'q» dedi — chiqish, parol almashishi
      // yoki token allaqachon ishlatilgan. Saqlab turishning ma'nosi
      // yo'q.
      if (response.status === 401) clearSession();
      return null;
    }

    const next = sessionFrom((await response.json()) as Record<string, unknown>);
    if (next === null) return null;
    saveSession(next);
    return next;
  } catch {
    /* Tarmoq yiqilgan bo'lishi mumkin — seans **saqlanadi** va
       keyingi so'rovda yana uriniladi. Faqat serverning aniq javobi
       tozalaydi (yuqorida): aks holda metroda ochilgan sahifa
       odamni hisobidan chiqarib yuborardi. */
    return null;
  }
}

/** Yaroqli kirish token'i, yoki `null` — kirilmagan bo'lsa. */
export async function accessToken(force = false): Promise<string | null> {
  const session = readSession();
  if (session === null) return null;
  if (!force && Date.now() < session.expiresAt) return session.accessToken;

  refreshing ??= renew(session.refreshToken).finally(() => {
    refreshing = null;
  });
  return (await refreshing)?.accessToken ?? null;
}
