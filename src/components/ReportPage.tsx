/** Shikoyat sahifasi — `/shikoyat/soz/{so'z}` va `/shikoyat/oyinchi/{uid}`.
 *
 *  Ilovadagi ikki oyna (`ReportWordSheet` va `ReportSheet`) ning veb
 *  ko'rinishi, lekin **oyna emas, sahifa**: jang natijasi ekrani
 *  allaqachon to'la va uning ustiga yana bir qavat qo'yish o'qishni
 *  qiyinlashtirardi. Alohida manzil yana ikki narsani beradi: shikoyat
 *  yarmida brauzerning «orqaga» tugmasi ishlaydi va havolani boshqa
 *  joydan (profil, janglar tarixi) ham ochsa bo'ladi.
 *
 *  Ikkala shikoyat bitta sahifada: shakli bir xil — sabab, izoh,
 *  yuborish. Farqi faqat sarlavha va qayerga ketishida.
 *
 *  Mehmon yozolmaydi: ikkala marshrut ham token talab qiladi, shuning
 *  uchun unga avval kirish taklif qilinadi. */
import { useState } from 'react';
import { useAuth } from '../lib/auth';
import {
  COMMENT_MAX,
  PLAYER_REASONS,
  REASONS,
  submitPlayerReport,
  submitWordReport,
  type PlayerReason,
  type ReportReason,
} from '../lib/report';
import { unlockBadge } from '../lib/badges';
import { toLatin } from '../lib/useScript';
import { display, split } from '../lib/uz';
import { ChevronLeft } from './Icons';

/** Manzildan nima ustidan shikoyat qilinayotgani o'qiladi.
 *
 *  `routeParam()` bu yerda yetmaydi: ikkala manzil ham bitta
 *  marshrutga tushadi (`/shikoyat`), ya'ni turini yo'lning o'zidan
 *  ajratish kerak. */
type Target =
  | { kind: 'word'; value: string }
  | { kind: 'player'; value: string }
  | null;

function targetOf(): Target {
  const path = window.location.pathname.replace(/\/+$/, '');
  const read = (prefix: string) => {
    if (!path.startsWith(prefix) || path.length <= prefix.length) return '';
    try {
      return decodeURIComponent(path.slice(prefix.length));
    } catch {
      return '';
    }
  };

  const word = read('/shikoyat/soz/');
  if (word) return { kind: 'word', value: word };
  const player = read('/shikoyat/oyinchi/');
  if (player) return { kind: 'player', value: player };
  return null;
}

/** Qo'shimcha ma'lumot manzil so'rovida: kimning taxallusi, qaysi jang,
 *  so'z qayerda uchragani. Ular shikoyatning o'ziga kirmaydi — faqat
 *  sarlavhani odamga tushunarli qiladi va izohga qo'shiladi. */
function queryOf(key: string): string {
  return new URLSearchParams(window.location.search).get(key)?.trim() ?? '';
}

export default function ReportPage() {
  const target = targetOf();
  const auth = useAuth();
  const [reason, setReason] = useState<string>('');
  const [comment, setComment] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const player = target?.kind === 'player';
  const reasons: { key: string; label: string }[] = player ? PLAYER_REASONS : REASONS;
  const picked = reason || reasons[0].key;
  /** Qayerdan kelgan bo'lsa — o'sha yerga. Shikoyat uchun sahifa
   *  tashlab chiqilgan, ya'ni odam jangining natijasiga qaytishi
   *  kerak; havola bilan to'g'ridan-to'g'ri kelgan bo'lsa o'yinlar
   *  ro'yxati qoladi. */
  const back = queryOf('orqaga') || '/oynash';

  async function send() {
    if (!target || !auth.account || state === 'sending') return;
    setState('sending');
    try {
      if (target.kind === 'word') {
        await submitWordReport({
          word: target.value,
          length: split(target.value).length,
          reason: picked as ReportReason,
          comment,
          mode: queryOf('qayerda') || 'jang',
        });
        // «Yalavoch» — lug'at uchun birinchi murojaat (`lib/badges.ts`).
        unlockBadge('yalavoch');
      } else {
        await submitPlayerReport({
          uid: target.value,
          reason: picked as PlayerReason,
          note: comment,
          battleId: queryOf('jang') || undefined,
        });
      }
      setState('sent');
    } catch {
      setState('error');
    }
  }

  if (!target) {
    return (
      <section className="oyin">
        <div className="wrap report-page">
          <h1>Shikoyat</h1>
          <p className="section__lead">
            Manzil to‘liq emas — shikoyat so‘z yoki o‘yinchi ustidan
            yuboriladi, ya’ni u qaysi biri ekani havolada bo‘lishi kerak.
          </p>
          <a className="btn btn--sm" href="/oynash">
            O‘yinlarga qaytish
          </a>
        </div>
      </section>
    );
  }

  const name = queryOf('ism');

  return (
    <section className="oyin">
      <div className="wrap report-page">
        <a className="player__back" href={back}>
          <ChevronLeft size={18} />
          Orqaga
        </a>

        <h1>{player ? 'O‘yinchi ustidan shikoyat' : 'So‘z haqida xabar berish'}</h1>
        <p className="section__lead">
          {player
            ? 'Shikoyatni moderator o‘qib chiqadi. Chora darhol ko‘rilmaydi: qarorni odam qabul qiladi.'
            : 'Sababni tanlang — moderator o‘qib chiqadi va so‘zni lug‘atdan chiqarishi mumkin.'}
        </p>

        {/* Nima ustidan shikoyat qilinayotgani ko'rinib tursin: odam
            havolani boshqa joydan ochgan bo'lishi ham mumkin. */}
        <p className="report-page__subject" data-script={player ? undefined : 'word'}>
          {player ? name || 'O‘yinchi' : display(target.value)}
        </p>

        {!auth.account ? (
          <div className="panel panel--call">
            <h3>Shikoyat uchun hisob kerak</h3>
            <p className="panel__note">
              Kim yuborganini moderator ko‘rishi kerak — aks holda bitta
              odam boshqasini cheksiz shikoyat qila olardi.
            </p>
            <button className="btn btn--sm" onClick={() => auth.openPrompt('signIn')}>
              Kirish
            </button>
          </div>
        ) : state === 'sent' ? (
          <div className="report__done" role="status">
            <span aria-hidden="true">✅</span>
            <p>Shikoyatingiz yuborildi — rahmat!</p>
            <a className="btn btn--sm" href={back}>
              Orqaga
            </a>
          </div>
        ) : (
          <div className="form">
            <div className="report__reasons" role="radiogroup" aria-label="Sabab">
              {reasons.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  role="radio"
                  aria-checked={picked === item.key}
                  className={`chip${picked === item.key ? ' chip--on' : ''}`}
                  onClick={() => setReason(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <label className="field">
              <span>Izoh (ixtiyoriy)</span>
              <textarea
                value={comment}
                onChange={(event) =>
                  setComment(toLatin(event.target.value).slice(0, COMMENT_MAX))
                }
                placeholder={
                  player ? 'Nima bo‘lganini yozing' : 'Nima noto‘g‘ri ekanini yozing'
                }
                rows={3}
                maxLength={COMMENT_MAX}
              />
              <small className="report__count">
                {comment.length}/{COMMENT_MAX}
              </small>
            </label>

            {state === 'error' && (
              <p className="form__err">
                Shikoyatni yuborib bo‘lmadi. Birozdan keyin urinib ko‘ring.
              </p>
            )}

            <button className="btn" onClick={send} disabled={state === 'sending'}>
              {state === 'sending' ? 'Yuborilmoqda…' : 'Yuborish'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
