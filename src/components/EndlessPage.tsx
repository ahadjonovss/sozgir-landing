/** Uzunlik bo'yicha sahifa — `/cheksiz/{n}-harf`.
 *
 *  Cheksiz rejim ilgari ham bor edi, lekin uning o'z manzili yo'q edi:
 *  «6 harfli so'z o'yini» deb qidirgan odam saytni topmasdi, topgan
 *  odam esa rejimni qo'lda tanlashi kerak edi. Endi har uzunlik o'z
 *  sahifasi bilan keladi va o'yin **darrov o'sha uzunlikda** ochiladi.
 *
 *  Tuzilishi bosh sahifadagidek: avval taxta, keyin matn. Sahifa
 *  o'ynash uchun ochiladi, o'qish uchun emas — matn esa qidiruv uchun
 *  ham, «bu yerda nima farq qiladi?» degan savol uchun ham kerak. */
import { links } from '../data/site';
import { LENGTH_PAGES, type LengthPage } from '../data/lengths';
import { attemptsFor } from '../lib/modes';
import { useGameChoice } from '../lib/useGameChoice';
import { useSozTop } from '../lib/useSozTop';
import AdBanner from './AdBanner';
import Play from './Play';
import { ChevronLeft } from './Icons';

export default function EndlessPage({ page }: { page: LengthPage }) {
  // Sahifa aynan shu uzunlik uchun ochilgan, ya'ni tanlov ham shundan
  // boshlanadi. Odam taxtaning o'zida boshqa uzunlikka o'tsa, manzil
  // ortda qoladi — bu yerda zarari yo'q: sahifa o'yinni cheklamaydi,
  // faqat qaysi biridan boshlanishini aytadi.
  const choice = useGameChoice({ mode: 'endless', length: page.length });
  const game = useSozTop(choice);
  const others = LENGTH_PAGES.filter((item) => item.length !== page.length);

  return (
    <section className="oyin cheksiz">
      <div className="wrap cheksiz__wrap">
        <a className="player__back" href={links.hub}>
          <ChevronLeft size={18} />
          Boshqa o‘yinlar
        </a>

        <div className="hero__play cheksiz__play">
          <div className="hero__board">
            <Play choice={choice} game={game} />
          </div>
        </div>

        <header className="cheksiz__head">
          <h1>{page.h1}</h1>
          <p className="section__lead">{page.lead}</p>
        </header>

        <ul className="cheksiz__facts">
          <li>
            <strong>{page.length}</strong>
            <span>katak</span>
          </li>
          <li>
            <strong>{attemptsFor(page.length)}</strong>
            <span>urinish</span>
          </li>
          <li>
            <strong>∞</strong>
            <span>o‘yin</span>
          </li>
        </ul>

        <div className="cheksiz__text">
          {page.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <h2 className="cheksiz__title">Boshqa uzunliklar</h2>
        <ul className="cheksiz__others">
          {others.map((item) => (
            <li key={item.path}>
              <a href={item.path}>
                <strong>{item.h1}</strong>
                <span>{item.tagline}</span>
              </a>
            </li>
          ))}
          <li>
            <a href={links.play}>
              <strong>Kunlik so‘z</strong>
              <span>Kuniga bitta so‘z — butun O‘zbekiston uchun bir xil</span>
            </a>
          </li>
        </ul>

        <AdBanner placement="game" />
      </div>
    </section>
  );
}
