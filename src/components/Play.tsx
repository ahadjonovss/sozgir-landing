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
import { useAuth } from '../lib/auth';
import { DAILY_LENGTH, DEFAULT_LENGTH, LENGTHS, type Mode } from '../lib/modes';
import { useSozTop } from '../lib/useSozTop';
import { pretty } from '../lib/uz';
import { Board, Keyboard } from './Board';

const LENGTH_KEY = 'sozgir.length';

function storedLength(): number {
  try {
    const raw = Number(localStorage.getItem(LENGTH_KEY));
    return LENGTHS.includes(raw as (typeof LENGTHS)[number]) ? raw : DEFAULT_LENGTH;
  } catch {
    return DEFAULT_LENGTH;
  }
}

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

export default function Play() {
  const auth = useAuth();
  const [mode, setMode] = useState<Mode>('daily');
  const [endlessLength, setEndlessLength] = useState(storedLength);
  const length = mode === 'daily' ? DAILY_LENGTH : endlessLength;

  const game = useSozTop({ mode, length });
  const finished = game.phase === 'won' || game.phase === 'lost';
  const countdown = useCountdown(finished && mode === 'daily');
  const [copied, setCopied] = useState(false);

  const { stats } = game;
  const winRate = stats.played === 0 ? 0 : Math.round((stats.wins / stats.played) * 100);

  function pickLength(next: number) {
    setEndlessLength(next);
    try {
      localStorage.setItem(LENGTH_KEY, String(next));
    } catch {
      // Tanlov saqlanmasa — keyingi tashrifda standart uzunlik bo'ladi.
    }
  }

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
        <span className="phone__live">
          <i />
          {game.puzzle
            ? mode === 'daily'
              ? `№${game.puzzle.number}`
              : `${game.puzzle.number}-o‘yin`
            : 'jonli'}
        </span>
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

      {game.puzzle && game.phase !== 'loading' && game.phase !== 'error' && (
        <>
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

          {finished ? (
            <div className={`result result--${game.phase}`} role="status">
              <p className="result__title">
                {game.phase === 'won'
                  ? `Topdingiz — ${game.activeRow} urinishda!`
                  : 'Urinishlar tugadi'}
              </p>
              <p className="result__word">{game.answerWord}</p>
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
                <button
                  className={`btn btn--sm${mode === 'endless' ? ' btn--ghost' : ''}`}
                  onClick={share}
                >
                  {copied ? 'Nusxa olindi' : 'Ulashish'}
                </button>
                {mode === 'daily' && (
                  <a className="btn btn--sm btn--ghost" href="#yuklab-olish">
                    Ilovada davom etish
                  </a>
                )}
              </div>

              {game.result && !game.result.saved && (
                <p className="result__save">
                  Natija faqat shu brauzerda saqlandi.{' '}
                  <button className="link" onClick={() => auth.openPrompt('guest')}>
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
            Kompyuter klaviaturasida ham yozing: <kbd>s</kbd>+<kbd>h</kbd> → SH,{' '}
            <kbd>o</kbd>+<kbd>'</kbd> → O‘
          </p>
        </>
      )}
    </div>
  );
}
