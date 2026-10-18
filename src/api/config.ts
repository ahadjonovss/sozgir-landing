/** Serverning manzili.
 *
 *  Sayt faqat prodga ulanadi — landing ochiq va dev bazasi kerak emas.
 *  Lokal serverga urish kerak bo'lsa `VITE_API_BASE` beriladi:
 *
 *      VITE_API_BASE=http://192.168.0.136:8080 npm run dev
 *
 *  Ilovadagi `ApiConfig` bilan bir xil qoida: socket manzili HTTP
 *  manzilidan hosil qilinadi. Alohida sozlama qilinmadi — ikkalasi bir
 *  serverda va ularni ajratish faqat ikkita joyni sinxron ushlab turish
 *  degan ish qo'shardi. */
export const API_BASE: string =
  import.meta.env.VITE_API_BASE ?? 'https://api.sozgir.uz';

export const SOCKET_URL = `${API_BASE.replace(/^http/, 'ws')}/ws`;
