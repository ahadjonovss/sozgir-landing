/** Turnir — `/turnir` bo'limi va `/turnir/{KOD}` sahifasi.
 *
 *  Turnir — ketma-ket bir necha maydon va odam hammasida o'ynaydi:
 *  chiqarib yuborish yo'q. Har davrada qatnashchilar to'rt kishilik
 *  guruhlarga bo'linadi, guruh esa jadvaldagi o'rin bo'yicha
 *  teriladi. Davra boshlanganda qatnashchi o'z guruh jangiga tushadi
 *  va o'yinni **mavjud jang ekranida** o'ynaydi — bu yerda o'yin
 *  mantiqi yo'q.
 *
 *  Bitta komponent ikki ishni bajaradi, chunki ikkalasi bitta holatdan
 *  oziqlanadi: bo'limda turnir ochiladi yoki kod kiritiladi, sahifada
 *  esa o'sha turnir kuzatiladi. Manzildagi kod ikkisini ajratadi. */
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../lib/auth';
import { routeParam } from '../lib/useRoute';
import { useTurnir, type Turnir } from '../lib/useTurnir';
import {
  cleanCode,
  turnirRounds,
  TURNIR_SIZES,
  earnedBy,
  memberName,
  playerCount,
  turnirPath,
  type TurnirCapacity,
} from '../lib/turnir';
import { punchline } from '../lib/shareLines';
import { shareCardImage } from '../lib/shareCard';
import { pretty } from '../lib/uz';
import type { BattleGame } from '../lib/battle';
import ArenaHistory from './ArenaHistory';
import AccountCall from './AccountCall';
import AdBanner from './AdBanner';
import { Aqcha, AqchaDelta } from './Units';
import { playerLink } from '../data/site';
import Avatar from './Avatar';
import CodeInput from './CodeInput';
import PlayerName from './PlayerName';
import TurnirLadder from './TurnirLadder';
import TurnirLobby from './TurnirLobby';
import GameIntro from './GameIntro';
import { Send, Swords, Trophy, Users } from './Icons';

const GAMES: { id: BattleGame; label: string }[] = [
  { id: 'guncha', label: 'G‘uncha' },
  { id: 'soztop', label: 'So‘zjang' },
];

export default function TurnirPage() {
  // Manzil o'zgarganda `App` qayta chiziladi, ya'ni kod shu yerda
  // o'qilsa yetadi — alohida holat kerak emas.
  const code = cleanCode(routeParam());
  const turnir = useTurnir(code);
  const { account } = useAuth();

  if (!account) {
    return (
      <AccountCall
        title="Turnir uchun hisob kerak"
        note="Turnirda o‘rin, aqcha va jadval hisobga yoziladi — shuning uchun u hisobsiz o‘ynalmaydi."
      />
    );
  }

  return (
    <section className="oyin">
      <div className="wrap">
        {turnir.error && <p className="form__err">{turnir.error}</p>}
        {code ? <Room turnir={turnir} /> : <Hub turnir={turnir} />}
      </div>
    </section>
  );
}

/* ── Bo'lim ──────────────────────────────────────────────────────────── */

function Hub({ turnir }: { turnir: Turnir }) {
  const [code, setCode] = useState('');
  const rounds = turnirRounds(turnir.size);

  const active = turnir.active;

  return (
    <div className="lobby">
      <div className="lobby__main">
        <GameIntro
          tone="yellow"
          icon={<Trophy size={16} />}
          title="Ketma-ket bir necha maydon"
          note="Har davrada o‘zingizga teng ochkodagilar bilan o‘ynaysiz, oxirida birinchi ikki o‘rin finalga chiqadi."
        />

        {/* Tugamagan turniri bor odamga — birinchi navbatda o'sha.
            Uchala yo'l (ochish, tezkor, kod) unga baribir yopiq:
            serverda bir vaqtda bitta turnir (`requireOneTurnir`) va
            tugmani bosgan odam xatodan boshqa narsa ko'rmasdi. */}
        {active && (
          <div className="panel panel--call">
            <h3>Sizning turniringiz</h3>
            <p className="panel__note">
              {active.doc.status === 'gathering'
                ? `Yig‘ilmoqda — ${playerCount(active.doc)} / ${active.doc.capacity ?? 8} kishi.`
                : `${active.doc.round ?? 1}-davra ketyapti.`}{' '}
              Bir vaqtda bitta turnir: shunisi tugagach, yangisini
              ochasiz.
            </p>
            <a className="btn btn--sm" href={turnirPath(active.code)}>
              Turnirga qaytish
            </a>
          </div>
        )}

        {!active && (
        <div className="panel lobby__card">
          <div className="panel__head">
            <h3>Turnir ochish</h3>
            <span className="panel__tag">8, 16 yoki 32 kishi</span>
          </div>

          <div className="play__modes" role="tablist" aria-label="Turnirdagi o‘yin">
            {GAMES.map((item) => (
              <button
                key={item.id}
                role="tab"
                aria-selected={turnir.game === item.id}
                className={`play__mode${turnir.game === item.id ? ' play__mode--on' : ''}`}
                onClick={() => turnir.setGame(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="lengths">
            <span className="lengths__label">Nechta kishi</span>
            <div className="lengths__row">
              {TURNIR_SIZES.map((item) => (
                <button
                  key={item}
                  className={`chip${turnir.size === item ? ' chip--on' : ''}`}
                  onClick={() => turnir.setSize(item as TurnirCapacity)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Va'da darhol ko'rinadi: odam «necha davra o'ynayman»
              degan savolga tugmani bosmasdan javob olsin — va
              chiqarib yuborilmasligini ham bilsin. */}
          <p className="panel__note lobby__hint">
            {rounds} davra · hamma oxirigacha o‘ynaydi
          </p>

          <label className="field tnr__title">
            <span>Nomi (ixtiyoriy)</span>
            <input
              value={turnir.title}
              onChange={(event) => turnir.setTitle(event.target.value.slice(0, 40))}
              placeholder="So‘zgir Kubogi"
              maxLength={40}
            />
          </label>

          <button
            className="btn btn--lg lobby__quick"
            onClick={turnir.create}
            disabled={turnir.busy}
          >
            <Trophy size={20} />
            {turnir.busy ? 'Ochilmoqda…' : 'Turnir ochish'}
          </button>

          {/* Tezkor turnir hajm va nomni e'tiborsiz qoldiradi: ochiq
              xona sakkiz kishilik va nomsiz. Shuning uchun u
              sozlamalardan keyin turadi — tanlovlar unga tegishli
              emasligi shundan ko'rinadi. */}
          <button
            className="btn btn--lg btn--outline"
            onClick={turnir.quick}
            disabled={turnir.busy}
          >
            <Swords size={20} />
            Tezkor turnir
          </button>
          <p className="panel__note">
            Notanish odamlar bilan, 8 kishilik — qatnashchilar uch
            daqiqa davomida yig‘iladi.
          </p>

          <div className="lobby__friend">
            <span className="panel__label">
              <Users size={14} /> Kod bilan kirish
            </span>
            <div className="lobby__friend-row">
              <CodeInput
                value={code}
                onChange={setCode}
                onSubmit={() => turnir.join(code)}
                disabled={turnir.busy}
              />
              <button
                className="btn btn--ghost"
                onClick={() => code.length === 6 && turnir.join(code)}
                disabled={turnir.busy || code.length !== 6}
              >
                Qo‘shilish
              </button>
            </div>
          </div>
        </div>
        )}

      </div>

      {/* Ro'yxatlar yon ustunda: chap tomonda bitta ish bor — turnir
          ochish yoki kod bilan kirish. Ilgari hammasi bitta tor
          ustunga tizilgan edi va o'ngdagi butun maydon bo'sh
          turardi; o'qiladigan narsa (ochiq turnirlar, tarix,
          qoidalar) esa tugmalarning ostida qolib ketgandi. */}
      <aside className="lobby__side">
        <OpenList turnir={turnir} />
        <HistoryList turnir={turnir} />

        {/* Janglar tarixi — qolgan uchta o'yinda ham shu yerda.
            Yuqoridagi ikkala ro'yxat bo'sh bo'lsa umuman chizilmaydi
            (ochiq turnir yo'q, o'zi ham hali o'ynamagan), ya'ni usiz
            yon ustun butunlay bo'sh qolardi.

            Qoidalar ro'yxati bu yerda bor edi va olib tashlandi: olti
            bandlik matnni turnir ochmoqchi bo'lgan odam o'qimaydi,
            o'ynagani esa allaqachon biladi — qoida o'yinning o'zida
            ko'rinadi, davra jadvalida va natijada. */}
        <ArenaHistory />

        {/* Telegram banneri vaqtincha olib turildi. */}
        {/* Faqat turnirga kirishdan oldin. Turnirning o'zi — zinapoya,
            jang va natija — reklamasiz: u yerda vaqt sanab turadi va
            yonidagi banner bevosita xalaqit beradi. */}
        <AdBanner placement="turnir" />
      </aside>
    </div>
  );
}

/* ── Turnir sahifasi ─────────────────────────────────────────────────── */

function Room({ turnir }: { turnir: Turnir }) {
  if (!turnir.loaded) {
    return (
      <div className="stage tnr">
        <p className="arena__wait" role="status">
          Turnir yuklanmoqda…
        </p>
      </div>
    );
  }

  if (turnir.missing) {
    return (
      <div className="panel panel--call">
        <h3>Bu kod bilan turnir topilmadi</h3>
        <p className="panel__note">
          Kod noto‘g‘ri bo‘lishi yoki turnirning yig‘ilish muddati o‘tgan
          bo‘lishi mumkin.
        </p>
        <a className="btn btn--sm" href="/turnir">
          Turnir bo‘limi
        </a>
      </div>
    );
  }

  if (turnir.status === 'expired') {
    return (
      <div className="panel panel--call">
        <h3>Turnirning muddati o‘tdi</h3>
        <p className="panel__note">
          Yig‘ilish ikki soat davom etadi — bu turnir boshlanmasdan yopildi.
        </p>
        <a className="btn btn--sm" href="/turnir">
          Yangi turnir ochish
        </a>
      </div>
    );
  }

  if (turnir.status === 'gathering') return <TurnirLobby turnir={turnir} />;
  if (turnir.status === 'finished') return <Winner turnir={turnir} />;
  return <Running turnir={turnir} />;
}

/* ── Davra ketayotganda ──────────────────────────────────────────────── */

function Running({ turnir }: { turnir: Turnir }) {
  const total = turnir.rounds.length;

  return (
    <div className="tnr">
      <div className="stage__head tnr__head">
        <h2>{turnir.doc?.title || 'Turnir'}</h2>
        <span className="stage__tag">
          {turnir.turnirGame === 'guncha' ? 'G‘uncha' : 'So‘zjang'} ·{' '}
          {total}-davra
        </span>
      </div>

      <Standing turnir={turnir} />
      <TurnirLadder turnir={turnir} />
    </div>
  );
}

/** Mening holatim: nechanchi o'rindaman va keyingi davra qachon.
 *
 *  To'rdan **oldin** turadi, chunki odam ekranni ochganda birinchi
 *  o'zini qidiradi. Savol shveytsarda «men hali o'ynayapmanmi?» emas
 *  — chiqib ketish yo'q — balki «men qayerdaman?». */
function Standing({ turnir }: { turnir: Turnir }) {
  const { place, nextIn, myBattle } = turnir;

  if (myBattle) {
    return (
      <div className="tnr__me tnr__me--on">
        <strong>Sizning guruhingiz o‘ynayapti</strong>
        <button className="btn btn--sm" onClick={turnir.enter}>
          <Swords size={16} />
          Jangga qaytish
        </button>
      </div>
    );
  }

  // Sanoq kuzatuvchiga ham ko'rsatiladi: u ham keyingi davra qachon
  // boshlanishini bilishni xohlaydi — tomosha ham o'yin.
  const clock =
    nextIn === null || nextIn <= 0
      ? null
      : `${Math.floor(nextIn / 60)}:${String(nextIn % 60).padStart(2, '0')}`;

  // Guruhim tugadi, lekin davra tugamadi: qolgan guruhlar hali
  // o'ynayapti. Ilgari bu yerda «Keyingi davra: 0:00» turardi —
  // sanoq nolga tushgan, hech narsa bo'lmayapti va odam nimani
  // kutayotganini bilmasdi.
  const round = turnir.rounds.find((item) => item.current);
  const left = round ? round.groups.filter((group) => !group.done).length : 0;

  // Birinchi davra yopilmaguncha ochko ham, o'rin ham yo'q: jadval
  // davra oxirida tuziladi. «1-o'rin · 0 ochko» o'sha paytda yolg'on
  // bo'lardi — u ro'yxatga kirish tartibi, natija emas.
  const scored = (turnir.doc?.ladder?.length ?? 0) > 0;

  return (
    <div className="tnr__me tnr__me--on">
      <strong>
        {scored && place.rank > 0
          ? `${place.rank}-o‘rin · ${place.points} ochko`
          : round
            ? `${round.round}-davra ketyapti`
            : 'Turnir ketyapti'}
      </strong>
      <span>
        {left > 0
          ? `${left} guruh hali o‘ynayapti — davra hamma guruh tugagach yakunlanadi.`
          : clock
            ? `Keyingi davra: ${clock}`
            : place.playing
              ? 'Davra ochilishi bilan jang o‘zi boshlanadi.'
              : 'Davralarni kuzatib turishingiz mumkin.'}
      </span>
    </div>
  );
}

/* ── Bo'limdagi ro'yxatlar ───────────────────────────────────────────── */

/** Hozir yig'ilayotgan turnirlar.
 *
 *  Kod bilan kirish yonida turadi va o'sha savolga javob beradi:
 *  «kodim yo'q, shunchaki qo'shilsam bo'ladimi?». Ro'yxat jonli —
 *  xonaga odam qo'shilgani sayin son o'zi yangilanadi. */
function OpenList({ turnir }: { turnir: Turnir }) {
  if (turnir.open.length === 0) return null;

  return (
    <div className="panel tnr-list">
      <h3>Ochiq turnirlar</h3>
      <ul className="tnr-list__items">
        {turnir.open.map((row) => (
          <li key={row.code}>
            <a className="tnr-list__row" href={turnirPath(row.code)}>
              <span className="tnr-list__dot" aria-hidden="true" />
              <span className="tnr-list__main">
                <b>{row.title || 'Turnir'}</b>
                <span>
                  {row.game === 'guncha' ? 'G‘uncha' : 'So‘zjang'} ·{' '}
                  {row.players} / {row.capacity} kishi
                </span>
              </span>
              <span className="tnr-list__free">
                {row.capacity - row.players > 0
                  ? `yana ${row.capacity - row.players} o‘rin`
                  : 'to‘ldi'}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Mening tugagan turnirlarim.
 *
 *  Kirmagan odamda umuman chizilmaydi: tarix hisobga bog'langan va
 *  bo'sh ro'yxat «sizda hech narsa yo'q» deb aytib turishdan ko'ra,
 *  butunlay ko'rinmagani tinchroq. */
function HistoryList({ turnir }: { turnir: Turnir }) {
  if (!turnir.account || turnir.history.length === 0) return null;

  return (
    <div className="panel tnr-list">
      <h3>Turnirlar tarixi</h3>
      <ul className="tnr-list__items">
        {turnir.history.map((row) => {
          const mine = row.winnerUid && row.winnerUid === turnir.mine;
          return (
            <li key={row.code}>
              <a className="tnr-list__row" href={turnirPath(row.code)}>
                <Trophy size={16} />
                <span className="tnr-list__main">
                  <b>{row.title || 'Turnir'}</b>
                  <span>
                    {row.players} kishi ·{' '}
                    {mine ? 'siz g‘olib' : `g‘olib: ${row.winnerName}`}
                  </span>
                </span>
                {mine && row.prize > 0 && (
                  <span className="tnr-list__prize">+{row.prize} aqcha</span>
                )}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ── Yakun ───────────────────────────────────────────────────────────── */

function Winner({ turnir }: { turnir: Turnir }) {
  const winnerUid = turnir.doc?.winnerUid ?? '';
  const name = pretty(turnir.doc?.members?.[winnerUid]?.nickname ?? 'G‘olib');
  // Turnirda qancha odam bor edi — `seeds` boshlanganda muhrlanadi,
  // ya'ni chiqib ketganlar ham shu sonda qoladi.
  const players = turnir.doc?.seeds?.length ?? turnir.players;
  const mine = winnerUid === turnir.mine;

  // Ustama uchinchi o'ringacha to'lanadi, demak uchovi ham shu
  // yerda ko'rinishi kerak: faqat g'olib chiqarilsa, uchinchi o'rin
  // olgan odam ustamasi qayerdan kelganini bilmay qolardi.
  const places: { uid: string; name: string; prize: number; rank: number }[] =
    [
      {
        uid: turnir.doc?.runnerUpUid ?? '',
        prize: turnir.doc?.runnerUpPrize ?? 0,
        rank: 2,
      },
      {
        uid: turnir.doc?.thirdUid ?? '',
        prize: turnir.doc?.thirdPrize ?? 0,
        rank: 3,
      },
    ]
      .filter((place) => place.uid !== '')
      .map((place) => ({
        ...place,
        name: pretty(
          turnir.doc?.members?.[place.uid]?.nickname ?? 'Mehmon'
        ),
      }));

  return (
    <div className="tnr">
      <div className="tnr__crown">
        <Trophy size={28} />
        <Avatar name={name} uid={winnerUid} size={78} />
        <b>
          <PlayerName uid={winnerUid} name={name} size={20} />
        </b>
        <span>{players} kishi orasida 1-o‘rin</span>
        {/* Ustama jangda yig'ilgan aqchadan ustiga qo'shiladi: u
            yerdagi son reytingdan keladi, bu esa turnirning o'z
            mukofoti. Kichik turnirda nol bo'ladi va umuman
            ko'rsatilmaydi — «+0 aqcha» mukofotdan ham yomonroq. */}
        {(turnir.doc?.prize ?? 0) > 0 && (
          <em className="tnr__prize">+{turnir.doc?.prize} aqcha</em>
        )}
        {places.map((place) => (
          <span className="tnr__second" key={place.uid}>
            {place.rank}-o‘rin · {place.name}
            {place.prize > 0 && ` · +${place.prize} aqcha`}
          </span>
        ))}
        {turnir.doc?.title && <i>{turnir.doc.title}</i>}
      </div>

      <div className="result__actions">
        <ShareWinner turnir={turnir} name={name} players={players} mine={mine} />
        {turnir.isHost && (
          <button className="btn btn--outline" onClick={turnir.again} disabled={turnir.busy}>
            <Trophy size={16} />
            {turnir.busy ? 'Ochilmoqda…' : 'Yana bir turnir'}
          </button>
        )}
        <a className="btn btn--ghost" href="/turnir">
          Turnir bo‘limi
        </a>
      </div>

      <FinalTable turnir={turnir} />
      <TurnirLadder turnir={turnir} />
    </div>
  );
}

/** Yakuniy jadval — turnirning **javobi**.
 *
 *  To'r har davrani alohida ko'rsatadi, lekin «men nechanchi
 *  bo'ldim va qancha ishladim?» degan savolga javob bermaydi: uning
 *  uchun to'rtta ustunni ko'z bilan qo'shib chiqish kerak edi.
 *
 *  Tartib serverdan (`order`): teng ochkoda ro'yxatga oldin kirgan
 *  odam yuqori turadi va bu qoida o'yindan oldin hammaga ko'rinadi.
 *  Aqcha ham serverdan — mijozda qayta hisoblanmaydi. */
function FinalTable({ turnir }: { turnir: Turnir }) {
  const doc = turnir.doc;
  const order = doc?.order ?? [];
  if (order.length === 0) return null;

  return (
    <div className="standings tnr__final">
      <h3>Yakuniy jadval</h3>
      <ol className="standings__list">
        {order.map((uid, index) => {
          // Ustama bilan: sovrinli o'rin egasi ekranda haqiqatan
          // olgan sonini ko'rsin.
          const delta = earnedBy(doc, uid) ?? 0;
          const balance = doc?.balance?.[uid];
          const mine = uid === turnir.mine;
          return (
            <li
              key={uid}
              className={`standings__row${mine ? ' standings__row--me' : ''}`}
            >
              <span className="standings__place">{index + 1}</span>
              <a className="standings__who" href={playerLink(uid)}>
                <Avatar name={memberName(doc, uid)} uid={uid} size={26} />
                <span>
                  <PlayerName uid={uid} name={memberName(doc, uid)} size={14} />
                </span>
              </a>
              <span className="standings__score">
                {doc?.points?.[uid] ?? 0} ochko
              </span>
              {/* Ikkala katak **har doim** chiziladi, hatto bo'sh
                  bo'lsa ham: biri tushib qolsa qolgan ustunlar
                  siljib, jadval zinapoyaga aylanardi. */}
              <span
                className={`standings__delta${
                  delta > 0
                    ? ' standings__delta--up'
                    : delta < 0
                      ? ' standings__delta--down'
                      : ''
                }`}
              >
                {delta === 0 ? '—' : <AqchaDelta value={delta} />}
              </span>
              {/* Umumiy hisob o'zgarishning yonida: odam «qancha
                  ishladim» bilan «qancham qoldi» ni birga ko'radi. */}
              <span className="standings__total">
                {balance === undefined ? '' : <Aqcha value={balance} size="sm" />}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** Ulashish kartochkasi — jang natijasidagi bilan bitta chizg'ich.
 *
 *  Kartochka **ko'rayotgan odamniki**: g'olib o'z g'alabasini, chiqib
 *  ketgan odam esa o'z o'rnini ulashadi. Ikkalasi ham turnirni
 *  ko'rsatadi, faqat raqam boshqa. */
function ShareWinner({
  turnir,
  name,
  players,
  mine,
}: {
  turnir: Turnir;
  name: string;
  players: number;
  mine: boolean;
}) {
  const [sent, setSent] = useState(false);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const place = mine ? 1 : turnir.place.rank;
  const myName = pretty(turnir.account?.nickname ?? 'Siz');
  const label = turnir.turnirGame === 'guncha' ? 'G‘uncha turniri' : 'So‘zjang turniri';

  const share = async () => {
    const line = `${label}: ${players} kishi, ${turnir.rounds.length} davra. sozgir.uz/turnir`;
    await shareCardImage(
      {
        game: label,
        tone: mine ? 'win' : 'field',
        verdict: mine ? 'G‘olib' : place ? `${place}-o‘rin` : 'Turnir tugadi',
        punchline: punchline(mine ? 'win' : 'field', turnir.code),
        me: {
          nickname: mine ? myName : name,
          value: mine ? '1' : String(place ?? '—'),
          caption: mine ? 'turnir g‘olibi' : 'o‘rin',
          winner: mine,
        },
        rank: { rank: mine ? 1 : (place ?? players), players },
        chips: [`${players} kishi`, `${turnir.rounds.length} davra`],
      },
      line,
    );
    setSent(true);
    timer.current = window.setTimeout(() => setSent(false), 1600);
  };

  return (
    <button className="btn" onClick={() => void share()}>
      <Send size={16} />
      {sent ? 'Tayyor' : 'Natijani ulashish'}
    </button>
  );
}

