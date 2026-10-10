/** Turnir — `/turnir` bo'limi va `/turnir/{KOD}` sahifasi.
 *
 *  Turnir — ketma-ket bir necha mardu maydoni: har davradan yuqori
 *  yarmi o'tadi, sakkiztadan ko'p bo'lsa guruhlarga bo'linadi. Davra
 *  boshlanganda qatnashchi o'z guruh jangiga tushadi va o'yinni
 *  **mavjud jang ekranida** o'ynaydi — bu yerda o'yin mantiqi yo'q.
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
  ladderSteps,
  TURNIR_GROUP,
  TURNIR_MIN_PLAYERS,
  TURNIR_SIZES,
  type TurnirCapacity,
} from '../lib/turnir';
import { punchline } from '../lib/shareLines';
import { shareCardImage } from '../lib/shareCard';
import { pretty } from '../lib/uz';
import type { BattleGame } from '../lib/battle';
import Avatar from './Avatar';
import CodeInput from './CodeInput';
import PlayerName from './PlayerName';
import TelegramBanner from './TelegramBanner';
import TurnirLadder from './TurnirLadder';
import TurnirLobby from './TurnirLobby';
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
  const { account, openPrompt } = useAuth();

  if (!account) {
    return (
      <section className="oyin">
        <div className="wrap">
          <div className="panel panel--call">
            <h3>Turnir uchun hisob kerak</h3>
            <p className="panel__note">
              Turnirda o‘rin, reyting va jadval hisobga yoziladi —
              shuning uchun u hisobsiz o‘ynalmaydi.
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
        {turnir.error && <p className="form__err">{turnir.error}</p>}
        {code ? <Room turnir={turnir} /> : <Hub turnir={turnir} />}
      </div>
    </section>
  );
}

/* ── Bo'lim ──────────────────────────────────────────────────────────── */

function Hub({ turnir }: { turnir: Turnir }) {
  const [code, setCode] = useState('');
  const steps = ladderSteps(turnir.size);

  return (
    <div className="lobby">
      <div className="lobby__main">
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

          {/* Zinapoya darhol ko'rinadi: odam «necha davra o'ynayman»
              degan savolga tugmani bosmasdan javob olsin. */}
          <p className="panel__note lobby__hint">
            {steps.join(' → ')} → g‘olib · {steps.length} davra
          </p>

          <label className="field tnr__title">
            <span>Nomi (ixtiyoriy)</span>
            <input
              value={turnir.title}
              onChange={(event) => turnir.setTitle(event.target.value.slice(0, 40))}
              placeholder="Alif kubogi"
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

        <div className="panel">
          <h3>Qoidalar</h3>
          <ol className="guncha__rules">
            <li>
              Turnir — ketma-ket bir necha mardu maydoni. Har davrada odam
              ikki barobar kamayadi.
            </li>
            <li>
              Bir maydonga {TURNIR_GROUP} kishigacha; ko‘p bo‘lsa guruhlarga
              bo‘linadi va guruhlar bir vaqtda o‘ynaydi.
            </li>
            <li>Har guruhdan yuqori yarmi o‘tadi; teng natijada ro‘yxatga oldin kirgani.</li>
            <li>
              Boshlash uchun kamida {TURNIR_MIN_PLAYERS} kishi kerak.
              Boshlashni tashkilotchi bosadi.
            </li>
            <li>Har guruh jangi — oddiy maydon: reyting ham, o‘lja ham o‘sha yo‘ldan.</li>
          </ol>
        </div>
      </div>

      <aside className="lobby__side">
        <TelegramBanner compact />
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

/** Mening holatim: o'ynayapmanmi, qachon chiqdim, keyingi davra qachon.
 *
 *  To'rdan **oldin** turadi, chunki odam ekranni ochganda birinchi
 *  o'zini qidiradi: «men hali o'ynayapmanmi?». */
function Standing({ turnir }: { turnir: Turnir }) {
  const { run, nextIn, myBattle } = turnir;

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

  const out = !run.alive && run.round !== null;
  // Sanoq chiqib ketgan odamga ham ko'rsatiladi: u ham keyingi davra
  // qachon boshlanishini bilishni xohlaydi — tomosha ham o'yin.
  const clock =
    nextIn === null
      ? null
      : `${Math.floor(nextIn / 60)}:${String(nextIn % 60).padStart(2, '0')}`;

  return (
    <div className={`tnr__me ${out ? 'tnr__me--out' : 'tnr__me--on'}`}>
      <strong>
        {out
          ? `Siz ${run.round}-davrada chiqdingiz${run.rank ? ` — ${run.rank}-o‘rin` : ''}`
          : run.alive
            ? 'Siz davom etyapsiz'
            : 'Turnir ketyapti'}
      </strong>
      <span>
        {clock
          ? `Keyingi davra: ${clock}`
          : out
            ? 'Turnirni oxirigacha kuzatishingiz mumkin.'
            : run.alive
              ? 'Davra ochilishi bilan jang o‘zi boshlanadi.'
              : 'Davralarni kuzatib turishingiz mumkin.'}
      </span>
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

  // Finalda ikki kishi qoladi va ikkalasi ham hamma davrani o'ynagan
  // — ikkinchi o'rin ham natija, quruq qoldirilmaydi.
  const runnerUpUid = turnir.doc?.runnerUpUid ?? '';
  const runnerUp = runnerUpUid
    ? pretty(turnir.doc?.members?.[runnerUpUid]?.nickname ?? 'Mehmon')
    : '';

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
        {runnerUp && (
          <span className="tnr__second">
            2-o‘rin · {runnerUp}
            {(turnir.doc?.runnerUpPrize ?? 0) > 0 &&
              ` · +${turnir.doc?.runnerUpPrize} aqcha`}
          </span>
        )}
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

      <TurnirLadder turnir={turnir} />
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

  const place = mine ? 1 : turnir.run.rank;
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

