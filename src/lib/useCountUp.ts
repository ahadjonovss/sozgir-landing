/** Raqam bir qiymatdan ikkinchisiga sanab o'tadi.
 *
 *  Jang tugagach o'lja kartochkasidagi son shu zahoti yangisiga
 *  almashardi va o'zgargani bilinmasdi: odam 997 ni ko'rmagan, faqat
 *  1 005 ni ko'rgan bo'lardi. Sanalib o'tish esa «oshdi» degan
 *  gapni raqamning o'zi bilan aytadi.
 *
 *  Bu bezak emas, ma'no: jangning natijasi aynan shu o'zgarish.
 *
 *  Harakat **kerak bo'lmasa qilinmaydi**: `from` berilmasa son darhol
 *  o'z joyida turadi, tizimda «harakatni kamaytirish» yoqilgan bo'lsa
 *  ham sakrab qo'ya qoladi (`prefers-reduced-motion`). */
import { useEffect, useRef, useState } from 'react';

/** Oxiriga yaqin sekinlashadi — sanoq to'xtagani seziladi. */
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

const calm = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

export function useCountUp(
  target: number,
  /** Qayerdan boshlansin. `null` — sanoq umuman bo'lmaydi. */
  from: number | null,
  ms = 900,
): number {
  const [value, setValue] = useState(target);
  /** Qaysi nishonga sanalgani: bir xil nishonga ikkinchi marta
   *  yugurmasin (kartochka jonli ma'lumotdan qayta chiziladi). */
  const done = useRef<number | null>(null);

  useEffect(() => {
    if (from === null || from === target || calm()) {
      done.current = target;
      setValue(target);
      return;
    }
    if (done.current === target) return;
    done.current = target;

    let frame = 0;
    const started = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - started) / ms);
      setValue(Math.round(from + (target - from) * ease(t)));
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [from, ms, target]);

  return value;
}
