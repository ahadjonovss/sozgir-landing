/** `sozgir.uz/soztop/<KOD>` — do'sti yashirgan so'zni topish sahifasi.
 *
 *  Havola ilovadan ulashiladi (`challengeShare`). Ilovasi bor telefonda
 *  u ilovani ochadi (universal havola), ya'ni bu sahifaga tushgan odamda
 *  ilova odatda **yo'q** — va aynan shuning uchun o'yin shu yerda,
 *  brauzerda o'ynaladi. Ilgari bu manzil yuklab olish sahifasini
 *  ko'rsatardi: odam havolani bosib, o'ynay olmay qaytib ketardi.
 *
 *  Yashirish saytda yo'q — u lug'at qidiruviga tayanadi va ilovada
 *  qoladi (`lib/challenge.ts`). Shuning uchun o'yin tugagach ilova
 *  taklif qilinadi: «endi o'zingiz yashiring» — bu sahifaning tabiiy
 *  davomi va ilovaning eng o'rinli taklif qilinadigan payti: odam
 *  o'yinni endigina o'ynab ko'rdi. */
import { useEffect, useState, type CSSProperties } from 'react';
import { links, playerLink } from '../data/site';
import { useAuth } from '../lib/auth';
import { askAppPromo } from '../lib/appPromo';
import { isChallengeCode } from '../lib/challenge';
import { useChallenge } from '../lib/useChallenge';
import { routeParam } from '../lib/useRoute';
import { Board, Keyboard } from './Board';
import DownloadPromo from './DownloadPromo';

/** O'yin tugadi. Javob ko'rsatilmaydi — uni server hech kimga bermaydi
 *  (`lib/challenge.ts`), ya'ni biz ham bilmaymiz. Topolmagan odamga
 *  «so'z falon edi» deyishning yagona yo'li — so'rab olish, u esa
 *  yashirgan odamda. */
function Result({
  won,
  attempts,
  guest,
}: {
  won: boolean;
  attempts: number;
  guest: boolean;
}) {
  return (
    <div className={`result result--${won ? 'won' : 'lost'}`} role="status">
      <p className="result__title">
        {won ? `Topdingiz — ${attempts} urinishda!` : 'Topilmadi'}
      </p>
      <p className="result__def">
        {won
          ? guest
            ? 'Yashirgan odam sizni ismsiz ko‘radi — «kimdir topdi» deb. Kirsangiz, o‘yiningiz shu zahoti uning statistikasiga ismingiz bilan yoziladi.'
            : 'Yashirgan odam buni darhol ko‘radi: uning statistikasida siz necha urinishda topganingiz yoziladi.'
          : 'So‘z serverda qoladi va uni faqat yashirgan odam biladi — so‘rab ko‘ring.'}
      </p>

      {/* Taklif aynan shu yerda: odam endigina o'ynab bo'ldi va
          natijasi qo'lida. Kirish o'yinni boshidan boshlatmaydi —
          tergan so'zlari serverga ko'chiriladi va ekranda o'sha
          o'yinning o'zi qoladi (`useChallenge`). */}
      {guest && <SaveCall won={won} />}
      <p className="result__next">
        Bitta so‘z bir marta o‘ynaladi. Endi o‘zingiz so‘z yashiring va
        do‘stlaringizga tashlang.
      </p>
      {/* Yashirish faqat ilovada: so'z lug'atdan qidirib tanlanadi. */}
      <DownloadPromo />
    </div>
  );
}

/** Mehmonga: «natijangiz yozilsin» taklifi.
 *
 *  Topganda ham, topolmaganda ham chiqadi — ikkala holat ham
 *  yashirgan odam uchun ma'lumot. Faqat matni boshqacha: yutgan
 *  odamga ismi, yutqazganga qatnashgani va'da qilinadi. */
function SaveCall({ won }: { won: boolean }) {
  const { openPrompt } = useAuth();
  return (
    <div className="result__save">
      <p className="panel__note">
        {won
          ? 'Ismingiz bilan yozilsinmi?'
          : 'Qatnashganingiz yozilsinmi? Yashirgan odam kim urinib ko‘rganini ko‘radi.'}
      </p>
      {/* Bitta tugma: kirish va hisob ochish bitta oqim — oynaning
          o'zida «Hisobim yo'q» havolasi bor va ilovada ham shunday
          (`AuthFormMode` bitta ekranda almashadi). Ikkita tugma
          odamni bo'lmagan tanlov oldida qoldirardi: u hisobi
          borligini biladi, biz esa so'rab o'tirardik. */}
      <button className="btn btn--sm" onClick={() => openPrompt('signIn')}>
        Kirish
      </button>
    </div>
  );
}

export default function ChallengePage() {
  // Manzil o'zgarganda `App` qayta chiziladi, ya'ni kodni shu yerda
  // o'qish yetarli — alohida holat kerak emas.
  const code = routeParam().toUpperCase();
  const valid = isChallengeCode(code);
  const game = useChallenge(valid ? code : '');
  const done = game.phase === 'won' || game.phase === 'lost';

  /* Taxta oxirgi qator ag'darilib bo'lgach yopiladi.
   *
   *  Darhol yopilsa o'yinning eng qiziq lahzasi — oxirgi qatorning
   *  rang olishi — umuman ko'rinmasdi: javob yuborilgan zahoti
   *  ekranda natija paydo bo'lardi.
   *
   *  Muddat aniq hisoblanadi, taxminiy son emas: har katak 0,5
   *  soniya ag'dariladi va ular 130 ms oralab boshlanadi
   *  (`landing.css`), ya'ni oxirgisi shuncha vaqtdan keyin
   *  tugaydi. */
  const [over, setOver] = useState(false);
  useEffect(() => {
    if (!done) return setOver(false);
    const wait = 500 + 130 * Math.max(0, game.length - 1);
    const timer = window.setTimeout(() => setOver(true), wait);
    return () => window.clearTimeout(timer);
  }, [done, game.length]);

  /* O'yin tugadi — telefonda ilova taklifi chiqadi va u yerda do'kon
     besh soniyadan keyin o'zi ochiladi (`AppPopup`, `soztop` sababi).
     Sahifaning davomi baribir ilovada: so'z yashirish faqat u yerda va
     bu odam hozir aynan shuni qilmoqchi — do'stining so'zini topdi.
     Kompyuterda oyna umuman chiqmaydi. */
  useEffect(() => {
    if (over) askAppPromo('soztop');
  }, [over]);
  /** Kod ishlamasa sahifa boshidagi va'da o'rinsiz bo'lib qoladi: ostida
   *  «bunday kod topilmadi» turganda «so'zni toping» deyishning ma'nosi
   *  yo'q. Sarlavha esa qoladi — odam qayerga tushganini bilsin. */
  const broken = !valid || game.phase === 'error';

  return (
    <section className="oyin">
      <div className="wrap oyin__solo">
        {/* O'ynaladigan holatda sarlavha **siqiladi**.
            Yashirilgan so'zning nomini odam o'zi yozadi va u
            uch qatorli jumla bo'lishi mumkin — oddiy `h1`
            o'lchamida u butun birinchi ekranni egallab, taxtani
            ham, klaviaturani ham pastga surib yuborardi. Xato
            holatda esa taxta yo'q, ya'ni sarlavha to'liq
            o'lchamida qolaveradi. */}
        <div
          className={`section__head section__head--center${
            broken ? '' : ' section__head--tight'
          }`}
        >
          <span className="section__kicker">So‘zTop</span>
          <h1>{game.title || 'Yashirilgan so‘z'}</h1>
          {!broken && (
            <p className="section__lead">
              {/* Ism bosiladigan: havolani tashlagan odam ko'pincha
                  notanish bo'ladi va «bu kim?» degan savol o'sha
                  zahoti tug'iladi. Profil ochiq, ya'ni javob bir
                  bosishda.

                  Hisobi noma'lum bo'lsa (eski server javobida
                  `hostUid` yo'q) oddiy matn qoladi: hech qayerga
                  olib bormaydigan havola nosozlikka o'xshaydi. */}
              {game.host ? (
                <>
                  {game.hostUid ? (
                    <a className="link" href={playerLink(game.hostUid)}>
                      {game.host}
                    </a>
                  ) : (
                    game.host
                  )}
                  {' bitta so‘z yashirdi — uni oddiy o‘yindagidek toping: uzunlik + 1 urinish.'}
                </>
              ) : (
                'Do‘stingiz bitta so‘z yashirdi — uni oddiy o‘yindagidek toping: uzunlik + 1 urinish.'
              )}
            </p>
          )}
        </div>

        {!valid && (
          <div className="panel panel--call">
            <h3>Havoladagi kod to‘g‘ri emas</h3>
            <p className="panel__note">
              Kod — harf va raqamlardan iborat qisqa satr.
              Do‘stingizdan havolani qayta so‘rang — yoki shu yerda
              bugungi so‘zni o‘ynang.
            </p>
            <a className="btn btn--sm" href={links.play}>
              Bugungi so‘zni o‘ynash
            </a>
          </div>
        )}

        {/* Serverning izohi o'zbekcha va aniq: «Bunday kod topilmadi»,
            «Bu so'z yopilgan», «Bu so'zni o'zingiz yashirgansiz». */}
        {valid && game.phase === 'error' && (
          <div className="panel panel--call" role="alert">
            <h3>{game.error}</h3>
            <p className="panel__note">
              Havola eskirgan bo‘lishi mumkin: yashirilgan so‘z o‘ttiz kun
              turadi va egasi uni ertaroq ham yopishi mumkin.
            </p>
            <div className="result__actions">
              <button className="btn btn--sm btn--ghost" onClick={game.retry}>
                Qayta urinish
              </button>
              <a className="btn btn--sm" href={links.play}>
                Bugungi so‘zni o‘ynash
              </a>
            </div>
            <DownloadPromo />
          </div>
        )}

        {valid && game.phase === 'loading' && (
          <div className="play__wait" role="status">
            <div className="play__skeleton" aria-hidden="true">
              {Array.from({ length: game.length }, (_, i) => (
                <span key={i} />
              ))}
            </div>
            <p>So‘z ochilmoqda…</p>
          </div>
        )}

        {/* O'yin tugadi — taxta **yopiladi** va o'rnida natija turadi.
            Ilgari ikkalasi ustma-ust turardi: tugagan o'yinning to'ri
            hech narsa qo'shmaydi (odam uni endigina o'ynadi), lekin
            ekranning yarmini egallab, natijani pastga surib
            yuborardi — telefonda u ko'rinmay ham qolardi. */}
        {valid && over && (
          <div className="oyin__board">
            <Result
              won={game.phase === 'won'}
              attempts={game.attempts}
              guest={game.guest}
            />
          </div>
        )}

        {valid && !over && (game.phase === 'playing' || done) && (
          <div className="oyin__board oyin__board--fit">
            {/* Taxta, klaviatura va tepadagi qator bitta enni baham
                ko'radi — `Play` dagidek. */}
            <div
              className="play"
              style={
                { '--cols': game.length, '--rows': game.rows.length } as CSSProperties
              }
            >
              <div className="play__area">
                <Board
                  rows={game.rows}
                  length={game.length}
                  flipRow={game.flipRow}
                  shakeRow={game.shake ? game.activeRow : -1}
                  winRow={game.phase === 'won' ? game.activeRow - 1 : -1}
                  activeRow={done ? -1 : game.activeRow}
                />
                {game.message && (
                  <p className="play__msg" role="status">
                    {game.message}
                  </p>
                )}
              </div>

              <Keyboard
                keyState={game.keyState}
                onPress={game.press}
                cols={game.length}
                rows={game.rows.length}
              />
              <p className="game__hint">
                Kompyuter klaviaturasida ham yozing:{' '}
                <kbd data-script="off">s</kbd>+<kbd data-script="off">h</kbd> →
                SH, <kbd data-script="off">o</kbd>+
                <kbd data-script="off">'</kbd> → O‘
              </p>
            </div>
          </div>
        )}

        {/* Sahifaning oxiri — **teskari taklif**.
            Bu yerga odam do'stining havolasi orqali tushadi, ya'ni
            o'yinni endigina ko'rdi va eng tabiiy keyingi qadam —
            o'zi ham bitta so'z yashirib, havolani boshqasiga
            tashlash. Shusiz sahifa boshi berk ko'cha edi: o'yin
            tugaydi va hech qayerga olib bormaydi.

            Kod noto'g'ri bo'lsa chizilmaydi: u yerda o'z taklifi
            bor («Bugungi so'zni o'ynash») va ikkita yo'nalish
            odamni ikkiga bo'lardi. */}
        {valid && (
          <aside className="panel panel--call soztop__own">
            <h3>Siz ham so‘z yashiring</h3>
            <p className="panel__note">
              Lug‘atdan bitta so‘z tanlang va havolasini do‘stlaringizga
              tashlang. Ular xuddi shu sahifadagidek topadi, siz esa kim
              necha urinishda topganini ko‘rib turasiz.
            </p>
            <a className="btn btn--sm" href={links.soztop}>
              So‘z yashirish
            </a>
          </aside>
        )}
      </div>
    </section>
  );
}
