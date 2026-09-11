/** Sahifadagi haqiqiy o'yin: kunlik va cheksiz rejim.
 *
 *  Bu demo emas. So'z ilovadagi lug'atning o'zidan, kunlik so'z esa
 *  serverdan olinadi — ya'ni bugungi so'z telefondagisi bilan bir xil.
 *  Kirilgan bo'lsa natija reytingga tushadi; kirilmagan bo'lsa brauzerda
 *  qoladi va keyin kirilganda o'zi yoziladi.
 *
 *  Kunlik o'yin bir kunda bitta, cheksiz rejimda esa 4 dan 7 harfgacha
 *  xohlagancha o'ynaladi — ilovadagi qoidaning aynan o'zi. */
import { useEffect, useState } from 'react';
import { untilNextWord } from '../lib/daily';
import { GUEST_GAME_LIMIT } from '../lib/progress';
import { useAuth } from '../lib/auth';
import { LENGTHS, type Mode } from '../lib/modes';
import type { GameChoice } from '../lib/useGameChoice';
import type { Game } from '../lib/useSozTop';
import { puzzleKey, useHint } from '../lib/useHint';
import { pretty } from '../lib/uz';
import { Board, Keyboard } from './Board';
import DownloadPromo from './DownloadPromo';
import Leaderboard from './Leaderboard';
import Modal from './Modal';
import ReportWord from './ReportWord';

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
export default function Play(props: { choice: GameChoice; game: Game }) {
  return <PlayBoard key={puzzleKey(props.game.puzzle)} {...props} />;
}

function PlayBoard({ choice, game }: { choice: GameChoice; game: Game }) {
  const auth = useAuth();
  const { mode, setMode, endlessLength, pickLength, length } = choice;
  const finished = game.phase === 'won' || game.phase === 'lost';
  /** O'yin shu yerda emas, ilovada o'ynalgan: taxminlar bizda yo'q,
   *  shuning uchun taxta ham, ulashish ham ko'rsatilmaydi. */
  const elsewhere = game.result?.elsewhere === true;
  const countdown = useCountdown(finished && mode === 'daily');
  const [copied, setCopied] = useState(false);
  /** Reyting oynasi. Telefonda jadval taxtadan ancha pastda qolardi —
   *  endi taxtaning o'zidan bir bosishda ochiladi. */
  const [ranksOpen, setRanksOpen] = useState(false);
  /** Mehmon chegarasi oynasi — taxta yopilganda bir marta ochiladi,
   *  yopilsa ostidagi panel qoladi. */
  const [gateOpen, setGateOpen] = useState(true);

  const { stats } = game;
  const winRate = stats.played === 0 ? 0 : Math.round((stats.wins / stats.played) * 100);
  const hint = useHint(game.puzzle, game.phase);
  const hintLeft = useHintCountdown(hint.nextAt);

  async function share() {
    const text = game.shareText();
    try {
      if (navigator.share) {
        await navigator.share({ text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ulashish bekor qilindi yoki brauzer ruxsat bermadi — jim o'tamiz.
    }
  }

  return (
    <div className="play">
      <div className="play__top">
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
        <div className="play__top-right">
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
          <span className="phone__live">
            <i />
            {game.puzzle
              ? mode === 'daily'
                ? `№${game.puzzle.number}`
                : `${game.puzzle.number}-o‘yin`
              : 'jonli'}
          </span>
          <button
            type="button"
            className="play__ranks"
            onClick={() => setRanksOpen(true)}
            aria-label="Reyting"
            title="Reyting"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path
                fill="currentColor"
                d="M18 4h2a1 1 0 0 1 1 1v2a4 4 0 0 1-3.6 3.98A6 6 0 0 1 13 14.92V18h3a1 1 0 1 1 0 2H8a1 1 0 1 1 0-2h3v-3.08a6 6 0 0 1-4.4-3.94A4 4 0 0 1 3 7V5a1 1 0 0 1 1-1h2V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1ZM6 6H5v1a2 2 0 0 0 1 1.73V6Zm12 2.73A2 2 0 0 0 19 7V6h-1v2.73Z"
              />
            </svg>
          </button>
        </div>
      </div>

      {ranksOpen && (
        <Modal title="Reyting" onClose={() => setRanksOpen(false)}>
          <Leaderboard />
        </Modal>
      )}

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

      {game.phase === 'loading' && (
        <div className="play__wait" role="status">
          <div className="play__skeleton" aria-hidden="true">
            {Array.from({ length }, (_, i) => (
              <span key={i} />
            ))}
          </div>
          <p>Lug‘at yuklanmoqda…</p>
        </div>
      )}

      {game.phase === 'error' && (
        <div className="play__wait play__wait--err" role="alert">
          <p>Lug‘atni yuklab bo‘lmadi. Internet aloqasini tekshiring.</p>
          <button className="btn btn--sm" onClick={game.retry}>
            Qayta urinish
          </button>
        </div>
      )}

      {hint.line && !game.locked && (
        <p className="play__hintline" role="status">
          {pretty(hint.line)}
        </p>
      )}

      {game.locked && (
        <>
          <div className="gate" role="status">
            <span className="gate__icon" aria-hidden="true">🔒</span>
            <h3>Iltimos, kiring</h3>
            <p>
              Hisobsiz {GUEST_GAME_LIMIT} ta o‘yin o‘ynadingiz. Davom etish
              uchun kiring — natijalaringiz saqlanadi va reytingga tushadi.
            </p>
            <div className="result__actions">
              <button className="btn btn--sm" onClick={() => auth.openPrompt('signIn')}>
                Kirish
              </button>
              <button className="btn btn--sm btn--ghost" onClick={() => auth.openPrompt('register')}>
                Hisob ochish
              </button>
            </div>
          </div>
          {gateOpen && (
            <Modal
              title="Iltimos, kiring"
              lead={`Hisobsiz ${GUEST_GAME_LIMIT} ta o‘yin o‘ynadingiz. Keyingisi uchun kirish kerak — natijalaringiz saqlanadi va boshqa qurilmadan ham ko‘rinadi.`}
              onClose={() => setGateOpen(false)}
            >
              <div className="form">
                <button
                  className="btn"
                  onClick={() => {
                    setGateOpen(false);
                    auth.openPrompt('signIn');
                  }}
                >
                  Kirish
                </button>
                <button
                  className="btn btn--ghost"
                  onClick={() => {
                    setGateOpen(false);
                    auth.openPrompt('register');
                  }}
                >
                  Hisob ochish
                </button>
              </div>
            </Modal>
          )}
        </>
      )}

      {game.puzzle && game.phase !== 'loading' && game.phase !== 'error' && !game.locked && (
        <>
          {!elsewhere && (
            <div className="play__area">
              <Board
                rows={game.rows}
                length={game.puzzle.length}
                flipRow={game.flipRow}
                shakeRow={game.shake ? game.activeRow : -1}
              />
              {game.message && (
                <p className="play__msg" role="status">
                  {game.message}
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
                <p className="result__points">+{game.result.points} ball</p>
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

              <ReportWord word={game.puzzle.answer} length={game.puzzle.length} mode={mode} />
            </div>
          ) : (
            <Keyboard keyState={game.keyState} onPress={game.press} />
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
