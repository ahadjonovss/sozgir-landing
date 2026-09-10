/** O'ynash sahifasi — `/oynash`.
 *
 *  Sarlavhada bitta «O'ynash» tugmasi bor; nimani o'ynashni odam shu
 *  yerda tanlaydi: So'ztop (bugungi so'z yoki cheksiz mashq) yoki
 *  So'zjang (do'st bilan yoki tezkor jang). Ilgari sarlavhada So'zjang
 *  alohida turardi, So'ztopga esa yo'l ko'rinmasdi. */
import { useEffect, useState } from 'react';
import { links } from '../data/site';
import { useAuth } from '../lib/auth';
import { dailyKey, dailyNumber, untilNextWord } from '../lib/daily';
import { DAILY_LENGTH, attemptsFor } from '../lib/modes';
import AppMark from './AppMark';
import { Clock, Swords } from './Icons';
import TelegramBanner from './TelegramBanner';

/** Bugungi o'yin holati — saqlangan sessiyadan.
 *
 *  Kalit `useSozTop` bilan bir xil: sahifa holatni o'qiydi, lekin unga
 *  tegmaydi. Boshqa kunning sessiyasi hisobga olinmaydi. */
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
    <span>
      <Clock size={14} /> Keyingi so‘zgacha {hours > 0 ? `${hours} soat ` : ''}
      {minutes} daqiqa
    </span>
  );
}

export default function PlayHub() {
  const { account, openPrompt } = useAuth();
  const [daily] = useState(readDaily);
  const number = dailyNumber();
  const max = attemptsFor(DAILY_LENGTH);

  return (
    <section className="oyin">
      <div className="wrap hub">
        <div className="hub__head">
          <span className="section__kicker">O‘ynash</span>
          <h1>Nimani o‘ynaymiz?</h1>
          <p className="section__lead">
            Bugungi so‘zni yolg‘iz toping yoki do‘stingiz bilan bir so‘z
            ustida bellashing. Ikkalasi ham shu yerda, brauzerda.
          </p>
        </div>

        <div className="hub__grid">
          <article className="hub-card hub-card--soztop">
            <div className="hub-card__top">
              <span className="hub-card__icon">
                <AppMark size={28} ink="currentColor" accent="var(--green)" />
              </span>
              <span className={`hub-card__badge${daily?.done ? ' hub-card__badge--done' : ''}`}>
                {daily?.done ? (daily.won ? 'Bugun topildi' : 'Bugun o‘ynaldi') : `№${number}`}
              </span>
            </div>
            <h2>So‘ztop</h2>
            <p>
              Kuniga bitta 5 harfli so‘z — butun O‘zbekiston uchun bir xil.
              Topgach cheksiz rejimda 4 dan 7 harfgacha mashq qiling.
            </p>
            <div className="hub-card__status">
              {daily?.done ? (
                <>
                  <span>
                    {daily.won ? (
                      <>
                        <b>{daily.guesses}/{max}</b> urinishda · <b>+{daily.points}</b> ball
                      </>
                    ) : (
                      'Bugun topa olmadingiz'
                    )}
                  </span>
                  <Countdown />
                </>
              ) : daily && daily.guesses > 0 ? (
                <span>
                  O‘yin davom etmoqda · <b>{daily.guesses}/{max}</b>
                </span>
              ) : (
                <span>Bugungi so‘z hali o‘ynalmagan</span>
              )}
            </div>
            <div className="hub-card__actions">
              <a className="btn" href={links.play}>
                {daily?.done ? 'Cheksiz rejimda o‘ynash' : 'Bugungi so‘zni o‘ynash'}
              </a>
              {!daily?.done && (
                <a className="btn btn--ghost" href={links.play}>
                  Cheksiz rejim
                </a>
              )}
            </div>
          </article>

          <article className="hub-card hub-card--battle">
            <div className="hub-card__top">
              <span className="hub-card__icon">
                <Swords size={26} />
              </span>
              <span className="hub-card__badge">Jonli</span>
            </div>
            <h2>So‘zjang</h2>
            <p>
              Bir so‘z, ikki o‘yinchi. Do‘stingizni kod bilan chaqiring yoki
              tezkor jangda tasodifiy raqib toping — kim kamroq urinishda
              topsa, o‘sha yutadi.
            </p>
            <div className="hub-card__status">
              {account ? (
                <span>
                  <b>{account.nickname}</b> sifatida o‘ynaysiz
                </span>
              ) : (
                <span>Jang uchun hisob kerak — raqib taxallusingizni ko‘radi</span>
              )}
            </div>
            <div className="hub-card__actions">
              <a className="btn" href={links.battle}>
                Jangga kirish
              </a>
              {!account && (
                <button className="btn btn--ghost" onClick={() => openPrompt('signIn')}>
                  Kirish
                </button>
              )}
            </div>
          </article>
        </div>

        <TelegramBanner />

        <p className="hub__more">
          Ilovada yana:
          <a className="chip" href="/#modullar">
            Yangso‘z
          </a>
          <a className="chip" href="/#modullar">
            O‘rganish
          </a>
          <a className="chip" href="/#modullar">
            Kategoriyalar
          </a>
          <a className="chip" href="/#yuklab-olish">
            Yuklab olish →
          </a>
        </p>
      </div>
    </section>
  );
}
