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

/** Serverdan kelgan o'zbekcha izoh bo'lsa — o'sha ko'rsatiladi.
 *  `INTERNAL` kabi xom kodlar foydalanuvchiga hech narsa aytmaydi. */
export function functionError(error: unknown): string {
  const message = String((error as { message?: string })?.message ?? '').trim();
  if (!message || message === message.toUpperCase()) {
    return 'Server javob bermadi — birozdan keyin urinib ko‘ring';
  }
  return message;
}
