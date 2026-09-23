/** G'uncha jangining boshlanish sanog'i — ilovadagi `GunchaCountdown`.
 *
 *  Raqib qo'shilgach o'yin taxtasi darhol ochilmaydi: So'zjangdagidek
 *  3 → 2 → 1 sanoq turadi, ya'ni ikkalangiz bir paytda boshlaganingiz
 *  ko'rinib turadi.
 *
 *  Ko'rinishi g'unchaniki: raqam yashil oltiburchak ichida (yurak
 *  harfning o'rnida), atrofida olti barg ochilib boradi — «1» da gul
 *  to'liq ochilgan bo'ladi va keyingi kadrda o'sha joyda harflar paydo
 *  bo'ladi. So'zjangdagi halqa va radar to'lqini bu yerda ishlatilmaydi:
 *  u arenaning tili.
 *
 *  Tepada ikki tomon yuzma-yuz: o'z rangidagi halqadagi avatar
 *  (o'zimniki yashil, raqibniki ko'k), ism va ostida daraja nishoni
 *  bilan o'lja. Reytingni jang hujjati bilmaydi — u `battle_ratings`
 *  dan alohida o'qiladi va **kutilmaydi**: kech kelsa yuz reytingsiz
 *  chiziladi. */
import { useEffect, useState } from 'react';
import { EMPTY_RATING, watchRating, type BattleRating } from '../lib/battleRating';
import { pretty } from '../lib/uz';
import Avatar from './Avatar';
import { VerifiedMark } from './PlayerName';
import { Olja, TierBadge } from './Units';

/** Gulning o'lchovlari — `GunchaFlower` bilan bir xil maydonda
 *  (100×100), shuning uchun sanoqdagi gul o'yindagisi bilan bir
 *  qolipda turadi. */
const START_ANGLE = 30;
const PETAL_W = 24.5;
const PETAL_H = 35.5;
const HEX_W = 35;
const HEX_RATIO = 0.8660254;
const HEX_H = HEX_W * HEX_RATIO;

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

/** Bitta tomonning reytingi. Hujjat kech kelsa `null` qoladi va yuz
 *  reytingsiz chiziladi — sanoq uni kutib turmaydi. */
function useRating(uid: string | null | undefined): BattleRating | null {
  const [value, setValue] = useState<BattleRating | null>(null);

  useEffect(() => {
    if (!uid) return;
    let alive = true;
    let stop: (() => void) | null = null;
    void watchRating(uid, (next) => {
      if (alive) setValue(next);
    }).then((off) => {
      if (alive) stop = off;
      else off();
    });
    return () => {
      alive = false;
      stop?.();
    };
  }, [uid]);

  return value;
}

function Face({
  name,
  uid,
  mine,
}: {
  name: string;
  uid: string | null | undefined;
  mine?: boolean;
}) {
  const rating = useRating(uid);
  const shown = rating ?? EMPTY_RATING;
  return (
    <div className={`gcount__face${mine ? ' gcount__face--me' : ''}`}>
      <span className="gcount__ring">
        <Avatar name={name} uid={uid ?? undefined} size={52} />
      </span>
      <strong className="gcount__name">
        {pretty(name)}
        <VerifiedMark uid={uid} size={13} />
      </strong>
      {rating && (
        <span className="gcount__rating">
          <TierBadge rating={shown.rating} size={16} />
          <Olja rating={shown.rating} size="sm" />
        </span>
      )}
    </div>
  );
}

export default function GunchaCountdown({
  me,
  meUid,
  opponent,
  opponentUid,
  left,
}: {
  me: string;
  meUid?: string | null;
  opponent: string;
  opponentUid?: string | null;
  /** Sanoqda qolgan soniya: 3 → 2 → 1. */
  left: number;
}) {
  // Har soniyada ikkita barg ochiladi: uchinchi soniyaga borib oltalasi
  // ham joyida bo'ladi.
  const open = Math.min(6, Math.max(0, (4 - left) * 2));

  return (
    <div className="stage gcount">
      <div className="gcount__faces">
        <Face name={me} uid={meUid} mine />
        {/* Ajratgich — gulning changchisi, So'zjangdagi «VS» rombi emas. */}
        <span className="gcount__stamen" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <Face name={opponent} uid={opponentUid} />
      </div>

      <svg
        className="gcount__flower"
        viewBox="0 0 100 100"
        role="img"
        aria-label={`Jang ${left} soniyadan keyin boshlanadi`}
      >
        {Array.from({ length: 6 }, (_, index) => {
          const angle = START_ANGLE + index * 60;
          return (
            <g
              key={index}
              className={`gcount__petal${index < open ? ' gcount__petal--on' : ''}`}
              transform={`rotate(${angle} 50 50)`}
            >
              {/* Yaproq gulning yuqori chetidan markazga qarab
                  yotadi — `GunchaFlower` dagi qolipning o'zi. */}
              <path d={PETAL_PATH} transform={`translate(${50 - PETAL_W / 2} 0)`} />
            </g>
          );
        })}

        {Array.from({ length: 6 }, (_, index) => (
          <rect
            key={`dot-${index}`}
            className="gcount__dot"
            x={-1.6}
            y={-1.6}
            width={3.2}
            height={3.2}
            rx={0.6}
            transform={`rotate(${index * 60} 50 50) translate(50 7.1) rotate(45)`}
          />
        ))}

        <g transform={`translate(${50 - HEX_W / 2} ${50 - HEX_H / 2})`}>
          <path className="gcount__hex" d={HEX_PATH} />
        </g>
        {/* Raqam har soniyada qaytadan chiziladi: `key` almashgani uchun
            animatsiya yangidan boshlanadi. */}
        <text key={left} className="gcount__num" x="50" y="50">
          {left}
        </text>
      </svg>
    </div>
  );
}
