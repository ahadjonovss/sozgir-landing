import { display } from '../lib/uz';
import { FLIP_MS, STAGGER_MS, type Row } from '../lib/useGame';

/** O'yin to'ri. Ochilish ilovadagidek to'lqin bo'lib ketadi: har katak
 *  oldingisidan 170 ms keyin aylanadi. */
export default function Board({
  rows,
  length,
  flipRow,
  known,
  shake,
  won,
}: {
  rows: Row[];
  length: number;
  flipRow: number;
  known: (string | null)[];
  shake: boolean;
  won: boolean;
}) {
  const activeRow = rows.findIndex((row) => row.verdicts === null);

  return (
    <div className="board">
      {rows.map((row, r) => (
        <div
          key={r}
          className={`board__row${shake && r === activeRow ? ' board__row--shake' : ''}`}
          style={{ ['--cols' as string]: length }}
        >
          {Array.from({ length }, (_, i) => {
            const unit = row.units[i] ?? '';
            const verdict = row.verdicts?.[i];
            const flip = r === flipRow;
            const celebrate = won && row.verdicts && r === rows.findLastIndex((x) => x.verdicts);
            const isKnown = !verdict && known[i] === unit && unit !== '';

            const classes = [
              'tile',
              unit && !verdict ? 'tile--filled' : '',
              isKnown ? 'tile--known' : '',
              verdict ? `tile--${verdict}` : '',
              verdict && flip ? 'tile--flip' : '',
              celebrate ? 'tile--win' : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <div
                key={i}
                className={classes}
                style={{
                  ['--delay' as string]: `${(i * STAGGER_MS) / 1000}s`,
                  animationDuration: verdict && flip ? `${FLIP_MS}ms` : undefined,
                }}
              >
                {display(unit)}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
