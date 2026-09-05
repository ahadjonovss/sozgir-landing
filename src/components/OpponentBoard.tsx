/** Raqibning taxtasi — faqat ranglar.
 *
 *  Harflar ko'rsatilmaydi: naqsh raqib qancha yaqinlashganini bildiradi,
 *  lekin javobni oshkor qilmaydi. Jang tugagach `words` ochiladi va o'sha
 *  paytda harflar ham chiqadi. */
import { display, type Verdict } from '../lib/uz';
import { split } from '../lib/uz';

export default function OpponentBoard({
  rows,
  words,
  length,
  maxAttempts,
}: {
  rows: Verdict[][];
  /** Jang tugagach oshkor bo'lgan taxminlar (bo'lmasa — bo'sh kataklar). */
  words?: string[];
  length: number;
  maxAttempts: number;
}) {
  return (
    <div className="mini" aria-label="Raqib yo‘li">
      {Array.from({ length: maxAttempts }, (_, r) => (
        <div className="mini__row" key={r}>
          {Array.from({ length }, (_, i) => {
            const verdict = rows[r]?.[i];
            const unit = words?.[r] ? split(words[r]!)[i] : undefined;
            return (
              <span
                key={i}
                className={`mini__tile${verdict ? ` mini__tile--${verdict}` : ''}`}
              >
                {unit ? display(unit) : ''}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}
