/** «Yangi so'z taklif qilish» — havola va oyna.
 *
 *  Ilovadagi `ProposeWordSheet` ning veb ko'rinishi: so'z va uning
 *  **ta'rifi**. Taklif `word_proposals` ga tushadi va admin panelida
 *  alohida navbat bo'lib ko'rinadi — o'yin paytida yig'ilgan ta'rifsiz
 *  takliflar bilan aralashmaydi.
 *
 *  Lug'atga qo'shilgan so'z uchun muallifga 3 aqcha beriladi, lekin
 *  yuborishning o'zi hech narsa bermaydi: qarorni moderator chiqaradi.
 *  Shu sabab oynada «yuborildi» dan boshqa va'da yo'q.
 *
 *  Mehmon yozolmaydi (qoidalar `uid` talab qiladi) — unga kirish taklif
 *  qilinadi. */
import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { toLatin } from '../lib/useScript';
import { lengthOf, normalize, pretty } from '../lib/uz';
import {
  DESCRIPTION_MAX,
  WORD_MAX,
  alreadyKnown,
  proposalError,
  submitWordProposal,
} from '../lib/wordProposal';
import Modal from './Modal';

export default function ProposeWord() {
  const auth = useAuth();
  const [open, setOpen] = useState(false);
  const [word, setWord] = useState('');
  const [description, setDescription] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [problem, setProblem] = useState<string | null>(null);

  const close = () => {
    setOpen(false);
    setState('idle');
    setWord('');
    setDescription('');
    setProblem(null);
  };

  /** Maydonning o'zi yettitadan ortiq harf qabul qilmaydi: ortiqchasi
   *  shunchaki yozilmaydi, ya'ni «uzun» degan xato umuman chiqmaydi.
   *  Hisob **harf-birlikda** boradi (`gʻisht` — to'rt harf). */
  const type = (raw: string) => {
    const clean = normalize(toLatin(raw));
    setWord(lengthOf(clean) > WORD_MAX ? word : clean);
    setProblem(null);
  };

  async function send() {
    if (!auth.account || state === 'sending') return;

    const issue = proposalError(word, description);
    if (issue) {
      setProblem(issue);
      return;
    }

    setState('sending');
    // Lug'atda bor so'z moderatorga ketmaydi: qarori oldindan ma'lum.
    if (await alreadyKnown(word)) {
      setState('idle');
      setProblem('Bu so‘z lug‘atda allaqachon bor');
      return;
    }

    try {
      await submitWordProposal({
        word,
        description,
        uid: auth.account.uid,
        nickname: auth.account.nickname,
      });
      setState('sent');
    } catch {
      setState('error');
    }
  }

  const units = lengthOf(word);

  return (
    <>
      <button
        type="button"
        className="report-link"
        onClick={() => (auth.account ? setOpen(true) : auth.openPrompt('signIn'))}
      >
        Yangi so‘z taklif qilish
      </button>

      {open && auth.account && (
        <Modal
          title="Yangi so‘z"
          lead="Lug‘atda yo‘q, lekin bo‘lishi kerak deb hisoblagan so‘zni ta’rifi bilan yuboring — moderator ko‘rib chiqadi."
          onClose={close}
        >
          {state === 'sent' ? (
            <div className="report__done" role="status">
              <span aria-hidden="true">✅</span>
              <p>
                Taklifingiz yuborildi — rahmat! Lug‘atga qo‘shilsa,
                hisobingizga 3 aqcha tushadi.
              </p>
              <button className="btn btn--sm" onClick={close}>
                Yopish
              </button>
            </div>
          ) : (
            <div className="form">
              <label className="field">
                <span>So‘z</span>
                <input
                  value={pretty(word)}
                  onChange={(event) => type(event.target.value)}
                  placeholder="Masalan: gʻisht"
                  autoComplete="off"
                  spellCheck={false}
                  data-script="word"
                />
                {/* Hisoblagich harf sonini ko'rsatadi: odam chegaraga
                    qanday yaqinlashayotganini yozayotib ko'rib turadi. */}
                <small className="report__count">
                  {units}/{WORD_MAX} harf
                </small>
              </label>

              <label className="field">
                <span>Ma’nosi</span>
                <textarea
                  value={description}
                  onChange={(event) => {
                    setDescription(event.target.value.slice(0, DESCRIPTION_MAX));
                    setProblem(null);
                  }}
                  placeholder="So‘z nimani anglatadi?"
                  rows={3}
                  maxLength={DESCRIPTION_MAX}
                />
                <small className="report__count">
                  {description.length}/{DESCRIPTION_MAX}
                </small>
              </label>

              {problem && <p className="form__err">{problem}</p>}
              {state === 'error' && (
                <p className="form__err">
                  Taklifni yuborib bo‘lmadi. Birozdan keyin urinib ko‘ring.
                </p>
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
