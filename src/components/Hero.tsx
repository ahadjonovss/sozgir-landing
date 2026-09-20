import Play from './Play';
import { useGameChoice } from '../lib/useGameChoice';
import { useSozTop } from '../lib/useSozTop';
import { formatPlayers, useTodayPlayers } from '../lib/players';
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

/** Bosh sahifaning boshi — **o'yinning o'zi**.
 *
 *  Ilgari bu yerda ikki ustun bor edi: chapda sarlavha va gap, o'ngda
 *  telefon ramkasidagi taxta. Telefonda ustunlar ustma-ust tushardi,
 *  ya'ni o'ynash uchun avval butun tanishtiruv matnini surib o'tish
 *  kerak bo'lardi — qaytib kelgan o'yinchi esa har safar shuni qilardi.
 *
 *  Endi taxta birinchi ekranda turadi, tanishtiruv matni esa uning
 *  **ostida**: sahifa o'ynash uchun ochiladi, o'qish uchun emas. Matn
 *  yo'qolmaydi (u qidiruv uchun ham, birinchi marta kelgan odam uchun
 *  ham kerak) — faqat joyini o'yinga bo'shatib beradi.
 *
 *  Taxta demo emas: kunlik so'z ilovadagi bilan bir xil va natija
 *  reytingga tushadi. Telefon ramkasi ham olib tashlandi — u o'yinni
 *  «ilovaning ko'rinishi» qilib ko'rsatardi, holbuki u shu yerda,
 *  brauzerda o'ynaladigan haqiqiy o'yin. */
export default function Hero() {
  const choice = useGameChoice();
  const game = useSozTop(choice);
  const players = useTodayPlayers();

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
        <div className="hero__play">
          {/* Sanoq serverdagi haqiqiy son: bugun ball yozgan odamlar.
              Kelmaguncha qator umuman chizilmaydi — joy band qilib
              turgan bo'sh yorliq sonning o'zidan yomonroq. */}
          {players !== null && (
            <p className="hero__live">
              <i aria-hidden="true" />
              Bugun <strong>{formatPlayers(players)}</strong> kishi o‘ynadi
            </p>
          )}

          <div className="hero__board">
            <Play choice={choice} game={game} />
          </div>

          <p className="hero__playnote">
            Bu haqiqiy o‘yin: bugungi so‘z ilovadagi bilan bir xil, natija
            reytingga tushadi.{' '}
            <a className="link" href={links.play}>
              To‘liq sahifa →
            </a>
          </p>
        </div>

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
            <a className="btn btn--lg" href={links.hub}>
              Boshqa o‘yinlar
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
      </div>
    </section>
  );
}
