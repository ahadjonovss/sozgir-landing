/** Shikoyat shakli — sabab, izoh, yuborish.
 *
 *  Ikki joyda bir xil chiqadi: `/shikoyat/...` sahifasida va jang
 *  natijasidagi oynada (`ReportDialog`). Shakl shu yerda turadi,
 *  chunki undagi hamma narsa — sabablar ro'yxati, izoh chegarasi,
 *  yuborilgandan keyingi holat va mehmonga aytiladigan gap — ikkala
 *  joyda ham bir xil bo'lishi kerak. Ilgari bu kod faqat sahifada
 *  bor edi va oyna qo'shilganda u ikkinchi nusxaga aylanardi.
 *
 *  So'z ustidan ham, o'yinchi ustidan ham shikoyat qilinadi: farqi
 *  faqat sabablar ro'yxati va qayerga yuborilishida.
 *
 *  Mehmon yozolmaydi — ikkala marshrut ham token talab qiladi,
 *  shuning uchun unga avval kirish taklif qilinadi. */
import { useState, type ReactNode } from 'react';
import { useAuth } from '../lib/auth';
import {
  COMMENT_MAX,
  PLAYER_REASONS,
  REASONS,
  submitPlayerReport,
  submitWordReport,
  type PlayerReason,
  type ReportKind,
  type ReportReason,
} from '../lib/report';
import { unlockBadge } from '../lib/badges';
import { toLatin } from '../lib/useScript';
import { display, split } from '../lib/uz';

export default function ReportForm({
  kind,
  value,
  name,
  mode = 'jang',
  battleId,
  doneAction,
}: {
  kind: ReportKind;
  /** So'zning o'zi yoki o'yinchining `uid` i. */
  value: string;
  /** O'yinchining taxallusi — `uid` odamga hech narsa aytmaydi. */
  name?: string;
  /** So'z qayerda uchragani: `jang`, `kunlik`, `cheksiz`. */
  mode?: string;
  battleId?: string;
  /** Yuborilgandan keyingi tugma — sahifada «Orqaga», oynada
   *  «Yopish». Shakl bu yerda qaror qilmaydi: u qayerda turganini
   *  bilmaydi. */
  doneAction?: ReactNode;
}) {
  const auth = useAuth();
  const [reason, setReason] = useState<string>('');
  const [comment, setComment] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const player = kind === 'player';
  const reasons: { key: string; label: string }[] = player ? PLAYER_REASONS : REASONS;
  const picked = reason || reasons[0].key;

  async function send() {
    if (!auth.account || state === 'sending') return;
    setState('sending');
    try {
      if (player) {
        await submitPlayerReport({
          uid: value,
          reason: picked as PlayerReason,
          note: comment,
          battleId,
        });
      } else {
        await submitWordReport({
          word: value,
          length: split(value).length,
          reason: picked as ReportReason,
          comment,
          mode,
        });
        // «Yalavoch» — lug'at uchun birinchi murojaat (`lib/badges.ts`).
        unlockBadge('yalavoch');
      }
      setState('sent');
    } catch {
      setState('error');
    }
  }

  return (
    <>
      {/* Nima ustidan shikoyat qilinayotgani ko'rinib tursin: oynani
          ham, havolani ham odam boshqa joydan ochgan bo'lishi
          mumkin. */}
      <p className="report-page__subject" data-script={player ? undefined : 'word'}>
        {player ? name || 'O‘yinchi' : display(value)}
      </p>

      {!auth.account ? (
        <div className="panel panel--call">
          <h3>Shikoyat uchun hisob kerak</h3>
          <p className="panel__note">
            Kim yuborganini moderator ko‘rishi kerak — aks holda bitta odam
            boshqasini cheksiz shikoyat qila olardi.
          </p>
          <button className="btn btn--sm" onClick={() => auth.openPrompt('signIn')}>
            Kirish
          </button>
        </div>
      ) : state === 'sent' ? (
        <div className="report__done" role="status">
          <span aria-hidden="true">✅</span>
          <p>Shikoyatingiz yuborildi — rahmat!</p>
          {doneAction}
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
    </>
  );
}
