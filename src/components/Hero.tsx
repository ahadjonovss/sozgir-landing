import Play from './Play';
import { useGameChoice } from '../lib/useGameChoice';
import { useSozTop } from '../lib/useSozTop';
import { links, stats } from '../data/site';

/** Orqa fondagi bezak kataklar — «so'z» harflari va ranglar. Faqat
 *  ko'rinish uchun, ekran o'quvchisiga chiqmaydi. */
const CONFETTI: { unit: string; verdict: 'correct' | 'present' | 'absent' }[] = [
  { unit: 'S', verdict: 'correct' },
  { unit: 'O‘', verdict: 'present' },
  { unit: 'Z', verdict: 'absent' },
  { unit: 'G', verdict: 'present' },
  { unit: 'I', verdict: 'correct' },
  { unit: 'R', verdict: 'absent' },
];

/** Tanishtiruv boshi: sahifaning gapi chapda, haqiqiy o'yin o'ngda.
 *
 *  Taxta demo emas — kunlik so'z ilovadagi bilan bir xil, natija
 *  reytingga tushadi. Shu sabab yangi mehmon ham, qaytib kelgan o'yinchi
 *  ham birinchi ekranda o'ynay boshlaydi. */
export default function Hero() {
  const choice = useGameChoice();
  const game = useSozTop(choice);

  return (
    <section className="hero" id="top">
      <div className="hero__glow" aria-hidden="true" />
      {/* Brend harflari — logotip kabi doim lotinda qoladi. */}
      <div className="hero__confetti" aria-hidden="true" data-script="off">
        {CONFETTI.map((item, index) => (
          <span key={index} className={`tile tile--${item.verdict}`} style={{ '--n': index } as React.CSSProperties}>
            <span>{item.unit}</span>
          </span>
        ))}
      </div>

      <div className="wrap hero__inner">
        <div className="hero__copy">
          <span className="hero__badge">
            <i />
            O‘zbek tilidagi so‘z o‘yinlari
          </span>

          <h1>
            Kuniga bitta so‘z.
            <br />
            <span className="hero__accent">Butun O‘zbekiston</span> bilan birga.
          </h1>

          <p className="hero__lead">
            Yashirin so‘zni oltita urinishda toping, do‘stingiz bilan{' '}
            <strong>jonli jang</strong> qiling va har topgan so‘zingizning
            ma’nosini <strong>o‘rganing</strong>. SH, CH, O‘ va G‘ — bitta
            harf, xuddi maktabda o‘rgangandek.
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
            {stats.map((item) => (
              <li key={item.label} title={item.hint}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="hero__play">
          <div className="phone">
            <div className="phone__notch" aria-hidden="true" />
            <div className="phone__screen">
              <Play choice={choice} game={game} />
            </div>
          </div>
          <p className="hero__playnote">
            Bu haqiqiy o‘yin: bugungi so‘z ilovadagi bilan bir xil, natija
            reytingga tushadi.{' '}
            <a className="link" href={links.play}>
              To‘liq sahifa →
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
