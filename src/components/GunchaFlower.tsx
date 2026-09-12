/** G'unchaning o'zi: o'rtada yurak harf, atrofida oltita barg.
 *
 *  Har bir harf — haqiqiy `<button>`: klaviatura bilan ham yuriladi va
 *  ekran o'quvchi ham o'qiydi. Oltiburchak shakl `clip-path` bilan
 *  beriladi, ya'ni bosish yuzasi ham shakl bo'yicha kesiladi — bargning
 *  burchagidan tashqarida bosilgan joy qo'shniga tegishli bo'ladi. */
import { display } from '../lib/uz';

/** Barglarning markazdan uzoqligi (konteyner kengligining ulushi). */
const RADIUS = 0.335;

/** Oltita barg — soat 12 dan boshlab. */
const ANGLES = [-90, -30, 30, 90, 150, 210];

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
  return (
    <div className="flower" role="group" aria-label="G‘uncha harflari">
      <button
        type="button"
        className="flower__cell flower__cell--center"
        style={{ left: '50%', top: '50%' }}
        onClick={() => onPress(center)}
        disabled={disabled}
        aria-label={`Yurak harf ${display(center)}`}
      >
        {display(center)}
      </button>

      {petals.map((petal, index) => {
        const angle = (ANGLES[index] ?? 0) * (Math.PI / 180);
        return (
          <button
            key={`${petal}-${index}`}
            type="button"
            className="flower__cell"
            style={{
              left: `${50 + Math.cos(angle) * RADIUS * 100}%`,
              top: `${50 + Math.sin(angle) * RADIUS * 100}%`,
            }}
            onClick={() => onPress(petal)}
            disabled={disabled}
          >
            {display(petal)}
          </button>
        );
      })}
    </div>
  );
}
