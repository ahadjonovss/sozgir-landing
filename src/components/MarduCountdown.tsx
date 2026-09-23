/** Maydonning boshlanish sanog'i — ilovadagi `MarduCountdown`.
 *
 *  So'zjangda sanoq ikki jangchini yuzma-yuz qo'yadi, G'unchada gul
 *  ochiladi — ikkalasi ham **ikki kishilik** manzara. Maydonda esa savol
 *  boshqa: «men kimlar bilan bellashyapman?».
 *
 *  Shuning uchun bu yerda halqa: hamma o'yinchi doira bo'ylab tizilgan
 *  (o'zim har doim tepada, yashil halqada), o'rtada katta raqam va
 *  odamlar soni. Halqa bo'ylab yugurgan yoy har soniyada uchdan bir
 *  aylanadi va yo'lidagi odamni «yoqib» o'tadi — «1» da butun maydon
 *  yonib bo'ladi va keyingi kadrda o'yin ochiladi. Sakkiztadan ortig'i
 *  oxirgi o'rindagi «+N» ga yig'iladi: yuzlar bir-biriga tegib
 *  ketgandan ko'ra son aytgani ma'qul.
 *
 *  Shakl **o'yinchilar sonidan** kelib chiqadi, hujjat turidan emas:
 *  ikki kishiga tushib qolgan maydonda halqa yolg'iz juftni ko'rsatardi,
 *  holbuki bu oddiy yakkama-yakka jang — u yerda o'yinning o'z sanog'i
 *  chiqadi (chaqiruvchi shuni hal qiladi). */
import { useEffect, useState } from 'react';
import type { ArenaRow } from '../lib/mardu';
import { pretty } from '../lib/uz';
import Avatar from './Avatar';

/** Sanoq uzunligi — So'zjang va G'uncha bilan bir xil. */
const COUNT_MS = 3000;

/** Halqada nechta yuz turadi; qolgani oxirgi o'rindagi «+N» ga
 *  yig'iladi. Maydonning o'zi ham shuncha kishilik (`MARDU_CAPACITY`),
 *  lekin chegara shakl uchun kerak: yuzlar bir-biriga tegmasin. */
const RING_SLOTS = 8;

export default function MarduCountdown({ rows }: { rows: ArenaRow[] }) {
  /** Yoyning bosgan yo'li: 0 dan 1 gacha. Kadrma-kadr yuradi, ya'ni
   *  yoy silliq aylanadi va soniya almashishini kutib turmaydi. */
  const [share, setShare] = useState(0);

  useEffect(() => {
    const from = performance.now();
    let frame = 0;
    const step = () => {
      const passed = (performance.now() - from) / COUNT_MS;
      setShare(Math.min(1, passed));
      if (passed < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, []);

  const left = Math.max(1, Math.ceil(3 * (1 - share)));

  // O'zim doim tepada: halqa «men qayerdaman» degan savolga emas,
  // «kimlar bilan» degan savolga javob beradi.
  const mineAt = rows.findIndex((row) => row.mine);
  const ordered = mineAt > 0 ? [rows[mineAt]!, ...rows.filter((_, i) => i !== mineAt)] : rows;
  const shown = ordered.slice(0, ordered.length > RING_SLOTS ? RING_SLOTS - 1 : RING_SLOTS);
  const rest = ordered.length - shown.length;
  const slots = rest > 0 ? shown.length + 1 : shown.length;

  /** Halqadagi o'rinning markazi — foizda (tepadan soat yo'nalishi). */
  const spot = (index: number) => {
    const angle = (index / slots) * 2 * Math.PI - Math.PI / 2;
    return {
      left: `${50 + 38 * Math.cos(angle)}%`,
      top: `${50 + 38 * Math.sin(angle)}%`,
    };
  };

  /** Yoy shu o'rindan o'tib bo'ldimi — o'tgan yuz «yonadi». */
  const lit = (index: number) => share >= (index + 1) / slots;

  return (
    <div className="stage mcount">
      <div className="mcount__ring">
        <svg className="mcount__arc" viewBox="0 0 100 100" aria-hidden="true">
          <circle className="mcount__track" cx="50" cy="50" r="38" />
          <circle
            className="mcount__sweep"
            cx="50"
            cy="50"
            r="38"
            pathLength={1}
            strokeDasharray={`${share} 1`}
          />
        </svg>

        <span className="mcount__mid">
          {/* Raqam har soniyada qaytadan chiziladi — `key` almashgani
              uchun animatsiya yangidan boshlanadi. */}
          <b key={left}>{left}</b>
          <i>{rows.length} kishi</i>
        </span>

        {shown.map((row, index) => (
          <span
            key={row.uid}
            className={`mcount__who${row.mine ? ' mcount__who--me' : ''}${
              lit(index) ? ' mcount__who--on' : ''
            }`}
            style={spot(index)}
          >
            <Avatar name={row.nickname} uid={row.uid} size={38} />
            <em>{pretty(row.nickname)}</em>
          </span>
        ))}

        {rest > 0 && (
          <span
            className={`mcount__who mcount__who--more${
              lit(shown.length) ? ' mcount__who--on' : ''
            }`}
            style={spot(shown.length)}
          >
            <b>+{rest}</b>
          </span>
        )}
      </div>
    </div>
  );
}
