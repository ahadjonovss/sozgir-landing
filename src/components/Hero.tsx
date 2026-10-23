import GameAside from './GameAside';
import { GunchaBoard } from './GunchaBoard';
import Play from './Play';
import { useGameChoice } from '../lib/useGameChoice';
import { useGameSwap } from '../lib/useGameSwap';
import { useSozTop } from '../lib/useSozTop';
import { useAuth } from '../lib/auth';
import { dailyNumber } from '../lib/daily';
import { Download, Today } from './Icons';
import { links } from '../data/site';

/** Qurilmaning do'koni.
 *
 *  Bitta tugmada ikkala do'konni ko'rsatib bo'lmaydi, tanlov esa
 *  ortiqcha savol: odam o'z telefonini biladi, biz ham bilamiz.
 *  Kompyuterda Google Play qoladi — u brauzerda ochiladi va
 *  havolani telefonga yuborish mumkin. */
const storeLink = (): string =>
  /iPhone|iPad|iPod/.test(navigator.userAgent) ||
  (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1)
    ? links.appStore
    : links.playStore;

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
 *  Sanoqli plitkalar (necha so'z, necha mavzu) bu yerdan olib
 *  tashlandi. Ular birinchi ekranning oxiridagi to'rtta raqam edi va
 *  o'yinga hech narsa qo'shmasdi: odam bu yerga o'ynagani keladi,
 *  lug'atning hajmini bilgani emas. Sonlar yo'qolmadi — ular endi
 *  qoida bo'limining oxirida, bitta qatorda turadi (`Rules`): gap
 *  lug'at haqida ketgan joyda ular javob beradi.
 *
 *  Taxta demo emas: kunlik so'z ilovadagi bilan bir xil va natija
 *  reytingga tushadi. Telefon ramkasi ham olib tashlandi — u o'yinni
 *  «ilovaning ko'rinishi» qilib ko'rsatardi, holbuki u shu yerda,
 *  brauzerda o'ynaladigan haqiqiy o'yin. */
export default function Hero() {
  // Bosh sahifa **cheksiz** rejimdan boshlanadi. Sabab ikkita: kunlik
  // so'z endi hisob talab qiladi (u reytingga tushadi), ya'ni birinchi
  // marta kelgan odam bosh sahifada darrov to'siqqa urilardi; ikkinchidan
  // kunlik so'zning o'z sahifasi bor va tepadagi banner aynan o'sha
  // yerga olib boradi.
  const { account } = useAuth();
  const choice = useGameChoice({ mode: 'endless' });
  // G'uncha ham shu sababdan **mashq**: kunligi kuniga bitta va uni
  // bosh sahifadagi taxtada sarflab qo'yish kerak emas. Tanlov ham
  // berilmaydi — bu yerda odam o'ynab ko'radi, rejim tanlamaydi.
  const swap = useGameSwap(false, true);
  const game = useSozTop(choice, !swap.flower);

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
          {/* Taxtaning tepasidagi qator — sahifaning eng muhim
              havolasi. Lekin u kimga nima ko'rsatishi hisobga
              bog'liq.

              **Kirgan odamga** — kunlik so'z: natijasi saqlanadi,
              reytingga tushadi va u buni darhol o'ynashi mumkin.

              **Kirmaganga** — ilova. Kunlik so'z unga baribir
              yopiq (u hisob talab qiladi), ya'ni eski qator uni
              bosib borib, kirish ekraniga urilish uchun chaqirardi.
              Ilova esa hisobsiz ham ishlaydi va natijani o'zi
              saqlaydi — ya'ni bu yerda taklif qilinadigan eng
              foydali narsa o'sha. Bosh sahifadagi taxta esa
              ikkalasiga ham ochiq: u cheksiz rejim. */}
          {account ? (
            <a className="daily-card" href={links.play}>
              <span className="daily-card__icon" aria-hidden="true">
                <Today size={20} />
              </span>
              <span className="daily-card__text">
                <strong>Kunlik so‘z №{dailyNumber()}</strong>
                <span>Butun O‘zbekiston uchun bitta so‘z</span>
              </span>
              <span className="btn btn--sm daily-card__go">O‘ynash</span>
            </a>
          ) : (
            <a
              className="daily-card"
              href={storeLink()}
              target="_blank"
              rel="noreferrer"
            >
              <span className="daily-card__icon" aria-hidden="true">
                <Download size={20} />
              </span>
              <span className="daily-card__text">
                <strong>Ilovani yuklab oling</strong>
                <span>Natijalar saqlanadi, kunlik eslatma keladi</span>
              </span>
              <span className="btn btn--sm daily-card__go">Yuklab olish</span>
            </a>
          )}

          <div className="hero__board game-slot">
            {/* Yon ustunlar taxtaning **yonida**, oqimdan tashqarida
                chiziladi (`position: absolute`) — markaz qimirlamaydi.
                Ular taxtaning o'zida emas, shu o'ramda: o'yin turi
                almashganda ham joyida qolishi kerak. Ilgari ular
                `Play` ichida edi va g'unchaga o'tilganda butunlay
                yo'qolardi. */}
            <GameAside current={choice.mode === 'endless' ? 'cheksiz' : 'soztop'} />

            {/* Belgi bilan almashadigan taxta: g'uncha ham shu
                yerda ochiladi, sahifa esa o'zgarmaydi. */}
            {swap.flower ? (
              <GunchaBoard
                guncha={swap.guncha}
                onSwap={swap.toggle}
                practiceOnly={swap.practiceOnly}
              />
            ) : (
              <Play choice={choice} game={game} onSwap={swap.toggle} />
            )}
          </div>

          {/* Jonli sanoq endi sarlavhaning o'rtasida — u butun saytga
              tegishli, faqat bosh sahifaga emas. */}
          <p className="hero__playnote">
            Bu haqiqiy o‘yin: lug‘at ilovadagi bilan bir xil, natija jadvalga
            tushadi.{' '}
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
        </div>
      </div>
    </section>
  );
}
