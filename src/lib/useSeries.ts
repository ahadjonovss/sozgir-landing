/** Jang turnir davrasimi — va qaysi turnirniki.
 *
 *  **Nega alohida hook kerak.** Ilgari javob jangning o'zida turardi:
 *  Firestore'dagi hujjatda `seriesId` maydoni bor edi va `seriesOf`
 *  uni o'qirdi. Yangi server bu maydonni **umuman yubormaydi** —
 *  bog'lanish endi teskari tomonda: turnir hujjatida har guruhning
 *  `battleId` si turadi.
 *
 *  Buzilishi jim bo'ldi va qimmatga tushdi: `seriesOf` doim `null`
 *  qaytargani uchun `BattlePage` dagi butun turnir ko'rinishi —
 *  keyingi davra sanog'i, boshqa guruhlar jadvali, «Turnirga
 *  qaytish» — hech qachon chizilmasdi. O'rniga umumiy tugmalar
 *  chiqardi: «Keyingi jang», «Maydonga qaytish». Turnir o'rtasida
 *  turgan odamga ikkalasi ham noto'g'ri javob edi.
 *
 *  **Qayerdan olinadi.** `watchMyTurnir` tugamagan turnirni
 *  kuzatadi (`/v1/web/turnirs/mine`) va u `sharedPoll` ustida —
 *  ya'ni nechta komponent so'rasa ham so'rov bitta. Davra almashsa
 *  `battleId` yangilanadi va keyingi so'rovda o'zi topiladi.
 *
 *  Eski `seriesId` ham tekshiriladi: server uni qaytasa yoki
 *  veb-soket yuborsa, javob darhol undan keladi va so'rov
 *  kutilmaydi. */
import { useEffect, useState } from 'react';
import { useAuth } from './auth';
import { seriesOf, watchMyTurnir, type TurnirDoc } from './turnir';
import type { BattleDoc } from './battle';

export function useSeries(
  battle: BattleDoc | null | undefined,
  battleId: string | null | undefined,
): string | null {
  const { account } = useAuth();
  const uid = account?.uid;
  const [mine, setMine] = useState<{ code: string; doc: TurnirDoc } | null>(null);

  useEffect(() => {
    // Hisobsiz odamda turnir ham yo'q. Holat bu yerda tozalanmaydi:
    // effekt ichidagi `setState` qo'shimcha render boshlaydi —
    // o'rniga quyida, qaytarishda qirqiladi.
    if (!uid) return;
    let alive = true;
    const stop = watchMyTurnir(uid, (next) => {
      if (alive) setMine(next);
    });
    return () => {
      alive = false;
      stop();
    };
  }, [uid]);

  // Eski yo'l — agar hujjatda belgi bo'lsa, so'rov kutilmaydi.
  const marked = seriesOf(battle);
  if (marked) return marked;

  if (!uid || !battleId || !mine) return null;
  const inside = mine.doc.groups?.some((group) => group.battleId === battleId);
  return inside ? mine.code : null;
}
