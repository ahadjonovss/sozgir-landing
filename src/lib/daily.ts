/** Kunlik so'zning server nusxasi.
 *
 *  Ilova avval Firestore'dagi `daily/{sana}_{uzunlik}` hujjatini o'qiydi,
 *  topilmasa (yoki internet bo'lmasa) so'zni o'zi deterministik tanlaydi.
 *  Sayt ham xuddi shu yo'ldan yuradi — shunda brauzerdagi so'z ilovadagi
 *  bilan har doim bir xil bo'ladi, hatto so'z qo'lda o'zgartirilgan
 *  bo'lsa ham.
 *
 *  SDK ishlatilmaydi: bitta hujjat uchun REST kifoya (~1 KB javob).
 *  Kalit maxfiy emas — mijoz konfiguratsiyasi, himoya `firestore.rules`
 *  orqali (kunlik so'z hammaga o'qish uchun ochiq, yozish yopiq). */

const PROJECT = 'soztop-prod';
const API_KEY = 'AIzaSyAMboZgQTXTxVIByvwuBtmuE89sAhmpsYo';
const TIMEOUT_MS = 2500;

/** Server bergan so'z yoki `null`. Xato — jim: o'yin kutmaydi. */
export async function serverDaily(
  dateKey: string,
  length: number,
): Promise<string | null> {
  const url =
    `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)` +
    `/documents/daily/${dateKey}_${length}?key=${API_KEY}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return null;
    const data = await response.json();
    const answer = data?.fields?.answer?.stringValue;
    return typeof answer === 'string' && answer.length > 0 ? answer : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
