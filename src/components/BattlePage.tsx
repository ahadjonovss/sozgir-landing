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
import { battleAqchaDelta } from '../lib/aqcha';
import { useAuth } from '../lib/auth';
import { countShare } from '../lib/badges';
import { inviteLink, verdictsOf, type BattlePlayer } from '../lib/battle';
import { useMeaning } from '../lib/useMeaning';
import { useSozjang, type Sozjang } from '../lib/useSozjang';
import { shareCardImage } from '../lib/shareCard';
import { punchline } from '../lib/shareLines';
import { display, pretty, split } from '../lib/uz';
import { links, playerLink } from '../data/site';
import Avatar from './Avatar';
import AdBanner from './AdBanner';
import ArenaHistory from './ArenaHistory';
import BattleBoard from './BattleBoard';
import BattleStats from './BattleStats';
import { Board, Keyboard } from './Board';
import CodeInput from './CodeInput';
import GameIntro from './GameIntro';
import { Check, Clock, Copy, Send, Swords, Trophy, Users } from './Icons';
import { ReactionBurst, ReactionPicker } from './Reactions';
import PlayerName from './PlayerName';
import ReportDialog from './ReportDialog';
import type { ReportKind } from '../lib/report';
import { AqchaDelta } from './Units';
import RotatingLine from './RotatingLine';
import ScoreRules from './ScoreRules';
import SendInvite, { type InviteTarget } from './SendInvite';
import MarduCountdown from './MarduCountdown';
import Versus from './Versus';
import Modal from './Modal';
import OpponentBoard from './OpponentBoard';
import ArenaStandings from './ArenaStandings';
import ArenaTiles from './ArenaTiles';
import { routeCode } from '../lib/useRoute';
import { turnirPath } from '../lib/turnir';
import { useSeries } from '../lib/useSeries';
import { TurnirGroups, TurnirNext, TurnirStageBar, TurnirWaiting } from './TurnirSide';
import { useTurnirHop } from '../lib/useTurnir';
import { useLiveStage } from '../lib/stage';
import { trackOnce } from '../lib/track';
import { stampMs, type Stamp } from '../lib/stamp';

/** Havoladagi kod — chaqiruvni bosib kelgan odam uchun.
 *
 *  Ikki ko'rinishi bor va ikkalasi ham o'qiladi: ilova ulashadigan
 *  `sozgir.uz/jang/AB12CD` (telefonda u ilovani ochadi, ilovasi yo'qda
 *  esa shu sahifani) va saytning o'z `?kod=AB12CD` si. */
function codeFromUrl(): string {
  const value =
    routeCode() || (new URLSearchParams(window.location.search).get('kod') ?? '');
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
}

/** Havola «darhol raqib qidir» deb aytganmi.
 *
 *  `/oynash` dagi kartochka shu bayroq bilan keladi: odam u yerda
 *  «Raqib qidirish» ni bosgan, ya'ni lobbida uni ikkinchi marta
 *  bostirishning ma'nosi yo'q. */
const quickFromUrl = () =>
  new URLSearchParams(window.location.search).get('tezkor') === '1';

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
  /* «SO'ZJANG» yorlig'i yo'q: odam bu yerga o'yinni tanlab keladi
     va nomi tanlov qatorida turibdi. */
  return (
    <GameIntro
      tone="orange"
      icon={<Swords size={16} />}
      title="Bir so‘z, ikki o‘yinchi"
      note="Ikkalangizga bir xil yashirin so‘z. Kim birinchi topsa — yutadi."
    />
  );
}

/** Qoidalar — yig'ilgan: kerak bo'lsa ochiladi, bo'lmasa joy olmaydi. */
function Rules() {
  return (
    <details className="lobby__rules">
      <summary>Qoidalar va aqcha</summary>
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
  const { ready, openPrompt } = useAuth();
  // Hisob holati aniqlanmaguncha jim turadi: `account` dastlab har doim
  // `null` va taklif kirgan odamga ham bir lahza ko'rinib ketardi.
  if (!ready) return null;
  return (
    <div className="lobby">
      <div className="lobby__main">
        <Head />
        <div className="panel lobby__card lobby__gate">
          <p>
            Jang uchun hisob kerak: raqib taxallusingizni ko‘radi, jang
            aqcha beradi.
          </p>
          {/* Bitta tugma: oyna ikkala ishni ham qiladi — hisob
              bo'lmasa o'sha yerda ochiladi. Ilgari «Kirish» va
              «Hisob ochish» yonma-yon turardi va ular ikki xil
              oyna ochardi. */}
          <div className="result__actions">
            <button className="btn btn--lg" onClick={() => openPrompt('signIn')}>
              Kirish
            </button>
          </div>
        </div>
        <Rules />
      </div>
      <aside className="lobby__side">
        <BattleBoard />
        {/* Telegram banneri vaqtincha olib turildi. */}
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
function Lobby({ game, inHub }: { game: Sozjang; inHub: boolean }) {
  const [code, setCode] = useState(codeFromUrl);
  const joined = useRef(false);
  const quickStarted = useRef(false);

  // Havoladagi kod bilan o'zi qo'shiladi — odam kodni terib o'tirmasin.
  // Keyin manzil tozalanadi: sahifa yangilanganda qayta urinilmaydi.
  useEffect(() => {
    if (joined.current || code.length !== 6) return;
    joined.current = true;
    void game.join(code);
    window.history.replaceState(null, '', '/sozjang');
  }, [code, game]);

  /* `?tezkor=1` bilan kelgan bo'lsa qidiruv o'zi boshlanadi.
     Kirmagan odamda boshlanmaydi: jang hisobni talab qiladi va
     qidiruv baribir xato bilan qaytardi — u yerda `Gate` o'z
     ishini qiladi. Bayroq manzildan olib tashlanadi: sahifa
     yangilanganda qidiruv ikkinchi marta ketmasin. Kod bilan
     kelgan havola ustun — ikkalasi bo'lsa do'stga qo'shiladi. */
  useEffect(() => {
    if (quickStarted.current || !quickFromUrl()) return;
    if (joined.current || !game.account || game.busy) return;
    // Bayroq **qidiruv ketganda** o'chiriladi, oldin emas: hisob
    // hali tanilmagan bo'lsa, keyingi renderda qayta urinib
    // ko'riladi. Ilgari bu yerda tartib teskari edi va kirish
    // oynasidan qaytgan odam uchun bayroq allaqachon yo'q edi.
    quickStarted.current = true;
    window.history.replaceState(null, '', '/sozjang');
    void game.quick();
  }, [game]);

  const join = () => {
    if (code.length === 6 && !game.busy) void game.join(code);
  };

  return (
    <div className="lobby">
      <div className="lobby__main">
        <Head />

        <div className="panel lobby__card">
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

          <div className="lobby__fast">
            <button className="btn btn--lg lobby__quick" onClick={game.quick} disabled={game.busy}>
              <Swords size={20} />
              {game.busy ? 'Qidirilmoqda…' : 'Raqib qidirish'}
            </button>
            <p className="panel__note lobby__hint">
              Kuchi sizga yaqin onlayn raqib. Hozir hech kim bo‘lmasa, navbatda
              kutasiz.
            </p>
          </div>
        </div>

        {/* `/oynash` ichida kartochka tablarning **ustida** turadi va
            butun kenglikni egallaydi (`PlayHub`) — bu yerda yana
            chizilsa, bitta ekranda bir xil son ikki marta
            ko'rinardi. Alohida `/sozjang` sahifasida esa u o'z
            joyida qoladi: u yerda tab ham, ustki qator ham yo'q. */}
        {!inHub && game.account && <BattleStats uid={game.account.uid} compact />}
        <Rules />
      </div>

      <aside className="lobby__side">
        {/* Kirgan odamga jadval emas, o'z tarixi: So'zjang jadvalining
            birinchi o'nligi oylab o'zgarmaydi va lobbida turib unga
            qarashning ma'nosi yo'q. «Kim bilan o'ynadim, qanday
            tugadi» esa aynan shu yerda kerak — yana bir jangga
            kirishdan oldin. Jadvalning o'zi kirmaganlar uchun `Gate` da
            qolgan: u yerda sahifa aks holda bo'sh ko'rinardi. */}
        <ArenaHistory />
        {/* Telegram banneri vaqtincha olib turildi. */}
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
  'Kuchi sizga yaqin raqib tanlanmoqda',
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
function JoinFuse({ expiresAt }: { expiresAt?: Stamp }) {
  const endsAt = stampMs(expiresAt);
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
  // Turnir guruhida kod ham, chaqiradigan odam ham yo'q —
  // u yerda butunlay boshqa ekran turadi.
  const { copied, share } = useShare();
  const [codeCopied, setCodeCopied] = useState(false);
  const code = game.code ?? '';
  const link = inviteLink(code);
  // Turnir guruhida kod ham, chaqiradigan odam ham yo'q — u yerda
  // butunlay boshqa ekran turadi. Tekshiruv **hook'lardan keyin**:
  // erta qaytish ularning tartibini buzardi.
  const series = useSeries(game.battle, game.battleId);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCodeCopied(true);
      window.setTimeout(() => setCodeCopied(false), 1600);
    } catch {
      // Ruxsat berilmadi — kod ekranda ko'rinib turibdi.
    }
  }

  if (series && game.battleId) {
    return <TurnirWaiting code={series} battleId={game.battleId} />;
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

/** Turnir guruhida o'ynayotgan odamga yon ustun qo'shadi.
 *
 *  Keng ekranda jangning ikki yoni bo'm-bo'sh turardi, holbuki
 *  odamda aniq savol bor edi: «qo'shni guruhda nima bo'lyapti?».
 *  Oddiy jangda esa ustun chizilmaydi. */
function TurnirStage({
  game,
  children,
}: {
  game: Sozjang;
  children: React.ReactNode;
}) {
  const series = useSeries(game.battle, game.battleId);
  if (!series || !game.battleId) return <>{children}</>;

  return (
    <div className="tnr-stage">
      <div className="tnr-stage__main">
        {/* Bosqich nomi taxtaning **ustida**: yon ustun tor ekranda
            chizilmaydi va telefonda o'ynayotgan odam finalni oddiy
            jangdan ajrata olmasdi. */}
        <TurnirStageBar code={series} battleId={game.battleId} />
        {children}
      </div>
      <TurnirGroups code={series} battleId={game.battleId} />
    </div>
  );
}

/* ── Jang ────────────────────────────────────────────────────────────── */

/** Jang boshlanishidagi uch soniyalik afisha.
 *
 *  Ilgari jang birdan taxta bilan ochilardi — kim bilan o'ynayotganini
 *  bilish uchun yon ustunga qarash kerak edi. Afisha bir marta, faqat
 *  jang boshlanganda ko'rinadi. */
function useIntro(phase: string, battleId: string | null): boolean {
  /** Afisha yopiladigan payt — mutlaq vaqt. `null` bo'lsa afisha yo'q. */
  const [endsAt, setEndsAt] = useState<number | null>(null);
  /** Afisha qaysi jangda ko'rsatilgan.
   *
   *  Ilgari bu oddiy `boolean` edi: «bir marta ko'rsatildi». Sahifa esa
   *  janglar orasida yopilmaydi — «Yangi raqib qidirish» bosilganda
   *  o'sha komponent qoladi. Natijada afisha faqat varaqdagi
   *  **birinchi** jangda chiqardi. */
  const shown = useRef<string | null>(null);

  useEffect(() => {
    if (phase !== 'playing' || !battleId || shown.current === battleId) return;
    shown.current = battleId;
    setEndsAt(Date.now() + INTRO_MS);
  }, [battleId, phase]);

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
  /*
   * Raqib tugatganda «tugatdi» deyish kam edi.
   *
   * U so'zdan uchta narsa bilinmasdi: topdimi, nechanchi urinishda va
   * men nimaga erishishim kerak. Jang esa shu paytda hal bo'ladi —
   * odam aynan shunda bilishi kerak. Shuning uchun holat o'rniga
   * natijaning o'zi yoziladi.
   */
  const foeAttempts = game.opponent?.attempts ?? foeRows;
  const status = game.opponent?.finished
    ? game.opponent.won
      ? `${foeAttempts} urinishda topdi`
      : 'topa olmadi'
    : foeRows === 0
      ? 'o‘ylayapti…'
      : `${foeRows}-urinish`;

  /** Raqib tugatdi, men hali o'ynayapman — nima qilish kerakligi.
   *
   *  Ilgari bu yerda «raqib shuncha ball to'pladi, undan oshish uchun
   *  kamroq urinish va tezlik kerak» turardi. Endi bunday deyish
   *  mumkin emas: g'olib **birinchi topgan** odam va raqib allaqachon
   *  tugatgan bo'lsa, undan o'zib bo'lmaydi.
   *
   *  Shuning uchun va'da berilmaydi — bor haqiqat aytiladi. Taxta esa
   *  ochiq qolaveradi: so'zni topib ko'rish odamning o'z ishi va uni
   *  to'xtatishning sababi yo'q. */
  const target =
    game.opponent?.finished && !game.me?.finished
      ? game.opponent.won
        ? 'Raqib so‘zni birinchi topdi — bu jang uniki. So‘zni baribir topib ko‘ring.'
        : 'Raqib topa olmadi — topsangiz, g‘alaba sizniki.'
      : null;

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
          {/* Yashil faqat topgani uchun: «topa olmadi» ni yashil
              yozish natijani teskari o'qitardi. */}
          <span className={`board-head__status${game.opponent?.won ? ' board-head__status--done' : ''}`}>
            {status}
          </span>
        </div>
        <Avatar name={foe} uid={game.opponentUid ?? undefined} size={40} className="board-head__avatar" />
      </div>
      {target && <p className="board-head__note">{target}</p>}
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
      {/* Muddat **ikkala** shaklda ham ko'rsatiladi.
          Ilgari u faqat maydonda chizilardi, chunki 1v1 da qattiq
          muddat yo'q edi. Endi server unga ham chegara qo'yadi (besh
          daqiqa) va vaqti tugagan jangni o'zi yopadi — ya'ni sanoq
          bor, lekin yashirin edi: odam ogohlantirishsiz uzilardi. */}
      {!game.mardu && game.left > 0 && (
        <div className={`arena__time${game.left <= 20 ? ' arena__time--urgent' : ''}`}>
          <strong>{clock(game.left)}</strong>
          <span>jang muddati</span>
        </div>
      )}
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
                {/* Nom, tasdiq belgisi va homiylik muhri — bittada.
                    Ilgari bu yerda faqat tasdiq belgisi chizilardi va
                    muhr jadvalda ko'rinib, jangda yo'qolardi. */}
                <PlayerName
                  uid={game.opponentUid}
                  name={game.opponent?.nickname ?? 'Raqib'}
                  size={14}
                />
              </strong>
              <span>
                {game.opponent?.finished
                  ? game.opponent.won
                    ? `${game.opponent.attempts ?? lastFoe} urinishda topdi`
                    : 'topa olmadi'
                  : `${lastFoe}/${game.maxAttempts}`}
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

/** Jangga sarflangan vaqt — «1:24» yoki «42 soniya».
 *
 *  Daqiqasiz qisqa jangda «0:42» o'qishga noqulay va nolning o'zi
 *  hech narsa aytmaydi, shuning uchun bir daqiqagacha so'z bilan
 *  yoziladi.
 *
 *  Vaqt natijada aniq kerak: So'zjangda g'olib **birinchi topgan**
 *  odam bo'ladi, ya'ni bu son nima uchun shunday tugaganini
 *  tushuntiradigan yagona narsa. */
function spentTime(ms: number): string {
  const total = Math.round(ms / 1000);
  if (total < 60) return `${total} soniya`;
  const minutes = Math.floor(total / 60);
  return `${minutes}:${String(total % 60).padStart(2, '0')}`;
}

/** O'yinchining shu jangdagi aqchasi — natija kartochkasidagi qator.
 *
 *  Ilgari u yerda «6 urinishda topdi» turardi. Urinishlar soni esa
 *  ostidagi taxtada qator-baqator ko'rinib turibdi, ya'ni qator o'sha
 *  gapni takrorlardi. Aqcha esa boshqa hech qayerda aytilmasdi va
 *  uning uchun pastda alohida kartochka kerak bo'lardi.
 *
 *  Reyting kelmasa (robot, yoki eski jang) eski matn qoladi: bo'sh
 *  qator qoldirgandan ko'ra urinishlar soni ma'qul. */
function aqchaOf(player: BattlePlayer | undefined): number | null {
  if (typeof player?.ratingBefore !== 'number') return null;
  if (typeof player.ratingAfter !== 'number') return null;
  return battleAqchaDelta(player.ratingBefore, player.ratingAfter);
}

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
  /** Qaysi shikoyat oynasi ochiq. */
  const [report, setReport] = useState<ReportKind | null>(null);
  const meAqcha = aqchaOf(game.me);
  const foeAqcha = aqchaOf(game.opponent);
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
  /** Turnir guruhi bo'lsa — o'z turniriga qaytish yo'li. Umumiy maydon
   *  bo'limi bu yerda noto'g'ri manzil: odam turnirning keyingi
   *  davrasini kutyapti. */
  const series = useSeries(game.battle, game.battleId);

  /* Tugagan jang — Telegram guruhiga. Yakka o'yinni `Play` yozadi,
     onlayn o'yinlar esa shu paytgacha umuman yozilmasdi: guruhda
     faqat kunlik so'z ko'rinardi.

     Kalit — jang raqami, ya'ni bitta jang bitta xabar. Natija ekrani
     qayta chizilsa ham (revansh oynasi ochildi, shikoyat yopildi)
     ikkinchi xabar ketmaydi.

     Javob so'zi yozilmaydi: `Play` dagi sabab bu yerda ham amal
     qiladi — guruhni ochgan odam o'ynashdan oldin ko'rib qo'yardi. */
  useEffect(() => {
    if (!game.battleId) return;
    trackOnce(`jang:${game.battleId}`, 'game', [
      ['O‘yin', game.mardu ? 'Mardu maydon' : series ? 'Turnir' : 'So‘zjang'],
      [
        'Natija',
        expired
          ? 'muddati o‘tdi'
          : gaveUp
            ? 'taslim'
            : game.mardu
              ? place > 0
                ? `${place}-o‘rin`
                : 'tugadi'
              : mine
                ? 'g‘alaba'
                : draw
                  ? 'durang'
                  : 'mag‘lubiyat',
      ],
      ['Kim', meName],
      ['Raqib', game.mardu ? `${game.arena.length} kishi` : foeName],
      ['Aqcha', meAqcha || null],
    ]);
    /* Bog'liqlikda faqat jang raqami: natija o'sha paytda o'qiladi va
       keyingi qayta chizish yangi xabar emas. */
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [game.battleId]);

  /** Javob so'zining ma'nosi — ilovadagi natija ekranidagidek, so'z
   *  ostida. Jang tugagan, yashirishdan ma'no yo'q. */
  const meaning = useMeaning(game.battle?.answer, game.boardLength);
  /** Natijani ulashadi: avval rasm (ilovadagidek kartochka), brauzer
   *  rasmni ko'tarmasa — eski matnli yo'l. Emoji to'r chatda boshqa
   *  xabarlar orasida ko'zga tashlanmasdi. */
  const shareResult = async () => {
    const outcome = game.mardu
      ? place <= 3 && place > 0
        ? 'podium'
        : 'field'
      : mine
        ? 'win'
        : draw
          ? 'draw'
          : 'loss';
    const seed = game.battleId ?? game.battle?.answer ?? 'jang';
    const attempts = (player: typeof game.me) =>
      player?.won ? `${player.attempts ?? player.rows?.length ?? 0}/${game.maxAttempts}` : `X/${game.maxAttempts}`;

    const sent = await shareCardImage(
      {
        game: 'So‘zjang',
        tone:
          outcome === 'win' ? 'win' : outcome === 'draw' ? 'draw' : outcome === 'loss' ? 'loss' : 'field',
        verdict: game.mardu ? `${place}-o‘rin` : mine ? 'G‘alaba' : draw ? 'Durang' : 'Mag‘lubiyat',
        punchline: punchline(outcome, seed),
        me: {
          nickname: meName,
          value: attempts(game.me),
          caption: game.me?.won ? 'topdi' : 'topa olmadi',
          winner: mine || first,
        },
        // Maydonda raqib yo'q: sakkiz kishini ikki ustunga bo'lib
        // bo'lmaydi va o'rin baribir hammasini almashtiradi.
        ...(game.mardu
          ? { rank: { rank: place, players: game.arena.length } }
          : {
              rival: {
                nickname: foeName,
                value: attempts(game.opponent),
                caption: game.opponent?.won ? 'topdi' : 'topa olmadi',
                winner: !mine && !draw,
              },
            }),
        chips: [`${game.boardLength} harf`],
        // Javob harflari kartada ochiq turadi: jang tugagan, yashirishdan
        // ma'no yo'q (ekranda ham shunday).
        ...(game.battle?.answer
          ? {
              tilesLabel: 'Yashirin so‘z',
              tiles: split(game.battle.answer).map((unit) => ({ text: unit })),
            }
          : {}),
      },
      game.shareText(),
    );
    if (!sent) await share(game.shareText());
    else countShare();
  };

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

      {/* Ulashish — burchakdagi belgi.
          Ilgari u pastdagi tugmalar qatorida turardi va «Yangi raqib
          qidirish» bilan bir xil og'irlikda ko'rinardi. Aslida odam
          jangdan keyin birinchi navbatda keyingi jangni tanlaydi,
          ulashish esa ikkinchi darajali va matnsiz ham tushunarli. */}
      {!expired && (
        <button
          className={`result__share${copied ? ' result__share--done' : ''}`}
          onClick={() => void shareResult()}
          aria-label={copied ? 'Nusxa olindi' : 'Natijani ulashish'}
          title={copied ? 'Nusxa olindi' : 'Natijani ulashish'}
        >
          <Send size={16} />
        </button>
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
            {/* So'zga qancha vaqt ketgani — so'zning o'zi ostida.
                G'olibni endi vaqt hal qiladi, ya'ni bu son natijani
                tushuntiradi: «raqib tezroq bo'ldi» degan sarlavha
                yonida «siz 1:24 sarfladingiz» o'z o'rniga tushadi. */}
            {typeof game.me?.durationMs === 'number' && (
              <p className="result__time">{spentTime(game.me.durationMs)}</p>
            )}
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

      {/* Ikki ustun: kim nima olgani bir qarashda solishtiriladi.
          Ilgari bu yerda jang **balli** ham turardi — eng katta son
          bo'lib. U endi hech narsani aytmaydi: g'olibni vaqt hal
          qiladi, aqcha esa g'alaba-mag'lubiyatdan hisoblanadi va
          shu yerning o'zida yozilgan, urinishlar soni ham ostidagi
          taxtada ko'rinib turibdi. Topmagan odamga ball 0 beriladi,
          ya'ni ikkovi ham topmagan jangda «0 : 0» chiqib, faqat
          «bu nima?» degan savol tug'dirardi.

          Ball bilan birga oradagi ikki nuqta ham ketdi — u o'sha ikki
          sonni ajratish uchun turardi. */}
      {!expired && !game.mardu && <div className="score">
        <div className={`score__side${mine ? ' score__side--win' : ''}`}>
          <Avatar name={meName} uid={account?.uid} size={36} className="score__avatar" />
          <span className="score__who">
            <PlayerName uid={account?.uid} name={meName} size={14} />
          </span>
          <span className="score__meta">
            {meAqcha !== null ? (
              <AqchaDelta value={meAqcha} />
            ) : game.me?.won ? (
              `${game.me.attempts ?? 0} urinishda topdi`
            ) : (
              'topa olmadi'
            )}
          </span>
        </div>
        <div className={`score__side${!mine && !draw && !expired ? ' score__side--win' : ''}`}>
          <Avatar name={foeName} uid={game.opponentUid ?? undefined} size={36} className="score__avatar" />
          {/* Raqib ismi — uning ochiq profiliga: kim bilan o'ynaganini
              ko'rish va keyin yana chaqirish uchun. */}
          {game.opponentUid ? (
            <a className="score__who score__who--link" href={playerLink(game.opponentUid)}>
              <PlayerName uid={game.opponentUid} name={foeName} size={14} />
            </a>
          ) : (
            <span className="score__who">{foeName}</span>
          )}
          <span className="score__meta">
            {pending ? (
              'o‘ynayapti'
            ) : foeAqcha !== null ? (
              <AqchaDelta value={foeAqcha} />
            ) : game.opponent?.won ? (
              `${game.opponent.attempts ?? 0} urinishda topdi`
            ) : (
              'topa olmadi'
            )}
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

      {/* Davra tugadi — endi nima bo'ladi. Tugmalardan **oldin**:
          odam avval keyingi davra o'zi boshlanishini bilsin, keyin
          qayerga borishni tanlasin. */}
      {series && <TurnirNext code={series} />}

      <div className="result__actions">
        {/* Turnirda «Yangi jang» chalg'itadi: odam o'yinni o'zi
            tanlamaydi, keyingi davrani turnir ochadi. */}
        {!series && (
          <button className="btn" onClick={() => void game.again()}>
            <Swords size={16} />
            Yangi raqib qidirish
          </button>
        )}
        {series && (
          <a className="btn" href={turnirPath(series)}>
            <Trophy size={16} />
            Turnir jadvali
          </a>
        )}
        {game.mardu && !series && (
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
      </div>

      {rematch && <SendInvite target={rematch} onClose={() => setRematch(null)} />}

      {/* Shikoyat — oynada.
          Ilgari ikkalasi ham `/shikoyat/...` sahifasiga olib borardi
          va natija ekrani tashlab chiqilardi. Shikoyat esa bir
          qarashlik ish: sabab tanlanadi, izoh ixtiyoriy va shu bilan
          tamom — uning uchun natijadan chiqib, keyin qaytib kelish
          ortiqcha yo'l edi.

          Sahifa o'z o'rnida qoldi: ilova ulashadigan havolalar o'sha
          yerga tushadi. Shakl esa ikkovida bitta (`ReportForm`).
          Ilovadagi natija ekranida ham shu ikki amal turadi
          (`battle_result_page.dart`). */}
      {(game.battle?.answer || (!game.mardu && game.opponentUid)) && (
        <div className="result__links">
          {game.battle?.answer && (
            <button className="report-link" onClick={() => setReport('word')}>
              Bu so‘z ustidan shikoyat
            </button>
          )}
          {!game.mardu && game.opponentUid && (
            <button className="report-link" onClick={() => setReport('player')}>
              Raqib ustidan shikoyat
            </button>
          )}
        </div>
      )}

      {report === 'word' && game.battle?.answer && (
        <ReportDialog
          kind="word"
          value={game.battle.answer}
          mode="jang"
          onClose={() => setReport(null)}
        />
      )}
      {report === 'player' && game.opponentUid && (
        <ReportDialog
          kind="player"
          value={game.opponentUid}
          name={foeName}
          battleId={game.battleId ?? undefined}
          onClose={() => setReport(null)}
        />
      )}
    </div>
  );
}

export default function BattlePage({ inHub = false }: { inHub?: boolean } = {}) {
  const game = useSozjang();
  const intro = useIntro(game.phase, game.battleId);
  /** Turnir davrasimi. Kutish kartochkasidagi tugma shunga qarab
   *  o'zgaradi: turnirda «keyingi jang» degan narsa yo'q — davrani
   *  turnirning o'zi ochadi. */
  const series = useSeries(game.battle, game.battleId);
  // Turnir guruhida o'ynagan odamni keyingi davra o'zi olib ketadi:
  // natija ekranida o'tirgan odam turnir hujjatini kuzatmaydi.
  useTurnirHop(game.battleId, game.battle);
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

  /* Lobbidan chiqdi — demak o'ynayapti: tanlov nomlari yashirinadi va
     keng ekranda chetlarga reklama chiqadi. Natija ekrani ham shu
     hisobda: u hali jangning davomi, odam undan lobbiga qaytadi. */
  useLiveStage('sozjang', phase !== 'lobby');

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

            {game.phase === 'lobby' && <Lobby game={game} inHub={inHub} />}
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
                <TurnirStage game={game}>
                  <Playing game={game} />
                </TurnirStage>
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
                    {/* Turnirda «Keyingi jang» noto'g'ri javob: keyingi
                        jangni odam tanlamaydi, uni davra ochadi. O'rniga
                        jadval — o'zining o'rni, boshqa guruhlardagi
                        holat va keyingi davragacha qancha qolgani
                        o'sha yerda turadi.

                        Turnirdan tashqarida esa tugma o'z ma'nosida:
                        odamning qiladigan ishi qolmagan — urinishlari
                        tugagan yoki so'zni topgan, natija esa raqibga
                        bog'liq. Kutishni xohlamasa ketsin; jang
                        natijasi baribir yoziladi. */}
                    {series ? (
                      <a className="btn btn--sm" href={turnirPath(series)}>
                        <Trophy size={16} />
                        Turnir jadvali
                      </a>
                    ) : (
                      <button className="btn btn--sm" onClick={() => void game.again()}>
                        <Swords size={16} />
                        Keyingi jang
                      </button>
                    )}
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
                    kutish paytida u eng o'rinli.

                    «Jangdan chiqish» esa faqat o'ynayotgan odamga:
                    u taslim bo'lish degani va uni tasdiq oynasi
                    so'raydi. Urinishlari tugagan odamda taslim
                    bo'ladigan narsa qolmagan — u yerda kutish
                    kartochkasidagi «Keyingi jang» turadi. */}
                <div className="jang__foot">
                  <ReactionPicker sent={game.sentReaction} onReact={game.react} />
                  {!game.me?.finished && (
                    <button className="link" onClick={askLeave}>
                      Jangdan chiqish
                    </button>
                  )}
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

