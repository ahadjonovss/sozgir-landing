/** «Bugun necha kishi o'ynadi» — bosh sahifadagi jonli sanoq.
 *
 *  Son `daily_scores/{sana}/entries` dagi yozuvlar soni: shu kunda ball
 *  yozgan har bir o'yinchida bitta hujjat bor (`scores.ts`), ya'ni bu
 *  aynan **bugun o'ynagan odamlar** soni. Ro'yxatning o'zi o'qilmaydi —
 *  `count()` bitta arzon so'rov (`firebase/rest.ts`).
 *
 *  Nega kerak: yangi mehmon sahifaga kirganda «bu yer tirikmi?» degan
 *  savolga javob oladi. Raqam o'ylab topilmaydi va bo'rttirilmaydi —
 *  serverdagi haqiqiy sanoq, shuning uchun u kun davomida o'sib boradi.
 *
 *  Kun boshida son kichik bo'ladi (ertalab o'nlab odam). O'shanda ham
 *  ko'rsatiladi: kichik, lekin haqiqiy son yo'q raqamdan yaxshi. Faqat
 *  butunlay bo'sh bo'lsa (`0` yoki so'rov yiqilsa) qator umuman
 *  chizilmaydi. */
import { useEffect, useState } from 'react';
import { PATHS } from '../firebase/paths';
import { countDocs } from '../firebase/rest';
import { dailyKey } from './daily';

/** Sahifa umrida bir marta o'qiladi: sanoq sekin o'sadi, uni har
 *  komponentda qayta so'rashning ma'nosi yo'q. */
let cached: Promise<number | null> | null = null;

export function todayPlayers(): Promise<number | null> {
  return (cached ??= countDocs(`${PATHS.dailyScores}/${dailyKey()}/${PATHS.entries}`));
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
