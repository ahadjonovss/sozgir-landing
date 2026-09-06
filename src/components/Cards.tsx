import { useEffect, useState, type ReactNode } from 'react';
import { attemptsFor, msUntilTomorrow } from '../lib/game';
import { display } from '../lib/uz';
import { Check, Clock, Close, Play, Trophy } from './Icons';
import { Link } from './Screen';

/** «Keyingi so'zgacha 4 soat 12 daqiqa» — ilovadagi sanoq. */
export function Countdown({ prefix = 'Keyingi so‘zgacha' }: { prefix?: string }) {
  const [left, setLeft] = useState(() => msUntilTomorrow());

  useEffect(() => {
    const timer = setInterval(() => setLeft(msUntilTomorrow()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const hours = Math.floor(left / 3_600_000);
  const minutes = Math.floor((left % 3_600_000) / 60_000);
  const text = hours > 0 ? `${hours} soat ${minutes} daqiqa` : `${minutes} daqiqa`;

  return (
    <span className="daily__count">
      <Clock size={15} />
      {prefix} {text}
    </span>
  );
}

export type DailyState = {
  started: boolean;
  finished: boolean;
  won: boolean;
  attempts: number;
  answer: string;
  score: number;
};

/** Bosh ekrandagi asosiy blok: bugungi o'yin. */
export function DailyCard({
  number,
  length,
  status,
  to,
}: {
  number: number;
  length: number;
  status: DailyState;
  to: string;
}) {
  const lost = status.finished && !status.won;
  const max = attemptsFor(length);

  const subtitle = !status.finished
    ? status.started
      ? `O‘yin davom etmoqda · ${status.attempts}/${max}`
      : `${length} harf · Hamma uchun bir xil so‘z`
    : status.won
      ? `${status.attempts}/${max} urinishda · +${status.score} ball`
      : `So‘z: ${display(status.answer)}`;

  return (
    <Link to={to} className={`daily${lost ? ' daily--lost' : ''}`}>
      <div className="daily__top">
        <span className="daily__no">№{number}</span>
        <span className="daily__title">
          {status.finished
            ? status.won
              ? 'Bugungi so‘z topildi'
              : 'Bugun topa olmadingiz'
            : 'Kunlik o‘yin'}
        </span>
        <span className="daily__circle" aria-hidden="true">
          <Trophy size={18} />
        </span>
        <span className="daily__circle" aria-hidden="true">
          {status.finished ? (
            status.won ? <Check size={18} /> : <Close size={18} />
          ) : (
            <Play size={18} />
          )}
        </span>
      </div>
      <span className="daily__sub">{subtitle}</span>
      <Countdown />
    </Link>
  );
}

/** Bosh ekrandagi katta modul kartochkasi (ikki ustunli to'r). */
export function ModuleCard({
  to,
  tone,
  icon,
  title,
  subtitle,
  badge,
}: {
  to: string;
  tone: string;
  icon: ReactNode;
  title: string;
  subtitle: string;
  badge?: string;
}) {
  return (
    <Link to={to} className="module" style={{ ['--tone' as string]: tone }}>
      <div className="module__row">
        <span className="module__icon">{icon}</span>
        {badge && <span className="module__badge">{badge}</span>}
      </div>
      <div>
        <div className="module__title">{title}</div>
        <div className="module__sub">{subtitle}</div>
      </div>
    </Link>
  );
}

/** Ro'yxatdagi kartochka: rejim, bo'lim yoki sozlama. */
export function TileCard({
  to,
  onClick,
  icon,
  title,
  subtitle,
  badge,
  accent,
}: {
  to?: string;
  onClick?: () => void;
  icon: ReactNode;
  title: string;
  subtitle?: string;
  badge?: string;
  accent?: boolean;
}) {
  const inner = (
    <>
      <span className="tile-card__icon">{icon}</span>
      <span className="tile-card__text">
        <span className="tile-card__title">{title}</span>
        {subtitle && <span className="tile-card__sub">{subtitle}</span>}
      </span>
      {badge && <span className="tile-card__badge">{badge}</span>}
    </>
  );

  const className = `tile-card${accent ? ' tile-card--accent' : ''}`;

  if (to) {
    return (
      <Link to={to} className={className}>
        {inner}
      </Link>
    );
  }
  return (
    <button className={className} onClick={onClick} type="button">
      {inner}
    </button>
  );
}

/** So'z uzunligi — cheksiz va kategoriya rejimlari uchun. */
export function LengthPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (length: number) => void;
}) {
  return (
    <div className="lengths" role="group" aria-label="So‘z uzunligi">
      {[4, 5, 6, 7].map((length) => (
        <button
          key={length}
          type="button"
          aria-pressed={value === length}
          onClick={() => onChange(length)}
        >
          {length} harf
        </button>
      ))}
    </div>
  );
}
