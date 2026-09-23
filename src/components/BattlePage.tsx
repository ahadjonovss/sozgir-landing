/** So'zjang sahifasi — `/sozjang`.
 *
 *  Ikki rejim: do'stga chaqiruv (kod bilan) va tezkor jang (tasodifiy
 *  raqib). Ikkalasi ham hisob talab qiladi — raqib kim bilan
 *  o'ynayotganini bilishi kerak va jang o'lja beradi.
 *
 *  Saytda yaratilgan chaqiruvga telefondan qo'shilish mumkin va aksincha:
 *  jang bir xil hujjatlarda, bir xil server funksiyalari orqali ketadi.
 *
 *  Sahifa jang holatiga qarab o'zgaradi: kutish va tanlov ekranlarida
 *  tepada tanishtiruv (sarlavha + jonli namoyish) turadi, jang boshlangach
 *  esa faqat maydon qoladi — e'tibor taxtada bo'lsin. */
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useAuth } from '../lib/auth';
import { countShare } from '../lib/badges';
import { inviteLink, verdictsOf, type BattlePlayer } from '../lib/battle';
import { useMeaning } from '../lib/useMeaning';
import { useSozjang, type Sozjang } from '../lib/useSozjang';
import { display, pretty } from '../lib/uz';
import { links, playerLink } from '../data/site';
import Avatar from './Avatar';
import AdBanner from './AdBanner';
import BattleBoard from './BattleBoard';
import BattleStats from './BattleStats';
import { Board, Keyboard } from './Board';
import CodeInput from './CodeInput';
import { Check, Clock, Copy, Send, Swords, Users } from './Icons';
import { ReactionBurst, ReactionPicker } from './Reactions';
import ReportWord from './ReportWord';
import { VerifiedMark } from './PlayerName';
import RotatingLine from './RotatingLine';
import ScoreRules from './ScoreRules';
import SendInvite, { type InviteTarget } from './SendInvite';
import MarduCountdown from './MarduCountdown';
import Versus from './Versus';
import Modal from './Modal';
import TelegramBanner from './TelegramBanner';
import OpponentBoard from './OpponentBoard';
import ArenaStandings from './ArenaStandings';
import ArenaTiles from './ArenaTiles';
import { routeParam } from '../lib/useRoute';

/** Havoladagi kod — chaqiruvni bosib kelgan odam uchun.
 *
 *  Ikki ko'rinishi bor va ikkalasi ham o'qiladi: ilova ulashadigan
 *  `sozgir.uz/jang/AB12CD` (telefonda u ilovani ochadi, ilovasi yo'qda
 *  esa shu sahifani) va saytning o'z `?kod=AB12CD` si. */
function codeFromUrl(): string {
  const value =
    routeParam() || (new URLSearchParams(window.location.search).get('kod') ?? '');
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
}

/** Matnni ulashish: iloji bo'lsa tizim oynasi, bo'lmasa nusxa. */
function useShare() {
  const [copied, setCopied] = useState(false);
  async function share(text: string) {
    try {
      if (navigator.share) {
        await navigator.share({ text });
        // «Jarchi» nishoni uchun sanoq (`lib/badges.ts`).
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
  return { copied, share };
}

/* ── Lobbi boshi va kirish to'sig'i ─────────────────────────────────── */

/** Sahifa boshi — qisqa: nom va bir jumla. Ilgari bu yerda katta sarlavha,
 *  ikki taxtali jonli namoyish, uchta «fakt» va to'rt «qadam» turardi —
 *  odam «O'ynash» → «Jangga kirish» deb kelgan bo'lsa, unga yana bir
 *  tanishtiruv emas, tugma kerak. Qoidalar pastda, yig'ilgan holda. */
function Head() {
  return (
    <div className="lobby__head">
      <span className="section__kicker">So‘zjang</span>
      <h1>Bir so‘z, ikki o‘yinchi</h1>
      <p className="section__lead">
        Ikkalangizga bir xil yashirin so‘z. Kim kamroq urinishda topsa — yutadi.
      </p>
    </div>
  );
}

/** Qoidalar — yig'ilgan: kerak bo'lsa ochiladi, bo'lmasa joy olmaydi. */
function Rules() {
  return (
    <details className="lobby__rules">
      <summary>Qoidalar va o‘lja</summary>
      <ul>
        <li>Raqibning taxtasida harflar yo‘q — faqat ranglar ko‘rinadi.</li>
        <li>Urinishlar bir xil: 5 harf — 6 urinish. Kamroq urinishda topgan yutadi.</li>
        <ScoreRules game="sozjang" bare />
        <li>Saytda yaratilgan chaqiruvga telefondagi ilovadan ham qo‘shilish mumkin.</li>
      </ul>
    </details>
  );
}

/** Kirmagan odam: sabab bir jumla, ikki tugma. Jadval yonida qolaveradi —
 *  sahifa bo'sh ko'rinmaydi va kim bilan bellashish mumkinligi ko'rinadi. */
function Gate() {
  const { openPrompt } = useAuth();
  return (
    <div className="lobby">
      <div className="lobby__main">
        <Head />
        <div className="panel lobby__card lobby__gate">
          <p>
            Jang uchun hisob kerak: raqib taxallusingizni ko‘radi, jang
            o‘lja beradi.
          </p>
          <div className="result__actions">
            <button className="btn btn--lg" onClick={() => openPrompt('signIn')}>
              Kirish
            </button>
            <button className="btn btn--lg btn--outline" onClick={() => openPrompt('register')}>
              Hisob ochish
            </button>
          </div>
        </div>
        <Rules />
      </div>
      <aside className="lobby__side">
        <BattleBoard />
        <TelegramBanner compact />
      </aside>
    </div>
  );
}

/* ── Tanlov ekrani ───────────────────────────────────────────────────── */

/** Kod kataklari: olti katak, yozilayotgani ajratib ko'rsatiladi.
 *  Haqiqiy `input` ko'rinmaydi, lekin klaviatura va joylashtirish unga
 *  tushadi — shu sabab telefon klaviaturasi ham ishlaydi. */
/** Lobbi: bitta asosiy tugma («Raqib qidirish»), ostida do'st bilan
 *  o'ynash yo'li, o'z o'ljasi va yonida So'zjang jadvali. */
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
    <div className="lobby">
      <div className="lobby__main">
        <Head />

        <div className="panel lobby__card">
          <button className="btn btn--lg lobby__quick" onClick={game.quick} disabled={game.busy}>
            <Swords size={20} />
            {game.busy ? 'Qidirilmoqda…' : 'Raqib qidirish'}
          </button>
          <p className="panel__note lobby__hint">
            Reytingi sizga yaqin onlayn raqib. Hozir hech kim bo‘lmasa, navbatda
            kutasiz.
          </p>

          <div className="lobby__friend">
            <span className="panel__label">
              <Users size={14} /> Do‘st bilan
            </span>
            <div className="lobby__friend-row">
              <button className="btn btn--outline" onClick={game.create} disabled={game.busy}>
                {game.busy ? 'Yaratilmoqda…' : 'Kod yaratish'}
              </button>
              <span className="lobby__or">yoki</span>
              <CodeInput value={code} onChange={setCode} onSubmit={join} disabled={game.busy} />
              <button
                className="btn btn--ghost"
                onClick={join}
                disabled={game.busy || code.length !== 6}
              >
                Qo‘shilish
              </button>
            </div>
          </div>
        </div>

        {game.account && <BattleStats uid={game.account.uid} compact />}
        <Rules />
      </div>

      <aside className="lobby__side">
        <BattleBoard />
        <TelegramBanner compact />
        {/* Faqat lobbida: qidiruv, jang va natija ekranlari reklamasiz.
            Bu yerda odam hali o'ynamayapti — tanlab turibdi. */}
        <AdBanner placement="battle" />
      </aside>
    </div>
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
        <Avatar name={name} uid={game.account?.uid} size={60} className="radar__me" />
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

/** Jang ochildi, ammo hujjati hali kelmadi — holat noma'lum. Bu qisqa
 *  oraliq bo'lib, taxta ham, afisha ham ko'rsatilmaydi: aks holda holat
 *  «sakrab» boshlanish afishasini buzadi. */
function Loading() {
  return (
    <div className="stage stage--wait">
      <div className="radar" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <p className="panel__note jang__wait" role="status">
        Jang yuklanmoqda…
      </p>
    </div>
  );
}

const WAIT_LINES = [
  'Do‘stingiz shu kodni kiritsa jang boshlanadi',
  'Havolani yuborsangiz, kodni terib ham o‘tirmaydi',
  'Do‘stingiz kirmaguncha kutib turamiz…',
  'Chaqiruvga telefondagi ilovadan ham qo‘shilish mumkin',
];

/** Raqib kirishi kerak bo'lgan muddat — serverdagi `JOIN_WINDOW_MINUTES`. */
const JOIN_WINDOW_SECONDS = 120;

/** Oxirgi shuncha soniyada pilik qizaradi. */
const FUSE_URGENT_AT = 20;

/** Raqib kirishiga qolgan vaqt — «pilik» (ilovadagi `_JoinFuse`): chapdan
 *  o'ngga kamayadigan chiziq va soat. Plastina arena tonida (yashil),
 *  oxirgi 20 soniyada qizaradi — tugab borayotganini rang va shakl bilan
 *  aytadi. Muddat jang hujjatidagi `expiresAt` dan: server bilan bir xil
 *  soat, sahifa yangilansa ham to'g'ri joydan davom etadi. */
function JoinFuse({ expiresAt }: { expiresAt?: { seconds?: number } | null }) {
  const endsAt = expiresAt?.seconds ? expiresAt.seconds * 1000 : null;
  // Soat sekundlab yuradi, qolgan vaqt esa renderda hisoblanadi — muddat
  // (hujjatdan kelgan `expiresAt`) o'zgarsa ham alohida holat kerak emas.
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (endsAt === null) return null;
  const left = Math.max(0, Math.min(JOIN_WINDOW_SECONDS, Math.round((endsAt - now) / 1000)));
  const urgent = left <= FUSE_URGENT_AT;
  const pad = (value: number) => String(value).padStart(2, '0');

  return (
    <div className={`fuse${urgent ? ' fuse--urgent' : ''}`} role="timer" aria-live="off">
      <div className="fuse__row">
        <Clock size={17} />
        <span className="fuse__label">Kirishga qolgan vaqt</span>
        <strong className="fuse__clock">
          {Math.floor(left / 60)}:{pad(left % 60)}
        </strong>
      </div>
      <span className="fuse__track" aria-hidden="true">
        <i style={{ width: `${Math.min(100, (left / JOIN_WINDOW_SECONDS) * 100)}%` }} />
      </span>
    </div>
  );
}

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

      {/* Raqib hali noma'lum — arenaning o'ng tomoni bo'sh turadi va
          do'st qo'shilganda uning rasmi bilan to'ladi. */}
      <Versus
        me={pretty(game.account?.nickname ?? 'Siz')}
        meUid={game.account?.uid}
        opponent="Raqib"
        mode="waiting"
        length={game.boardLength}
        maxAttempts={game.maxAttempts}
      />
      <JoinFuse expiresAt={game.battle?.expiresAt} />

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
  /** Afisha yopiladigan payt — mutlaq vaqt. `null` bo'lsa afisha yo'q. */
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const seen = useRef(false);

  useEffect(() => {
    if (phase !== 'playing' || seen.current) return;
    seen.current = true;
    setEndsAt(Date.now() + INTRO_MS);
  }, [phase]);

  // Taymer alohida effektda va muddati mutlaq. Ilgari taymer «bir marta»
  // qo'riqchisi bilan bitta effektda edi: React effektni ikki marta
  // chaqirganda birinchi taymer cleanup'da bekor bo'lardi, ikkinchi
  // chaqiruv esa qo'riqchi sababli qaytib ketardi — afisha yopilmay,
  // sanoq «1» da qotib qolardi. Muddat mutlaq bo'lgani uchun taymer
  // qayta qo'yilsa ham afisha aynan o'z paytida yopiladi.
  useEffect(() => {
    if (endsAt === null) return;
    const timer = window.setTimeout(
      () => setEndsAt(null),
      Math.max(0, endsAt - Date.now()),
    );
    return () => window.clearTimeout(timer);
  }, [endsAt]);

  return endsAt !== null;
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

  // Halqali sanoq: raqam atrofida kengayib so'nadigan halqa — «qidiryapmiz»
  // to'lqinining bitta nusxasi, boshlanish ham shu tilda gapiradi.
  return (
    <span className="versus__count" key={left}>
      <i className="versus__count-ring" aria-hidden="true" />
      {left}
    </span>
  );
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

/* ── Reaksiya ────────────────────────────────────────────────────────── */

/** Reaksiya tanlash: tugma bosilganda yetti belgi ustida ochiladi.
 *
 *  Tanlov bir bosishda tugashi kerak — jang ketayotgan bo'ladi. Yuborgach
 *  tugma ikki soniya «sovib» turadi va shu vaqt ichida uning o'rnida
 *  yuborilgan belgi turadi: bu ham «ketdi» degan javob, ham ketma-ket
 *  bosishning oldini olish (qoidalar yozuvlar orasida 1.5 soniya
 *  talab qiladi). */
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
        <Avatar name={me} uid={game.account?.uid} size={40} className="board-head__avatar" />
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
        <Avatar name={foe} uid={game.opponentUid ?? undefined} size={40} className="board-head__avatar" />
      </div>
    </div>
  );
}

/** Maydondagi muddat — `mm:ss`. */
const clock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.max(0, seconds % 60)).padStart(2, '0')}`;

function Playing({ game }: { game: Sozjang }) {
  const opponentRows = (game.opponent?.rows ?? []).map(verdictsOf);
  const lastFoe = opponentRows.length;

  return (
    <div className="stage stage--fight">
      {/* Maydonda raqib bitta emas: ikki tomonlama hisob o'rnida uchta
          kartochka va muddat turadi. */}
      {game.mardu ? (
        <>
          {game.left > 0 && (
            <div className={`arena__time${game.left <= 20 ? ' arena__time--urgent' : ''}`}>
              <strong>{clock(game.left)}</strong>
              <span>maydon muddati</span>
            </div>
          )}
          <ArenaTiles
            tiles={game.tiles}
            game="soztop"
            leader={0}
            total={game.arena.length}
          />
        </>
      ) : (
        <Scoreboard game={game} />
      )}

      <div className="fight">
        <div className="fight__side">
          <div className="play__area">
            <Board
              rows={game.rows}
              length={game.boardLength}
              flipRow={game.flipRow}
              shakeRow={game.shake ? (game.me?.rows?.length ?? 0) : -1}
              winRow={game.me?.won ? (game.me.rows?.length ?? 0) - 1 : -1}
              activeRow={game.me?.finished ? -1 : (game.me?.rows?.length ?? 0)}
            />
            {game.message && (
              <p className="play__msg" role="status">
                {game.message}
              </p>
            )}
          </div>
          {game.hint && !game.me?.finished && (
            <p className="fight__hint">
              💡 Maslahat: <b>{game.hint.index + 1}</b>-katakda <b data-script="word">{display(game.hint.unit)}</b> —
              harf keyingi qatorga qo‘yildi
            </p>
          )}
        </div>

        {/* O'rash kerak: panelning o'zi har yangi qatorda qaytadan
            yaratiladi (`key`), reaksiya esa undan mustaqil yashashi
            kerak.

            Maydonda raqib **taxtasi** ko'rsatilmaydi: sakkiztasi ekranga
            sig'maydi va sakkizta rangli qator birga javob haqida
            keragidan ko'p narsa aytardi. Reaksiya esa qoladi — jonli
            efirning o'zi shu. */}
        <div className="fight__foe">
          <ReactionBurst event={game.incoming} />
          <div className="fight__side fight__side--foe" key={lastFoe} hidden={game.mardu}>
            <div className="fight__who">
              <strong>
                {pretty(game.opponent?.nickname ?? 'Raqib')}
                <VerifiedMark uid={game.opponentUid} size={14} />
              </strong>
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
    </div>
  );
}

/* ── Jangdan chiqish tasdig'i ────────────────────────────────────────── */

/** Jang ketayotganda ekrandan shunchaki chiqib bo'lmaydi — raqib kutib
 *  qolmasin. Chiqishning yagona yo'li mag'lubiyat, shuning uchun ilovadagi
 *  `ConfirmSheet` kabi avval so'raladi (matnlar `battleLeave*` bilan bir
 *  xil). Ilgari «Jangdan chiqish» bosilishi bilan taslim bo'linardi. */
function LeaveConfirm({ onLeave, onClose }: { onLeave: () => void; onClose: () => void }) {
  return (
    <Modal
      title="Jangdan chiqish"
      lead="Jang hali tugamagan. Chiqsangiz bu mag‘lubiyat sifatida yoziladi."
      onClose={onClose}
    >
      <div className="result__actions leave__actions">
        <button className="btn btn--danger" onClick={onLeave}>
          Mag‘lub bo‘lib chiqish
        </button>
        <button className="btn btn--outline" onClick={onClose}>
          Qolish
        </button>
      </div>
    </Modal>
  );
}

/* ── Natija ──────────────────────────────────────────────────────────── */

const CONFETTI = Array.from({ length: 18 }, (_, index) => index);

function Result({ game }: { game: Sozjang }) {
  const { account } = game;
  const { copied, share } = useShare();
  /** Revansh — o'sha raqibga chaqiruv (ilovadagi natija ekranidagi
   *  «Qayta jang»). Yuboriladi va javob kutiladi; qabul qilinsa yangi
   *  jang shu sahifada ochiladi. */
  const [rematch, setRematch] = useState<InviteTarget | null>(null);
  const winner = game.battle?.winnerUid;
  /** Taslim bo'lib chiqdim, raqib esa hali o'ynayapti.
   *
   *  Jang hujjati shu payt hali yopilmagan: `winnerUid` ham, javob so'zi
   *  ham yo'q — ikkalasini server jangni yopganda yozadi. Shuning uchun
   *  natija hujjatdan emas, shu bayroqdan olinadi: chiqib ketgan odam
   *  yutqazadi, raqibning natijasi esa bu ekranga umuman kirmaydi. */
  const gaveUp = game.forfeited;
  /** Taslimdan keyin jang hujjati hali ochiq: raqib o'ynayapti, javob
   *  so'zi esa yozilmagan — ikkalasini server jangni yopganda qo'yadi.
   *  Raqib tugatgach kuzatuvchi hujjatni yangilaydi va ekran to'ladi. */
  const pending =
    gaveUp && game.battle?.status !== 'finished' && game.battle?.status !== 'expired';
  const mine = !gaveUp && !!winner && !!account && winner === account.uid;
  const draw = !gaveUp && !winner;
  const expired = game.battle?.status === 'expired';
  const opponentRows = (game.opponent?.rows ?? []).map(verdictsOf);
  const meName = pretty(account?.nickname ?? 'Siz');
  const foeName = pretty(game.opponent?.nickname ?? 'Raqib');

  // Maydonda «yutdi/yutqazdi» degan ikkilik yo'q — o'rin bor. Oxirgi
  // o'rin ham mag'lubiyat emas: odam ikkinchi, uchinchi uchun o'ynagan.
  const place = game.arena.find((row) => row.mine)?.rank ?? 0;
  const first = game.mardu && place === 1;
  /** Javob so'zining ma'nosi — ilovadagi natija ekranidagidek, so'z
   *  ostida. Jang tugagan, yashirishdan ma'no yo'q. */
  const meaning = useMeaning(game.battle?.answer, game.boardLength);

  const title = gaveUp
    ? 'Taslim bo‘ldingiz'
    : expired
    ? 'Chaqiruv muddati o‘tdi'
    : game.mardu
      ? first
        ? 'Maydon sizniki!'
        : `${place}-o‘rin`
      : mine
        ? 'Yutdingiz!'
        : draw
          ? 'Durang'
          : 'Bu safar raqib tezroq bo‘ldi';
  const emoji = gaveUp
    ? '🏳️'
    : expired
      ? '⌛'
      : game.mardu
        ? first
          ? '🏆'
          : '🎯'
        : mine
          ? '🏆'
          : draw
            ? '🤝'
            : '⚔️';

  return (
    <div
      className={`stage stage--result stage--${
        game.mardu ? (first ? 'won' : 'draw') : mine ? 'won' : draw ? 'draw' : 'lost'
      }`}
    >
      {(mine || first) && (
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
        {game.battle?.answer ? (
          <>
            <p className="verdict__label">Yashirin so‘z</p>
            <p className="result__word" data-script="word">{display(game.battle.answer)}</p>
            {meaning && <p className="result__def">{pretty(meaning)}</p>}
          </>
        ) : (
          /* Javob so'zi jang yopilgandagina hujjatga tushadi — taslim
             bo'lganda u hali yo'q. Sababi yozib qo'yiladi, aks holda
             ekran chala chizilgandek ko'rinardi. */
          pending && (
            <p className="verdict__note">
              Yashirin so‘z raqib o‘ynab bo‘lgach ochiladi — jang natijasi
              janglar tarixida chiqadi.
            </p>
          )
        )}
      </div>

      {/* Raqib kelmadi — arena so'lg'un holatda, o'ng tomonda «kelmadi». */}
      {expired && (
        <Versus
          me={meName}
          meUid={account?.uid}
          opponent="Raqib"
          mode="expired"
          length={game.boardLength}
          maxAttempts={game.maxAttempts}
        />
      )}

      {/* Maydonda jadval: ikki ustun sakkiz kishiga yaramaydi. */}
      {!expired && game.mardu && <ArenaStandings rows={game.arena} game="soztop" />}

      {/* Bitta uzun qator o'rniga ikki ustun: kim nechada topgani va
          nechada topgani bir qarashda solishtiriladi. */}
      {!expired && !game.mardu && <div className="score">
        <div className={`score__side${mine ? ' score__side--win' : ''}`}>
          <Avatar name={meName} uid={account?.uid} size={36} className="score__avatar" />
          <span className="score__who">
            {meName}
            <VerifiedMark uid={account?.uid} size={14} />
          </span>
          <strong className="score__points">{game.me?.score ?? 0}</strong>
          <span className="score__meta">
            {game.me?.won ? `${game.me.attempts ?? 0} urinishda topdi` : 'topa olmadi'}
          </span>
        </div>
        <span className="score__dash" aria-hidden="true">
          :
        </span>
        <div className={`score__side${!mine && !draw && !expired ? ' score__side--win' : ''}`}>
          <Avatar name={foeName} uid={game.opponentUid ?? undefined} size={36} className="score__avatar" />
          {/* Raqib ismi — uning ochiq profiliga: kim bilan o'ynaganini
              ko'rish va keyin yana chaqirish uchun. */}
          {game.opponentUid ? (
            <a className="score__who score__who--link" href={playerLink(game.opponentUid)}>
              {foeName}
              <VerifiedMark uid={game.opponentUid} size={14} />
            </a>
          ) : (
            <span className="score__who">{foeName}</span>
          )}
          <strong className="score__points">{game.opponent?.score ?? 0}</strong>
          <span className="score__meta">
            {game.opponent?.won
              ? `${game.opponent.attempts ?? 0} urinishda topdi`
              : pending
                ? 'o‘ynayapti'
                : 'topa olmadi'}
          </span>
        </div>
      </div>}

      {!expired && !game.mardu && <div className="fight fight--done">
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
      </div>}

      {account && !expired && <BattleStats uid={account.uid} compact />}

      <div className="result__actions">
        <button className="btn" onClick={() => void game.again()}>
          <Swords size={16} />
          {game.battle?.type === 'quick' ? 'Yangi raqib qidirish' : 'Yangi jang'}
        </button>
        {game.mardu && (
          <a className="btn btn--outline" href={links.mardu}>
            <Users size={16} />
            Maydonga qaytish
          </a>
        )}
        {!expired && !game.mardu && game.opponentUid && (
          /* Taslimdan keyin qasos **o'chiq**: chaqiruv raqibning hali
             ketayotgan jangi ustidan tushardi. Tugma yashirilmaydi —
             natija ekrani hamma joyda bir xil ko'rinishda qolsin. Raqib
             tugatgach tugma o'zi yonadi. */
          <button
            className="btn btn--outline"
            disabled={pending}
            title={pending ? 'Raqib jangni tugatgach chaqirsa bo‘ladi' : undefined}
            onClick={() =>
              setRematch({
                uid: game.opponentUid!,
                nickname: game.opponent?.nickname ?? 'Raqib',
                kind: 'rematch',
                length: game.boardLength,
              })
            }
          >
            <Swords size={16} />
            Revansh
          </button>
        )}
        {!expired && (
          <button className="btn btn--ghost" onClick={() => void share(game.shareText())}>
            <Send size={16} />
            {copied ? 'Nusxa olindi' : 'Natijani ulashish'}
          </button>
        )}
      </div>

      {rematch && <SendInvite target={rematch} onClose={() => setRematch(null)} />}

      {game.battle?.answer && (
        <ReportWord word={game.battle.answer} length={game.boardLength} mode="battle" />
      )}
    </div>
  );
}

export default function BattlePage() {
  const game = useSozjang();
  const intro = useIntro(game.phase);
  /** «Jangdan chiqish» bosildi, tasdiq kutilmoqda. */
  const [leaving, setLeaving] = useState(false);

  // O'zim tugatgan bo'lsam (raqibni kutyapman) chiqish taslim emas — so'ramay
  // lobbiga qaytiladi. Jang ketayotganda esa avval tasdiq, keyin taslim:
  // natija shu zahoti ochiladi, lobbi emas (ilovadagi `_forfeit`).
  const askLeave = () => {
    if (game.me?.finished) void game.leave();
    else setLeaving(true);
  };

  // Holat almashganda (qidiruv, kutish, jang, natija) sahifa tepaga
  // qaytadi. Telefonda tugma ekranning pastida bo'lardi va yangi ekran
  // ko'rinmay qolardi — ilgari «Raqib qidirish» bosilgach faqat footer
  // ko'rinib turardi.
  const phase = game.phase;
  useEffect(() => {
    if (phase === 'lobby') return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [phase]);

  // Kutish va boshlanish afishasida butun sahifa arena ohangida: fonda
  // och yashil-ko'k parda (ilovadagi `ArenaBackdrop`). Arena kartochkasi
  // yolg'iz turganda sahifaning qolgani oddiy oq ro'yxatdek ko'rinardi.
  const arena = phase === 'waiting' || (phase === 'playing' && intro);

  return (
    <section className={`oyin jang${arena ? ' jang--arena' : ''}`}>
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
            {game.phase === 'loading' && <Loading />}
            {game.phase === 'waiting' && <Waiting game={game} />}
            {/* Maydonda (uch kishidan boshlab) afisha o'rnida halqa:
                yuzma-yuz arena yolg'iz juftni ko'rsatardi, maydonda esa
                savol «kimlar bilan» — shakl o'yinchilar sonidan kelib
                chiqadi. */}
            {game.phase === 'playing' && intro && game.arena.length > 2 && (
              <MarduCountdown rows={game.arena} />
            )}
            {game.phase === 'playing' && intro && game.arena.length <= 2 && (
              <div className="stage">
                <Versus
                  me={pretty(game.account?.nickname ?? 'Siz')}
                  meUid={game.account?.uid}
                  opponent={pretty(game.opponent?.nickname ?? 'Raqib')}
                  opponentUid={game.opponentUid ?? undefined}
                  length={game.boardLength}
                  maxAttempts={game.maxAttempts}
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
                    <Keyboard
                      keyState={game.keyState}
                      onPress={game.press}
                      cols={game.boardLength}
                    />
                  </div>
                )}
                {/* Reaksiya jang ketayotganda ham, o'z navbatim tugab
                    raqibni kutayotganda ham yuboriladi — aynan o'sha
                    kutish paytida u eng o'rinli. */}
                <div className="jang__foot">
                  <ReactionPicker sent={game.sentReaction} onReact={game.react} />
                  <button className="link" onClick={askLeave}>
                    Jangdan chiqish
                  </button>
                </div>
                {leaving && (
                  <LeaveConfirm
                    onLeave={() => {
                      setLeaving(false);
                      void game.surrender();
                    }}
                    onClose={() => setLeaving(false)}
                  />
                )}
              </>
            )}
            {game.phase === 'finished' && <Result game={game} />}
          </>
        )}
      </div>
    </section>
  );
}

