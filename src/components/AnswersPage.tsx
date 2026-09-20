/** Javoblar — `/javoblar`: bugungi so'z va o'tgan kunlar arxivi.
 *
 *  Sahifa bitta savolga javob beradi: «bugungi so'z nima?». Odam uni
 *  baribir qidiradi — javobni o'zimiz bermasak, u boshqa joydan (yoki
 *  umuman noto'g'ri) topadi va qaytib kelmaydi.
 *
 *  **Javob spoyler ostida.** Bir bosish qo'shimcha to'siq emas, ongli
 *  qaror: sahifaga bugungi o'yinni hali o'ynamagan odam ham tushib
 *  qoladi (qidiruvdan, havoladan), va u javobni tasodifan ko'rib
 *  qolmasligi kerak.
 *
 *  Kelajakdagi so'zlar ro'yxatga umuman tushmaydi — chegara so'rovning
 *  o'zida (`lib/answers.ts`). */
import { useEffect, useState } from 'react';
import { links } from '../data/site';
import { formatDate, loadAnswers, type DailyAnswer } from '../lib/answers';
import { dailyNumber, untilNextWord } from '../lib/daily';
import { display, pretty } from '../lib/uz';
import AdBanner from './AdBanner';
import { ChevronLeft } from './Icons';

export default function AnswersPage() {
  const [rows, setRows] = useState<DailyAnswer[] | null>(null);
  const [failed, setFailed] = useState(false);
  /** Bugungi javob ochilganmi. Arxivdagi kunlar yashirilmaydi: ular
   *  allaqachon o'ynab bo'lingan, ularni yopib turishning ma'nosi
   *  yo'q. */
  const [shown, setShown] = useState(false);

  useEffect(() => {
    let alive = true;
    loadAnswers()
      .then((answers) => {
        if (!alive) return;
        if (answers.length === 0) setFailed(true);
        setRows(answers);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const today = rows?.[0] ?? null;
  const archive = rows?.slice(1) ?? [];

  return (
    <section className="oyin javob">
      <div className="wrap javob__wrap">
        <a className="player__back" href={links.play}>
          <ChevronLeft size={18} />
          O‘yinga qaytish
        </a>

        <header className="javob__head">
          <h1>So‘ztop javoblari</h1>
          <p className="section__lead">
            Bugungi so‘z va o‘tgan kunlar arxivi. Javob yopiq turadi —
            o‘ynab bo‘lgach oching.
          </p>
        </header>

        <div className="javob__today">
          <span className="panel__label">
            Bugungi so‘z · №{today?.number ?? dailyNumber()}
          </span>

          {shown && today ? (
            <>
              <p className="javob__word" data-script="word">
                {display(today.word)}
              </p>
              {today.meaning && <p className="javob__meaning">{pretty(today.meaning)}</p>}
            </>
          ) : (
            <>
              <p className="javob__hidden" aria-hidden="true">
                • • • • •
              </p>
              <button
                className="btn"
                onClick={() => setShown(true)}
                disabled={!today}
              >
                {today ? 'Javobni ko‘rsatish' : 'Yuklanmoqda…'}
              </button>
            </>
          )}

          <p className="panel__note">
            Keyingi so‘z <NextWord /> dan keyin — yarim tunda, hamma uchun
            bir vaqtda.
          </p>
        </div>

        <div className="javob__cta">
          <a className="btn btn--lg" href={links.play}>
            Bugungi so‘zni o‘zim topaman
          </a>
        </div>

        <h2 className="javob__title">O‘tgan kunlar javoblari</h2>
        <p className="panel__note javob__note">
          Har kuni bitta so‘z, butun O‘zbekiston uchun bir xil. Ro‘yxatda
          faqat o‘ynab bo‘lingan kunlar turadi.
        </p>

        {failed && rows?.length === 0 && (
          <p className="panel__note">
            Arxivni o‘qib bo‘lmadi. Internet aloqasini tekshirib, qayta urinib
            ko‘ring.
          </p>
        )}

        {rows === null ? (
          <ul className="javob__list" aria-busy="true" aria-label="Yuklanmoqda">
            {Array.from({ length: 8 }, (_, index) => (
              <li key={index} className="javob__row javob__row--skeleton">
                <i />
              </li>
            ))}
          </ul>
        ) : (
          <ul className="javob__list">
            {archive.map((row) => (
              <li key={row.dateKey} className="javob__row">
                <span className="javob__num">№{row.number}</span>
                <span className="javob__row-word" data-script="word">
                  {display(row.word)}
                </span>
                <span className="javob__date">{formatDate(row.dateKey)}</span>
                {row.meaning && (
                  <span className="javob__row-meaning">{pretty(row.meaning)}</span>
                )}
              </li>
            ))}
          </ul>
        )}

        <AdBanner placement="profile" />
      </div>
    </section>
  );
}

/** Keyingi so'zgacha qolgan vaqt — `06:12:40`. */
function NextWord() {
  const [left, setLeft] = useState(() => untilNextWord());

  useEffect(() => {
    const timer = window.setInterval(() => setLeft(untilNextWord()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const seconds = Math.max(0, Math.floor(left / 1000));
  const two = (value: number) => String(value).padStart(2, '0');
  return (
    <strong>
      {two(Math.floor(seconds / 3600))}:{two(Math.floor((seconds % 3600) / 60))}:
      {two(seconds % 60)}
    </strong>
  );
}
