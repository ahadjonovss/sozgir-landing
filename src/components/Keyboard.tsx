import { display, KEYBOARD_ROWS, type Verdict } from '../lib/uz';

/** O'zbek lotin klaviaturasi: SH, CH, O‘, G‘ — alohida tugma, ya'ni
 *  bosilganda bitta katakcha to'ldiriladi. */
export default function Keyboard({
  state,
  onPress,
  onClear,
}: {
  state: Map<string, Verdict>;
  onPress: (unit: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="keyboard">
      {KEYBOARD_ROWS.map((row, r) => (
        <div className="keyboard__row" key={r}>
          {row.map((unit) => {
            const verdict = state.get(unit);
            return (
              <button
                key={unit}
                type="button"
                className={`key${unit.length > 1 ? ' key--wide' : ''}${
                  verdict ? ` key--${verdict}` : ''
                }`}
                onClick={() => onPress(unit)}
              >
                {display(unit)}
              </button>
            );
          })}
          {r === 1 && (
            <button
              type="button"
              className="key key--action"
              onClick={() => onPress('back')}
              onContextMenu={(event) => {
                event.preventDefault();
                onClear();
              }}
              aria-label="O‘chirish"
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6H9l-5 6 5 6h11a1 1 0 001-1V7a1 1 0 00-1-1zM17 10l-4 4M13 10l4 4" />
              </svg>
            </button>
          )}
          {r === 2 && (
            <button
              type="button"
              className="key key--action"
              onClick={() => onPress('enter')}
              aria-label="Tekshirish"
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 5v6a3 3 0 01-3 3H5m0 0l4-4m-4 4l4 4" />
              </svg>
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
