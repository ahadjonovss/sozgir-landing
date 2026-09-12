/** Sarlavhadagi hisob tugmasi va hisob oynasi.
 *
 *  Ikki yo'l: kirish va yangi hisob. Kirish tugmasi to'g'ridan-to'g'ri
 *  kirish shaklini ochadi — oldin oldida taxallus so'raydigan «mehmon»
 *  qadami bor edi, u olib tashlandi.
 *
 *  Oynaning ochiq/yopiq holati `AuthProvider` da turadi: uni sarlavhadagi
 *  tugma ham, o'yin natijasidagi «Natijani saqlash» ham chaqiradi. */
import { useEffect, useRef, useState } from 'react';
import { useAuth, type AuthPrompt } from '../lib/auth';
import Avatar from './Avatar';
import AvatarEditor from './AvatarEditor';
import Modal from './Modal';
import { nicknameError } from '../lib/nickname';
import { isValidLogin, looksLikePhone, prettyLogin } from '../lib/loginId';
import { loadDetails, MAX_AGE, MIN_AGE, type ProfileDetails } from '../firebase/profile';
import { toLatin } from '../lib/useScript';
import { playerLink } from '../data/site';

/** Sana tanlagichining chegaralari — ilovadagi `minAge`/`maxAge`. */
function birthRange(now = new Date()) {
  const iso = (year: number) =>
    new Date(year, now.getMonth(), now.getDate()).toISOString().slice(0, 10);
  return { min: iso(now.getFullYear() - MAX_AGE), max: iso(now.getFullYear() - MIN_AGE) };
}

/** Oyna har ochilganda `key={mode}` bilan qaytadan yaratiladi — shuning
 *  uchun maydonlar shu rejimga mos boshlang'ich qiymat bilan keladi. */
function AuthDialog({ mode }: { mode: AuthPrompt }) {
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(() => auth.nickname);
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [note, setNote] = useState<string | null>(null);
  const [invalid, setInvalid] = useState<string | null>(null);
  const first = useRef<HTMLInputElement | null>(null);
  const range = birthRange();

  useEffect(() => {
    first.current?.focus();
  }, []);

  /* Profil oynasi: serverdagi ma'lumot o'qiladi — bir marta to'ldirgan
     odamdan qayta so'ralmasin. */
  const uid = auth.account?.uid;
  useEffect(() => {
    if (mode !== 'profile' || !uid) return;
    let alive = true;
    void loadDetails(uid).then((details) => {
      if (!alive) return;
      if (details.birthDate) setBirthDate(details.birthDate);
      if (details.gender) setGender(details.gender);
    });
    return () => {
      alive = false;
    };
  }, [mode, uid]);

  const close = () => auth.closePrompt();
  const open = (next: AuthPrompt) => auth.openPrompt(next);
  const problem = invalid ?? auth.error;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setInvalid(null);
    setNote(null);

    const nameProblem = nicknameError(name);
    const loginProblem = isValidLogin(email)
      ? null
      : 'Email yoki telefon raqamni to‘g‘ri kiriting';
    const passProblem =
      password.length >= 6 ? null : 'Parol kamida 6 belgidan iborat bo‘lsin';

    if (mode === 'register') {
      if (nameProblem) return setInvalid(nameProblem);
      if (loginProblem) return setInvalid(loginProblem);
      if (passProblem) return setInvalid(passProblem);
      if (!birthDate) return setInvalid('Tug‘ilgan sanani tanlang');
      if (!gender) return setInvalid('Jinsni tanlang');
      const joined = await auth.register({
        email: email.trim(),
        password,
        nickname: name,
        details: { birthDate, gender },
      });
      if (joined) close();
      return;
    }
    if (mode === 'signIn') {
      if (loginProblem) return setInvalid(loginProblem);
      if (passProblem) return setInvalid(passProblem);
      if (await auth.signIn({ email: email.trim(), password })) close();
      return;
    }
    if (nameProblem) return setInvalid(nameProblem);
    if (!(await auth.saveNickname(name))) return;
    // Tug'ilgan sana va jins — eski hisoblar shu yerda to'ldiradi.
    const details: ProfileDetails = {
      birthDate: birthDate || null,
      gender: gender || null,
    };
    if (details.birthDate || details.gender) await auth.saveDetails(details);
    setNote('Saqlandi');
  }

  async function forgot() {
    setInvalid(null);
    setNote(null);
    // Raqam bilan kirgan odamga tiklash havolasi yubora olmaymiz: u
    // `<raqam>@gmail.com` ga ketadi, o'sha pochta esa uniki bo'lmasligi
    // mumkin.
    if (looksLikePhone(email)) {
      return setInvalid('Parolni tiklash email orqali ishlaydi');
    }
    if (!isValidLogin(email)) return setInvalid('Avval email manzilini kiriting');
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
        /* Boshqa alifboda yozilgan taxallus darhol eski lotinga
           o'giriladi — bazada va reytingda bitta shakl turadi. */
        onChange={(event) => setName(toLatin(event.target.value))}
        maxLength={24}
        placeholder={placeholder}
      />
    </label>
  );

  /** Tug'ilgan sana va jins — ro'yxatdan o'tishda so'raladi, profil
   *  oynasida esa eski hisoblar to'ldiradi. */
  const detailFields = (
    <div className="form__pair">
      <label className="field">
        <span>Tug‘ilgan sana</span>
        <input
          type="date"
          value={birthDate}
          min={range.min}
          max={range.max}
          onChange={(event) => setBirthDate(event.target.value)}
        />
      </label>
      <label className="field">
        <span>Jins</span>
        <select
          value={gender}
          onChange={(event) =>
            setGender(event.target.value as 'male' | 'female' | '')
          }
        >
          <option value="">Tanlang</option>
          <option value="male">Erkak</option>
          <option value="female">Ayol</option>
        </select>
      </label>
    </div>
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
        {/* Profil rasmi — ilovadagi kabi: qo'yish, almashtirish, o'chirish. */}
        <AvatarEditor uid={auth.account.uid} name={auth.account.nickname} />

        <div className="modal__row">
          <div>
            <strong>{auth.account.nickname}</strong>
            <p className="modal__lead">
              {auth.account.linked
                ? prettyLogin(auth.account.email)
                : 'Mehmon rejimi'}
            </p>
            {/* Boshqalar ko'radigan sahifa — ochiq ma'lumot qanday
                ko'rinishini o'zi ham ko'rsin. Oyna yopiladi: havola
                sahifani almashtiradi. */}
            <a className="link" href={playerLink(auth.account.uid)} onClick={close}>
              Ochiq profilim
            </a>
          </div>
        </div>

        <form className="form" onSubmit={submit}>
          {nameField('Ismingiz yoki taxallusingiz', true)}
          {detailFields}
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
              email qo‘shish
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

  if (mode === 'register') {
    return (
      <Modal
        title="Yangi hisob"
        lead="Natijalaringiz saqlanadi, reytingda ko‘rinadi va boshqa qurilmadan ham ochiladi."
        onClose={close}
      >
        <form className="form" onSubmit={submit}>
          {nameField('Ismingiz yoki taxallusingiz', true)}
          <label className="field">
            <span>Email yoki telefon</span>
            <input
              type="text"
              inputMode="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="misol@mail.com yoki 90 123 45 67"
              autoComplete="username"
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
          {detailFields}
          {status}
          <button className="btn" disabled={auth.busy}>
            {auth.busy ? 'Yaratilmoqda…' : 'Ro‘yxatdan o‘tish'}
          </button>
        </form>

        <div className="modal__tabs">
          <button className="link" onClick={() => open('signIn')}>
            Hisobim bor
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
          <span>Email yoki telefon</span>
          <input
            ref={first}
            type="text"
            inputMode="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="misol@mail.com yoki 90 123 45 67"
            autoComplete="username"
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

/** Hisob oynasi — sahifada bir marta chizilishi kerak.
 *
 *  Tugma bir necha joyda turadi (yon menyu, telefondagi sarlavha), oyna
 *  esa bitta: shuning uchun u tugmadan ajratilgan. */
export function AccountDialog() {
  const auth = useAuth();
  return auth.prompt ? <AuthDialog key={auth.prompt} mode={auth.prompt} /> : null;
}

export default function Account() {
  const auth = useAuth();

  return (
    <>
      {auth.account ? (
        <button
          className="account"
          onClick={() => auth.openPrompt('profile')}
          title={prettyLogin(auth.account.email) || 'Mehmon rejimi'}
        >
          <Avatar name={auth.account.nickname} uid={auth.account.uid} size={26} />
          <span className="account__name">{auth.account.nickname}</span>
        </button>
      ) : (
        <button
          className="btn btn--sm btn--ghost"
          onClick={() => auth.openPrompt('signIn')}
        >
          Kirish
        </button>
      )}
    </>
  );
}
