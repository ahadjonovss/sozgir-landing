import { useEffect, useState } from 'react';
import { DAILY_LENGTH, dailyNumberFor } from '../lib/game';
import { dailyStatus } from '../lib/storage';
import { DailyCard } from '../components/Cards';
import Foot from '../components/Foot';
import { Link } from '../components/Screen';
import {
  CategoriesSection,
  DownloadSection,
  FaqSection,
  ModulesSection,
  RulesSection,
  StatsRow,
} from '../components/Sections';

/** Kompyuterdagi bosh sahifa — tanishtiruv sahifasi.
 *
 *  Telefonda bosh ekran ilovaning o'zi bo'ladi (`Home`), bu yerda esa
 *  sayt o'z vazifasini bajaradi: nima ekanini tushuntiradi, bugungi
 *  so'zni darhol o'ynatadi va ilovaga yo'naltiradi. Bo'limlar ikkala
 *  ko'rinishda ham bir xil komponentlardan yig'iladi. */
export default function Landing() {
  const number = dailyNumberFor();
  const [status, setStatus] = useState(() => dailyStatus(number, DAILY_LENGTH));

  useEffect(() => {
    document.title = 'So‘zgir — o‘zbekcha so‘z o‘yinlari';
    const refresh = () => setStatus(dailyStatus(number, DAILY_LENGTH));
    refresh();
    addEventListener('focus', refresh);
    return () => removeEventListener('focus', refresh);
  }, [number]);

  return (
    <div className="landing">
      <section className="hero">
        <div className="hero__copy">
          <span className="hero__badge">
            <i />
            O‘zbek tilidagi so‘z o‘yinlari platformasi
          </span>
          <h1 className="hero__title">
            Kuniga bitta so‘z.
            <br />
            <span style={{ color: 'var(--green)' }}>Butun O‘zbekiston</span> bilan birga.
          </h1>
          <p className="hero__lead">
            So‘zgir ilovasining veb versiyasi. Bugungi so‘z shu yerda ham
            o‘ynaladi — <strong>ilovadagi lug‘at</strong> va{' '}
            <strong>aynan o‘sha so‘z</strong> bilan. Do‘stingiz bilan jang
            qiling, tilda yo‘q tushunchaga yangi so‘z o‘ylab toping va
            topgan so‘zingizning ma’nosini o‘rganing.
          </p>
          <div className="hero__cta">
            <Link to="/kunlik" className="btn">
              Bugungi so‘zni o‘ynash
            </Link>
            <Link to="/yuklab-olish" className="btn btn--soft">
              Ilovani yuklab olish
            </Link>
          </div>
          <StatsRow />
        </div>

        <div className="hero__play">
          <DailyCard number={number} length={DAILY_LENGTH} status={status} to="/kunlik" />
          <p className="prose" style={{ fontSize: 13, marginTop: 12 }}>
            Kunlik so‘z sana bo‘yicha tanlanadi va hamma qurilmada bir xil —
            shuning uchun kunlik reyting adolatli bo‘ladi.
          </p>
        </div>
      </section>

      <ModulesSection />
      <RulesSection />
      <CategoriesSection />
      <FaqSection />
      <DownloadSection />
      <Foot />
    </div>
  );
}
