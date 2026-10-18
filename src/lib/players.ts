/** «Bugun necha kishi o'ynadi» — bosh sahifadagi jonli sanoq.
 *
 *  Hozircha **o'chiq**: `null` qaytadi va qator umuman chizilmaydi.
 *
 *  Sabab ko'chishda. Firestore'da bu `daily_scores/{sana}/entries`
 *  dagi hujjatlar soni edi va uni `count()` bitta arzon so'rov bilan
 *  berardi. Yangi serverda esa sanoq marshruti yo'q: eng yaqini
 *  `/v1/public/daily/aqcha`, lekin u eng yuqoridagi 100 tani qaytaradi —
 *  ro'yxat, sanoq emas. Undan son yasash kun davomida «100» da qotib
 *  qolardi, ya'ni qator haqiqatni emas, chegarani ko'rsatardi.
 *
 *  Bu yerda tanlov ongli: **yo'q raqam noto'g'ri raqamdan yaxshi.**
 *  Serverda sanoq marshruti ochilganda (`/v1/daily/players` kabi) shu
 *  funksiyaning ichi bir qatorda tiklanadi — qolgan hamma narsa,
 *  formatlash ham, hook ham, joyida turibdi. */
import { useEffect, useState } from 'react';

export function todayPlayers(): Promise<number | null> {
  return Promise.resolve(null);
}

/** Ekrandagi ko'rinishi: `72`, `1,2 ming`, `26 ming`.
 *
 *  Minglardan keyin aniqlikning keragi yo'q — sanoq «qancha odam»
 *  degan savolga javob beradi, hisobot emas. */
export function formatPlayers(count: number): string {
  if (count < 1000) return String(count);
  const thousands = count / 1000;
  const shown = thousands < 10 ? thousands.toFixed(1).replace('.', ',') : Math.round(thousands);
  return `${shown} ming`;
}

/** Bugungi sanoq. Kelmaguncha va bo'sh bo'lsa — `null`. */
export function useTodayPlayers(): number | null {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    void todayPlayers().then((value) => {
      if (alive && value !== null && value > 0) setCount(value);
    });
    return () => {
      alive = false;
    };
  }, []);

  return count;
}
