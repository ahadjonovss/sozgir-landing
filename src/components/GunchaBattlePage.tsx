/** G'uncha jangi — `/gunchajang`.
 *
 *  Ikkalangizga bir xil g'uncha beriladi, uch daqiqa vaqt bo'ladi va kim
 *  ko'p to'plasa — o'sha yutadi. Jang ekrani yakka g'unchadan **shakl
 *  jihatidan farq qilmaydi**: o'sha gul, o'sha tugmalar, faqat tepasiga
 *  taymer va raqib qatori qo'shiladi — o'rganish qaytadan boshlanmasin.
 *
 *  Jang saytda ham, ilovada ham bir xil hujjatlar va bir xil funksiyalar
 *  orqali ketadi: telefondagi do'stni kod bilan chaqirsa bo'ladi. */
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { links, site } from '../data/site';
import { useAuth } from '../lib/auth';
import { countShare } from '../lib/badges';
import { shareCardImage } from '../lib/shareCard';
import { punchline } from '../lib/shareLines';
import { inviteLink } from '../lib/battle';
import { wordOf } from '../lib/guncha';
import { useGunchaJang, type GunchaJang } from '../lib/useGunchaJang';
import { GUNCHA_SECONDS } from '../lib/gunchaBattle';
import { display, pretty } from '../lib/uz';
import { useLongPress } from '../lib/useLongPress';
import GameIntro from './GameIntro';
import AccountCall from './AccountCall';
import ArenaHistory from './ArenaHistory';
import ArenaStandings from './ArenaStandings';
import ArenaTiles from './ArenaTiles';
import Avatar from './Avatar';
import CodeInput from './CodeInput';
import GunchaCountdown from './GunchaCountdown';
import GunchaFlower from './GunchaFlower';
import { Check, ChevronRight, Copy, Send, Swords, Trophy, Users } from './Icons';
import Modal from './Modal';
import MarduCountdown from './MarduCountdown';
import { ReactionBurst, ReactionPicker } from './Reactions';
import { VerifiedMark } from './PlayerName';
import RotatingLine from './RotatingLine';
import ScoreRules from './ScoreRules';
import SendInvite, { type InviteTarget } from './SendInvite';
import { battleAqchaDelta } from '../lib/aqcha';
import { AqchaDelta } from './Units';
import { seriesOf, turnirPath } from '../lib/turnir';
import { TurnirGroups, TurnirNext, TurnirWaiting } from './TurnirSide';
import { useTurnirHop } from '../lib/useTurnir';

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
  const { account } = useAuth();
  const intro = useIntro(game);
  // Turnir guruhida o'ynagan odamni keyingi davra o'zi olib ketadi:
  // natija ekranida o'tirgan odam turnir hujjatini kuzatmaydi.
  useTurnirHop(game.battleId, game.battle);

  if (!account) {
    return (
      <AccountCall
        title="Jang uchun hisob kerak"
        note="Raqibingiz taxallusingizni ko‘radi va jang aqcha beradi — shuning uchun g‘uncha jangi hisobsiz o‘ynalmaydi."
      />
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
        {/* Jang boshlanishida uch soniyalik sanoq. Maydonda (uch
            kishidan boshlab) halqa, yakkama-yakkada esa ochilayotgan
            gul — shakl o'yinchilar sonidan kelib chiqadi. */}
        {intro > 0 &&
          (game.phase === 'playing' || game.phase === 'finishing') &&
          (game.arena.length > 2 ? (
            <MarduCountdown rows={game.arena} />
          ) : (
            <GunchaCountdown
              me={game.account?.nickname ?? 'Siz'}
              meUid={game.account?.uid}
              opponent={game.opponent?.nickname ?? 'Raqib'}
              opponentUid={game.opponentUid}
              left={intro}
            />
          ))}
        {intro === 0 && (game.phase === 'playing' || game.phase === 'finishing') && (
          <TurnirStage game={game}>
            <Playing game={game} />
          </TurnirStage>
        )}
        {game.phase === 'finished' && <Result game={game} />}
      </div>
    </section>
  );
}

/** Sanoqda qolgan soniya; sanoq yo'q bo'lsa 0.
 *
 *  Ikki farqi bor va ikkalasi ham ilovadagidek:
 *
 *  * **sanoq jangni kechiktirmaydi** — vaqtni server sanaydi (`endsAt`)
 *    va uni ushlab turib bo'lmaydi; sanoq shu uch soniyani taxta o'rniga
 *    gulning ochilishi bilan to'ldiradi, xolos;
 *  * **faqat endigina boshlangan jangda chiqadi** — ekrandan chiqib
 *    qaytgan odam uni ko'rmaydi: jang o'rtasida turib «boshlanmoqda»
 *    deyish aldov bo'lardi. Ilova buni `startedAt` bo'yicha ajratadi,
 *    saytda esa o'sha savolga qolgan vaqt javob beradi: o'n soniyadan
 *    ko'pi ketgan bo'lsa — bu qaytib kirish. */
function useIntro(game: GunchaJang): number {
  const [endsAt, setEndsAt] = useState<number | null>(null);
  /** Afisha qaysi jangda ko'rsatilgan.
   *
   *  Ilgari bu oddiy `boolean` edi: «bir marta ko'rsatildi». Sahifa esa
   *  janglar orasida yopilmaydi — «Yana o'ynash» bosilganda o'sha
   *  komponent qoladi. Natijada afisha faqat varaqdagi **birinchi**
   *  jangda chiqardi, keyingilari esa to'g'ridan-to'g'ri taxtadan
   *  boshlanardi. */
  const shown = useRef<string | null>(null);
  const [left, setLeft] = useState(0);

  const fresh = game.phase === 'playing' && game.left > GUNCHA_SECONDS - 10;
  const id = game.battleId;
  useEffect(() => {
    if (!fresh || !id || shown.current === id) return;
    shown.current = id;
    setEndsAt(Date.now() + INTRO_MS);
    setLeft(Math.round(INTRO_MS / 1000));
  }, [fresh, id]);

  // Taymer alohida va muddati mutlaq: React effektni ikki marta
  // chaqirsa ham sanoq o'z paytida tugaydi.
  useEffect(() => {
    if (endsAt === null) return;
    const timer = window.setInterval(() => {
      const ms = endsAt - Date.now();
      if (ms <= 0) {
        setEndsAt(null);
        setLeft(0);
        return;
      }
      setLeft(Math.ceil(ms / 1000));
    }, 200);
    return () => window.clearInterval(timer);
  }, [endsAt]);

  return left;
}

const INTRO_MS = 3000;

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
        <GameIntro
          tone="teal"
          icon={<span className="lobby__emoji">🌸</span>}
          title="Bitta g‘uncha, uch daqiqa"
          note="Ikkalangizga bir xil yettita harf. Kim ko‘p so‘z yig‘sa — o‘sha yutadi."
        />

        <div className="panel lobby__card">
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

          <div className="lobby__fast">
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
              Kim ko‘p to‘plasa — o‘sha yutadi.
            </p>
          </div>
        </div>

        <div className="panel">
          <h3>Qoidalar</h3>
          <ol className="guncha__rules">
            <li>So‘z kamida 4 harfdan bo‘lsin va yurak harf qatnashsin.</li>
            <li>Uzun so‘z ko‘proq beradi, pangramma — qo‘shimcha 7.</li>
            <li>Vaqtni server hisoblaydi: muddat o‘tgach so‘z hisoblanmaydi.</li>
            <li>Hisob teng bo‘lsa — durang.</li>
            <ScoreRules game="gunchajang" bare />
          </ol>
        </div>
      </div>

      <aside className="lobby__side">
        <ArenaHistory />
        {/* Telegram banneri vaqtincha olib turildi. */}
        {/* «Yakka o'ynash» taklifi ketdi: bu sahifa birov bilan
            o'ynash haqida, kunlik g'unchaning o'z manzili bor. */}
      </aside>
    </div>
  );
}

/** Qidiruv davomida almashadigan izohlar — So'zjangdagidek.
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

/** Raqib qidirish ekrani — So'zjangdagi bilan bir xil.
 *
 *  Ilgari bu yerda oddiy kartochka turardi: sarlavha, bitta qator va
 *  butun enni egallagan «Bekor qilish» tugmasi. Qidiruv esa ikkala
 *  o'yinda ham bitta ish va u bir xil ko'rinishi kerak — odam
 *  So'zjangdan g'unchaga o'tganda boshqa saytga tushgandek
 *  bo'lmasligi lozim. Shu sababli bu yerda ham radar, sanoq va
 *  almashadigan jumlalar turadi.
 *
 *  Farqi bittasi: yorliqda so'z uzunligi emas, jang muddati turadi —
 *  g'unchada harflar soni doim yettita va u haqda aytadigan gap
 *  yo'q. */
function Searching({ game }: { game: GunchaJang }) {
  const name = pretty(game.account?.nickname ?? 'Siz');
  const pad = (value: number) => String(value).padStart(2, '0');
  return (
    <div className="stage">
      <div className="stage__head">
        <h2>Raqib qidirilmoqda</h2>
        <span className="stage__tag">{GUNCHA_SECONDS / 60} daqiqa</span>
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

/** Kod bilan chaqiruv — raqib kirgunicha. */
function Waiting({ game }: { game: GunchaJang }) {
  const [copied, setCopied] = useState(false);
  const link = game.code ? inviteLink(game.code, 'guncha') : '';
  // Turnir guruhida kod ham, chaqiradigan odam ham yo'q — u yerda
  // butunlay boshqa ekran turadi. Tekshiruv **hook'lardan keyin**:
  // erta qaytish ularning tartibini buzardi.
  const series = seriesOf(game.battle);

  const copy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link).catch(() => undefined);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  if (series && game.battleId) {
    return <TurnirWaiting code={series} battleId={game.battleId} />;
  }

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

/** Turnir guruhida o'ynayotgan odamga yon ustun qo'shadi.
 *
 *  Keng ekranda jangning ikki yoni bo'm-bo'sh turardi, holbuki
 *  odamda aniq savol bor edi: «qo'shni guruhda nima bo'lyapti?».
 *  Oddiy jangda esa ustun chizilmaydi — qo'shiladigan gap yo'q. */
function TurnirStage({
  game,
  children,
}: {
  game: GunchaJang;
  children: React.ReactNode;
}) {
  const series = seriesOf(game.battle);
  if (!series || !game.battleId) return <>{children}</>;

  return (
    <div className="tnr-stage">
      <div className="tnr-stage__main">{children}</div>
      <TurnirGroups code={series} battleId={game.battleId} />
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
        {/* Maydonda yonma-yon ikki qator o'rniga uchta qat'iy kartochka:
            sakkiz kishilik ro'yxat ekranga sig'maydi. */}
        {game.mardu ? (
          <ArenaTiles
            tiles={game.tiles}
            game="guncha"
            leader={game.arena[0]?.player.score ?? 0}
            total={game.arena.length}
          />
        ) : (
          <div className="gbar__rows">
            <span className="gbar__row gbar__row--me">
              <Avatar name={game.account?.nickname ?? 'Siz'} uid={game.account?.uid} size={24} />
              <b>
                {pretty(game.account?.nickname ?? 'Siz')}
              </b>
              <em>{game.score}</em>
              <span>{game.mine.length} so‘z</span>
            </span>
            <span className="gbar__row">
              <Avatar
                name={game.opponent?.nickname ?? 'Raqib'}
                uid={game.opponentUid ?? undefined}
                size={24}
              />
              <b>
                {pretty(game.opponent?.nickname ?? 'Raqib')}
              </b>
              <em>{game.opponent?.score ?? 0}</em>
              <span>{game.opponent?.wordCount ?? 0} so‘z</span>
            </span>
          </div>
        )}
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
        <DeleteButton
          onBackspace={() => game.press('back')}
          onClear={game.clear}
          disabled={game.typed.length === 0 || game.phase !== 'playing'}
        />
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
          {game.mine.length} so‘z · {game.score}
        </span>
        <button className="link" onClick={() => setConfirm(true)}>
          Chiqish
        </button>
      </div>

      {confirm && (
        /* Tasdiq oynasi So'zjangdagining o'zi (`LeaveConfirm`): izoh
           `Modal` ning `lead` i bo'lib keladi, tugmalar esa
           `result__actions leave__actions` ichida to'liq o'lchamda
           turadi. Ilgari bu yerda o'z razmetkasi bor edi —
           `modal__lead` va `modal__foot` — va ikkita kichik tugma
           bir-biriga tiqilib qolardi. */
        <Modal
          title="Jangdan chiqish"
          lead="Jang davom etadi va raqib o‘z bali bilan qoladi — siz esa mag‘lub bo‘lasiz."
          onClose={() => setConfirm(false)}
        >
          <div className="result__actions leave__actions">
            <button className="btn btn--danger" onClick={game.leave}>
              Mag‘lub bo‘lib chiqish
            </button>
            <button className="btn btn--outline" onClick={() => setConfirm(false)}>
              Qolish
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
  /** Qaysi so'zlar ro'yxati ochiq. */
  const [list, setList] = useState<'found' | 'missed' | null>(null);
  const uid = game.account?.uid;
  const winner = game.battle?.winnerUid;
  const mineScore = game.me?.score ?? game.score;
  const theirScore = game.opponent?.score ?? 0;
  // Xom reyting emas, **aqcha**: ekranda hamma joyda shu shkala
  // turadi (`lib/aqcha.ts`) va jadvaldagi qator ham shuni
  // ko'rsatadi. Ilgari bu yerda xom ayirma turardi va kartochkadagi
  // son ro'yxatdagisidan ikki barobar katta chiqardi.
  /** O'yinchining shu jangdagi aqchasi.
   *
   *  Ilgari faqat o'ziniki hisoblanardi va u sarlavha ostida, alohida
   *  qatorda turardi — raqib nima olgani esa hech qayerda
   *  aytilmasdi. Endi ikkalasi ham o'z kartochkasida: jang ikki
   *  tomonlama va «men nima oldim» degan savol yolg'iz emas. */
  const aqchaOf = (player: typeof game.me): number | null =>
    player?.ratingBefore !== undefined && player.ratingAfter !== undefined
      ? battleAqchaDelta(player.ratingBefore, player.ratingAfter)
      : null;

  const meAqcha = aqchaOf(game.me);
  const foeAqcha = aqchaOf(game.opponent);

  // Maydonda «g'alaba/mag'lubiyat» degan ikkilik yo'q: o'rin bor.
  // Oxirgi o'rin ham mag'lubiyat emas — odam hali ikkinchi, uchinchi
  // uchun o'ynagan.
  const place = game.arena.find((row) => row.mine)?.rank ?? 0;
  /** Turnir guruhi bo'lsa — o'z turniriga qaytish yo'li. Umumiy maydon
   *  bo'limi bu yerda noto'g'ri manzil: odam keyingi davrani kutyapti. */
  const series = seriesOf(game.battle);

  /** Natijani rasm bilan ulashadi — ilovadagi kartochkaning o'zi.
   *
   *  Kataklarda g'unchaning harflari turadi, yurak harf urg'uda:
   *  ulashilgan rasmdan o'sha g'unchani boshqa odam ham taniydi. */
  const shareResult = async () => {
    const outcome = game.mardu
      ? place > 0 && place <= 3
        ? 'podium'
        : 'field'
      : !winner
        ? 'draw'
        : winner === uid
          ? 'win'
          : 'loss';
    const text = [
      `G‘uncha jangi · ${title}`,
      lead,
      `${site}${links.gunchaBattle}`,
    ].join('\n');

    const sent = await shareCardImage(
      {
        game: 'G‘uncha jangi',
        tone:
          outcome === 'win' ? 'win' : outcome === 'draw' ? 'draw' : outcome === 'loss' ? 'loss' : 'field',
        verdict: title,
        punchline: punchline(outcome, game.battleId ?? 'guncha'),
        me: {
          nickname: game.account?.nickname ?? 'Siz',
          value: String(mineScore),
          caption: `${game.revealed.mine.length} so‘z`,
          winner: winner === uid || place === 1,
        },
        ...(game.mardu
          ? { rank: { rank: place, players: game.arena.length } }
          : {
              rival: {
                nickname: game.opponent?.nickname ?? 'Raqib',
                value: String(theirScore),
                caption: `${game.revealed.theirs.length} so‘z`,
                winner: !!winner && winner !== uid,
              },
            }),
        ...(game.puzzle
          ? {
              tilesLabel: 'G‘uncha harflari',
              tiles: [
                { text: game.puzzle.center },
                ...game.puzzle.petals.map((unit) => ({ text: unit, strong: false })),
              ],
            }
          : {}),
      },
      text,
    );
    if (sent) countShare();
  };

  const title = game.mardu
    ? place === 1
      ? 'Maydon sizniki'
      : `${place}-o‘rin`
    : !winner
      ? 'Durang'
      : winner === uid
        ? 'G‘alaba'
        : 'Mag‘lubiyat';
  const lead = game.mardu
    ? `${game.arena.length} kishilik maydon · ${mineScore} to‘pladingiz`
    : !winner
      ? `Ikkalangiz ham ${mineScore} to‘pladingiz`
      : winner === uid
        ? `Raqibingizdan ${mineScore - theirScore} ko‘p to‘pladingiz`
        : `${theirScore - mineScore} yetmadi`;

  /* Topilgan va topilmagan so'zlar — ilovadagi natija ekranidagidek
     (`guncha_battle_result.dart`). Ro'yxatning o'zi **yig'ilgan**:
     natijani ko'rgan odam avval kim yutganini o'qiydi, so'zlarni esa
     xohlasa ochadi. Ochiq tursa ekran cho'zilib, tugmalar pastga
     tushib ketardi — ilovada ham aynan shu sabab bilan oynaga
     ko'chirilgan. */
  /* Topilganlar **topilgan so'zlardan** yig'iladi, g'unchaning
     ro'yxatidan emas. Ilgari ro'yxat `puzzle.words` dan filtr bilan
     olinardi va serverning lug'atida bor, brauzernikida yo'q so'zlar
     tushib qolardi: raqib uchta so'z topgan bo'lsa-yu, ro'yxatda
     bittasi ko'rinardi. Ball esa bor joyidan olinadi — bo'lmasa nol
     yoziladi, bu raqamni brauzer bilmaydi. */
  const found = useMemo(() => {
    const all = [...new Set([...game.revealed.mine, ...game.revealed.theirs])];
    return all.map((word) => {
      const entry = game.puzzle ? wordOf(game.puzzle, word) : null;
      return { word, score: entry?.score ?? 0, pangram: entry?.pangram ?? false };
    });
  }, [game.puzzle, game.revealed]);

  const missed = useMemo(() => {
    const all = new Set([...game.revealed.mine, ...game.revealed.theirs]);
    return (game.puzzle?.words ?? []).filter((word) => !all.has(word.word));
  }, [game.puzzle, game.revealed]);

  const mineSet = useMemo(() => new Set(game.revealed.mine), [game.revealed.mine]);
  const theirSet = useMemo(() => new Set(game.revealed.theirs), [game.revealed.theirs]);

  const tone = game.mardu
    ? place === 1
      ? 'won'
      : 'draw'
    : !winner
      ? 'draw'
      : winner === uid
        ? 'won'
        : 'lost';

  return (
    <div className={`stage stage--result stage--${tone}`}>
      {/* Ulashish — burchakdagi belgi, So'zjangdagidek. Ilgari u
          tugmalar qatorida «Natijani ulashish» bo'lib turardi va
          «Qasos» bilan bir xil og'irlikda ko'rinardi. */}
      <button
        className="result__share"
        onClick={() => void shareResult()}
        aria-label="Natijani ulashish"
        title="Natijani ulashish"
      >
        <Send size={16} />
      </button>

      <div className="verdict">
        <span className="verdict__emoji" aria-hidden="true">
          {tone === 'won' ? '🏆' : tone === 'draw' ? '🤝' : '⚔️'}
        </span>
        <h2 className="verdict__title">{title}</h2>
        <p className="verdict__label">{lead}</p>
      </div>

      {game.mardu ? (
        <ArenaStandings rows={game.arena} game="guncha" />
      ) : (
        <div className="score">
          <div className={`score__side${winner === uid ? ' score__side--win' : ''}`}>
            <Avatar
              name={pretty(game.account?.nickname ?? 'Siz')}
              uid={game.account?.uid}
              size={36}
              className="score__avatar"
            />
            <span className="score__who">
              {pretty(game.account?.nickname ?? 'Siz')}
              <VerifiedMark uid={game.account?.uid} size={14} />
            </span>
            <strong className="score__points">{mineScore}</strong>
            <span className="score__meta">{game.revealed.mine.length} so‘z</span>
            {meAqcha !== null && meAqcha !== 0 && (
              <span className={`score__delta score__delta--${meAqcha > 0 ? 'up' : 'down'}`}>
                <AqchaDelta value={meAqcha} />
              </span>
            )}
          </div>
          <div
            className={`score__side${winner && winner !== uid ? ' score__side--win' : ''}`}
          >
            <Avatar
              name={pretty(game.opponent?.nickname ?? 'Raqib')}
              uid={game.opponentUid ?? undefined}
              size={36}
              className="score__avatar"
            />
            <span className="score__who">
              {pretty(game.opponent?.nickname ?? 'Raqib')}
              <VerifiedMark uid={game.opponentUid} size={14} />
            </span>
            <strong className="score__points">{theirScore}</strong>
            <span className="score__meta">{game.revealed.theirs.length} so‘z</span>
            {foeAqcha !== null && foeAqcha !== 0 && (
              <span className={`score__delta score__delta--${foeAqcha > 0 ? 'up' : 'down'}`}>
                <AqchaDelta value={foeAqcha} />
              </span>
            )}
          </div>
        </div>
      )}

      {found.length > 0 && (
        <button className="word-open" onClick={() => setList('found')}>
          <span>Topilgan so‘zlar</span>
          <em>{found.length}</em>
          <ChevronRight size={18} />
        </button>
      )}
      {missed.length > 0 && (
        <button className="word-open" onClick={() => setList('missed')}>
          <span>Hech kim topmadi</span>
          <em>{missed.length}</em>
          <ChevronRight size={18} />
        </button>
      )}

      {/* Davra tugadi — endi nima bo'ladi. Tugmalardan **oldin**:
          odam avval keyingi davra o'zi boshlanishini bilsin, keyin
          qayerga borishni tanlasin. */}
      {series && <TurnirNext code={series} />}

      <div className="result__actions">
        {/* Qasos birinchi turadi: o'sha raqib bilan qayta o'ynash istagi
            natijani ko'rgan zahoti tug'iladi. */}
        {!game.mardu && game.opponentUid && game.opponent?.nickname && (
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
            <Swords size={16} />
            Qasos
          </button>
        )}
        {/* Turnirda «Yana o'ynash» chalg'itadi: odam o'yinni o'zi
            tanlamaydi, keyingi davrani turnir ochadi. */}
        {series ? (
          <a className="btn btn--sm" href={turnirPath(series)}>
            <Trophy size={14} />
            Turnirga qaytish
          </a>
        ) : (
          <button className="btn btn--sm btn--outline" onClick={game.again}>
            <Swords size={16} />
            Keyingi jang
          </button>
        )}
        {game.mardu && !series && (
          <a className="btn btn--sm btn--ghost" href={links.mardu}>
            Maydonga qaytish
          </a>
        )}
      </div>

      {list === 'found' && (
        <Modal title="Topilgan so‘zlar" onClose={() => setList(null)}>
          <ul className="word-list">
            {found.map((word) => {
              const byMe = mineSet.has(word.word);
              const byRival = theirSet.has(word.word);
              const who = byMe && byRival ? 'both' : byMe ? 'me' : 'foe';
              return (
                <li key={word.word} className={`word-list__row word-list__row--${who}`}>
                  <i aria-hidden="true" />
                  <span className={word.pangram ? 'word-list__word is-pangram' : 'word-list__word'}>
                    {pretty(word.word)}
                  </span>
                  <small>
                    {byMe && byRival
                      ? 'ikkalangiz'
                      : byMe
                        ? 'siz'
                        : pretty(game.opponent?.nickname ?? 'raqib')}
                  </small>
                  <b>+{word.score}</b>
                </li>
              );
            })}
          </ul>
        </Modal>
      )}

      {list === 'missed' && (
        <Modal title="Hech kim topmadi" onClose={() => setList(null)}>
          {/* Bu ro'yxatda kim topgani yo'q — faqat so'zning o'zi, ya'ni
              qator emas, yorliq yetadi. Ilovada ham shunday. */}
          <div className="word-chips">
            {missed.map((word) => (
              <span key={word.word}>{pretty(word.word)}</span>
            ))}
          </div>
        </Modal>
      )}

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

/** «O'chirish» — ilovadagi qoidada: bosilsa **bitta harf**, uzoq bosilsa
 *  butun so'z (`GunchaPillButton` ning `onTap`/`onLongPress` i).
 *
 *  Ilgari saytda bosilishi bilan hammasi o'chardi: bitta xato harf
 *  uchun so'zni boshidan terishga to'g'ri kelardi. Hech narsa
 *  yozilmagan bo'lsa tugma o'chiq — ilovada ham shunday. */
function DeleteButton({
  onBackspace,
  onClear,
  disabled,
}: {
  onBackspace: () => void;
  onClear: () => void;
  disabled: boolean;
}) {
  const hold = useLongPress(onClear);

  return (
    <button
      className="btn btn--sm btn--ghost"
      onClick={hold.onClick(onBackspace)}
      disabled={disabled}
      title="Bosing — bitta harf, uzoq bosing — butun so‘z"
      {...hold.handlers}
    >
      O‘chirish
    </button>
  );
}
