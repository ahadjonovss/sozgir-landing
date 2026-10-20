/** Sahifadagi haqiqiy o'yin: kunlik va cheksiz rejim.
 *
 *  Bu demo emas. So'z ilovadagi lug'atning o'zidan, kunlik so'z esa
 *  serverdan olinadi — ya'ni bugungi so'z telefondagisi bilan bir xil.
 *  Kirilgan bo'lsa natija reytingga tushadi; kirilmagan bo'lsa brauzerda
 *  qoladi va keyin kirilganda o'zi yoziladi.
 *
 *  Kunlik o'yin bir kunda bitta, cheksiz rejimda esa 4 dan 7 harfgacha
 *  xohlagancha o'ynaladi — ilovadagi qoidaning aynan o'zi. */
import { useEffect, useState, type CSSProperties } from 'react';
import { untilNextWord } from '../lib/daily';
import { useAuth } from '../lib/auth';
import { askAppPromo } from '../lib/appPromo';
import { countShare } from '../lib/badges';
import { LENGTHS, type Mode } from '../lib/modes';
import type { GameChoice } from '../lib/useGameChoice';
import type { Game } from '../lib/useSozTop';
import { puzzleKey, useHint } from '../lib/useHint';
import { pretty } from '../lib/uz';
import { Board, Keyboard } from './Board';
import GameAside from './GameAside';
import { Refresh } from './Icons';
import { Aqcha } from './Units';
import DownloadPromo from './DownloadPromo';
import ProposeWord from './ProposeWord';
import ReportWord from './ReportWord';
import { warmSounds } from '../lib/sounds';

/** Keyingi kunlik so'zgacha qolgan vaqt. */
function useCountdown(active: boolean): string {
  const [left, setLeft] = useState(() => untilNextWord());

  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => setLeft(untilNextWord()), 1000);
    return () => window.clearInterval(timer);
  }, [active]);

  const total = Math.max(0, Math.floor(left / 1000));
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
}

/** Yordamgacha qolgan vaqt — `m:ss`. */
function useHintCountdown(target: number | null): string {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (target === null) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [target]);

  if (target === null) return '';
  const total = Math.max(0, Math.ceil((target - now) / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/** Har yangi so'zda ichki holat (yordam sanog'i, oynalar) noldan boshlanadi:
 *  komponent so'z kaliti bilan qayta yaratiladi. */
export default function Play(props: {
  choice: GameChoice;
  game: Game;
  /** O'yin turini almashtirish — berilmasa belgi umuman chizilmaydi.
   *  Bosh sahifadagi taxtada (`Hero`) almashtiradigan narsa yo'q. */
  onSwap?: () => void;
}) {
  /** Tashlab ketilgan so'z — taxta ostida bir necha soniya turadi.
   *
   *  Holat **shu yerda**, kalitdan tashqarida: `PlayBoard` har yangi
   *  so'zda qaytadan o'rnashadi (`key={puzzleKey(...)}`), ya'ni uning
   *  ichidagi holat o'sha zahoti tozalanardi va aytilgan so'z umuman
   *  ko'rinmasdi. */
  const [skipped, setSkipped] = useState<string | null>(null);

  /* Bir necha soniyadan keyin ketadi: u yangi o'yinning ustida abadiy
     osilib turmasligi kerak. */
  useEffect(() => {
    if (!skipped) return;
    const timer = window.setTimeout(() => setSkipped(null), 4000);
    return () => window.clearTimeout(timer);
  }, [skipped]);

  return (
    <PlayBoard
      key={puzzleKey(props.game.puzzle)}
      {...props}
      skipped={skipped}
      onSkip={setSkipped}
    />
  );
}

function PlayBoard({
  choice,
  game,
  onSwap,
  skipped,
  onSkip,
}: {
  choice: GameChoice;
  game: Game;
  onSwap?: () => void;
  /** Oldingi so'z — tashlab ketilgan bo'lsa. */
  skipped: string | null;
  onSkip: (word: string | null) => void;
}) {
  const auth = useAuth();
  /* Ovoz fayllari taxta chiqishi bilan bo'sh vaqtda yuklanadi — shunda
     birinchi bosilgan harf ham ovozli bo'ladi (`lib/sounds.ts`). */
  useEffect(() => warmSounds(), []);
  const { mode, setMode, endlessLength, pickLength, length } = choice;
  const finished = game.phase === 'won' || game.phase === 'lost';
  /** O'yin shu yerda emas, ilovada o'ynalgan: taxminlar bizda yo'q,
   *  shuning uchun taxta ham, ulashish ham ko'rsatilmaydi. */
  const elsewhere = game.result?.elsewhere === true;
  const countdown = useCountdown(finished && mode === 'daily');
  const [copied, setCopied] = useState(false);
  /** Reyting oynasi. Telefonda jadval taxtadan ancha pastda qolardi —
   *  endi taxtaning o'zidan bir bosishda ochiladi. */
  /** Statistika oynasi. Ilovada bu alohida sahifa (Reyting bilan yonma-yon
   *  turadigan «Statistika» kartochkasi); saytda esa panel yon ustunda
   *  qolib ketardi — telefonda uni umuman ko'rmaslik mumkin edi. */
  /** Kunlik so'z uchun hisob kerak.
   *
   *  Kunlik o'yin — hamma uchun bitta so'z va u reytingga tushadi:
   *  natijasi saqlanmaydigan o'yinchi jadvalda ham yo'q, ya'ni kunlik
   *  o'yinning yarmi u uchun ishlamaydi. Cheksiz rejim esa hisobsiz
   *  ochiq qolaveradi — mashq uchun kirish talab qilishning ma'nosi
   *  yo'q va yangi mehmon aynan o'sha yerda o'yinni sinab ko'radi.
   *
   *  `ready` kutiladi: hisob holati aniqlanmaguncha to'siq
   *  ko'rsatilmaydi, aks holda kirgan odam ham bir lahza uni ko'rib
   *  qolardi. */
  const needsAccount = mode === 'daily' && auth.ready && !auth.account;

  const { stats } = game;
  const winRate = stats.played === 0 ? 0 : Math.round((stats.wins / stats.played) * 100);
  // Sanoq birinchi urinishdan keyin ketadi — `activeRow` yozib
  // bo'lingan qatorlar soni.
  const hint = useHint(game.puzzle, game.phase, game.activeRow);
  const hintLeft = useHintCountdown(hint.nextAt);

  /* O'yin tugadi — telefonda ilova taklif qilinadi. Aynan shu payt u
     eng o'rinli: odam o'yinni sinab ko'rdi va yoqqan-yoqmaganini
     allaqachon biladi. Qolgan qarorlar (qurilma telefonmi, bugun
     ko'rsatilganmi, endigina yopilganmi) `lib/appPromo.ts` da —
     o'yinning ishi «tugadi» deb aytishdan nariga o'tmaydi. */
  useEffect(() => {
    if (finished && !elsewhere) askAppPromo('result');
  }, [elsewhere, finished]);

  // Olingan yordam mukofot chegarasini tushiradi — natija yozilishidan
  // oldin o'yin holati buni bilishi kerak (`score.ts`).
  const { noteHint } = game;
  useEffect(() => {
    noteHint(hint.used);
  }, [hint.used, noteHint]);

  async function share() {
    const text = game.shareText();
    try {
      if (navigator.share) {
        await navigator.share({ text });
        // «Jarchi» nishoni uchun sanoq: ulashish hech qayerda
        // saqlanmasdi (`lib/badges.ts`). Bekor qilingan ulashish
        // sanalmaydi — u `catch` ga tushadi.
        countShare();
        return;
      }
      await navigator.clipboard.writeText(text);
      countShare();
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ulashish bekor qilindi yoki brauzer ruxsat bermadi — jim o'tamiz.
    }
  }

  return (
    // Ustunning o'lchami shu yerda e'lon qilinadi: taxta, klaviatura va
    // tepadagi qator **bitta** enni baham ko'radi (`--board-w`,
    // `landing.css`). Ilgari har biri o'zicha kengayardi va ekranda
    // uch xil kenglikdagi uch blok turardi.
    <div
      className="play"
      style={
        {
          '--cols': game.puzzle?.length ?? length,
          '--rows': game.rows.length,
        } as CSSProperties
      }
    >
      {/* Yon ustunlar taxtaning **ichida** e'lon qilinadi, lekin
          oqimdan tashqarida chiziladi (`position: absolute`): shunda
          ular taxtaning o'z chetlaridan hisoblanadi va markaz
          qimirlamaydi. Keng ekrandan boshqa joyda CSS ularni umuman
          ko'rsatmaydi.

          Joriy o'yin rejimga qarab aytiladi: cheksiz rejimda odam
          aynan «Cheksiz» ni o'ynab turibdi, ya'ni unga So'ztopning
          kunlik so'zi taklif qilinadi va teskarisi. */}
      <GameAside current={mode === 'endless' ? 'cheksiz' : 'soztop'} />

      <div className="play__top">
        {/* O'yin raqami qatorning eng chapida — taxtaning chap cheti
            ustida. Ilgari u o'ng guruhda, statistika va yordam bilan
            yonma-yon turardi: o'zgarmaydigan, faqat o'qiladigan son
            bosiladigan tugmalar orasida qolib ketardi. Endi u rejim
            tugmalari bilan bitta guruhda — ikkalasi ham «bu qaysi
            o'yin» degan savolga javob beradi. */}
        <div className="play__top-left">
          <span className="phone__live">
            <i />
            {game.puzzle
              ? mode === 'daily'
                ? `№${game.puzzle.number}`
                : `${game.puzzle.number}-o‘yin`
              : 'jonli'}
          </span>
          <div className="play__modes" role="tablist" aria-label="O‘yin rejimi">
            {(['daily', 'endless'] as Mode[]).map((item) => (
              <button
                key={item}
                role="tab"
                aria-selected={mode === item}
                className={`play__mode${mode === item ? ' play__mode--on' : ''}`}
                onClick={() => setMode(item)}
              >
                {item === 'daily' ? 'Kunlik' : 'Cheksiz'}
              </button>
            ))}
          </div>
        </div>
        <div className="play__top-right">
          {/* O'ng chekkadagi tartib: o'yin turi, boshqa so'z, yordam.
              Almashtirgich birinchi — u o'yinning o'zini tanlaydi,
              qolgan ikkitasi esa tanlangan o'yin ichidagi amal.

              Reyting ham, statistika ham bu qatordan olindi: ikkalasi
              ham taxtaning ostida, o'z kartochkasida turibdi
              (`StatsPanel`, `/oynash`). Taxta ustidagi qator esa
              o'ynayotgan odamga kerak bo'ladigan narsalar uchun —
              o'yin tugagach qaraladigan sonlar uchun emas. */}
          {/* O'yin turini almashtirish. Hech qayerga o'tilmaydi:
              manzil ham, sahifa ham o'sha-o'sha qoladi, faqat shu
              belgining ostidagi taxta g'unchaga almashadi. Ilgari bu
              havola edi va bosilganda manzil o'zgarib, boshqa sahifa
              ochilgandek bo'lardi.

              Belgi emoji: `gameLinks` kartochkalarida ham o'sha
              turadi, ya'ni odam uni allaqachon ko'rgan. */}
          {onSwap && (
            <button
              type="button"
              className="play__ranks play__swap"
              onClick={onSwap}
              aria-label="G‘unchaga almashtirish"
              title="G‘unchaga almashtirish"
            >
              <span aria-hidden="true">🌸</span>
            </button>
          )}
          {/* Boshqa so'zga o'tish — oddiy yangilash belgisi.
              Faqat cheksiz rejimda: kunlik so'z butun mamlakat uchun
              bitta va uni almashtirib bo'lmaydi. Bosilganda tashlab
              ketilgan so'z taxta ostida aytiladi. */}
          {mode === 'endless' && game.phase === 'playing' && (
            <button
              type="button"
              className="play__ranks"
              onClick={() => {
                onSkip(game.answerWord || null);
                game.playAgain();
              }}
              aria-label="Boshqa so‘z"
              title="Boshqa so‘z"
            >
              <Refresh size={18} />
            </button>
          )}
          {/* Yordam: o'ylash cho'zilganda o'zi paydo bo'ladi, undan oldin
              qancha qolgani sanab turiladi — ilovadagi `_HintIndicator`. */}
          {hint.ready ? (
            <button
              type="button"
              className="play__hint play__hint--ready"
              onClick={hint.reveal}
              title="Yordam olish"
            >
              💡 Yordam
            </button>
          ) : hint.nextAt !== null ? (
            <span className="play__hint" title="Yordam shuncha vaqtdan keyin ochiladi">
              💡 {hintLeft}
            </span>
          ) : null}
        </div>
      </div>

      {mode === 'endless' && (
        <div className="play__lengths" aria-label="So‘z uzunligi">
          {LENGTHS.map((item) => (
            <button
              key={item}
              className={`chip${endlessLength === item ? ' chip--on' : ''}`}
              onClick={() => pickLength(item)}
            >
              {item} harf
            </button>
          ))}
        </div>
      )}

      {!needsAccount && game.phase === 'loading' && (
        <div className="play__wait" role="status">
          <div className="play__skeleton" aria-hidden="true">
            {Array.from({ length }, (_, i) => (
              <span key={i} />
            ))}
          </div>
          <p>Lug‘at yuklanmoqda…</p>
        </div>
      )}

      {!needsAccount && game.phase === 'error' && (
        <div className="play__wait play__wait--err" role="alert">
          <p>Lug‘atni yuklab bo‘lmadi. Internet aloqasini tekshiring.</p>
          <button className="btn btn--sm" onClick={game.retry}>
            Qayta urinish
          </button>
        </div>
      )}

      {hint.line && (
        <p className="play__hintline" role="status">
          {pretty(hint.line)}
        </p>
      )}

      {needsAccount && (
        <div className="gate" role="status">
          <span className="gate__icon" aria-hidden="true">🔒</span>
          <h3>Kunlik so‘z uchun hisob kerak</h3>
          <p>
            Kunlik so‘z butun O‘zbekiston uchun bitta va natija reytingga
            tushadi — shuning uchun u hisobga bog‘lanadi. Kirish bir daqiqa
            oladi, natijalaringiz esa saqlanadi va boshqa qurilmadan ham
            ko‘rinadi.
          </p>
          <div className="result__actions">
            <button className="btn btn--sm" onClick={() => auth.openPrompt('signIn')}>
              Kirish
            </button>
            <button
              className="btn btn--sm btn--ghost"
              onClick={() => auth.openPrompt('register')}
            >
              Hisob ochish
            </button>
          </div>
          {/* Hisobsiz ham o'ynash yo'li ochiq qoladi: «bo'lmaydi» deb
              qo'yib yuborishning o'rniga darrov o'ynaydigan rejim
              taklif qilinadi. */}
          <button className="link gate__skip" onClick={() => setMode('endless')}>
            Hisobsiz cheksiz rejimda o‘ynash →
          </button>
        </div>
      )}

      {!needsAccount && game.puzzle && game.phase !== 'loading' && game.phase !== 'error' && (
        <>
          {!elsewhere && (
            <div className="play__area">
              <Board
                rows={game.rows}
                length={game.puzzle.length}
                flipRow={game.flipRow}
                shakeRow={game.shake ? game.activeRow : -1}
                /* Topilgan qator ochilib bo'lgach sakraydi — natija
                   kartochkasi chiqishidan oldin taxtaning o'zi
                   quvonadi. */
                winRow={game.phase === 'won' ? game.activeRow - 1 : -1}
                activeRow={game.phase === 'playing' ? game.activeRow : -1}
              />
              {game.message && (
                <p className="play__msg" role="status">
                  {game.message}
                </p>
              )}
              {!game.message && skipped && (
                <p className="play__msg play__msg--skip" role="status">
                  Oldingi so‘z: <b data-script="word">{skipped}</b>
                </p>
              )}
            </div>
          )}

          {finished ? (
            <div className={`result result--${game.phase}`} role="status">
              <p className="result__title">
                {elsewhere
                  ? 'Bugungi so‘z allaqachon o‘ynalgan'
                  : game.phase === 'won'
                    ? `Topdingiz — ${game.result?.attempts ?? game.activeRow} urinishda!`
                    : 'Urinishlar tugadi'}
              </p>
              {elsewhere && (
                <p className="result__where">
                  Ilovada yoki boshqa qurilmada —{' '}
                  {game.phase === 'won'
                    ? `${game.result?.attempts} urinishda topgansiz`
                    : 'topa olmagansiz'}
                  .
                </p>
              )}
              <p className="result__word" data-script="word">{game.answerWord}</p>
              {game.puzzle.description && (
                <p className="result__def">{pretty(game.puzzle.description)}</p>
              )}

              {game.result && game.result.points > 0 && (
                <p className="result__points">
                  <Aqcha value={game.result.points} size="lg" sign />
                </p>
              )}

              <div className="result__actions">
                {mode === 'endless' && (
                  <button className="btn btn--sm" onClick={game.playAgain}>
                    Yana bir so‘z
                  </button>
                )}
                {/* Ulashishda taxminlar to'ri bo'ladi — ilovada o'ynalgan
                    o'yinda u bizda yo'q. */}
                {!elsewhere && (
                  <button
                    className={`btn btn--sm${mode === 'endless' ? ' btn--ghost' : ''}`}
                    onClick={share}
                  >
                    {copied ? 'Nusxa olindi' : 'Ulashish'}
                  </button>
                )}
                {elsewhere && (
                  <button className="btn btn--sm" onClick={() => setMode('endless')}>
                    Cheksiz rejimda mashq qilish
                  </button>
                )}
                {mode === 'daily' && !elsewhere && auth.account && (
                  <a className="btn btn--sm btn--ghost" href="#yuklab-olish">
                    Ilovada davom etish
                  </a>
                )}
              </div>

              {/* Kirish holati renderda o'qiladi: natija oynasi ochiq
                  turganda ham kirish mumkin, xabar shu zahoti ketishi
                  kerak. */}
              {game.result && !auth.account && (
                <p className="result__save">
                  Natija faqat shu brauzerda saqlandi.{' '}
                  <button className="link" onClick={() => auth.openPrompt('signIn')}>
                    Kirsangiz reytingga tushadi
                  </button>
                  .
                </p>
              )}

              {mode === 'daily' && (
                <p className="result__next">
                  Keyingi so‘zgacha <strong>{countdown}</strong>
                </p>
              )}

              {/* Mehmon uchun har o'yin tugagach: ilova natijani saqlaydi. */}
              {!auth.account && <DownloadPromo />}

              <div className="result__links">
                <ReportWord word={game.puzzle.answer} length={game.puzzle.length} mode={mode} />
                {/* Yonida — teskarisi: lug'atda yo'q, lekin bo'lishi
                    kerak deb hisoblangan so'z. */}
                <ProposeWord />
              </div>
            </div>
          ) : (
            <Keyboard
              keyState={game.keyState}
              onPress={game.press}
              cols={game.puzzle.length}
              rows={game.rows.length}
            />
          )}

          {stats.played > 0 && (
            <ul className="play__stats">
              <li>
                <strong>{stats.played}</strong>
                <span>O‘yin</span>
              </li>
              <li>
                <strong>{winRate}%</strong>
                <span>G‘alaba</span>
              </li>
              <li>
                <strong>{stats.currentStreak}</strong>
                <span>Ketma-ket</span>
              </li>
            </ul>
          )}

          <p className="game__hint">
            {/* Tugmalar fizik klaviaturada nima bosilishini ko'rsatadi —
                ular hech qachon ko'chirilmaydi; natija (`SH`, `O‘`) esa
                tanlangan alifboda yoziladi. */}
            Kompyuter klaviaturasida ham yozing: <kbd data-script="off">s</kbd>+
            <kbd data-script="off">h</kbd> → SH, <kbd data-script="off">o</kbd>+
            <kbd data-script="off">'</kbd> → O‘
          </p>
        </>
      )}
    </div>
  );
}
