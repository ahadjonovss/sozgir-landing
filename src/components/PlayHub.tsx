/** O'ynash sahifasi — `/oynash`.
 *
 *  Sarlavhada bitta «O'ynash» tugmasi bor; nimani o'ynashni odam shu
 *  yerda tanlaydi: So'ztop (bugungi so'z yoki cheksiz mashq) yoki
 *  So'zjang (do'st bilan yoki tezkor jang). Ilgari sarlavhada So'zjang
 *  alohida turardi, So'ztopga esa yo'l ko'rinmasdi.
 *
 *  Turnir va Mardu maydon kartochkalari qolganlaridan keyin turadi:
 *  ular yangi o'yin
 *  emas, **shakl** — ichida baribir So'zjang yoki G'uncha o'ynaladi,
 *  shuning uchun avval o'yinlarning o'zi ko'rinishi kerak.
 *
 *  Kartochkalardan keyin o'yinchining o'zi: aqchasi va darajasi, umumiy
 *  reyting va janglar tarixi. Ilgari bular sahifalar bo'ylab sochilgan
 *  edi — reyting So'ztop ichida, tarix esa maydon sahifasining yon
 *  ustunida, ya'ni «qanday o'ynayapman» degan savolga javob olish uchun
 *  o'yin ochish kerak edi. Tartib shu savolning tartibi: avval nima
 *  o'ynash, keyin boshqalarga nisbatan qanday va nima bo'lgani.
 *  Kirgan odamning o'z aqchasi esa kartochkalardan oldin: u bu yerga
 *  ko'pincha o'ynagani emas, «qanchaman» deb keladi. */
import { useEffect, useState } from 'react';
import { links } from '../data/site';
import { useAuth } from '../lib/auth';
import { dailyKey, dailyNumber, untilNextWord } from '../lib/daily';
import { DAILY_LENGTH, attemptsFor } from '../lib/modes';
import AdBanner from './AdBanner';
import AppMark from './AppMark';
import ArenaHistory from './ArenaHistory';
import BattleStats from './BattleStats';
import PlaysLeft from './PlaysLeft';
import Leaderboard from './Leaderboard';
import { Clock, Swords, Trophy, Users } from './Icons';
import GunchaCard from './GunchaCard';
import TelegramBanner from './TelegramBanner';
import { Aqcha } from './Units';

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
  const { account, openPrompt, ready } = useAuth();
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
            Bugungi so‘zni yolg‘iz toping, harflardan so‘z yig‘ing yoki
            do‘stingiz bilan bellashing. Hammasi shu yerda, brauzerda.
          </p>
        </div>

        {/* Aqcha va daraja o'yinlardan **oldin**: kirgan odam bu
            sahifaga ko'pincha «qanchaman» deb keladi, kartochkalar esa
            telefonda ikki ekran joy oladi.

            Kirmaganga ko'rsatilmaydi: yangi odam avval o'yinni ko'rishi
            kerak, kirish taklifi esa reyting jadvalining o'zida bor.
            `ready` kutiladi — aks holda kirgan odam ham har tashrifda
            bir lahza bo'sh joyni ko'rardi (`AccountCall` dagi sabab). */}
        {ready && account && (
          <section className="hub__block">
            <h2 className="hub__block-title">Ballaringiz</h2>
            <BattleStats uid={account.uid} />
          </section>
        )}

        <PlaysLeft />

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
                        <b>{daily.guesses}/{max}</b> urinishda ·{' '}
                        <b><Aqcha tiyin={daily.points} size="sm" sign /></b>
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

          <GunchaCard />

          <article className="hub-card hub-card--mardu">
            <div className="hub-card__top">
              <span className="hub-card__icon">
                <Users size={26} />
              </span>
              <span className="hub-card__badge">8 kishigacha</span>
            </div>
            <h2>Mardu maydon</h2>
            <p>
              Yangi o‘yin emas — yangi shakl. O‘sha So‘zjang yoki G‘uncha,
              lekin ikki kishi emas: sakkiztagacha odam bir vaqtda o‘ynaydi
              va oxirida jadval tuziladi.
            </p>
            <div className="hub-card__status">
              <span>
                Tezkor maydonga kiring yoki bitta havola bilan butun davrani
                yig‘ing
              </span>
            </div>
            <div className="hub-card__actions">
              <a className="btn" href={links.mardu}>
                Maydonga kirish
              </a>
            </div>
          </article>

          {/* Turnir maydondan **keyin**: ichida o'ynaladigani o'sha
              maydon, ya'ni odam avval maydonni ko'rishi kerak. */}
          <article className="hub-card hub-card--turnir">
            <div className="hub-card__top">
              <span className="hub-card__icon">
                <Trophy size={26} />
              </span>
              <span className="hub-card__badge">8–32 kishi</span>
            </div>
            <h2>Turnir</h2>
            <p>
              Ketma-ket bir necha maydon: har davrada o‘zingizga teng
              ochkodagilar bilan o‘ynaysiz, oxirida esa jadvalning birinchi
              ikki o‘rni finalga chiqadi.
            </p>
            <div className="hub-card__status">
              <span>
                Chiqarib yuborish yo‘q — hamma oxirgi davragacha o‘ynaydi
              </span>
            </div>
            <div className="hub-card__actions">
              <a className="btn" href={links.turnir}>
                Turnirga kirish
              </a>
            </div>
          </article>
        </div>

        {/* Sarlavha yo'q: `Leaderboard` va `ArenaHistory` o'z
            sarlavhasi bilan keladi (ular boshqa sahifalarda yolg'iz
            turadi), ikkinchisi takror bo'lardi.

            Ikkovi bitta o'ramda: keng ekranda yonma-yon turadi, aks
            holda jadval butun enga cho'zilib, ism chap chetda, aqcha
            o'ng chetda qolardi. Tarix hisobsiz umuman chizilmaydi —
            `ArenaHistory` o'zi qaror qiladi, o'ram esa shunda yolg'iz
            qolgan jadvalni o'qishga qulay enda ushlaydi. */}
        <div className="hub__panels">
          <Leaderboard />
          <ArenaHistory />
        </div>

        <TelegramBanner />

        {/* Reklama bo'lim oxirida: odam nimani o'ynashni tanlab bo'lgan,
            kartochkalar bilan tugma orasiga hech narsa qo'yilmagan. */}
        <AdBanner placement="hub" fit="edge" />

        <p className="hub__more">
          Ilovada yana:
          <a className="chip" href="/#modullar">
            Yangso‘z
          </a>
          <a className="chip" href="/#modullar">
            Kategoriyalar
          </a>
          <a className="chip" href="/#modullar">
            Reyting
          </a>
          <a className="chip" href="/#yuklab-olish">
            Yuklab olish →
          </a>
        </p>
      </div>
    </section>
  );
}
