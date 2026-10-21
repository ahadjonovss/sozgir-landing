/** Server bilan gaplashadigan yagona joy.
 *
 *  Ilovadagi `api_client.dart` ning ko'zgusi: bir xil sarlavhalar, bir
 *  xil xato shakli (`{"error": "..."}`) va 401'da bir marta tokenni
 *  majburan yangilab qayta urinish. Ikkalasi bir serverga uradi, demak
 *  farq qilsa — farqi xatoga aylanadi.
 *
 *  Token seansdan olinadi (`api/session.ts`) — u ham shu serverniki.
 *  Ochiq marshrutlarda (lug'at, reyting, kunlik so'z) token umuman
 *  so'ralmaydi: `auth: false` bo'lsa seansga ham qaralmaydi.
 *
 *  Manzillar **saytniki**: `/v1/public/*` tokensiz o'qiladigani,
 *  `/v1/web/*` tokenlisi. Ilovaning `/v1/*` marshrutlariga sayt
 *  urmaydi — ular ilova bilan birga o'zgaradi va o'shanda saytni
 *  sindirardi. Sabab serverda, `backend/src/web/index.ts` da
 *  to'liq yozilgan. */
import { API_BASE } from './config';
import { accessToken } from './session';

/** Server qaytargan xato.
 *
 *  Matn serverdan keladi va u **odamga ko'rsatiladigan** qilib yozilgan,
 *  shuning uchun uni qayta tarjima qilish shart emas. */
export class ApiError extends Error {
  readonly status: number | null;
  readonly path: string | null;

  constructor(
    message: string,
    status: number | null = null,
    path: string | null = null,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.path = path;
  }

  /** Token eskirgan yoki yo'q. */
  get unauthenticated(): boolean {
    return this.status === 401;
  }

  /** Kunlik chegaraga yetilgan — ekran premium taklifini ko'rsatadi.
   *
   *  Holat kodi bo'yicha, matn bo'yicha emas: xabar o'zgarsa
   *  tekshiruv sinmasligi kerak. */
  get payment(): boolean {
    return this.status === 402;
  }
}

/** Kunlik chegaraga yetilganda varaqqa yuboriladigan hodisa.
 *
 *  `lib/plays.ts` uni tinglaydi va sanoqni qaytadan o'qiydi: server
 *  «tugadi» degan zahoti ekrandagi son ham nolga tushadi va premium
 *  taklifi o'zi chiqadi. */
export const LIMIT_EVENT = 'sozgir:limit';

export interface Options {
  query?: Record<string, string | number | undefined>;
  body?: unknown;
  /** Token qo'shilsinmi. Ochiq marshrutlarda `false` — shunda seans
   *  umuman o'qilmaydi va kirmagan odam ham javob oladi. */
  auth?: boolean;
  timeout?: number;
}

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

function url(path: string, query: Options['query']): string {
  const base = `${API_BASE}${path}`;
  if (query === undefined) return base;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value));
  }
  const tail = params.toString();
  return tail === '' ? base : `${base}?${tail}`;
}

async function send<T>(
  method: Method,
  path: string,
  { query, body, auth = true, timeout = 12_000 }: Options = {},
  retried = false,
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    // Sayt o'zini tanishtiradi — jurnal uchun. Kunlik chegara
    // endi bunga qaramaydi: u `/v1/web/*` ning o'zidan kelib
    // chiqadi va sarlavhani almashtirib aylanib o'tib bo'lmaydi
    // (`backend/src/app/site_limit.ts`).
    'X-Soztop-Client': 'web',
  };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  if (auth) {
    const bearer = await accessToken();
    if (bearer !== null) headers.Authorization = `Bearer ${bearer}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  let response: Response;
  try {
    response = await fetch(url(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    throw new ApiError(`Serverga ulanib bo'lmadi: ${String(error)}`, null, path);
  } finally {
    clearTimeout(timer);
  }

  // Token eskirgan bo'lsa bir marta majburan yangilab, so'rov
  // qaytariladi. Ikkinchi marta urinilmaydi: sabab token emas, hisobning
  // o'zi.
  if (response.status === 401 && auth && !retried) {
    await accessToken(true);
    return send<T>(method, path, { query, body, auth, timeout }, true);
  }

  const text = await response.text();
  let data: unknown = {};
  if (text !== '') {
    try {
      data = JSON.parse(text);
    } catch {
      // Javob JSON emas — proksi yoki xato sahifasi. Matnni ko'rsatish
      // foydasiz, shuning uchun holat kodi yetadi.
    }
  }

  if (response.ok) return data as T;

  /* Kunlik chegaraga yetilgani — ekranga aytiladi.
     Hodisa orqali, to'g'ridan-to'g'ri chaqiruv bilan emas: sanoqni
     yurituvchi `lib/plays.ts` ning o'zi shu mijozdan foydalanadi va
     uni bu yerdan import qilish ikkita modulni bir-biriga bog'lab
     qo'yardi. Tinglovchi bo'lmasa hech narsa bo'lmaydi. */
  if (response.status === 402) {
    window.dispatchEvent(new Event(LIMIT_EVENT));
  }

  const message = (data as { error?: unknown }).error;
  throw new ApiError(
    typeof message === 'string' && message !== ''
      ? message
      : `Server xatosi (${response.status})`,
    response.status,
    path,
  );
}

export const api = {
  get: <T>(path: string, options?: Options) => send<T>('GET', path, options),
  post: <T>(path: string, options?: Options) => send<T>('POST', path, options),
  put: <T>(path: string, options?: Options) => send<T>('PUT', path, options),
  delete: <T>(path: string, options?: Options) => send<T>('DELETE', path, options),
};
