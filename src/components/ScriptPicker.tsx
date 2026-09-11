/** Alifbo tanlash — sarlavhadagi tugma va ostidan chiqadigan ro'yxat.
 *
 *  Ilovadagi `ScriptSheet` ning sayt varianti. Variantlar **ko'chirilmaydi**
 *  (`data-script="off"`): har biri o'z alifbosida turishi kerak, aks holda
 *  uchala namuna amaldagi alifboga aylanib, tanlovning ma'nosi qolmaydi.
 *  Tugmadagi harf ham shu sababli belgilangan — u tanlangan alifboda `O‘`
 *  tovushi qanday yozilishini ko'rsatadi. */
import { useEffect, useRef, useState } from 'react';
import { SCRIPTS } from '../lib/script';
import { setScript, useScript } from '../lib/useScript';

export default function ScriptPicker() {
  const script = useScript();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const active = SCRIPTS.find((item) => item.key === script) ?? SCRIPTS[0];

  // Tashqariga bosilsa yoki Escape bosilsa — yopiladi.
  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="script" ref={box}>
      <button
        className="icon-btn script__btn"
        onClick={() => setOpen((value) => !value)}
        aria-label="Alifboni almashtirish"
        title="Lotin / yangi lotin / kirill"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span data-script="off">{active.badge}</span>
      </button>

      {open && (
        <div className="script__menu" role="menu" data-script="off">
          {SCRIPTS.map((item) => (
            <button
              key={item.key}
              role="menuitemradio"
              aria-checked={item.key === script}
              className={`script__item${item.key === script ? ' script__item--on' : ''}`}
              onClick={() => {
                setScript(item.key);
                setOpen(false);
              }}
            >
              <b>{item.label}</b>
              <span>{item.sample}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
