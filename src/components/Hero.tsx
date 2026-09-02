import Game from './Game';
import { stats } from '../data/site';

export default function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero__glow" aria-hidden="true" />
      <div className="wrap hero__inner">
        <div className="hero__copy">
          <span className="hero__badge">
            <i />O‘zbek tilidagi so‘z o‘yinlari platformasi
          </span>

          <h1>
            Kuniga bitta so‘z.
            <br />
            <span className="hero__accent">Butun O‘zbekiston</span> bilan birga.
          </h1>

          <p className="hero__lead">
            Do‘stingiz bilan <strong>jonli jang</strong> qiling, tilda yo‘q
            tushunchaga <strong>yangi so‘z o‘ylab toping</strong> va har topgan
            so‘zingizning ma’nosini <strong>o‘rganing</strong>. Hammasi bitta
            ilovada — o‘zbek tilida.
          </p>

          <div className="hero__cta">
            <a className="btn btn--lg" href="#yuklab-olish">
              Ilovani yuklab olish
            </a>
            <a className="btn btn--lg btn--outline" href="#qoida">
              Qanday o‘ynaladi?
            </a>
          </div>

          <ul className="hero__stats">
            {stats.map((s) => (
              <li key={s.label}>
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="hero__play">
          <div className="phone">
            <div className="phone__notch" aria-hidden="true" />
            <div className="phone__screen">
              <div className="phone__bar">
                <span className="phone__title">So‘ztop · kunlik</span>
                <span className="phone__live">
                  <i />
                  jonli demo
                </span>
              </div>
              <Game />
            </div>
          </div>
          <p className="hero__playnote">
            Haqiqiy o‘yin — shu yerda o‘ynang. Bugungi so‘z hamma uchun bir xil.
          </p>
        </div>
      </div>
    </section>
  );
}
