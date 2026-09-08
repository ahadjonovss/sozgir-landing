/** So'zjang sahifasi — `/sozjang`.
 *
 *  Ikki rejim: do'stga chaqiruv (kod bilan) va tezkor jang (tasodifiy
 *  raqib). Ikkalasi ham hisob talab qiladi — raqib kim bilan
 *  o'ynayotganini bilishi kerak va natija reytingga yoziladi.
 *
 *  Saytda yaratilgan chaqiruvga telefondan qo'shilish mumkin va aksincha:
 *  jang bir xil hujjatlarda, bir xil server funksiyalari orqali ketadi.
 *
 *  Sahifa jang holatiga qarab o'zgaradi: kutish va tanlov ekranlarida
 *  tepada tanishtiruv (sarlavha + jonli namoyish) turadi, jang boshlangach
 *  esa faqat maydon qoladi — e'tibor taxtada bo'lsin. */
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useAuth } from '../lib/auth';
import { inviteLink, verdictsOf, type BattlePlayer } from '../lib/battle';
import { useSozjang, type Sozjang } from '../lib/useSozjang';
import { display, pretty, type Verdict } from '../lib/uz';
import BattleStats from './BattleStats';
import { Board, Keyboard } from './Board';
import { Check, Copy, Send, Swords, Users } from './Icons';
import ReportWord from './ReportWord';
import RotatingLine from './RotatingLine';
import Versus from './Versus';
import OpponentBoard from './OpponentBoard';

/** Havoladagi `?kod=ABC123` — chaqiruvni bosib kelgan odam uchun. */
function codeFromUrl(): string {
  const value = new URLSearchParams(window.location.search).get('kod') ?? '';
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
}

function initialOf(name: string): string {
  const trimmed = name.trim();
  return trimmed.length === 0 ? '?' : trimmed[0].toUpperCase();
}

/** Matnni ulashish: iloji bo'lsa tizim oynasi, bo'lmasa nusxa. */
function useShare() {
  const [copied, setCopied] = useState(false);
  async function share(text: string) {
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
  return { copied, share };
}

/* ── Jonli namoyish ──────────────────────────────────────────────────── */

const DEMO: { me: Verdict[][]; foe: Verdict[][] } = {
  me: [
    ['absent', 'present', 'absent', 'absent', 'correct'],
    ['present', 'correct', 'absent', 'absent', 'correct'],
    ['correct', 'correct', 'correct', 'present', 'correct'],
    ['correct', 'correct', 'correct', 'correct', 'correct'],
  ],
  foe: [
    ['absent', 'absent', 'present', 'absent', 'absent'],
    ['absent', 'correct', 'absent', 'present', 'absent'],
    ['present', 'correct', 'absent', 'correct', 'absent'],
    ['correct', 'correct', 'absent', 'correct', 'correct'],
    ['correct', 'correct', 'correct', 'correct', 'correct'],
  ],
};

/** Ikki taxta yonma-yon, qatorlar navbat bilan ochiladi va aylanadi:
 *  jang qanday ko'rinishini so'zsiz tushuntiradi. */
function DuelDemo() {
  const board = (rows: Verdict[][], who: 'me' | 'foe') => (
    <div className={`demo__board demo__board--${who}`}>
      {Array.from({ length: 6 }, (_, r) => (
        <div className="demo__row" key={r}>
          {Array.from({ length: 5 }, (_, i) => {
            const verdict = rows[r]?.[i];
            return (
              <span
                key={i}
                className={`demo__tile${verdict ? ` demo__tile--${verdict}` : ''}`}
                style={{ '--r': r, '--i': i } as CSSProperties}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
  return (
    <div className="demo" aria-hidden="true">
      <div className="demo__side">
        <span className="demo__name demo__name--me">Siz</span>
        {board(DEMO.me, 'me')}
        <span className="demo__badge">4 urinish · g‘olib</span>
      </div>
      <span className="demo__vs">VS</span>
      <div className="demo__side">
        <span className="demo__name">Raqib</span>
        {board(DEMO.foe, 'foe')}
        <span className="demo__badge demo__badge--muted">5 urinish</span>
      </div>
    </div>
  );
}

/** Sahifa boshi — faqat jang boshlanmagan holatlarda. */
function Intro({ children }: { children?: React.ReactNode }) {
  return (
    <div className="jang-hero">
      <div className="jang-hero__copy">
        <span className="section__kicker">So‘zjang</span>
        <h1>Bir so‘z, ikki o‘yinchi</h1>
        <p className="section__lead">
          Ikkalangizga bir xil yashirin so‘z beriladi. Raqibning kataklari
          harfsiz — faqat ranglar ko‘rinadi. Kim kamroq urinishda topsa,
          o‘sha yutadi.
        </p>
        {children}
      </div>
      <DuelDemo />
    </div>
  );
}

function Gate() {
  const { openPrompt } = useAuth();
  return (
    <Intro>
      <div className="jang-hero__gate">
        <p>
          Jangda raqib taxallusingizni ko‘radi va natija reytingga
          yoziladi — shuning uchun hisob kerak. So‘ztopni esa kirmasdan
          ham o‘ynash mumkin.
        </p>
        <div className="result__actions result__actions--start">
          <button className="btn btn--lg" onClick={() => openPrompt('signIn')}>
            Kirish
          </button>
          <button className="btn btn--lg btn--outline" onClick={() => openPrompt('register')}>
            Hisob ochish
          </button>
        </div>
      </div>
    </Intro>
  );
}

/* ── Tanlov ekrani ───────────────────────────────────────────────────── */

/** Kod kataklari: olti katak, yozilayotgani ajratib ko'rsatiladi.
 *  Haqiqiy `input` ko'rinmaydi, lekin klaviatura va joylashtirish unga
 *  tushadi — shu sabab telefon klaviaturasi ham ishlaydi. */
function CodeInput({
  value,
  onChange,
  onSubmit,
  disabled,
}: {
  value: string;
  onChange: (next: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [focus, setFocus] = useState(false);
  const active = Math.min(value.length, 5);

  return (
    <div className={`codein${focus ? ' codein--focus' : ''}`} onClick={() => input.current?.focus()}>
      <input
        ref={input}
        className="codein__input"
        value={value}
        onChange={(event) =>
          onChange(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))
        }
        onKeyDown={(event) => {
          if (event.key === 'Enter' && value.length === 6) onSubmit();
        }}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        inputMode="text"
        autoCapitalize="characters"
        autoComplete="off"
        spellCheck={false}
        maxLength={6}
        disabled={disabled}
        aria-label="Chaqiruv kodi"
      />
      {Array.from({ length: 6 }, (_, index) => (
        <span
          key={index}
          className={`codein__cell${value[index] ? ' codein__cell--filled' : ''}${
            focus && index === active && value.length < 6 ? ' codein__cell--active' : ''
          }`}
          aria-hidden="true"
        >
          {value[index] ?? ''}
        </span>
      ))}
    </div>
  );
}

const STEPS = [
  { n: '1', title: 'Chaqiruv yoki qidiruv', text: 'Do‘stga kod yuboring yoki tezkor raqib toping.' },
  { n: '2', title: 'Bir xil so‘z', text: 'Ikkalangizga bitta yashirin so‘z, bir xil urinish.' },
  { n: '3', title: 'Ranglar bo‘yicha', text: 'Raqib yo‘lini ranglarda ko‘rasiz, harflarni emas.' },
  { n: '4', title: 'Kim tezroq', text: 'Kamroq urinish yutadi, natija Elo reytingga tushadi.' },
];

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

  const join = () => {
    if (code.length === 6 && !game.busy) void game.join(code);
  };

  return (
    <>
      <Intro />

      {game.account && <BattleStats uid={game.account.uid} />}

      <div className="arena">
        <article className="mode mode--friend">
          <span className="mode__icon">
            <Users size={24} />
          </span>
          <h3>Do‘st bilan</h3>
          <p>
            Chaqiruv yarating — 6 belgili kod va havola chiqadi. Do‘stingiz
            kodni kiritadi yoki havolani bosadi, ikkalangizga bir xil so‘z
            beriladi.
          </p>
          <button className="btn btn--lg mode__cta" onClick={game.create} disabled={game.busy}>
            <Swords size={18} />
            {game.busy ? 'Yaratilmoqda…' : 'Chaqiruv yaratish'}
          </button>

          <div className="mode__or">
            <span>yoki kod bilan qo‘shiling</span>
          </div>
          <CodeInput value={code} onChange={setCode} onSubmit={join} disabled={game.busy} />
          <button
            className="btn btn--ghost mode__join"
            onClick={join}
            disabled={game.busy || code.length !== 6}
          >
            Qo‘shilish
          </button>
        </article>

        <article className="mode mode--quick">
          <span className="mode__icon">
            <span className="mode__radar" aria-hidden="true">
              <i />
              <i />
            </span>
          </span>
          <h3>Tezkor jang</h3>
          <p>
            Tizim reytingi sizga yaqin raqibni topadi. Kim onlayn bo‘lsa —
            shu zahoti boshlanadi, bo‘lmasa navbatda kutasiz.
          </p>
          <button className="btn btn--lg mode__cta" onClick={game.quick} disabled={game.busy}>
            {game.busy ? 'Qidirilmoqda…' : 'Raqib qidirish'}
          </button>
          <ul className="mode__facts">
            <li>Reytingi yaqin raqib</li>
            <li>Raqib taxtasi — faqat ranglar</li>
            <li>Natija Elo reytingga yoziladi</li>
          </ul>
        </article>
      </div>

      <ol className="steps">
        {STEPS.map((step) => (
          <li className="step" key={step.n}>
            <span className="step__n">{step.n}</span>
            <strong>{step.title}</strong>
            <p>{step.text}</p>
          </li>
        ))}
      </ol>
    </>
  );
}

/* ── Qidiruv va kutish ───────────────────────────────────────────────── */

/** Qidiruv davomida almashadigan izohlar.
 *
 *  Qidiruv **to'xtamaydi**, shuning uchun «hech kim yo'q» degan xabar
 *  yo'q: jumlalar navbat bilan almashadi va kutish tirik ko'rinadi. */
const SEARCH_LINES = [
  'Onlayn o‘yinchilar ko‘rib chiqilmoqda…',
  'Reytingi sizga yaqin raqib tanlanmoqda',
  'Hali ham qidiryapmiz…',
  'Navbatdasiz — raqib chiqishi bilan boshlanadi',
  'Do‘stingizni kod bilan chaqirsangiz tezroq bo‘ladi',
];

function Searching({ game }: { game: Sozjang }) {
  const name = pretty(game.account?.nickname ?? 'Siz');
  const pad = (value: number) => String(value).padStart(2, '0');
  return (
    <div className="stage">
      <div className="stage__head">
        <h2>Raqib qidirilmoqda</h2>
        <span className="stage__tag">{game.length} harf</span>
      </div>

      <div className="radar radar--big" aria-hidden="true">
        <span />
        <span />
        <span />
        <b className="radar__me">{initialOf(name)}</b>
      </div>

      <p className="stage__timer" aria-live="off">
        {pad(Math.floor(game.seconds / 60))}:{pad(game.seconds % 60)}
      </p>
      <RotatingLine lines={SEARCH_LINES} />

      <div className="result__actions">
        <button className="btn btn--sm btn--outline" onClick={game.cancelSearch}>
          Bekor qilish
        </button>
      </div>
    </div>
  );
}

const WAIT_LINES = [
  'Do‘stingiz shu kodni kiritsa jang boshlanadi',
  'Havolani yuborsangiz, kodni terib ham o‘tirmaydi',
  'Do‘stingiz kirmaguncha kutib turamiz…',
  'Chaqiruvga telefondagi ilovadan ham qo‘shilish mumkin',
];

function Waiting({ game }: { game: Sozjang }) {
  const { copied, share } = useShare();
  const [codeCopied, setCodeCopied] = useState(false);
  const code = game.code ?? '';
  const link = inviteLink(code);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCodeCopied(true);
      window.setTimeout(() => setCodeCopied(false), 1600);
    } catch {
      // Ruxsat berilmadi — kod ekranda ko'rinib turibdi.
    }
  }

  return (
    <div className="stage">
      <div className="stage__head">
        <h2>Chaqiruv tayyor</h2>
        <span className="stage__tag">{game.boardLength} harf</span>
      </div>

      {/* Raqib hali noma'lum — o'ng tomonda so'roq belgisi turadi va
          do'st qo'shilganda uning ismiga aylanadi. */}
      <Versus me={pretty(game.account?.nickname ?? 'Siz')} opponent="Raqib" waiting />

      <button
        type="button"
        className="code"
        onClick={copyCode}
        title="Kodni nusxalash"
        aria-label={`Chaqiruv kodi ${code}. Nusxalash`}
      >
        {[...code].map((char, index) => (
          <span key={index} style={{ '--i': index } as CSSProperties}>
            {char}
          </span>
        ))}
      </button>
      <p className="stage__hint" role="status">
        {codeCopied ? (
          <>
            <Check size={14} /> Kod nusxalandi
          </>
        ) : (
          'Kodni bosib nusxalash mumkin'
        )}
      </p>

      <div className="linkbox">
        <span className="linkbox__url">{link.replace('https://', '')}</span>
        <button
          type="button"
          className="icon-btn"
          onClick={() => void share(`So‘zgir'da menga qarshi jangga chiqing! Kod: ${code}\n\n${link}`)}
          aria-label="Havolani nusxalash"
          title="Havolani nusxalash"
        >
          {copied ? <Check size={18} /> : <Copy size={18} />}
        </button>
      </div>

      <RotatingLine lines={WAIT_LINES} />

      <div className="result__actions">
        <button
          className="btn"
          onClick={() => void share(`So‘zgir'da menga qarshi jangga chiqing! Kod: ${code}\n\n${link}`)}
        >
          <Send size={16} />
          {copied ? 'Nusxa olindi' : 'Chaqiruvni ulashish'}
        </button>
        <button className="btn btn--outline" onClick={game.leave}>
          Bekor qilish
        </button>
      </div>
    </div>
  );
}

/* ── Jang ────────────────────────────────────────────────────────────── */

/** Jang boshlanishidagi uch soniyalik afisha.
 *
 *  Ilgari jang birdan taxta bilan ochilardi — kim bilan o'ynayotganini
 *  bilish uchun yon ustunga qarash kerak edi. Afisha bir marta, faqat
 *  jang boshlanganda ko'rinadi. */
function useIntro(phase: string): boolean {
  const [show, setShow] = useState(false);
  const seen = useRef(false);

  useEffect(() => {
    if (phase !== 'playing' || seen.current) return;
    seen.current = true;
    setShow(true);
    const timer = window.setTimeout(() => setShow(false), INTRO_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  return show;
}

const INTRO_MS = 3000;

/** Afisha ostidagi sanoq: 3 → 1. */
function IntroCountdown() {
  const [left, setLeft] = useState(Math.round(INTRO_MS / 1000));

  useEffect(() => {
    const timer = window.setInterval(
      () => setLeft((value) => Math.max(1, value - 1)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, []);

  return <span className="versus__count">{left}</span>;
}

/** Bir o'yinchining urinish nuqtalari: har qator uchun bitta — bo'sh,
 *  o'ynalgan (eng yaxshi rang bilan) yoki topilgan. */
function Dots({ player, max, mine }: { player?: BattlePlayer; max: number; mine?: boolean }) {
  const rows = player?.rows ?? [];
  return (
    <span className={`dots${mine ? ' dots--me' : ''}`} aria-hidden="true">
      {Array.from({ length: max }, (_, index) => {
        const row = rows[index];
        const verdicts = row ? verdictsOf(row) : null;
        const tone = !verdicts
          ? ''
          : verdicts.every((v) => v === 'correct')
            ? 'correct'
            : verdicts.some((v) => v !== 'absent')
              ? 'present'
              : 'absent';
        return <i key={index} className={tone ? `dots__dot dots__dot--${tone}` : 'dots__dot'} />;
      })}
    </span>
  );
}

/** Jang tepasidagi hisob taxtasi: ikki tomon, urinishlar va holat. */
function Scoreboard({ game }: { game: Sozjang }) {
  const me = pretty(game.account?.nickname ?? 'Siz');
  const foe = pretty(game.opponent?.nickname ?? 'Raqib');
  const foeRows = game.opponent?.rows?.length ?? 0;
  const status = game.opponent?.finished
    ? game.opponent.won
      ? 'topdi'
      : 'tugatdi'
    : foeRows === 0
      ? 'o‘ylayapti…'
      : `${foeRows}-urinish`;

  return (
    <div className="board-head">
      <div className="board-head__side board-head__side--me">
        <span className="board-head__avatar">{initialOf(me)}</span>
        <div className="board-head__text">
          <strong>{me}</strong>
          <Dots player={game.me} max={game.maxAttempts} mine />
        </div>
      </div>
      <span className="board-head__vs">
        <Swords size={18} />
      </span>
      <div className="board-head__side board-head__side--foe">
        <div className="board-head__text">
          <strong>{foe}</strong>
          <Dots player={game.opponent} max={game.maxAttempts} />
          <span className={`board-head__status${game.opponent?.finished ? ' board-head__status--done' : ''}`}>
            {status}
          </span>
        </div>
        <span className="board-head__avatar board-head__avatar--foe">{initialOf(foe)}</span>
      </div>
    </div>
  );
}

function Playing({ game }: { game: Sozjang }) {
  const opponentRows = (game.opponent?.rows ?? []).map(verdictsOf);
  const lastFoe = opponentRows.length;

  return (
    <div className="stage stage--fight">
      <Scoreboard game={game} />

      <div className="fight">
        <div className="fight__side">
          <div className="play__area">
            <Board
              rows={game.rows}
              length={game.boardLength}
              flipRow={game.flipRow}
              shakeRow={game.shake ? (game.me?.rows?.length ?? 0) : -1}
            />
            {game.message && (
              <p className="play__msg" role="status">
                {game.message}
              </p>
            )}
          </div>
          {game.hint && !game.me?.finished && (
            <p className="fight__hint">
              💡 Maslahat: <b>{game.hint.index + 1}</b>-katakda <b>{display(game.hint.unit)}</b> —
              harf keyingi qatorga qo‘yildi
            </p>
          )}
        </div>

        <div className="fight__side fight__side--foe" key={lastFoe}>
          <div className="fight__who">
            <strong>{pretty(game.opponent?.nickname ?? 'Raqib')}</strong>
            <span>
              {game.opponent?.finished ? 'tugatdi' : `${lastFoe}/${game.maxAttempts}`}
              {game.opponent?.hintUsed ? ' · maslahat oldi' : ''}
            </span>
          </div>
          <OpponentBoard
            rows={opponentRows}
            length={game.boardLength}
            maxAttempts={game.maxAttempts}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Natija ──────────────────────────────────────────────────────────── */

const CONFETTI = Array.from({ length: 18 }, (_, index) => index);

function Result({ game }: { game: Sozjang }) {
  const { account } = game;
  const { copied, share } = useShare();
  const winner = game.battle?.winnerUid;
  const mine = !!winner && !!account && winner === account.uid;
  const draw = !winner;
  const expired = game.battle?.status === 'expired';
  const opponentRows = (game.opponent?.rows ?? []).map(verdictsOf);
  const meName = pretty(account?.nickname ?? 'Siz');
  const foeName = pretty(game.opponent?.nickname ?? 'Raqib');

  const title = expired
    ? 'Chaqiruv muddati o‘tdi'
    : mine
      ? 'Yutdingiz!'
      : draw
        ? 'Durang'
        : 'Bu safar raqib tezroq bo‘ldi';
  const emoji = expired ? '⌛' : mine ? '🏆' : draw ? '🤝' : '⚔️';

  return (
    <div className={`stage stage--result stage--${mine ? 'won' : draw ? 'draw' : 'lost'}`}>
      {mine && (
        <div className="confetti" aria-hidden="true">
          {CONFETTI.map((index) => (
            <i key={index} style={{ '--n': index } as CSSProperties} />
          ))}
        </div>
      )}

      <div className="verdict">
        <span className="verdict__emoji" aria-hidden="true">
          {emoji}
        </span>
        <h2 className="verdict__title">{title}</h2>
        {game.battle?.answer && (
          <>
            <p className="verdict__label">Yashirin so‘z</p>
            <p className="result__word">{display(game.battle.answer)}</p>
          </>
        )}
      </div>

      {/* Bitta uzun qator o'rniga ikki ustun: kim nechada topgani va
          necha ball olgani bir qarashda solishtiriladi. */}
      <div className="score">
        <div className={`score__side${mine ? ' score__side--win' : ''}`}>
          <span className="score__avatar">{initialOf(meName)}</span>
          <span className="score__who">{meName}</span>
          <strong className="score__points">{game.me?.score ?? 0}</strong>
          <span className="score__meta">
            {game.me?.won ? `${game.me.attempts ?? 0} urinishda topdi` : 'topa olmadi'}
          </span>
        </div>
        <span className="score__dash" aria-hidden="true">
          :
        </span>
        <div className={`score__side${!mine && !draw && !expired ? ' score__side--win' : ''}`}>
          <span className="score__avatar score__avatar--foe">{initialOf(foeName)}</span>
          <span className="score__who">{foeName}</span>
          <strong className="score__points">{game.opponent?.score ?? 0}</strong>
          <span className="score__meta">
            {game.opponent?.won
              ? `${game.opponent.attempts ?? 0} urinishda topdi`
              : 'topa olmadi'}
          </span>
        </div>
      </div>

      <div className="fight fight--done">
        <div className="fight__side">
          <div className="fight__who">
            <strong>{meName}</strong>
            <span>{game.me?.rows?.length ?? 0}/{game.maxAttempts}</span>
          </div>
          {/* Server ochgan so'zlar; bo'lmasa (yoki bo'sh kelsa) brauzerda
              saqlangan o'z taxminlarim. */}
          <OpponentBoard
            rows={(game.me?.rows ?? []).map(verdictsOf)}
            words={game.me?.words?.length ? game.me.words : game.words}
            length={game.boardLength}
            maxAttempts={game.maxAttempts}
          />
        </div>
        <div className="fight__side">
          <div className="fight__who">
            <strong>{foeName}</strong>
            <span>{opponentRows.length}/{game.maxAttempts}</span>
          </div>
          <OpponentBoard
            rows={opponentRows}
            words={game.opponent?.words}
            length={game.boardLength}
            maxAttempts={game.maxAttempts}
          />
        </div>
      </div>

      {account && !expired && <BattleStats uid={account.uid} compact />}

      <div className="result__actions">
        <button className="btn" onClick={game.leave}>
          <Swords size={16} />
          Yangi jang
        </button>
        {!expired && (
          <button className="btn btn--ghost" onClick={() => void share(game.shareText())}>
            <Send size={16} />
            {copied ? 'Nusxa olindi' : 'Natijani ulashish'}
          </button>
        )}
      </div>

      {game.battle?.answer && (
        <ReportWord word={game.battle.answer} length={game.boardLength} mode="battle" />
      )}
    </div>
  );
}

export default function BattlePage() {
  const game = useSozjang();
  const intro = useIntro(game.phase);

  // Holat almashganda (qidiruv, kutish, jang, natija) sahifa tepaga
  // qaytadi. Telefonda tugma ekranning pastida bo'lardi va yangi ekran
  // ko'rinmay qolardi — ilgari «Raqib qidirish» bosilgach faqat footer
  // ko'rinib turardi.
  const phase = game.phase;
  useEffect(() => {
    if (phase === 'lobby') return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [phase]);

  return (
    <section className="oyin jang">
      <div className="wrap jang__wrap">
        {!game.account ? (
          <Gate />
        ) : (
          <>
            {game.error && (
              <p className="form__err jang__err" role="alert">
                {game.error}
              </p>
            )}

            {game.phase === 'lobby' && <Lobby game={game} />}
            {game.phase === 'searching' && <Searching game={game} />}
            {game.phase === 'waiting' && <Waiting game={game} />}
            {game.phase === 'playing' && intro && (
              <div className="stage">
                <Versus
                  me={pretty(game.account?.nickname ?? 'Siz')}
                  opponent={pretty(game.opponent?.nickname ?? 'Raqib')}
                  note={<IntroCountdown />}
                />
              </div>
            )}
            {game.phase === 'playing' && !intro && (
              <>
                <Playing game={game} />
                {game.me?.finished ? (
                  <div className="stage stage--wait">
                    <div className="radar" aria-hidden="true">
                      <span />
                      <span />
                      <span />
                    </div>
                    <p className="panel__note jang__wait">
                      {game.me.won ? 'Topdingiz!' : 'Urinishlar tugadi.'} Raqib o‘ynab
                      bo‘lishini kutamiz…
                    </p>
                  </div>
                ) : (
                  <div className="jang__keys">
                    <Keyboard keyState={game.keyState} onPress={game.press} />
                  </div>
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

