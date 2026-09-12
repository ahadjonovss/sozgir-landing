/** Kunlik g'unchaning harflari — serverdan.
 *
 *  Kunlik so'zdagi bilan bir xil qoida: **harflarni server tanlaydi**.
 *  Sabab — lug'at yangilanganda tanlov natijasi ham o'zgaradi. Agar har
 *  qurilma o'zi hisoblasa, lug'ati eski qurilmada bir xil, yangisida
 *  boshqa g'uncha chiqar edi; «kunlik» degani esa hamma uchun bir xil
 *  degani.
 *
 *  ```
 *  guncha/2026-09-12   { center, petals[], number, dateKey }
 *  ```
 *
 *  Hujjatda **faqat harflar** bo'ladi, so'zlar ro'yxati emas: so'zlarni
 *  sayt o'zidagi lug'atdan yig'adi — hujjat kichik qoladi va har bir
 *  so'zning ma'nosi ham joyida turadi.
 *
 *  Hujjat qoidalarda hammaga ochiq (`allow read: if true`), shuning uchun
 *  SDK kerak emas — REST yetadi. */
import { readDoc } from '../firebase/rest';
import { normalize } from './uz';

export interface DailyGuncha {
  center: string;
  petals: string[];
  number: number;
}

const KEY = (dateKey: string) => `sozgir.guncha.daily.${dateKey}`;

/** Nechta kunning harflari brauzerda qoladi.
 *
 *  Bir marta olingan harflar saqlanadi: aloqa uzilsa ham o'sha kunning
 *  g'unchasi ochilaveradi va yarim qolgan o'yin davom etadi. */
const KEEP_DAYS = 3;

function readCache(dateKey: string): DailyGuncha | null {
  try {
    const raw = localStorage.getItem(KEY(dateKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DailyGuncha;
    return parsed?.center && parsed.petals?.length === 6 ? parsed : null;
  } catch {
    return null;
  }
}

function writeCache(dateKey: string, guncha: DailyGuncha): void {
  try {
    localStorage.setItem(KEY(dateKey), JSON.stringify(guncha));
    // Eski kunlarni tozalaymiz — yozuvlar cheksiz yig'ilib qolmasin.
    const keep = new Set(
      Array.from({ length: KEEP_DAYS }, (_, back) => {
        const date = new Date();
        date.setDate(date.getDate() - back);
        return KEY(
          `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
            date.getDate(),
          ).padStart(2, '0')}`,
        );
      }),
    );
    for (const name of Object.keys(localStorage)) {
      if (name.startsWith('sozgir.guncha.daily.') && !keep.has(name)) {
        localStorage.removeItem(name);
      }
    }
  } catch {
    // Saqlanmasa — har tashrifda serverdan olinadi.
  }
}

/** Shu kunning g'unchasi. Server javob bermasa va keshda ham bo'lmasa
 *  `null` — chaqiruvchi «internetni yoqing» deb aytadi. */
export async function fetchDailyGuncha({
  dateKey,
  number,
}: {
  dateKey: string;
  number: number;
}): Promise<DailyGuncha | null> {
  const cached = readCache(dateKey);
  if (cached) return cached;

  const data = await readDoc(`guncha/${dateKey}`).catch(() => null);
  const center = data?.center;
  const petals = data?.petals;
  if (typeof center !== 'string' || !Array.isArray(petals) || petals.length !== 6) {
    return null;
  }

  const guncha: DailyGuncha = {
    center: normalize(center),
    petals: petals.map((petal) => normalize(String(petal))),
    number: typeof data?.number === 'number' ? data.number : number,
  };
  writeCache(dateKey, guncha);
  return guncha;
}
