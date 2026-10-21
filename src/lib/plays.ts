/** Saytdagi kunlik chegara — kuniga uchta o'yin.
 *
 *  Chegara **odam bilan o'ynaladigan** o'yinlarga tegadi: So'zjang,
 *  g'uncha jangi va mardu maydoni. Yakka o'yinlar (So'ztop, G'uncha,
 *  chaqiriq so'zi) bepul qoladi — ular hech kimning vaqtini olmaydi
 *  va ularni cheklashning sababi yo'q.
 *
 *  Turnir **bitta** o'yin: ichidagi bosqichlar alohida sanalmaydi.
 *
 *  Sanoq **serverda** (`/v1/web/me/plays`): brauzer keshini tozalash
 *  yordam bermaydi. Shu sababdan u hisob talab qiladi — kirmagan
 *  odamning o'yinini serverda sanab bo'lmaydi va unga avvalgi
 *  mehmon chegarasi qo'llanadi (`progress.ts`).
 *
 *  Bu yerdagi son — **ko'rsatma**. Haqiqiy to'siq serverda: tugma
 *  bosilganda javob 402 bo'lib qaytadi ([ApiError.payment]) va ekran
 *  o'sha paytda ham taklifni ko'rsatadi. Ikkisi birga kerak: son
 *  bo'lmasa odam chegarani bilmay turib o'ynab ketardi, serverdagi
 *  tekshiruv bo'lmasa esa sonning o'zi hech narsani to'xtatmasdi. */
import { useCallback, useEffect, useState } from 'react';
import { LIMIT_EVENT, api } from '../api/client';
import { useAuth } from './auth';

export interface Plays {
  used: number;
  limit: number;
  /** Premiumda `null` — chegara yo'q. */
  left: number | null;
  premium: boolean;
}

const EMPTY: Plays = { used: 0, limit: 3, left: null, premium: false };

/** Holat o'yin boshlangandan keyin o'zgaradi, shuning uchun uni
 *  kuzatuvchilar qayta o'qiy olsin. */
const listeners = new Set<() => void>();

export function refreshPlays(): void {
  for (const listener of listeners) listener();
}

export async function loadPlays(): Promise<Plays> {
  try {
    const data = await api.get<{
      used?: unknown;
      limit?: unknown;
      left?: unknown;
      premium?: unknown;
    }>('/v1/web/me/plays');

    return {
      used: typeof data.used === 'number' ? data.used : 0,
      limit: typeof data.limit === 'number' ? data.limit : EMPTY.limit,
      left: typeof data.left === 'number' ? data.left : null,
      premium: data.premium === true,
    };
  } catch {
    // Holat kelmasa chegara ko'rsatilmaydi: serverdagi tekshiruv
    // baribir joyida va u yolg'on to'siqdan ishonchliroq.
    return EMPTY;
  }
}

/** Qancha qolgani. Kirmagan odamda `null` — unga mehmon chegarasi
 *  qo'llanadi va bu son ma'nosiz. */
export function usePlays(): Plays | null {
  const { account } = useAuth();
  const uid = account?.uid;
  /** Kimniki ekani ham saqlanadi: hisob almashganda eski son bir
   *  lahza bo'lsa ham yangi egasiniki bo'lib ko'rinmasligi kerak. */
  const [state, setState] = useState<{ uid: string; plays: Plays } | null>(null);

  const read = useCallback(() => {
    if (!uid) return;
    void loadPlays().then((plays) => setState({ uid, plays }));
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    read();
    listeners.add(read);
    /* Server «bugunga yetdi» desa (402) sanoq darhol qayta o'qiladi.
       Shusiz ekranda eski son turib qolardi: odam tugmani bosardi,
       xato ko'rardi, lekin «yana bitta qoldi» degan yozuv o'sha
       joyda turaverardi va premium taklifi hech qachon chiqmasdi. */
    window.addEventListener(LIMIT_EVENT, read);
    return () => {
      listeners.delete(read);
      window.removeEventListener(LIMIT_EVENT, read);
    };
  }, [read, uid]);

  return state !== null && state.uid === uid ? state.plays : null;
}
