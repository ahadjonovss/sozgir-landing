/** Ekran torligi — React tomonda.
 *
 *  Ko'p narsani CSS o'zi hal qiladi, lekin «telefonda yig'ib qo'yish»
 *  uni hal qilmaydi: yig'ilgan blok ochilganda-yopilganda holat kerak,
 *  holatning boshlang'ich qiymati esa ekranga bog'liq (kompyuterda —
 *  ochiq, telefonda — yopiq). Shuning uchun bitta `matchMedia`.
 *
 *  Chegara `900px` — `play.css` dagi yon ustun bitta ustunga
 *  tushadigan nuqtaning o'zi. Ikki joyda yozilgani yoqimsiz, lekin
 *  CSS o'zgaruvchisini media so'rovida ishlatib bo'lmaydi. */
import { useEffect, useState } from 'react';

const QUERY = '(max-width: 900px)';

export function useNarrow(): boolean {
  const [narrow, setNarrow] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(QUERY).matches,
  );

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const sync = () => setNarrow(mq.matches);
    mq.addEventListener('change', sync);
    sync();
    return () => mq.removeEventListener('change', sync);
  }, []);

  return narrow;
}
