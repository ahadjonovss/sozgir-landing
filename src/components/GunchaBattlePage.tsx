/** G'uncha jangi — `/gunchajang`.
 *
 *  Ikkalangizga bir xil g'uncha beriladi, uch daqiqa vaqt bo'ladi va kim
 *  ko'p ball yig'sa — o'sha yutadi. Jang ekrani yakka g'unchadan **shakl
 *  jihatidan farq qilmaydi**: o'sha gul, o'sha tugmalar, faqat tepasiga
 *  taymer va raqib qatori qo'shiladi — o'rganish qaytadan boshlanmasin.
 *
 *  Jang saytda ham, ilovada ham bir xil hujjatlar va bir xil funksiyalar
 *  orqali ketadi: telefondagi do'stni kod bilan chaqirsa bo'ladi. */
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { links } from '../data/site';
import { useAuth } from '../lib/auth';
import { inviteLink } from '../lib/battle';
import { useGunchaJang, type GunchaJang } from '../lib/useGunchaJang';
import { GUNCHA_SECONDS } from '../lib/gunchaBattle';
import { display, pretty } from '../lib/uz';
import ArenaHistory from './ArenaHistory';
import Avatar from './Avatar';
import CodeInput from './CodeInput';
import GunchaFlower from './GunchaFlower';
import { Check, Copy, Swords, Users } from './Icons';
import Modal from './Modal';
import { ReactionBurst, ReactionPicker } from './Reactions';
import SendInvite, { type InviteTarget } from './SendInvite';
import TelegramBanner from './TelegramBanner';

/** Oxirgi soniyalarda rang ogohlantiruvchiga o'tadi. */
const URGENT_AT = 30;

/** Havoladagi `?kod=ABC123` — chaqiruvni bosib kelgan odam uchun. */
function codeFromUrl(): string {
  const value = new URLSearchParams(window.location.search).get('kod') ?? '';
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
}

const clock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.max(0, seconds % 60)).padStart(2, '0')}`;

export default function GunchaBattlePage() {
  const game = useGunchaJang();
  const { account, openPrompt } = useAuth();

  if (!account) {
    return (
      <section className="oyin">
        <div className="wrap">
          <div className="panel panel--call">
            <h3>Jang uchun hisob kerak</h3>
            <p className="panel__note">
              Raqibingiz taxallusingizni ko‘radi va natija reytingga
              yoziladi — shuning uchun g‘uncha jangi hisobsiz o‘ynalmaydi.
            </p>
            <button className="btn btn--sm" onClick={() => openPrompt('signIn')}>
              Kirish
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="oyin">
      <div className="wrap">
        {game.error && (
          <p className="form__err" onClick={game.clearError}>
            {game.error}
          </p>
        )}
        {game.phase === 'lobby' && <Lobby game={game} />}
        {game.phase === 'searching' && <Searching game={game} />}
        {game.phase === 'loading' && <p className="guncha__note">Jang ochilmoqda…</p>}
        {game.phase === 'waiting' && <Waiting game={game} />}
        {(game.phase === 'playing' || game.phase === 'finishing') && (
          <Playing game={game} />
        )}
        {game.phase === 'finished' && <Result game={game} />}
      </div>
    </section>
  );
}

/* ── Lobbi ───────────────────────────────────────────────────────────── */

function Lobby({ game }: { game: GunchaJang }) {
  const [code, setCode] = useState(codeFromUrl);
  const joined = useRef(false);

  // Havoladagi kod bilan o'zi qo'shiladi — odam kodni terib o'tirmasin.
  // Keyin manzil tozalanadi: sahifa yangilanganda qayta urinilmaydi.
  useEffect(() => {
    if (joined.current || code.length !== 6) return;
    joined.current = true;
    void game.join(code);
    window.history.replaceState(null, '', links.gunchaBattle);
  }, [code, game]);

  return (
    <div className="lobby">
      <div className="lobby__main">
        <div className="panel lobby__card">
          <button
            className="btn btn--lg lobby__quick"
            onClick={game.quick}
            disabled={game.busy}
          >
            <Swords size={20} />
            {game.busy ? 'Qidirilmoqda…' : 'Raqib qidirish'}
          </button>
          <p className="panel__note lobby__hint">
            Ikkalangizga bir xil g‘uncha beriladi va uch daqiqa vaqt bo‘ladi.
            Kim ko‘p ball yig‘sa — o‘sha yutadi.
          </p>

          <div className="lobby__friend">
            <span className="panel__label">
              <Users size={14} /> Do‘st bilan
            </span>
            <div className="lobby__friend-row">
              <button
                className="btn btn--outline"
                onClick={game.create}
                disabled={game.busy}
              >
                {game.busy ? 'Yaratilmoqda…' : 'Kod yaratish'}
              </button>
              <span className="lobby__or">yoki</span>
              <CodeInput
                value={code}
                onChange={setCode}
                onSubmit={() => game.join(code)}
                disabled={game.busy}
              />
              <button
                className="btn btn--ghost"
                onClick={() => code.length === 6 && game.join(code)}
                disabled={game.busy || code.length !== 6}
              >
                Qo‘shilish
              </button>
            </div>
          </div>
        </div>

        <div className="panel">
          <h3>Qoidalar</h3>
          <ol className="guncha__rules">
            <li>So‘z kamida 4 harfdan bo‘lsin va yurak harf qatnashsin.</li>
            <li>Uzun so‘z ko‘p ball beradi, pangramma — qo‘shimcha 7 ball.</li>
            <li>Vaqtni server hisoblaydi: muddat o‘tgach so‘z hisoblanmaydi.</li>
            <li>Ball teng bo‘lsa — durang.</li>
          </ol>
        </div>
      </div>

      <aside className="lobby__side">
        <ArenaHistory />
        <TelegramBanner compact />
        <div className="panel panel--call">
          <h3>Yakka o‘ynash</h3>
          <p className="panel__note">
            Kunlik g‘uncha hamma uchun bir xil va vaqt cheklovi yo‘q.
          </p>
          <a className="btn btn--sm btn--ghost" href={links.guncha}>
            G‘unchaga o‘tish
          </a>
        </div>
      </aside>
    </div>
  );
}

function Searching({ game }: { game: GunchaJang }) {
  return (
    <div className="panel lobby__card">
      <h3>Raqib qidirilmoqda…</h3>
      <p className="panel__note">
        Navbatdasiz — {game.seconds} s. Raqib chiqishi bilan jang boshlanadi.
      </p>
      <button className="btn btn--sm btn--ghost" onClick={game.cancelSearch}>
        Bekor qilish
      </button>
    </div>
  );
}

/** Kod bilan chaqiruv — raqib kirgunicha. */
function Waiting({ game }: { game: GunchaJang }) {
  const [copied, setCopied] = useState(false);
  const link = game.code ? inviteLink(game.code, 'guncha') : '';

  const copy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link).catch(() => undefined);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="stage">
      <div className="stage__head">
        <h2>Chaqiruv tayyor</h2>
        <span className="stage__tag">G‘uncha · 3 daqiqa</span>
      </div>

      <button
        type="button"
        className="code"
        onClick={copy}
        title="Havolani nusxalash"
        aria-label={`Chaqiruv kodi ${game.code ?? ''}. Havolani nusxalash`}
      >
        {[...(game.code ?? '')].map((char, index) => (
          <span key={index} style={{ '--i': index } as CSSProperties}>
            {char}
          </span>
        ))}
      </button>
      <p className="stage__hint" role="status">
        {copied ? (
          <>
            <Check size={14} /> Havola nusxalandi
          </>
        ) : (
          'Kodni do‘stingizga yuboring — u kod bilan qo‘shiladi'
        )}
      </p>

      {link && (
        <div className="linkbox">
          <span className="linkbox__url">{link.replace('https://', '')}</span>
          <button
            type="button"
            className="icon-btn"
            onClick={copy}
            aria-label="Havolani nusxalash"
            title="Havolani nusxalash"
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
          </button>
        </div>
      )}

      <div className="result__actions">
        <button className="btn btn--outline" onClick={game.leave}>
          Bekor qilish
        </button>
      </div>
    </div>
  );
}

/* ── Jang ────────────────────────────────────────────────────────────── */

function Playing({ game }: { game: GunchaJang }) {
  const [confirm, setConfirm] = useState(false);
  const urgent = game.left <= URGENT_AT;
  const share = Math.max(0, Math.min(1, game.left / GUNCHA_SECONDS));

  // Oxirgi o'n soniyada yengil tebranish — telefonda seziladi.
  const buzzed = useRef(0);
  useEffect(() => {
    if (game.left > 0 && game.left <= 30 && game.left % 10 === 0) {
      if (buzzed.current !== game.left) {
        buzzed.current = game.left;
        navigator.vibrate?.(40);
      }
    }
  }, [game.left]);

  return (
    <div className="guncha guncha--battle">
      <div className={`gbar${urgent ? ' gbar--urgent' : ''}`}>
        <div className="gbar__time">
          <strong>{clock(game.left)}</strong>
          <i style={{ width: `${share * 100}%` }} />
        </div>
        <div className="gbar__rows">
          <span className="gbar__row gbar__row--me">
            <Avatar name={game.account?.nickname ?? 'Siz'} uid={game.account?.uid} size={24} />
            <b>{pretty(game.account?.nickname ?? 'Siz')}</b>
            <em>{game.score}</em>
            <span>{game.mine.length} so‘z</span>
          </span>
          <span className="gbar__row">
            <Avatar
              name={game.opponent?.nickname ?? 'Raqib'}
              uid={game.opponentUid ?? undefined}
              size={24}
            />
            <b>{pretty(game.opponent?.nickname ?? 'Raqib')}</b>
            <em>{game.opponent?.score ?? 0}</em>
            <span>{game.opponent?.wordCount ?? 0} so‘z</span>
          </span>
        </div>
      </div>

      {game.phase === 'finishing' && (
        <p className="guncha__note">Yakunlanmoqda…</p>
      )}

      <div className={`guncha__typed${game.shake ? ' guncha__typed--shake' : ''}`}>
        {game.typed.length === 0 ? (
          <span className="guncha__hint">Harflarni bosing yoki yozing</span>
        ) : (
          game.typed.map((unit, index) => (
            <span
              key={index}
              className={
                unit === game.center
                  ? 'guncha__unit guncha__unit--center'
                  : 'guncha__unit'
              }
            >
              {display(unit)}
            </span>
          ))
        )}
        {game.praise && <span className="guncha__praise">{game.praise}</span>}
        {game.message && <span className="guncha__msg">{game.message}</span>}
        <ReactionBurst event={game.incoming} />
      </div>

      {game.center && (
        <GunchaFlower
          center={game.center}
          petals={game.order}
          onPress={game.press}
          disabled={game.phase !== 'playing'}
        />
      )}

      <div className="guncha__controls">
        <button className="btn btn--sm btn--ghost" onClick={game.clear}>
          O‘chirish
        </button>
        <button className="btn btn--sm btn--ghost" onClick={game.shuffle}>
          Aralashtirish
        </button>
        <button
          className="btn btn--sm"
          onClick={game.submit}
          disabled={game.phase !== 'playing'}
        >
          Kiritish
        </button>
      </div>

      <div className="guncha__foot">
        <ReactionPicker sent={game.sentReaction} onReact={game.react} />
        <span>
          {game.mine.length} so‘z · {game.score} ball
        </span>
        <button className="link" onClick={() => setConfirm(true)}>
          Chiqish
        </button>
      </div>

      {confirm && (
        <Modal title="Jangdan chiqasizmi?" onClose={() => setConfirm(false)}>
          <p className="modal__lead">
            Jang davom etadi va raqib o‘z bali bilan qoladi — siz esa
            mag‘lub bo‘lasiz.
          </p>
          <div className="modal__foot">
            <button className="btn btn--sm btn--outline" onClick={game.leave}>
              Chiqish
            </button>
            <button className="btn btn--sm" onClick={() => setConfirm(false)}>
              Davom etish
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ── Natija ──────────────────────────────────────────────────────────── */

function Result({ game }: { game: GunchaJang }) {
  const [rematch, setRematch] = useState<InviteTarget | null>(null);
  const uid = game.account?.uid;
  const winner = game.battle?.winnerUid;
  const mineScore = game.me?.score ?? game.score;
  const theirScore = game.opponent?.score ?? 0;
  const delta =
    game.me?.ratingAfter !== undefined && game.me?.ratingBefore !== undefined
      ? game.me.ratingAfter - game.me.ratingBefore
      : null;

  const title = !winner
    ? 'Durang'
    : winner === uid
      ? 'G‘alaba'
      : 'Mag‘lubiyat';
  const lead = !winner
    ? `Ikkalangiz ham ${mineScore} ball`
    : winner === uid
      ? `Raqibingizdan ${mineScore - theirScore} ball ko‘p topdingiz`
      : `${theirScore - mineScore} ball yetmadi`;

  return (
    <div className="panel gresult">
      <div className="gresult__head">
        <h2>{title}</h2>
        <p className="panel__note">{lead}</p>
        {delta !== null && delta !== 0 && (
          <span className={`gresult__delta${delta > 0 ? ' is-up' : ''}`}>
            Reyting {delta > 0 ? `+${delta}` : delta}
          </span>
        )}
      </div>

      <div className="gresult__cols">
        <Column
          name={pretty(game.account?.nickname ?? 'Siz')}
          score={mineScore}
          words={game.revealed.mine}
        />
        <Column
          name={pretty(game.opponent?.nickname ?? 'Raqib')}
          score={theirScore}
          words={game.revealed.theirs}
        />
      </div>

      <div className="gresult__foot">
        {/* Qasos birinchi turadi: o'sha raqib bilan qayta o'ynash istagi
            natijani ko'rgan zahoti tug'iladi. */}
        {game.opponentUid && game.opponent?.nickname && (
          <button
            className="btn btn--sm"
            onClick={() =>
              setRematch({
                uid: game.opponentUid!,
                nickname: game.opponent!.nickname!,
                kind: 'rematch',
                game: 'guncha',
              })
            }
          >
            Qasos
          </button>
        )}
        <button className="btn btn--sm btn--outline" onClick={game.again}>
          Yana o‘ynash
        </button>
        <a className="btn btn--sm btn--ghost" href={links.guncha}>
          Yakka g‘uncha
        </a>
      </div>

      {rematch && (
        <SendInvite
          key={rematch.uid}
          target={rematch}
          onClose={() => setRematch(null)}
        />
      )}
    </div>
  );
}

/** Natijadagi bitta ustun: ball va topilgan so'zlar.
 *
 *  So'zlar jang tugagach ochiladi — davomida ular raqibga tayyor javob
 *  bo'lardi. */
function Column({
  name,
  score,
  words,
}: {
  name: string;
  score: number;
  words: string[];
}) {
  return (
    <div className="gresult__col">
      <div className="gresult__who">
        <strong>{name}</strong>
        <em>{score} ball</em>
      </div>
      {words.length === 0 ? (
        <p className="panel__note">Hech narsa topilmadi</p>
      ) : (
        <ul className="gresult__words">
          {words.map((word) => (
            <li key={word}>{pretty(word)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
