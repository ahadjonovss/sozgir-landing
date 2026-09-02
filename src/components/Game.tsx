import type { CSSProperties } from 'react';
import { display, KEYBOARD_ROWS, pretty } from '../lib/uz';
import { useWordGame, type Row } from '../lib/useWordGame';

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

function BoardRow({
  row,
  length,
  flipping,
  shake,
}: {
  row: Row;
  length: number;
  flipping: boolean;
  shake: boolean;
}) {
  return (
    <div className={`board__row${shake ? ' board__row--shake' : ''}`}>
      {Array.from({ length }, (_, i) => (
        <Tile
          key={i}
          unit={row.units[i]}
          verdict={row.verdicts?.[i]}
          index={i}
          flipping={flipping}
        />
      ))}
    </div>
  );
}

export default function Game() {
  const game = useWordGame();
  const finished = game.status !== 'playing';

  return (
    <div className="game">
      <div className="game__board" aria-label="So‘ztop taxtasi">
        {game.rows.map((row, r) => (
          <BoardRow
            key={r}
            row={row}
            length={game.answer.length}
            flipping={r === game.flipRow}
            shake={game.shake && r === game.activeRow}
          />
        ))}
      </div>

      {finished ? (
        <div className={`result result--${game.status}`} role="status">
          <p className="result__title">
            {game.status === 'won'
              ? `Topdingiz — ${game.tries} urinishda!`
              : 'Urinishlar tugadi'}
          </p>
          <p className="result__word">{display(game.target.w)}</p>
          <p className="result__def">{pretty(game.target.d)}</p>
          <div className="result__actions">
            <button className="btn btn--sm" onClick={game.reset}>
              Yana bir so‘z
            </button>
            <a className="btn btn--sm btn--ghost" href="#yuklab-olish">
              Ilovada davom etish
            </a>
          </div>
        </div>
      ) : (
        <div className="keyboard" aria-label="O‘zbek klaviaturasi">
          {KEYBOARD_ROWS.map((row, r) => (
            <div className="keyboard__row" key={r}>
              {r === 2 && (
                <button
                  className="key key--action"
                  onClick={() => game.press('enter')}
                  aria-label="Tasdiqlash"
                >
                  ⏎
                </button>
              )}
              {row.map((k) => (
                <button
                  key={k}
                  className={[
                    'key',
                    game.keyState.get(k) ? `key--${game.keyState.get(k)}` : '',
                    k.length > 1 ? 'key--wide' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => game.press(k)}
                >
                  {display(k)}
                </button>
              ))}
              {r === 2 && (
                <button
                  className="key key--action"
                  onClick={() => game.press('back')}
                  aria-label="O‘chirish"
                >
                  ⌫
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="game__hint">
        Kompyuter klaviaturasida ham yozing: <kbd>s</kbd>+<kbd>h</kbd> → SH,{' '}
        <kbd>o</kbd>+<kbd>'</kbd> → O‘
      </p>
    </div>
  );
}
