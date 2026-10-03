/** Cloud Functions chaqiruvlari.
 *
 *  So'zjangning butun mantig'i serverda: javob so'zi mijozga hech qachon
 *  yuborilmaydi, taxminni funksiya tekshiradi va faqat ranglar qatorini
 *  qaytaradi. Shuning uchun saytga faqat chaqirish va natijani kuzatish
 *  qoladi — qoidalar ilova bilan bir xil bo'lishi o'z-o'zidan kelib
 *  chiqadi.
 *
 *  SDK kechiktirib yuklanadi: funksiyalar faqat So'zjang sahifasida
 *  kerak. */
import { client } from './client';
import { EMULATOR, useEmulator } from './config';

/** Funksiyalar joylashtirilgan mintaqa — ilovadagi bilan bir xil. */
const REGION = 'europe-west1';

export async function callFunction<T>(
  name: string,
  payload: Record<string, unknown> = {},
): Promise<T> {
  const { app } = await client();
  const { connectFunctionsEmulator, getFunctions, httpsCallable } =
    await import('firebase/functions');

  const functions = getFunctions(app, REGION);
  if (useEmulator) {
    connectFunctionsEmulator(functions, EMULATOR.host, EMULATOR.functions);
  }

  const result = await httpsCallable(functions, name)(payload);
  return result.data as T;
}

/** Chaqiruvning xom holat kodlari (`HttpsError` nomlari).
 *
 *  SDK javobni o'qiy olmaganda yoki server izoh bermaganda xabar
 *  o'rniga shu nomning o'zini qo'yadi — odamga u hech narsa aytmaydi. */
const RAW_CODES = new Set([
  'ok', 'cancelled', 'unknown', 'invalid-argument', 'deadline-exceeded',
  'not-found', 'already-exists', 'permission-denied', 'resource-exhausted',
  'failed-precondition', 'aborted', 'out-of-range', 'unimplemented',
  'internal', 'unavailable', 'data-loss', 'unauthenticated',
]);

/** Serverdan kelgan o'zbekcha izoh bo'lsa — o'sha ko'rsatiladi.
 *  `internal` kabi xom kodlar foydalanuvchiga hech narsa aytmaydi.
 *
 *  Ikkita tuzoq bor va ikkalasi ham tekshiruvni chetlab o'tardi: SDK
 *  kodni **kichik harfda** beradi (`internal`, `not-found` — ya'ni
 *  «hammasi bosh harfmi» savoli ularni ushlamaydi) va oxiriga urinish
 *  raqamini qo'shadi (`internal [0]`). Natijada joylashtirilmagan
 *  funksiya chaqirilganda ekranda «internal [0]» turardi. */
export function functionError(error: unknown): string {
  const message = String((error as { message?: string })?.message ?? '')
    // Urinish raqami — xabarning o'zi emas, SDK qo'shimchasi.
    .replace(/\s*\[\d+\]\s*$/, '')
    .trim();
  if (!message || message === message.toUpperCase() || RAW_CODES.has(message.toLowerCase())) {
    return 'Server javob bermadi — birozdan keyin urinib ko‘ring';
  }
  return message;
}
