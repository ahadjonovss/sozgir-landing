/** Taxta va klaviatura — o'yinning ko'rinadigan qismi.
 *  Uslublar `landing.css` dagi `.tile`, `.key` bloklaridan olinadi, ya'ni
 *  taxta qoida bo'limidagi demo bilan bir xil ko'rinadi. */
import type { CSSProperties } from 'react';
import { display, KEYBOARD_ROWS } from '../lib/uz';
import type { Row } from '../lib/useSozTop';

function Tile({
  unit,
  verdict,
  index,
  flipping,
}: {
  unit?: string;
  verdict?: string | null;
  index: number;
  flipping: boolean;
}) {
  const cls = [
    'tile',
    unit ? 'tile--filled' : '',
    verdict ? `tile--${verdict}` : '',
    flipping ? 'tile--flip' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={cls} style={{ '--i': index } as CSSProperties}>
      <span>{unit ? display(unit) : ''}</span>
    </div>
  );
}

export function Board({
  rows,
  length,
  flipRow,
  shakeRow,
}: {
  rows: Row[];
  length: number;
  flipRow: number;
  shakeRow: number;
}) {
  return (
    <div className="game__board" aria-label="So‘ztop taxtasi">
      {rows.map((row, r) => (
        <div
          className={`board__row${r === shakeRow ? ' board__row--shake' : ''}`}
          key={r}
        >
          {Array.from({ length }, (_, i) => (
            <Tile
              key={i}
              unit={row.units[i]}
              verdict={row.verdicts?.[i]}
              index={i}
              flipping={r === flipRow}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function Keyboard({
  keyState,
  onPress,
}: {
  keyState: Map<string, string>;
  onPress: (key: string) => void;
}) {
  return (
    <div className="keyboard" aria-label="O‘zbek klaviaturasi">
      {KEYBOARD_ROWS.map((row, r) => (
        <div className="keyboard__row" key={r}>
          {r === 2 && (
            <button
              className="key key--action"
              onClick={() => onPress('enter')}
              aria-label="Tasdiqlash"
            >
              ⏎
            </button>
          )}
          {row.map((key) => (
            <button
              key={key}
              className={[
                'key',
                keyState.get(key) ? `key--${keyState.get(key)}` : '',
                key.length > 1 ? 'key--wide' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onPress(key)}
            >
              {display(key)}
            </button>
          ))}
          {r === 2 && (
            <button
              className="key key--action"
              onClick={() => onPress('back')}
              aria-label="O‘chirish"
            >
              ⌫
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
