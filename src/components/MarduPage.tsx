/** Mardu maydon — `/maydon`.
 *
 *  Yangi o'yin emas, **yangi shakl**: ichida o'ynaladigani baribir
 *  So'zjang yoki G'uncha, qoidalari va hisobi o'sha. Farqi bitta —
 *  raqib bittadan ko'p, sakkiztagacha.
 *
 *  Ikki yo'l bor va ikkalasi bitta kutish xonasiga olib keladi:
 *  **tezkor maydon** (notanishlar bilan, ikkinchi odam kirganda 60
 *  soniyalik sanoq boshlanadi) va **do'stlar maydoni** (kod va havola,
 *  sanoqsiz — boshlashni yaratuvchi bosadi).
 *
 *  Maydon boshlangach o'yinning o'zi mavjud ekranlarda o'ynaladi
 *  (`/gunchajang` yoki `/sozjang`): xona o'sha ekranga o'tadi va
 *  hujjatdagi `endsAt` sanoqni o'zi boshlaydi. */
import { useEffect, useRef, useState } from 'react';
import { links } from '../data/site';
import { useAuth } from '../lib/auth';
import { useMardu, type Mardu } from '../lib/useMardu';
import { marduLink, MARDU_CAPACITY, MARDU_MIN_PLAYERS } from '../lib/mardu';
import type { BattleGame } from '../lib/battle';
import { routeParam } from '../lib/useRoute';
import { pretty } from '../lib/uz';
import ArenaHistory from './ArenaHistory';
import Avatar from './Avatar';
import CodeInput from './CodeInput';
import ScoreRules from './ScoreRules';
import { Check, Copy, Swords, Users } from './Icons';
import TelegramBanner from './TelegramBanner';

/** Havoladagi kod: `/maydon/AB12CD` — ilova ulashadigan manzil. */
function codeFromUrl(): string {
  const fromPath = routeParam();
  const fromQuery = new URLSearchParams(window.location.search).get('kod') ?? '';
  return (fromPath || fromQuery)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6);
}

const GAMES: { id: BattleGame; label: string; hint: string }[] = [
  {
    id: 'guncha',
    label: 'G‘uncha',
    hint: 'Hammaga bir xil g‘uncha, uch daqiqa. Kim ko‘p to‘plasa — o‘sha yuqorida.',
  },
  {
    id: 'soztop',
    label: 'So‘zjang',
    hint: 'Hammaga bir xil so‘z, ikki daqiqa. Kam urinishda topgan yuqorida turadi.',
  },
];

export default function MarduPage() {
  const mardu = useMardu();
  const { account, openPrompt } = useAuth();

  if (!account) {
    return (
      <section className="oyin">
        <div className="wrap">
          <div className="panel panel--call">
            <h3>Maydon uchun hisob kerak</h3>
            <p className="panel__note">
              Maydondagilar taxallusingizni ko‘radi va o‘rin o‘lja
              beradi — shuning uchun maydon hisobsiz o‘ynalmaydi.
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
        {mardu.error && <p className="form__err">{mardu.error}</p>}
        {mardu.battleId ? <Lobby mardu={mardu} /> : <Hub mardu={mardu} />}
      </div>
    </section>
  );
}

/* ── Bo'lim ──────────────────────────────────────────────────────────── */

function Hub({ mardu }: { mardu: Mardu }) {
  const [code, setCode] = useState(codeFromUrl);
  const joined = useRef(false);

  // Havoladagi kod bilan o'zi qo'shiladi — odam kodni terib o'tirmasin.
  // Keyin manzil tozalanadi: sahifa yangilanganda qayta urinilmaydi.
  useEffect(() => {
    if (joined.current || code.length !== 6) return;
    joined.current = true;
    void mardu.join(code);
    window.history.replaceState(null, '', links.mardu);
  }, [code, mardu]);

  const chosen = GAMES.find((item) => item.id === mardu.game) ?? GAMES[0]!;

  return (
    <div className="lobby">
      <div className="lobby__main">
        <div className="panel lobby__card">
          <div className="panel__head">
            <h3>Mardu maydon</h3>
            <span className="panel__tag">{MARDU_CAPACITY} kishigacha</span>
          </div>

          {/* Avval qaysi o'yin: maydon — shakl, ichidagi o'yin tanlanadi. */}
          <div className="play__modes" role="tablist" aria-label="Maydondagi o‘yin">
            {GAMES.map((item) => (
              <button
                key={item.id}
                role="tab"
                aria-selected={mardu.game === item.id}
                className={`play__mode${mardu.game === item.id ? ' play__mode--on' : ''}`}
                onClick={() => mardu.setGame(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <p className="panel__note lobby__hint">{chosen.hint}</p>

          <button
            className="btn btn--lg lobby__quick"
            onClick={() => mardu.quick()}
            disabled={mardu.busy}
          >
            <Users size={20} />
            {mardu.busy ? 'Maydon ochilmoqda…' : 'Tezkor maydon'}
          </button>
          <p className="panel__note lobby__hint">
            Notanish odamlar bilan. Ikkinchi odam kirgach {mardu.countdown}{' '}
            soniyalik sanoq boshlanadi — kim yig‘ilgan bo‘lsa, o‘sha bilan
            o‘ynaysiz.
          </p>

          <div className="lobby__friend">
            <span className="panel__label">
              <Swords size={14} /> Do‘stlar bilan
            </span>
            <div className="lobby__friend-row">
              <button
                className="btn btn--outline"
                onClick={() => mardu.create()}
                disabled={mardu.busy}
              >
                {mardu.busy ? 'Yaratilmoqda…' : 'Maydon ochish'}
              </button>
              <span className="lobby__or">yoki</span>
              <CodeInput
                value={code}
                onChange={setCode}
                onSubmit={() => mardu.join(code)}
                disabled={mardu.busy}
              />
              <button
                className="btn btn--ghost"
                onClick={() => code.length === 6 && mardu.join(code)}
                disabled={mardu.busy || code.length !== 6}
              >
                Qo‘shilish
              </button>
            </div>
          </div>
        </div>

        <div className="panel">
          <h3>Qoidalar</h3>
          <ol className="guncha__rules">
            <li>Maydonga {MARDU_CAPACITY} kishigacha yig‘iladi, kamida {MARDU_MIN_PLAYERS}.</li>
            <li>O‘yin o‘zgarmaydi — o‘sha so‘z yoki o‘sha g‘uncha, faqat raqib ko‘p.</li>
            <li>Vaqtni server hisoblaydi: muddat o‘tgach natija yakunlanadi.</li>
            <ScoreRules game="mardu" bare />
          </ol>
        </div>
      </div>

      <aside className="lobby__side">
        <ArenaHistory />
        <TelegramBanner compact />
      </aside>
    </div>
  );
}

/* ── Kutish xonasi ───────────────────────────────────────────────────── */

function Lobby({ mardu }: { mardu: Mardu }) {
  const friends = mardu.mode === 'friends';

  return (
    <div className="stage arena">
      <div className="stage__head">
        <h2>{friends ? 'Do‘stlar maydoni' : 'Tezkor maydon'}</h2>
        <span className="stage__tag">
          {mardu.marduGame === 'guncha' ? 'G‘uncha' : 'So‘zjang'} ·{' '}
          {mardu.players}/{MARDU_CAPACITY}
        </span>
      </div>

      {friends ? <Invite mardu={mardu} /> : <Countdown mardu={mardu} />}

      <ul className="arena__members">
        {mardu.rows.map((row) => (
          <li
            key={row.uid}
            className={`arena__member${row.mine ? ' arena__member--me' : ''}`}
          >
            <Avatar name={row.nickname} uid={row.uid} size={34} />
            <span className="arena__name">{pretty(row.nickname)}</span>
            {row.uid === (mardu.battle?.host ?? mardu.battle?.createdBy) && (
              <span className="arena__host">yaratuvchi</span>
            )}
          </li>
        ))}
        {/* Bo'sh o'rinlar ham ko'rinadi: maydon to'lib borayotgani
            sezilsin, aks holda ikki kishilik ro'yxat «hammasi shu» bo'lib
            ko'rinardi. */}
        {Array.from(
          { length: Math.max(0, MARDU_MIN_PLAYERS + 1 - mardu.players) },
          (_, index) => (
            <li key={`bosh-${index}`} className="arena__member arena__member--empty">
              <i aria-hidden="true" />
              <span className="arena__name">kutilmoqda…</span>
            </li>
          ),
        )}
      </ul>

      <div className="result__actions">
        {friends && mardu.isHost && (
          <button
            className="btn"
            onClick={mardu.start}
            disabled={mardu.busy || !mardu.canStart}
            title={mardu.canStart ? undefined : 'Kamida ikki kishi kerak'}
          >
            {mardu.busy ? 'Boshlanmoqda…' : 'Boshlash'}
          </button>
        )}
        <button className="btn btn--outline" onClick={mardu.leave}>
          Chiqish
        </button>
      </div>

      {friends && !mardu.isHost && (
        <p className="stage__hint" role="status">
          Maydonni yaratuvchi boshlaydi.
        </p>
      )}
    </div>
  );
}

/** Tezkor maydondagi halqa sanoq. Sanoq **ikkinchi** odamdan boshlanadi:
 *  yolg'iz kutgan odam uchun sanoq yolg'on bo'lardi — nol bo'lganda
 *  o'ynaydigan hech kim yo'q. */
function Countdown({ mardu }: { mardu: Mardu }) {
  if (mardu.left === null) {
    return (
      <p className="arena__wait" role="status">
        Odam kutilmoqda — ikkinchisi kirgach sanoq boshlanadi.
      </p>
    );
  }

  const share = Math.max(0, Math.min(1, mardu.left / mardu.countdown));
  const urgent = mardu.left <= 10;

  return (
    <div className={`arena__clock${urgent ? ' arena__clock--urgent' : ''}`}>
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle className="arena__ring" cx="60" cy="60" r="52" />
        <circle
          className="arena__ring arena__ring--on"
          cx="60"
          cy="60"
          r="52"
          style={{ strokeDashoffset: `${(1 - share) * 327}` }}
        />
      </svg>
      <strong aria-live="polite">{mardu.left}</strong>
      <span>soniya</span>
    </div>
  );
}

/** Do'stlar maydonida sanoq o'rnida havola va kod turadi. */
function Invite({ mardu }: { mardu: Mardu }) {
  const [copied, setCopied] = useState(false);
  const link = mardu.code ? marduLink(mardu.code) : '';

  const copy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link).catch(() => undefined);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  if (!mardu.code) return null;

  return (
    <>
      <button
        type="button"
        className="code"
        onClick={copy}
        title="Havolani nusxalash"
        aria-label={`Maydon kodi ${mardu.code}. Havolani nusxalash`}
      >
        {[...mardu.code].map((char, index) => (
          <span key={index} style={{ '--i': index } as React.CSSProperties}>
            {char}
          </span>
        ))}
      </button>

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
      <p className="stage__hint" role="status">
        {copied ? 'Havola nusxalandi' : 'Havolani do‘stlaringizga yuboring'}
      </p>
    </>
  );
}
