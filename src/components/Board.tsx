/** Taxta va klaviatura — o'yinning ko'rinadigan qismi.
 *  Uslublar `landing.css` dagi `.tile`, `.key` bloklaridan olinadi, ya'ni
 *  taxta qoida bo'limidagi demo bilan bir xil ko'rinadi. */
import type { CSSProperties } from 'react';
import { display, KEYBOARD_ROWS } from '../lib/uz';

/** Taxtaning bir qatori. Belgi — rang (`correct`, `present`, `absent`)
 *  yoki `lock`: So'zjangda oldingi taxmindan o'tgan, joyida turgan harf. */
export interface TileRow {
  units: string[];
  verdicts: ReadonlyArray<string | null> | null;
}

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
  rows: TileRow[];
  length: number;
  flipRow: number;
  shakeRow: number;
}) {
  return (
    <div className="game__board" aria-label="So‘ztop taxtasi" data-script="word">
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
  // Ilovadagi tartib: o'chirish ikkinchi qatorning oxirida, tasdiqlash
  // uchinchi qatorning oxirida (kengroq tugma).
  return (
    <div className="keyboard" aria-label="O‘zbek klaviaturasi" data-script="word">
      {KEYBOARD_ROWS.map((row, r) => (
        <div className="keyboard__row" key={r}>
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
          {r === 1 && (
            <button
              className="key key--action"
              onClick={() => onPress('back')}
              aria-label="O‘chirish"
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 5h11a1 1 0 011 1v12a1 1 0 01-1 1H9l-6-7 6-7zM12 9l6 6M18 9l-6 6" />
              </svg>
            </button>
          )}
          {r === 2 && (
            <button
              className="key key--action key--enter"
              onClick={() => onPress('enter')}
              aria-label="Tasdiqlash"
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 6v6a2 2 0 01-2 2H5M9 10l-4 4 4 4" />
              </svg>
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
