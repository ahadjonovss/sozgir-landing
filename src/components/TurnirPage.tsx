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
import { routeCode } from '../lib/useRoute';
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
  roundMarksOf,
  type RoundMark,
  type TurnirDoc,
} from '../lib/turnir';
import { punchline } from '../lib/shareLines';
import { shareCardImage } from '../lib/shareCard';
import { pretty } from '../lib/uz';
import type { BattleGame } from '../lib/battle';
import Leaderboard from './Leaderboard';
import AccountCall from './AccountCall';
import { Aqcha, AqchaDelta } from './Units';
import { playerLink } from '../data/site';
import Avatar from './Avatar';
import CodeInput from './CodeInput';
import PlayerName from './PlayerName';
import DownloadPromo from './DownloadPromo';
import TurnirLadder from './TurnirLadder';
import TurnirLobby from './TurnirLobby';
import GameIntro from './GameIntro';
import { Flower, Send, Swords, Trophy, Users } from './Icons';

const GAMES: { id: BattleGame; label: string }[] = [
  { id: 'guncha', label: 'G‘uncha' },
  { id: 'soztop', label: 'So‘zjang' },
];

export default function TurnirPage() {
  // Manzil o'zgarganda `App` qayta chiziladi, ya'ni kod shu yerda
  // o'qilsa yetadi — alohida holat kerak emas.
  const code = cleanCode(routeCode());
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
    /* Bo'lim bitta ustun: ilgari u ikkiga bo'lingan edi va o'ngdagi
       tor yon ustunda uchta ro'yxat ustma-ust tizilgandi — ularni
       o'qish uchun chapdagi forma yonidan pastga surish kerak
       bo'lardi. Endi har narsa butun enni oladi va tartib savol
       bo'yicha: «hozir qayerga qo'shilsam bo'ladi» → «o'zim
       ochaman yoki kod bilan kiraman» → «kim yuqorida, men
       qanday o'ynadim». */
    <div className="tnr-hub">
      <GameIntro
        tone="yellow"
        icon={<Trophy size={16} />}
        title="Ketma-ket bir necha maydon"
        note="Har davrada o‘zingizga teng ochkodagilar bilan o‘ynaysiz, oxirida birinchi ikki o‘rin finalga chiqadi."
      />

      {/* Tugamagan turniri bor odamga — birinchi navbatda o'sha.
          Qolgan ikkala yo'l (ochish, kod) unga baribir yopiq:
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
        <>
          {/* Eng tepada — hozir yig'ilayotganlar. Odam bu yerga
              ko'pincha «o'ynasam bo'ladimi» deb keladi, va agar
              xona allaqachon ochiq bo'lsa, javob turnir ochishdan
              ham, kod so'rashdan ham tez. */}
          <OpenRow turnir={turnir} />

          <div className="tnr-hub__row">
            <div className="panel tnr-hub__make">
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
                  degan savolga tugmani bosmasdan javob olsin. */}
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
              <p className="panel__note">
                Havolani do‘stlaringizga tashlaysiz — xona siz
                boshlagunicha ochiq turadi.
              </p>
            </div>

            <div className="panel tnr-hub__join">
              <div className="panel__head">
                <h3>Qo‘shilish</h3>
                <span className="panel__tag">
                  <Users size={14} /> Kod bilan
                </span>
              </div>
              <p className="panel__note">
                Do‘stingiz ochgan turnirning olti belgili kodini
                kiriting — havolasini ochsangiz ham bo‘ladi.
              </p>
              <div className="lobby__friend-row">
                <CodeInput
                  value={code}
                  onChange={setCode}
                  onSubmit={() => turnir.join(code)}
                  disabled={turnir.busy}
                />
                <button
                  className="btn"
                  onClick={() => code.length === 6 && turnir.join(code)}
                  disabled={turnir.busy || code.length !== 6}
                >
                  Qo‘shilish
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Pastki qator: bir tomonda kim yuqorida, ikkinchisida —
          o'zimning o'tgan turnirlarim. Ikkisi ham o'qiladigan
          narsa, ya'ni formadan keyin turadi. */}
      <div className="tnr-hub__row">
        <Leaderboard />
        <HistoryList turnir={turnir} />
      </div>

      {/* Banner bu yerda yo'q: bo'lim `PlayHub` ichida ochiladi va
          u sahifaning eng oxiriga bittasini o'zi qo'yadi. Ikkitasi
          bitta ekranda ortiqcha bo'lardi. */}
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

  /** `125` → `2:05`. Nol va yo'q — ikkalasi ham `null`. */
  const mmss = (seconds: number | null): string | null =>
    seconds === null || seconds <= 0
      ? null
      : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

  // Sanoq kuzatuvchiga ham ko'rsatiladi: u ham keyingi davra qachon
  // boshlanishini bilishni xohlaydi — tomosha ham o'yin.
  const clock = mmss(nextIn);
  /** Hali o'ynayotgan guruhlar qachon tugaydi. */
  const roundClock = mmss(turnir.roundIn);

  /** Turnir ketyaptimi — tugagan turnirda «keyingi davra» yo'q. */
  const running = turnir.doc?.status === 'running';

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
      {/* Kutayotgan odamga har doim **muddat** aytiladi.
          Ilgari bu yerda uchta jumlaning biri turardi va hech
          birida son yo'q edi: «qolgan guruhlar o'ynayapti»,
          «kuzatib turishingiz mumkin». Odam nimani, qancha
          kutayotganini bilmasdi.

          Endi ikkita sanoq bor: hali o'ynayotgan guruhlarning
          tugashi (eng kech tugaydigani butun davrani ushlab
          turadi) va shundan keyingi tanaffus. Muddat kelmagan
          bir lahzada eski jumlalar zaxirada qoladi. */}
      <span>
        {left > 0
          ? roundClock
            ? `${left} guruh o‘ynayapti — tugashiga ${roundClock}`
            : `${left} guruh hali o‘ynayapti — davra hamma guruh tugagach yakunlanadi.`
          : clock
            ? `Keyingi davra: ${clock}`
            : running
              ? 'Keyingi davra boshlanmoqda…'
              : place.playing
                ? 'Davra ochilishi bilan jang o‘zi boshlanadi.'
                : 'Davralarni kuzatib turishingiz mumkin.'}
      </span>
    </div>
  );
}

/* ── Bo'limdagi ro'yxatlar ───────────────────────────────────────────── */

/** Hozir yig'ilayotgan turnirlar — bo'limning eng tepasida, **qator**
 *  bo'lib.
 *
 *  Ilgari ro'yxat yon ustunda, tik tizilgan holda turardi va
 *  turnir ochish formasining yonida qolib ketardi. Holbuki odam bu
 *  yerga ko'pincha «hozir qayerga qo'shilsam bo'ladi» degan savol
 *  bilan keladi — javobi esa forma to'ldirishdan ham, kod
 *  so'rashdan ham tez.
 *
 *  Har kartochkada **to'lish chizig'i** bor va u tirik: xona
 *  yig'ilayotgani shundan bilinadi, son o'qilmasdan oldin ham.
 *  Ro'yxatning o'zi jonli — odam qo'shilgani sayin chiziq o'sadi. */
function OpenRow({ turnir }: { turnir: Turnir }) {
  if (turnir.open.length === 0) return null;

  return (
    <div className="panel tnr-open">
      <div className="panel__head">
        <h3>Ochiq turnirlar</h3>
        {/* Yonidagi nuqta — «ro'yxat tirik» degani: jimgina
            yangilanadigan sonlar odatda eski deb o'ylanadi. */}
        <span className="tnr-open__live">
          <i aria-hidden="true" /> yig‘ilmoqda
        </span>
      </div>

      <ul className="tnr-open__row">
        {turnir.open.map((row) => {
          const free = row.capacity - row.players;
          return (
            <li key={row.code}>
              <a className="tnr-open__card" href={turnirPath(row.code)}>
                <span className={`tnr-list__icon tnr-list__icon--${row.game}`}>
                  {row.game === 'guncha' ? <Flower size={16} /> : <Swords size={16} />}
                </span>
                <b>{row.title || (row.game === 'guncha' ? 'G‘uncha' : 'So‘zjang')}</b>
                <span className="tnr-open__count">
                  {row.players} / {row.capacity} kishi
                </span>
                {/* Chiziq ikki qavat: ostidagi — bo'sh o'rinlar
                    bo'ylab yuguradigan yorug'lik, ustidagi — rost
                    to'lish. Animatsiya faqat joy qolganda: to'lgan
                    xonada yugurib turadigan chiziq «hali kutilyapti»
                    deb aldardi. */}
                <span className={`tnr-open__bar${free > 0 ? ' tnr-open__bar--live' : ''}`}>
                  <i style={{ width: `${(row.players / row.capacity) * 100}%` }} />
                </span>
                <span className="tnr-open__free">
                  {free > 0 ? `yana ${free} o‘rin` : 'to‘ldi'}
                </span>
              </a>
            </li>
          );
        })}
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
      {/* Qatorda **o'z** natijam turadi, g'olibning ismi emas.
          Ilgari «8 kishi · g'olib: Alisher Rasulov» yozilardi va
          odam o'z tarixini ochib birovning ismini o'qirdi: o'zi
          nechanchi bo'lgani, qancha ishlagani va turnirni qanday
          o'tgani ko'rinmasdi. G'olib esa jadvalning o'zida,
          birinchi qatorda turibdi — ro'yxatda takrorlashning
          ma'nosi yo'q.

          Uch narsa: o'rin, davralar izi (yakuniy jadvaldagi
          nuqtalarning o'zi) va ishlangan aqcha. */}
      <ul className="tnr-list__items">
        {turnir.history.map((row) => {
          const uid = turnir.mine;
          /* O'rin — yakuniy tartibdan (`order`). Tugamagan yoki
             tashlab ketilgan turnirda u bo'lmaydi; o'shanda
             o'rin ham yozilmaydi. */
          const place = uid ? (row.doc.order ?? []).indexOf(uid) + 1 : 0;
          const earned = uid ? (earnedBy(row.doc, uid) ?? 0) : 0;
          return (
            <li key={row.code}>
              <a className="tnr-list__row" href={turnirPath(row.code)}>
                {/* O'yinning o'z ikonkasi va o'z rangi. Ilgari
                    hamma qatorda bir xil kubok turardi va So'zjang
                    bilan G'unchani faqat matnni o'qib ajratish
                    mumkin edi. Kubok esa hech narsa aytmasdi: bu
                    ro'yxatning hammasi turnir. */}
                <span className={`tnr-list__icon tnr-list__icon--${row.game}`}>
                  {row.game === 'guncha' ? <Flower size={16} /> : <Swords size={16} />}
                </span>
                <span className="tnr-list__main">
                  {/* Sarlavhada o'yinning nomi — «Turnir» hech narsa
                      aytmasdi, ro'yxatning hammasi turnir. Nomi
                      qo'yilgan turnirda esa o'sha nom qoladi: u
                      o'yin nomidan ham aniqroq, o'yinni ikonka
                      aytib turibdi. */}
                  <b>{row.title || (row.game === 'guncha' ? 'G‘uncha' : 'So‘zjang')}</b>
                  {/* Ikkinchi satr ikki bo'lakdan, uchta emas.
                      Ilgari «8 kishi», iz va «7-o'rin» teng vazn
                      bilan yonma-yon turardi va o'rtadagi nuqtalar
                      tasodifan tushib qolganday ko'rinardi.

                      Endi matn bitta bo'lak: sharoit va natija
                      («8 kishi · 7-o'rin»), o'rin esa ichida
                      ajralib turadi — savol «men nechanchi
                      bo'ldim», javob shu. Davralar izi undan
                      keyin, kengroq oraliq bilan: u izoh, ya'ni
                      «qanday o'tdim». */}
                  <span className="tnr-list__meta">
                    <span>
                      {row.players} kishi
                      {place > 0 && (
                        <>
                          {' · '}
                          <b>{place}-o‘rin</b>
                        </>
                      )}
                    </span>
                    {uid && <RoundMarks doc={row.doc} uid={uid} />}
                  </span>
                </span>
                {/* Rang yakuniy jadvaldagi bilan bitta qoidadan:
                    ishlangani yashil, yo'qotilgani qizil.
                    `.tnr-list__prize` yaramaydi — u sariqni
                    majburlaydi va manfiy son ham sariq chiqardi. */}
                {earned !== 0 && (
                  <span
                    className={`standings__delta standings__delta--${
                      earned > 0 ? 'up' : 'down'
                    }`}
                  >
                    <AqchaDelta value={earned} />
                  </span>
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
      {/* Ilovaga taklif eng tepada: turnir tugagan payt — odam
          sahifada eng uzoq turadigan, keyingi turnirni kutayotgan
          payt. Pastda, jadval ortida bo'lsa hech kim ko'rmasdi. */}
      <DownloadPromo
        top
        title="Turnirlar ilovada qulayroq"
        text="Yangi turnir boshlanishidan xabar keladi, davra tugashini kutib o‘tirmaysiz."
      />
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

/** Davralar izi — har davra uchun bitta nuqta.
 *
 *  Yashil — guruhini yutdi, qizil — oxirgi bo'ldi, kulrang —
 *  oralig'ida. So'lg'uni o'ynamagan davra: nuqta baribir qoladi,
 *  aks holda qatorlar bir-biriga nisbatan qisqarib ketardi va
 *  davralarni ko'z bilan solishtirib bo'lmasdi. */
function RoundMarks({ doc, uid }: { doc: TurnirDoc | null | undefined; uid: string }) {
  const marks = roundMarksOf(doc, uid);
  if (marks.length === 0) return <span className="standings__score" />;

  const TITLE: Record<RoundMark, string> = {
    won: 'guruhida birinchi',
    mid: 'o‘rtada',
    lost: 'guruhida oxirgi',
    none: 'o‘ynamadi',
  };

  return (
    <span className="standings__score marks">
      {marks.map((mark, index) => (
        <i
          key={index}
          className={`marks__dot marks__dot--${mark}`}
          title={`${index + 1}-davra — ${TITLE[mark]}`}
        />
      ))}
    </span>
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

  /* Umumiy hisob ustuni faqat kerak bo'lganda chiziladi. Server uni
     har doim ham yubormaydi va o'shanda jadvalning o'ng chekkasida
     ellik piksellik bo'sh ustun qolib, sonlar o'rtada osilib
     turardi. */
  const money = order.some((uid) => doc?.balance?.[uid] !== undefined);

  return (
    <div className={`standings tnr__final${money ? ' tnr__final--money' : ''}`}>
      <h3>Yakuniy jadval</h3>
      <ol className="standings__list">
        {order.map((uid, index) => {
          // Ustama bilan: sovrinli o'rin egasi ekranda haqiqatan
          // olgan sonini ko'rsin.
          const delta = earnedBy(doc, uid) ?? 0;
          const balance = doc?.balance?.[uid];
          /* Sovrinli o'rin ustamasi — alohida ko'rsatiladi.
             `earnedBy` uni allaqachon qo'shib beradi, ya'ni ekranda
             rost son turadi; lekin «nega menda +7 va unda +1?»
             degan savolga javob yo'q edi. Ilovada javobni qisqa
             «+N ustama» yozuvi beradi (`TurnirEarned`) — bu yerda
             ham o'shanday, faqat animatsiyasiz: jadval tinch
             turishi kerak. */
          const bonus =
            uid === doc?.winnerUid
              ? (doc?.prize ?? 0)
              : uid === doc?.runnerUpUid
                ? (doc?.runnerUpPrize ?? 0)
                : uid === doc?.thirdUid
                  ? (doc?.thirdPrize ?? 0)
                  : 0;
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
              {/* Ochko o'rniga **davralar izi** — ilovadagidek.
                  Ochko chalg'itardi: o'rinni yakunda final
                  belgilaydi, ya'ni ikkinchi qatordagi odamning
                  ochkosi birinchinikidan ko'p bo'lib chiqishi
                  mumkin. Iz esa «bu odam turnirni qanday o'tdi»
                  degan savolga bir qarashda javob beradi. */}
              <RoundMarks doc={doc} uid={uid} />
              {/* Katak har doim turadi: ustamasiz qatorlarda ham
                  joyi band bo'lsin, aks holda yonidagi sonlar
                  qatordan qatorga siljirdi. */}
              <span className="standings__bonus">
                {bonus > 0 ? `+${bonus} ustama` : ''}
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
              {money && (
                <span className="standings__total">
                  {balance === undefined ? '' : <Aqcha value={balance} size="sm" />}
                </span>
              )}
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

