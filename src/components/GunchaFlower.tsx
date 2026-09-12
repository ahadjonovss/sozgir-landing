/** G'uncha: o'rtada yurak harf, atrofida olti barg.
 *
 *  Shakl ilovadagi `GunchaFlower` ning ko'chirmasi: barg — ikki uchi
 *  o'tkir yaproq, yurak harf — yassi tepali oltiburchak, barglar orasida
 *  esa kichik bezaklar («changchi»). Ilgari saytda oltalasi ham
 *  oltiburchak edi va gul emas, g'isht terilgandek ko'rinardi.
 *
 *  Ko'rinish va bosilish ajratilgan: yaproq faqat chiziladi, bosilishni
 *  esa uning ostidagi ko'rinmas bo'lak oladi. Sabab — yaproq nozik va
 *  atrofida bo'sh joy bor, ya'ni barmoq bir oz chetga tushsa «tegmadi»
 *  bo'lib qolardi. Bo'laklar gulning butun maydonini oltiga bo'ladi.
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

/** Bargning bosilish yuzasi — markazdan chiqadigan 60 gradusli bo'lak.
 *
 *  Ko'rinadigan yaproqning o'zi kichik va uning atrofida bo'sh joy bor:
 *  odam yaproqning yoniga tekkanda hech narsa bo'lmasdi. Bo'laklar esa
 *  gulning butun maydonini oltiga bo'lib oladi, ya'ni «tegmadi» degan
 *  holat qolmaydi. O'rtasini yurak harf egallaydi — u oxirida
 *  chizilgani uchun ustma-ust joyda o'zi yutadi. */
const HIT_PATH = 'M 50 50 L 25 6.7 A 50 50 0 0 1 75 6.7 Z';

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
        {/* Bosiladigan yuza yaprog'idan oldin turadi: yaproq uning
            ustiga chiziladi, lekin hodisalarni o'tkazib yuboradi. */}
        <path
          className="flower__hit"
          d={HIT_PATH}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-disabled={disabled || undefined}
          aria-label={letter}
          onClick={() => press(unit)}
          onKeyDown={(event) => onKey(event, unit)}
        />
        <path
          className="flower__petal"
          d={PETAL_PATH}
          transform={`translate(${50 - PETAL_W / 2} 0)`}
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
