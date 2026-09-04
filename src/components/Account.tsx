/** Sarlavhadagi hisob tugmasi va hisob oynasi.
 *
 *  Uch yo'l taklif qiladi: mehmon (anonim hisob), yangi hisob va kirish.
 *  Mehmon yo'li ham hisob yaratadi — shuning uchun ball reytingga tushadi;
 *  farqi shundaki, email so'ralmaydi va keyin xohlasa bog'lab qo'yadi.
 *
 *  Oynaning ochiq/yopiq holati `AuthProvider` da turadi: uni sarlavhadagi
 *  tugma ham, o'yin natijasidagi «Natijani saqlash» ham chaqiradi. */
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth, type AuthPrompt } from '../lib/auth';
import { GUEST, nicknameError } from '../lib/nickname';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function Modal({
  title,
  lead,
  onClose,
  children,
}: {
  title: string;
  lead?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    // Oyna ochiq turganda sahifa orqada surilmasin.
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  // Portal shart: `.header` da `backdrop-filter` bor, u esa ichidagi
  // `position: fixed` uchun yangi kontekst yasaydi — oyna sarlavha
  // balandligiga qamalib qolardi.
  return createPortal(
    <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
      <button className="modal__veil" onClick={onClose} aria-label="Yopish" />
      <div className="modal__card">
        <div className="modal__head">
          <div>
            <h3>{title}</h3>
            {lead && <p className="modal__lead">{lead}</p>}
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Yopish">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

/** Oyna har ochilganda `key={mode}` bilan qaytadan yaratiladi — shuning
 *  uchun maydonlar shu rejimga mos boshlang'ich qiymat bilan keladi. */
function AuthDialog({ mode }: { mode: AuthPrompt }) {
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(
    () => auth.nickname || (mode === 'guest' ? GUEST : ''),
  );
  const [note, setNote] = useState<string | null>(null);
  const [invalid, setInvalid] = useState<string | null>(null);
  const first = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    first.current?.focus();
  }, []);

  const close = () => auth.closePrompt();
  const open = (next: AuthPrompt) => auth.openPrompt(next);
  const problem = invalid ?? auth.error;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setInvalid(null);
    setNote(null);

    const nameProblem = nicknameError(name);
    const mailProblem = EMAIL.test(email.trim()) ? null : 'Email manzili noto‘g‘ri';
    const passProblem =
      password.length >= 6 ? null : 'Parol kamida 6 belgidan iborat bo‘lsin';

    if (mode === 'guest') {
      if (nameProblem) return setInvalid(nameProblem);
      if (await auth.continueAsGuest(name)) close();
      return;
    }
    if (mode === 'register') {
      if (nameProblem) return setInvalid(nameProblem);
      if (mailProblem) return setInvalid(mailProblem);
      if (passProblem) return setInvalid(passProblem);
      const joined = await auth.register({
        email: email.trim(),
        password,
        nickname: name,
      });
      if (joined) close();
      return;
    }
    if (mode === 'signIn') {
      if (mailProblem) return setInvalid(mailProblem);
      if (passProblem) return setInvalid(passProblem);
      if (await auth.signIn({ email: email.trim(), password })) close();
      return;
    }
    if (nameProblem) return setInvalid(nameProblem);
    if (await auth.saveNickname(name)) setNote('Taxallus saqlandi');
  }

  async function forgot() {
    setInvalid(null);
    setNote(null);
    if (!EMAIL.test(email.trim())) return setInvalid('Avval email manzilini kiriting');
    if (await auth.resetPassword(email.trim())) {
      setNote('Parolni tiklash havolasi emailga yuborildi');
    }
  }

  const nameField = (placeholder: string, ref = false) => (
    <label className="field">
      <span>Taxallus</span>
      <input
        ref={ref ? first : undefined}
        value={name}
        onChange={(event) => setName(event.target.value)}
        maxLength={24}
        placeholder={placeholder}
      />
    </label>
  );

  const status = (
    <>
      {problem && <p className="form__err">{problem}</p>}
      {note && <p className="form__ok">{note}</p>}
    </>
  );

  if (mode === 'profile') {
    if (!auth.account) return null;
    return (
      <Modal title="Hisob" onClose={close}>
        <div className="modal__row">
          <span className="account__avatar account__avatar--lg">
            {auth.account.initial}
          </span>
          <div>
            <strong>{auth.account.nickname}</strong>
            <p className="modal__lead">
              {auth.account.linked ? auth.account.email : 'Mehmon rejimi'}
            </p>
          </div>
        </div>

        <form className="form" onSubmit={submit}>
          {nameField('Ismingiz yoki taxallusingiz', true)}
          {status}
          <button className="btn" disabled={auth.busy}>
            {auth.busy ? 'Saqlanmoqda…' : 'Saqlash'}
          </button>
        </form>

        {!auth.account.linked && (
          <p className="modal__hint">
            Mehmon hisobi shu brauzerga bog‘langan. Email qo‘shsangiz
            natijalaringiz boshqa qurilmadan ham ko‘rinadi —{' '}
            <button className="link" onClick={() => open('register')}>
              hisob ochish
            </button>
            .
          </p>
        )}

        <div className="modal__foot">
          <button
            className="btn btn--sm btn--outline"
            onClick={async () => {
              await auth.signOut();
              close();
            }}
          >
            Chiqish
          </button>
        </div>
      </Modal>
    );
  }

  if (mode === 'guest') {
    return (
      <Modal
        title="O‘yinga kirish"
        lead="Natijalaringiz saqlanadi va reytingda ko‘rinadi."
        onClose={close}
      >
        <form className="form" onSubmit={submit}>
          {nameField('Reytingda shu nom ko‘rinadi', true)}
          {status}
          <button className="btn" disabled={auth.busy}>
            {auth.busy ? 'Ulanmoqda…' : 'Mehmon sifatida davom etish'}
          </button>
        </form>

        <div className="modal__tabs">
          <button className="link" onClick={() => open('register')}>
            Email bilan hisob ochish
          </button>
          <button className="link" onClick={() => open('signIn')}>
            Hisobim bor
          </button>
        </div>
        <p className="modal__hint">
          Kirmasdan ham o‘ynash mumkin — u holda natija faqat shu brauzerda
          qoladi va reytingga tushmaydi.
        </p>
      </Modal>
    );
  }

  if (mode === 'register') {
    return (
      <Modal
        title="Yangi hisob"
        lead="Mehmon sifatida o‘ynagan bo‘lsangiz, ballaringiz shu hisobga o‘tadi."
        onClose={close}
      >
        <form className="form" onSubmit={submit}>
          {nameField('Ismingiz yoki taxallusingiz', true)}
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="misol@mail.com"
              autoComplete="email"
            />
          </label>
          <label className="field">
            <span>Parol</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Kamida 6 belgi"
              autoComplete="new-password"
            />
          </label>
          {status}
          <button className="btn" disabled={auth.busy}>
            {auth.busy ? 'Yaratilmoqda…' : 'Ro‘yxatdan o‘tish'}
          </button>
        </form>

        <div className="modal__tabs">
          <button className="link" onClick={() => open('signIn')}>
            Hisobim bor
          </button>
          <button className="link" onClick={() => open('guest')}>
            Mehmon sifatida
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title="Hisobga kirish"
      lead="Statistika, ball va reytingdagi o‘rningiz tiklanadi."
      onClose={close}
    >
      <form className="form" onSubmit={submit}>
        <label className="field">
          <span>Email</span>
          <input
            ref={first}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="misol@mail.com"
            autoComplete="email"
          />
        </label>
        <label className="field">
          <span>Parol</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />
        </label>
        {status}
        <button className="btn" disabled={auth.busy}>
          {auth.busy ? 'Kirilmoqda…' : 'Kirish'}
        </button>
      </form>

      <div className="modal__tabs">
        <button className="link" onClick={forgot}>
          Parolni unutdingizmi?
        </button>
        <button className="link" onClick={() => open('register')}>
          Hisobim yo‘q
        </button>
      </div>
    </Modal>
  );
}

export default function Account() {
  const auth = useAuth();

  return (
    <>
      {auth.account ? (
        <button
          className="account"
          onClick={() => auth.openPrompt('profile')}
          title={auth.account.email ?? 'Mehmon rejimi'}
        >
          <span className="account__avatar">{auth.account.initial}</span>
          <span className="account__name">{auth.account.nickname}</span>
        </button>
      ) : (
        <button
          className="btn btn--sm btn--ghost"
          onClick={() => auth.openPrompt('guest')}
        >
          Kirish
        </button>
      )}

      {auth.prompt && <AuthDialog key={auth.prompt} mode={auth.prompt} />}
    </>
  );
}
