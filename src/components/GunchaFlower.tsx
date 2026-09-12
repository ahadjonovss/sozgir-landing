/** G'uncha: o'rtada yurak harf, atrofida olti barg.
 *
 *  Shakl ilovadagi `GunchaFlower` ning ko'chirmasi: barg — ikki uchi
 *  o'tkir yaproq, yurak harf — yassi tepali oltiburchak, barglar orasida
 *  esa kichik bezaklar («changchi»). Ilgari saytda oltalasi ham
 *  oltiburchak edi va gul emas, g'isht terilgandek ko'rinardi.
 *
 *  SVG tanlangani ham shakl uchun: `<path>` bosilish yuzasini aynan o'z
 *  konturi bo'yicha oladi, ya'ni ikki bargning to'rtburchak chegarasi
 *  ustma-ust tushsa ham har biri faqat o'z yaprog'i ichida bosiladi —
 *  ilovada buni `ClipPath` qiladi.
 *
 *  O'lchovlar 100×100 maydonga keltirilgan (ilovada 280 px edi), shuning
 *  uchun gul istalgan kenglikda bir xil nisbatda chiziladi. */
import type { KeyboardEvent } from 'react';
import { display } from '../lib/uz';

/** Birinchi barg tepadan shuncha og'adi: tepada barg emas, ikki
 *  bargning orasi tursin — gul shu holatda tabiiyroq ko'rinadi. */
const START_ANGLE = 30;

const PETAL_W = 24.5;
const PETAL_H = 35.5;
const HEX_W = 35;

/** Muntazam oltiburchakda balandlikning enga nisbati. */
const HEX_RATIO = 0.8660254;
const HEX_H = HEX_W * HEX_RATIO;

/** Barg shakli — ichki uchi (pastda) gulning markaziga qaraydi. */
const PETAL_PATH = `M ${PETAL_W / 2} ${PETAL_H}
  C 0 ${PETAL_H * 0.78} 0 ${PETAL_H * 0.16} ${PETAL_W / 2} 0
  C ${PETAL_W} ${PETAL_H * 0.16} ${PETAL_W} ${PETAL_H * 0.78} ${PETAL_W / 2} ${PETAL_H}
  Z`;

const HEX_PATH = `M ${HEX_W * 0.25} 0
  L ${HEX_W * 0.75} 0
  L ${HEX_W} ${HEX_H / 2}
  L ${HEX_W * 0.75} ${HEX_H}
  L ${HEX_W * 0.25} ${HEX_H}
  L 0 ${HEX_H / 2}
  Z`;

/** Ikki belgili harf (SH, CH, O‘) kichikroq yoziladi — aks holda
 *  bargdan chiqib ketadi. */
const fontOf = (text: string) => (text.length > 1 ? 7.2 : 9.3);

export default function GunchaFlower({
  center,
  petals,
  onPress,
  disabled = false,
}: {
  center: string;
  petals: string[];
  onPress: (unit: string) => void;
  disabled?: boolean;
}) {
  const press = (unit: string) => {
    if (!disabled) onPress(unit);
  };

  /** Klaviatura: `<path>` tugma bo'lgani uchun bosilishni o'zimiz
   *  tarjima qilamiz. */
  const onKey = (event: KeyboardEvent<SVGPathElement>, unit: string) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    press(unit);
  };

  const cell = (unit: string, angle: number, index: number) => {
    const letter = display(unit);
    return (
      <g key={`${unit}-${index}`} transform={`rotate(${angle} 50 50)`}>
        <path
          className="flower__petal"
          d={PETAL_PATH}
          transform={`translate(${50 - PETAL_W / 2} 0)`}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-disabled={disabled || undefined}
          aria-label={letter}
          onClick={() => press(unit)}
          onKeyDown={(event) => onKey(event, unit)}
        />
        {/* Barg burilgan, harf esa tik tursin. */}
        <text
          className="flower__letter"
          x={50}
          y={PETAL_H / 2}
          fontSize={fontOf(letter)}
          transform={`rotate(${-angle} 50 ${PETAL_H / 2})`}
        >
          {letter}
        </text>
      </g>
    );
  };

  const heart = display(center);

  return (
    <svg
      className={`flower${disabled ? ' flower--off' : ''}`}
      viewBox="0 0 100 100"
      role="group"
      aria-label="G‘uncha harflari"
    >
      {/* Barglar orasidagi bezaklar — gulning «changchisi». */}
      {Array.from({ length: 6 }, (_, index) => (
        <rect
          key={`dot-${index}`}
          className="flower__dot"
          x={-1.6}
          y={-1.6}
          width={3.2}
          height={3.2}
          rx={0.6}
          transform={`rotate(${index * 60} 50 50) translate(50 7.1) rotate(45)`}
        />
      ))}

      {petals.map((petal, index) =>
        cell(petal, START_ANGLE + index * 60, index),
      )}

      <g>
        <path
          className="flower__heart"
          d={HEX_PATH}
          transform={`translate(${50 - HEX_W / 2} ${50 - HEX_H / 2})`}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-disabled={disabled || undefined}
          aria-label={`Yurak harf ${heart}`}
          onClick={() => press(center)}
          onKeyDown={(event) => onKey(event, center)}
        />
        <text
          className="flower__letter flower__letter--heart"
          x={50}
          y={50}
          fontSize={fontOf(heart)}
        >
          {heart}
        </text>
      </g>
    </svg>
  );
}
