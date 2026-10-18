/** Serverdan kelgan xatoni ekranga chiqadigan matnga aylantiradi.
 *
 *  Yangi backend izohni o'zbekcha va **odamga qaratib** yozadi
 *  (`{"error": "Summa noto'g'ri"}`), shuning uchun odatda uni shundayligicha
 *  ko'rsatish kifoya. Bu yerda faqat ikki holat ushlanadi:
 *
 *   * izoh umuman yo'q (tarmoq uzildi, proksi HTML qaytardi) — o'shanda
 *     holat kodi odamga hech narsa aytmaydi;
 *   * izoh o'rniga xom kod kelgan (`internal`, `not_found`) — bular
 *     jurnal uchun yozilgan, ekran uchun emas.
 *
 *  Ikkalasida ham umumiy, ammo foydali matn beriladi: nima bo'lgani
 *  noma'lum bo'lsa, hech bo'lmaganda nima qilish kerakligi aytiladi. */
import { ApiError } from './client';

/** Ekranga chiqarilmaydigan xom kodlar. */
const RAW_CODES = new Set([
  'ok', 'cancelled', 'unknown', 'invalid_argument', 'invalid-argument',
  'deadline_exceeded', 'deadline-exceeded', 'not_found', 'not-found',
  'already_exists', 'already-exists', 'permission_denied', 'permission-denied',
  'resource_exhausted', 'resource-exhausted', 'failed_precondition',
  'failed-precondition', 'aborted', 'out_of_range', 'out-of-range',
  'unimplemented', 'internal', 'unavailable', 'data_loss', 'data-loss',
  'unauthenticated', 'word_failed', 'finish_failed',
]);

const FALLBACK = 'Server javob bermadi — birozdan keyin urinib ko‘ring';

export function apiError(error: unknown): string {
  if (error instanceof ApiError && error.unauthenticated) {
    return 'Kirish muddati tugadi — qaytadan kiring';
  }

  const message = String((error as { message?: string })?.message ?? '').trim();

  if (
    !message ||
    message === message.toUpperCase() ||
    RAW_CODES.has(message.toLowerCase())
  ) {
    return FALLBACK;
  }
  return message;
}
