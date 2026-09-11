/** «So'z haqida xabar berish» — natija ostidagi havola va oyna.
 *
 *  Ilovadagi `ReportWordSheet` ning veb ko'rinishi: tayyor sabablar va
 *  ixtiyoriy izoh. Murojaat `word_reports` ga tushadi va moderator so'zni
 *  lug'atdan chiqarishi mumkin. Mehmon yozolmaydi (qoidalar `uid` talab
 *  qiladi) — unga kirish taklif qilinadi. */
import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { COMMENT_MAX, REASONS, submitWordReport, type ReportReason } from '../lib/report';
import { toLatin } from '../lib/useScript';
import { display } from '../lib/uz';
import Modal from './Modal';

export default function ReportWord({
  word,
  length,
  mode,
}: {
  word: string;
  length: number;
  mode: string;
}) {
  const auth = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>('notAWord');
  const [comment, setComment] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const close = () => {
    setOpen(false);
    setState('idle');
    setComment('');
  };

  async function send() {
    if (!auth.account || state === 'sending') return;
    setState('sending');
    try {
      await submitWordReport({
        word,
        length,
        reason,
        comment,
        mode,
        uid: auth.account.uid,
        nickname: auth.account.nickname,
      });
      setState('sent');
    } catch {
      setState('error');
    }
  }

  return (
    <>
      <button
        type="button"
        className="report-link"
        onClick={() => (auth.account ? setOpen(true) : auth.openPrompt('signIn'))}
      >
        So‘z haqida xabar berish
      </button>

      {open && auth.account && (
        <Modal
          title="Xabar berish"
          lead="Sababni tanlang — moderator o‘qib chiqadi va so‘zni lug‘atdan chiqarishi mumkin."
          onClose={close}
        >
          {state === 'sent' ? (
            <div className="report__done" role="status">
              <span aria-hidden="true">✅</span>
              <p>Xabaringiz yuborildi — rahmat!</p>
              <button className="btn btn--sm" onClick={close}>
                Yopish
              </button>
            </div>
          ) : (
            <div className="form">
              <p className="report__word" data-script="word">{display(word)}</p>

              <div className="report__reasons" role="radiogroup" aria-label="Sabab">
                {REASONS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    role="radio"
                    aria-checked={reason === item.key}
                    className={`chip${reason === item.key ? ' chip--on' : ''}`}
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
                  placeholder="Nima noto‘g‘ri ekanini yozing"
                  rows={3}
                  maxLength={COMMENT_MAX}
                />
                <small className="report__count">
                  {comment.length}/{COMMENT_MAX}
                </small>
              </label>

              {state === 'error' && (
                <p className="form__err">Murojaatni yuborib bo‘lmadi. Birozdan keyin urinib ko‘ring.</p>
              )}

              <button className="btn" onClick={send} disabled={state === 'sending'}>
                {state === 'sending' ? 'Yuborilmoqda…' : 'Yuborish'}
              </button>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
