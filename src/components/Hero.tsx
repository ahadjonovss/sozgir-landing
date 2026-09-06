import Play from './Play';
import { useGameChoice } from '../lib/useGameChoice';
import { useSozTop } from '../lib/useSozTop';
import { stats } from '../data/site';
import { links } from '../data/site';

/** Sahifaning gapi: nima ekani, nega arziydi va raqamlar. */
function Copy({ compact }: { compact: boolean }) {
  return (
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
        {compact ? (
          <a className="btn btn--lg" href={links.play}>
            Bugungi so‘zni o‘ynash
          </a>
        ) : (
          <a className="btn btn--lg" href="#yuklab-olish">
            Ilovani yuklab olish
          </a>
        )}
        <a className="btn btn--lg btn--outline" href="#qoida">
          Qanday o‘ynaladi?
        </a>
      </div>

      <ul className="hero__stats">
        {stats.map((item) => (
          <li key={item.label}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Taxta bilan: sahifa faqat tanishtiruv bo'lganda ishlatiladi. */
function HeroFull() {
  const choice = useGameChoice();
  const game = useSozTop(choice);

  return (
    <section className="hero" id="top">
      <div className="hero__glow" aria-hidden="true" />
      <div className="wrap hero__inner">
        <Copy compact={false} />

        <div className="hero__play">
          <div className="phone">
            <div className="phone__notch" aria-hidden="true" />
            <div className="phone__screen">
              <Play choice={choice} game={game} />
            </div>
          </div>
          <p className="hero__playnote">
            Haqiqiy o‘yin — shu yerda o‘ynang. Bugungi so‘z ilovadagi bilan
            bir xil, natija esa reytingga tushadi.
            <br />
            <a className="link" href={links.play}>
              Reyting va statistika bilan to‘liq o‘yin sahifasi →
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}

/** Tanishtiruv boshi.
 *
 *  [compact] — taxtasiz. Bosh ekranning tepasida kunlik kartochka
 *  allaqachon turadi va bitta sahifada ikkita o'yin maydoni ortiqcha
 *  bo'lardi; bu yerda esa faqat sahifaning gapi qoladi. */
export default function Hero({ compact = false }: { compact?: boolean }) {
  if (!compact) return <HeroFull />;

  return (
    <section className="hero hero--compact" id="top">
      <div className="wrap hero__inner">
        <Copy compact />
      </div>
    </section>
  );
}
