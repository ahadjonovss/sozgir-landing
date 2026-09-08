/** Telefondagi bosh ekran — ilovadagi `HomePage` ning tartibi.
 *
 *  Kunlik kartochka, modul to'ri va qo'llab-quvvatlash: qaytib kelgan
 *  o'yinchi bir bosishda o'ynay boshlaydi. Tanishtiruv bloklari esa
 *  pastda qoladi (`App` ularni shu ekranning ostiga qo'yadi) — sayt
 *  birinchi marta kirgan odam uchun ham ishlashi kerak.
 *
 *  Kompyuterda xuddi shu bloklar ikki ustunga yoyiladi (`shell.css`). */
import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { dailyKey, dailyNumber, untilNextWord } from '../lib/daily';
import { DAILY_LENGTH, attemptsFor } from '../lib/modes';
import { foundSummary } from '../lib/progress';
import { links } from '../data/site';
import { display } from '../lib/uz';
import AppMark from './AppMark';
import {
  Book,
  Bulb,
  Check,
  ChevronRight,
  Close,
  Clock,
  Download,
  Heart,
  Person,
  Play,
  Swords,
  Trophy,
} from './Icons';

/** Bugungi o'yin holati — saqlangan sessiyadan.
 *
 *  Kalit `useSozTop` bilan bir xil: bosh ekran o'yin holatini o'qiydi,
 *  lekin unga tegmaydi. Boshqa kunning sessiyasi hisobga olinmaydi. */
function readDaily() {
  try {
    const raw = localStorage.getItem(`sozgir.game.daily.${DAILY_LENGTH}`);
    const session = raw ? JSON.parse(raw) : null;
    if (!session || session.dateKey !== dailyKey()) return null;
    return {
      guesses: (session.guesses as string[] | undefined)?.length ?? 0,
      done: session.done === true,
      won: session.done === true && (session.points ?? 0) > 0,
      points: (session.points as number | undefined) ?? 0,
      answer: (session.answer as string | undefined) ?? '',
    };
  } catch {
    return null;
  }
}

function Countdown() {
  const [left, setLeft] = useState(() => untilNextWord());

  useEffect(() => {
    const timer = window.setInterval(() => setLeft(untilNextWord()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const hours = Math.floor(left / 3_600_000);
  const minutes = Math.floor((left % 3_600_000) / 60_000);

  return (
    <span className="daily__count">
      <Clock size={15} />
      Keyingi so‘zgacha {hours > 0 ? `${hours} soat ` : ''}
      {minutes} daqiqa
    </span>
  );
}

function Module({
  href,
  tone,
  icon,
  title,
  subtitle,
  badge,
}: {
  href: string;
  tone: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  badge?: string;
}) {
  return (
    <a className="hmod" href={href} style={{ '--tone': tone } as React.CSSProperties}>
      <span className="hmod__row">
        <span className="hmod__icon">{icon}</span>
        {badge && <span className="hmod__badge">{badge}</span>}
      </span>
      <span>
        <span className="hmod__title">{title}</span>
        <span className="hmod__sub">{subtitle}</span>
      </span>
    </a>
  );
}

export default function HomeApp() {
  const { account, nickname, openPrompt } = useAuth();
  const [daily, setDaily] = useState(readDaily);
  const [summary, setSummary] = useState(() => foundSummary());
  const number = dailyNumber();
  const max = attemptsFor(DAILY_LENGTH);

  useEffect(() => {
    // O'yindan qaytilganda holat yangilanadi.
    const refresh = () => {
      setDaily(readDaily());
      setSummary(foundSummary());
    };
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, []);

  const lost = daily?.done && !daily.won;
  const subtitle = !daily?.done
    ? daily && daily.guesses > 0
      ? `O‘yin davom etmoqda · ${daily.guesses}/${max}`
      : `${DAILY_LENGTH} harf · Hamma uchun bir xil so‘z`
    : daily.won
      ? `${daily.guesses}/${max} urinishda · +${daily.points} ball`
      : `So‘z: ${display(daily.answer)}`;

  return (
    <div className="home">
      <div className="home-head fade-in">
        <div style={{ flex: 1 }}>
          <div className="home-head__name">
            <AppMark size={26} ink="var(--text)" />
            {nickname}
          </div>
          <span className="home-head__metrics">
            <span style={{ color: 'var(--yellow)' }}>★</span>
            <b>{summary.totalScore}</b> ball · <b>{summary.count}</b> so‘z
            {!account && <> · natija shu brauzerda</>}
            <ChevronRight size={14} />
          </span>
        </div>
        <button
          className="avatar"
          onClick={() => openPrompt(account ? 'profile' : 'signIn')}
          aria-label={account ? 'Profil' : 'Kirish'}
        >
          {account ? (
            <span className="account__avatar">{account.initial}</span>
          ) : (
            <Person size={22} />
          )}
        </button>
      </div>

      <div className="home-daily fade-in" style={{ '--delay': '0.07s' } as React.CSSProperties}>
        <a className={`daily${lost ? ' daily--lost' : ''}`} href={links.play}>
          <span className="daily__top">
            <span className="daily__no">№{number}</span>
            <span className="daily__title">
              {daily?.done
                ? daily.won
                  ? 'Bugungi so‘z topildi'
                  : 'Bugun topa olmadingiz'
                : 'Kunlik o‘yin'}
            </span>
            <span className="daily__circle" aria-hidden="true">
              <Trophy size={18} />
            </span>
            <span className="daily__circle" aria-hidden="true">
              {daily?.done ? (
                daily.won ? <Check size={18} /> : <Close size={18} />
              ) : (
                <Play size={18} />
              )}
            </span>
          </span>
          <span className="daily__sub">{subtitle}</span>
          <Countdown />
        </a>
      </div>

      <div className="home-modules fade-in" style={{ '--delay': '0.11s' } as React.CSSProperties}>
        <div className="home-grid">
          <Module
            href={links.play}
            tone="var(--green)"
            icon={<AppMark size={22} ink="var(--green)" accent="var(--green)" />}
            title="So‘ztop"
            subtitle="Yashirin so‘zni toping"
          />
          <Module
            href={links.battle}
            tone="var(--accent)"
            icon={<Swords size={22} />}
            title="So‘zjang"
            subtitle="Do‘st bilan bellashing"
            badge="Jonli"
          />
          <Module
            href="/#modullar"
            tone="var(--yellow)"
            icon={<Bulb size={22} />}
            title="Yangso‘z"
            subtitle="Yangi so‘z o‘ylab toping"
            badge="Ilovada"
          />
          <Module
            href="/#modullar"
            tone="var(--violet)"
            icon={<Book size={22} />}
            title="O‘rganish"
            subtitle="So‘z boyligingizni oshiring"
            badge="Ilovada"
          />
        </div>
      </div>

      <div className="home-aside fade-in" style={{ '--delay': '0.17s' } as React.CSSProperties}>
        <a className="tile-card" href={links.donate}>
          <span className="tile-card__icon" style={{ color: 'var(--danger)' }}>
            <Heart size={18} />
          </span>
          <span className="tile-card__text">
            <span className="tile-card__title">Qo‘llab-quvvatlash</span>
            <span className="tile-card__sub">Xarid yo‘q, obuna yo‘q</span>
          </span>
          <span className="tile-card__badge">Hissa</span>
        </a>

        <a className="tile-card" href="/#yuklab-olish">
          <span className="tile-card__icon" style={{ color: 'var(--accent)' }}>
            <Download size={18} />
          </span>
          <span className="tile-card__text">
            <span className="tile-card__title">Ilovani yuklab olish</span>
            <span className="tile-card__sub">Yangso‘z, eslatma va oflayn o‘yin</span>
          </span>
        </a>
      </div>
    </div>
  );
}
