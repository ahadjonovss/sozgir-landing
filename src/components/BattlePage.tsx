/** So'zjang sahifasi — `/sozjang`.
 *
 *  Ikki rejim: do'stga chaqiruv (kod bilan) va tezkor jang (tasodifiy
 *  raqib). Ikkalasi ham hisob talab qiladi — raqib kim bilan
 *  o'ynayotganini bilishi kerak va natija reytingga yoziladi.
 *
 *  Saytda yaratilgan chaqiruvga telefondan qo'shilish mumkin va aksincha:
 *  jang bir xil hujjatlarda, bir xil server funksiyalari orqali ketadi. */
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../lib/auth';
import { inviteLink, verdictsOf } from '../lib/battle';
import { LENGTHS } from '../lib/modes';
import { useSozjang, type Sozjang } from '../lib/useSozjang';
import { display, pretty } from '../lib/uz';
import { Board, Keyboard } from './Board';
import OpponentBoard from './OpponentBoard';

/** Havoladagi `?kod=ABC123` — chaqiruvni bosib kelgan odam uchun. */
function codeFromUrl(): string {
  const value = new URLSearchParams(window.location.search).get('kod') ?? '';
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
}

function Gate() {
  const { openPrompt } = useAuth();
  return (
    <div className="panel panel--call">
      <h3>So‘zjang uchun hisob kerak</h3>
      <p className="panel__note">
        Jangda raqib sizning taxallusingizni ko‘radi va natija reytingga
        yoziladi — shuning uchun bu rejim hisobsiz ishlamaydi. So‘ztopni
        esa kirmasdan ham o‘ynash mumkin.
      </p>
      <div className="result__actions">
        <button className="btn btn--sm" onClick={() => openPrompt('signIn')}>
          Kirish
        </button>
        <button
          className="btn btn--sm btn--ghost"
          onClick={() => openPrompt('register')}
        >
          Hisob ochish
        </button>
      </div>
    </div>
  );
}

function Lengths({ game }: { game: Sozjang }) {
  return (
    <div className="play__lengths" aria-label="So‘z uzunligi">
      {LENGTHS.map((item) => (
        <button
          key={item}
          className={`chip${game.length === item ? ' chip--on' : ''}`}
          onClick={() => game.pickLength(item)}
          disabled={game.busy}
        >
          {item} harf
        </button>
      ))}
    </div>
  );
}

function Lobby({ game }: { game: Sozjang }) {
  const [code, setCode] = useState(codeFromUrl);
  const joined = useRef(false);

  // Havoladagi kod bilan o'zi qo'shiladi — odam kodni terib o'tirmasin.
  // Keyin manzil tozalanadi: sahifa yangilanganda qayta urinilmaydi.
  useEffect(() => {
    if (joined.current || code.length !== 6) return;
    joined.current = true;
    void game.join(code);
    window.history.replaceState(null, '', '/sozjang');
  }, [code, game]);

  return (
    <>
      <div className="panel">
        <div className="panel__head">
          <h3>Do‘st bilan</h3>
        </div>
        <p className="panel__note">
          Chaqiruv yarating — 6 belgili kod va havola chiqadi. Do‘stingiz
          shu kod bilan qo‘shiladi, ikkalangizga bir xil so‘z beriladi.
        </p>
        <Lengths game={game} />
        <button className="btn" onClick={game.create} disabled={game.busy}>
          {game.busy ? 'Yaratilmoqda…' : 'Chaqiruv yaratish'}
        </button>

        <p className="panel__label">Kod bilan qo‘shilish</p>
        <form
          className="join"
          onSubmit={(event) => {
            event.preventDefault();
            if (code.trim().length === 6) void game.join(code);
          }}
        >
          <input
            className="join__code"
            value={code}
            onChange={(event) =>
              setCode(
                event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6),
              )
            }
            placeholder="ABC123"
            inputMode="text"
            autoCapitalize="characters"
            spellCheck={false}
            aria-label="Chaqiruv kodi"
          />
          <button
            className="btn btn--ghost"
            disabled={game.busy || code.trim().length !== 6}
          >
            Qo‘shilish
          </button>
        </form>
      </div>

      <div className="panel">
        <div className="panel__head">
          <h3>Tezkor jang</h3>
        </div>
        <p className="panel__note">
          Tizim reytingi yaqin raqibni topadi. Raqibning kataklari harfsiz —
          faqat ranglar ko‘rinadi, ya‘ni kim qancha yaqinlashgani bilinadi,
          javob esa oshkor bo‘lmaydi.
        </p>
        <Lengths game={game} />
        <button className="btn" onClick={game.quick} disabled={game.busy}>
          {game.busy ? 'Qidirilmoqda…' : 'Raqib qidirish'}
        </button>
      </div>
    </>
  );
}

function Searching({ game }: { game: Sozjang }) {
  return (
    <div className="panel">
      <div className="panel__head">
        <h3>Raqib qidirilmoqda</h3>
        <span className="panel__tag">{game.seconds} s</span>
      </div>
      <div className="radar" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <p className="panel__note">
        Navbatdasiz. Kimdir shu uzunlikda jang izlasa, darhol
        juftlashtirasiz. Hozircha kam o‘yinchi bo‘lsa, do‘stingizni
        chaqiruv kodi bilan taklif qilish tezroq.
      </p>
      <button className="btn btn--sm btn--outline" onClick={game.cancelSearch}>
        Bekor qilish
      </button>
    </div>
  );
}

function Waiting({ game }: { game: Sozjang }) {
  const [copied, setCopied] = useState(false);
  const code = game.code ?? '';

  async function share() {
    const text = `So‘zgir'da menga qarshi jangga chiqing! Kod: ${code}\n\n${inviteLink(code)}`;
    try {
      if (navigator.share) {
        await navigator.share({ text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ulashish bekor qilindi — jim o'tamiz.
    }
  }

  return (
    <div className="panel">
      <div className="panel__head">
        <h3>Chaqiruv tayyor</h3>
        <span className="panel__tag">{game.boardLength} harf</span>
      </div>

      <div className="code" aria-label="Chaqiruv kodi">
        {[...code].map((char, index) => (
          <span key={index}>{char}</span>
        ))}
      </div>

      <p className="panel__note">
        Do‘stingiz shu kodni kiritsa jang boshlanadi. Havolani yuborsangiz,
        u kodni terib ham o‘tirmaydi.
      </p>

      <div className="result__actions">
        <button className="btn btn--sm" onClick={share}>
          {copied ? 'Nusxa olindi' : 'Havolani ulashish'}
        </button>
        <button className="btn btn--sm btn--outline" onClick={game.leave}>
          Bekor qilish
        </button>
      </div>
    </div>
  );
}

function Playing({ game }: { game: Sozjang }) {
  const opponentRows = (game.opponent?.rows ?? []).map(verdictsOf);

  return (
    <div className="fight">
      <div className="fight__side">
        <div className="fight__who">
          <strong>Siz</strong>
          <span>{game.me?.attempts ?? 0} urinish</span>
        </div>
        <div className="play__area">
          <Board
            rows={game.rows}
            length={game.boardLength}
            flipRow={-1}
            shakeRow={-1}
          />
          {game.message && (
            <p className="play__msg" role="status">
              {game.message}
            </p>
          )}
        </div>
      </div>

      <div className="fight__side fight__side--foe">
        <div className="fight__who">
          <strong>{pretty(game.opponent?.nickname ?? 'Raqib')}</strong>
          <span>
            {game.opponent?.finished
              ? 'tugatdi'
              : `${game.opponent?.attempts ?? 0} urinish`}
          </span>
        </div>
        <OpponentBoard
          rows={opponentRows}
          length={game.boardLength}
          maxAttempts={game.maxAttempts}
        />
      </div>
    </div>
  );
}

function Result({ game }: { game: Sozjang }) {
  const { account } = game;
  const winner = game.battle?.winnerUid;
  const mine = winner && account && winner === account.uid;
  const draw = !winner;
  const opponentRows = (game.opponent?.rows ?? []).map(verdictsOf);

  return (
    <>
      <div
        className={`result result--${mine ? 'won' : draw ? 'lost' : 'lost'}`}
        role="status"
      >
        <p className="result__title">
          {game.battle?.status === 'expired'
            ? 'Chaqiruv muddati o‘tdi'
            : mine
              ? 'Yutdingiz!'
              : draw
                ? 'Durang'
                : 'Bu safar raqib tezroq bo‘ldi'}
        </p>
        {game.battle?.answer && (
          <p className="result__word">{display(game.battle.answer)}</p>
        )}
        <p className="result__where">
          Siz — {game.me?.attempts ?? 0} urinish, {game.me?.score ?? 0} ball ·{' '}
          {pretty(game.opponent?.nickname ?? 'Raqib')} —{' '}
          {game.opponent?.attempts ?? 0} urinish, {game.opponent?.score ?? 0} ball
        </p>
        <div className="result__actions">
          <button className="btn btn--sm" onClick={game.leave}>
            Yangi jang
          </button>
        </div>
      </div>

      <div className="fight fight--done">
        <div className="fight__side">
          <div className="fight__who">
            <strong>Siz</strong>
          </div>
          <OpponentBoard
            rows={(game.me?.rows ?? []).map(verdictsOf)}
            words={game.me?.words ?? game.words}
            length={game.boardLength}
            maxAttempts={game.maxAttempts}
          />
        </div>
        <div className="fight__side">
          <div className="fight__who">
            <strong>{pretty(game.opponent?.nickname ?? 'Raqib')}</strong>
          </div>
          <OpponentBoard
            rows={opponentRows}
            words={game.opponent?.words}
            length={game.boardLength}
            maxAttempts={game.maxAttempts}
          />
        </div>
      </div>
    </>
  );
}

export default function BattlePage() {
  const game = useSozjang();

  return (
    <section className="oyin">
      <div className="wrap oyin__head">
        <span className="section__kicker">So‘zjang</span>
        <h1>Bir so‘z, ikki o‘yinchi</h1>
        <p className="section__lead">
          Do‘stingizni kod bilan chaqiring yoki tasodifiy raqib bilan
          bellashing. Kim kamroq urinishda topsa — o‘sha yutadi.
        </p>
      </div>

      <div className="wrap jang">
        {!game.account ? (
          <Gate />
        ) : (
          <>
            {game.error && (
              <p className="form__err" role="alert">
                {game.error}
              </p>
            )}

            {game.phase === 'lobby' && <Lobby game={game} />}
            {game.phase === 'searching' && <Searching game={game} />}
            {game.phase === 'waiting' && <Waiting game={game} />}
            {game.phase === 'playing' && (
              <>
                <Playing game={game} />
                {game.me?.finished ? (
                  <p className="panel__note jang__wait">
                    Siz tugatdingiz — raqib o‘ynab bo‘lishini kutamiz.
                  </p>
                ) : (
                  <Keyboard keyState={game.keyState} onPress={game.press} />
                )}
                <div className="jang__foot">
                  <button className="link" onClick={game.leave}>
                    Jangdan chiqish
                  </button>
                </div>
              </>
            )}
            {game.phase === 'finished' && <Result game={game} />}
          </>
        )}
      </div>
    </section>
  );
}
