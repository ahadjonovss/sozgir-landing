/** Uzoq bosish — bitta tugmaga ikkinchi, «kuchliroq» amal berish uchun.
 *
 *  G'unchadagi «O'chirish» shunday: bosilsa bitta harf o'chadi, uzoq
 *  bosilsa butun so'z. Ilovada ham aynan shunday (`GunchaPillButton`
 *  ning `onTap` va `onLongPress` i) va o'yin klaviaturasining o'chirish
 *  tugmasi ham shu qoidada ishlaydi.
 *
 *  Nega `pointer` hodisalari: ular sichqoncha, barmoq va qalam uchun
 *  bitta yo'l — `touchstart` va `mousedown` ni alohida tinglash telefon
 *  brauzerida ikkalasini ham chiqarib, amalni ikki marta bajarardi.
 *
 *  Bosish `click` da bajariladi, uzoq bosish esa vaqt tugaganda. Shuning
 *  uchun uzoq bosishdan keyin keladigan `click` o'tkazib yuboriladi —
 *  aks holda so'z o'chib, ustiga yana bitta harf o'chishga urinardi. */
import { useCallback, useEffect, useRef } from 'react';

/** Uzoq bosish shu vaqtdan keyin ishlaydi.
 *
 *  450 ms — brauzerning kontekst menyusi chiqadigan paytdan (~500 ms)
 *  bir oz oldin: menyu ochilib qolsa barmoq ko'tarilganda hech narsa
 *  bo'lmasdi. */
const HOLD_MS = 450;

export function useLongPress(onLongPress: () => void, delay = HOLD_MS) {
  const timer = useRef<number | null>(null);
  const fired = useRef(false);

  const stop = useCallback(() => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  }, []);

  // Sahifa yopilganda osilgan taymer qolmasin.
  useEffect(() => stop, [stop]);

  const start = useCallback(() => {
    fired.current = false;
    stop();
    timer.current = window.setTimeout(() => {
      fired.current = true;
      onLongPress();
    }, delay);
  }, [delay, onLongPress, stop]);

  /** `onClick` shu orqali o'tkaziladi: uzoq bosish ishlagan bo'lsa,
   *  bosish amali bajarilmaydi. */
  const onClick = useCallback(
    (action: () => void) => () => {
      if (fired.current) {
        fired.current = false;
        return;
      }
      action();
    },
    [],
  );

  return {
    onClick,
    handlers: {
      onPointerDown: start,
      onPointerUp: stop,
      onPointerLeave: stop,
      onPointerCancel: stop,
      // Telefonda uzoq bosishda matn tanlash yoki kontekst menyusi
      // chiqmasin — tugmaning o'z amali bor.
      onContextMenu: (event: { preventDefault: () => void }) =>
        event.preventDefault(),
    },
  };
}
