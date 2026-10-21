/** Jang ketyaptimi — sahifaning qolgan qismi shunga qarab o'zgaradi.
 *
 *  Savol bitta: odam **hozir o'ynayaptimi**. Javob ikki joyda kerak va
 *  ikkalasi ham o'yin komponentining tashqarisida:
 *
 *  * O'ynash sahifasidagi to'rtta nom (`hub__tabs`) jang paytida
 *    yashiriladi — bosilishi mumkin bo'lgan narsa taxtaning ustida
 *    turmasligi kerak.
 *  * Keng ekranda chetlarda bo'shliq qoladi va reklama o'sha yerga
 *    chiqadi (`SideAds`).
 *
 *  Nega kontekst: jangni boshqaradigan komponent (`BattlePage`,
 *  `GunchaBattlePage`) sahifa daraxtining ichkarisida, qolgan ikkisi
 *  esa tashqarisida turadi. Holatni yuqoriga `props` bilan uzatish
 *  uchun oraliqdagi hamma komponentni o'zgartirish kerak bo'lardi.
 *
 *  Bayroq **marshrutga emas, holatga** bog'liq: lobbida va natija
 *  ekranida ham `/sozjang` manzili o'sha bo'lib qoladi, lekin o'sha
 *  paytda odam o'ynamayapti. */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface Stage {
  /** Jang ketyapti: qidiruvdan natijagacha. */
  live: boolean;
  /** O'yin komponenti o'z holatini shu yerga yozadi. */
  setLive: (id: string, live: boolean) => void;
}

const Ctx = createContext<Stage>({ live: false, setLive: () => {} });

export function StageProvider({ children }: { children: ReactNode }) {
  /* Bir vaqtda bitta o'yin ko'rinadi, lekin marshrut almashganda eskisi
     yangisidan keyinroq daraxtdan chiqadi va «o'chirdim» degani
     yangining «yoqdim» ini bosib ketardi. Shuning uchun har bir
     komponent o'z nomi bilan yoziladi. */
  const [ids, setIds] = useState<ReadonlySet<string>>(() => new Set());

  const setLive = (id: string, live: boolean) =>
    setIds((prev) => {
      if (prev.has(id) === live) return prev;
      const next = new Set(prev);
      if (live) next.add(id);
      else next.delete(id);
      return next;
    });

  return <Ctx.Provider value={{ live: ids.size > 0, setLive }}>{children}</Ctx.Provider>;
}

/** Jang ketyaptimi — o'qish uchun. */
export function useStage(): boolean {
  return useContext(Ctx).live;
}

/** O'yin komponenti o'z holatini bildiradi.
 *
 *  [id] — komponentning nomi, `'sozjang'` kabi. Komponent daraxtdan
 *  chiqqanda bayroq o'zi tushadi. */
export function useLiveStage(id: string, live: boolean): void {
  const { setLive } = useContext(Ctx);
  useEffect(() => {
    setLive(id, live);
    return () => setLive(id, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, live]);
}
