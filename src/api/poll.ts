/** Serverdan davriy o'qib, kuzatuvga o'xshatib beradi.
 *
 *  Firestore'dagi `onSnapshot` ning o'rnini bosadi va imzosi ataylab
 *  o'shaniki bilan bir xil (`(data) => void` + `Unsubscribe`), shunda
 *  chaqiruv joylari deyarli o'zgarmaydi.
 *
 *  Farqni ochiq aytish kerak: **bu realtime emas.** O'zgarish darhol
 *  emas, keyingi so'rovda ko'rinadi. Ilovada ham shunday qilingan
 *  (`polled_stream.dart`) va sabab bir xil: do'stlar ro'yxati,
 *  so'rovlar, turnir jadvali kabi joylarda o'zgarish kamdan-kam
 *  bo'ladi va bir necha soniya kechikish sezilmaydi. Ular uchun socket
 *  ochish — har ekranga alohida kanal, qayta ulanish va holatni
 *  tiklash degani.
 *
 *  Jang boshqa: u yerda har yurish muhim va u socket orqali ketadi
 *  (`socket.ts`).
 *
 *  Ikki narsa ataylab:
 *   * **birinchi so'rov darhol** ketadi — sahifa bo'sh turmaydi;
 *   * **sahifa fonda bo'lsa so'rov to'xtaydi** va qaytganda darhol
 *     bittasi ketadi: boshqa yorliqqa o'tgan odamga yangilik kerak
 *     emas, lekin taymer ishlayverardi. */
import { ApiError } from './client';

export type Unsubscribe = () => void;

/** Sahifa ko'rinmay turibdimi. */
const hidden = (): boolean =>
  typeof document !== 'undefined' && document.visibilityState === 'hidden';

export function poll<T>(
  fetch: () => Promise<T>,
  onData: (value: T) => void,
  {
    period = 10_000,
    onError,
  }: {
    period?: number;
    /** Chaqiruvchi xatoni ko'rsatmoqchi bo'lsa. Berilmasa jim
     *  o'tiladi — chaqiruvchi oxirgi holat bilan qoladi, `live.ts`
     *  dagi xulq aynan shunday edi. */
    onError?: (error: unknown) => void;
  } = {},
): Unsubscribe {
  let stopped = false;
  let busy = false;
  let timer: ReturnType<typeof setInterval> | null = null;

  /** Ketma-ket nechta xato bo'ldi.
   *
   *  Xato **bir marta** uzatiladi: takroriy xabar sahifaga yangilik
   *  qo'shmaydi. Tarmoq tiklanganda sanoq nolga qaytadi. */
  let failures = 0;

  const tick = async (): Promise<void> => {
    // Oldingi so'rov tugamagan bo'lsa o'tkazib yuboriladi: sekin
    // tarmoqda so'rovlar bir-birining ustiga chiqib ketardi.
    if (stopped || busy) return;
    busy = true;
    try {
      const value = await fetch();
      failures = 0;
      if (!stopped) onData(value);
    } catch (error) {
      // Autentifikatsiya xatosi — qayta urinish foydasiz: token
      // yaroqsiz va u keyingi so'rovda o'zgarmaydi. Kuzatuv to'xtaydi.
      if (error instanceof ApiError && error.unauthenticated) {
        stop();
        onError?.(error);
        return;
      }
      failures += 1;
      if (failures === 1) onError?.(error);
    } finally {
      busy = false;
    }
  };

  const onVisible = (): void => {
    if (!hidden()) void tick();
  };

  function stop(): void {
    if (stopped) return;
    stopped = true;
    if (timer !== null) clearInterval(timer);
    timer = null;
    document.removeEventListener('visibilitychange', onVisible);
  }

  void tick();
  timer = setInterval(() => {
    if (!hidden()) void tick();
  }, period);
  document.addEventListener('visibilitychange', onVisible);

  return stop;
}

/*
 * Bir xil ma'lumotni so'rayotgan kuzatuvchilar **bitta** so'rov bilan
 * kifoyalanadi.
 *
 * Firestore SDK'si buni o'zi qilardi: bitta hujjatga o'nta tinglovchi
 * ulansa ham tarmoqqa bitta kuzatuv chiqardi. Davriy so'rovda bunday
 * emas — har kuzatuvchi o'z taymerini ochadi va sarlavha bilan sahifa
 * bir xil ro'yxatni so'rasa, server ikki marta band bo'ladi.
 *
 * Kalitga so'rov **parametrlari ham** kirishi kerak:
 * `turnirs/open?limit=10` va `?limit=30` boshqa-boshqa narsa.
 */
interface Shared {
  listeners: Set<(value: unknown) => void>;
  stop: Unsubscribe;
  /** Oxirgi kelgan qiymat — kech qo'shilgan kuzatuvchi bo'sh sahifa
   *  ko'rmasligi uchun darhol beriladi. */
  last: unknown;
  seen: boolean;
}

const shared = new Map<string, Shared>();

export function sharedPoll<T>(
  key: string,
  fetch: () => Promise<T>,
  onData: (value: T) => void,
  options: { period?: number; onError?: (error: unknown) => void } = {},
): Unsubscribe {
  const listener = onData as (value: unknown) => void;
  let entry = shared.get(key);

  if (entry === undefined) {
    const fresh: Shared = {
      listeners: new Set([listener]),
      stop: () => {},
      last: undefined,
      seen: false,
    };
    shared.set(key, fresh);
    fresh.stop = poll<T>(
      fetch,
      (value) => {
        fresh.last = value;
        fresh.seen = true;
        for (const fn of [...fresh.listeners]) fn(value);
      },
      {
        ...options,
        onError: (error) => options.onError?.(error),
      },
    );
    entry = fresh;
  } else {
    entry.listeners.add(listener);
    // Birinchi so'rov allaqachon o'tgan bo'lsa yangi kuzatuvchi uni
    // kutib turmaydi.
    if (entry.seen) listener(entry.last);
  }

  const current = entry;
  return () => {
    current.listeners.delete(listener);
    // Oxirgi kuzatuvchi ketdi — taymer o'chadi, ya'ni sahifa yopilsa
    // so'rov ham to'xtaydi.
    if (current.listeners.size === 0) {
      current.stop();
      shared.delete(key);
    }
  };
}
