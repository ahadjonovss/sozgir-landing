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
import PlayerName from './PlayerName';
import { nicknameError } from '../lib/nickname';
import { PHONE_LENGTH, prettyLogin } from '../lib/loginId';
import { loadDetails, MAX_AGE, MIN_AGE, type ProfileDetails } from '../lib/profile';
import PhoneField from './PhoneField';
import { toLatin } from '../lib/useScript';
import { links, playerLink } from '../data/site';

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
  /** Faqat raqamlar — `+998` maydonning o'zida turadi. */
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(() => auth.nickname);
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  /** Telegram kodi so'ralayotgan bosqich.
   *
   *  Alohida oyna emas, shu oynaning ikkinchi ko'rinishi: robot
   *  brauzerning boshqa varag'ida ochiladi va odam shu yerga
   *  qaytib kodni teradi. Ilovada ham xuddi shunday — robot
   *  ilovadan tashqarida ishlaydi, oyna esa ochiq qoladi. */
  const [codeStep, setCodeStep] = useState(false);
  const [code, setCode] = useState('');
  const [note, setNote] = useState<string | null>(null);
  const [invalid, setInvalid] = useState<string | null>(null);
  const first = useRef<HTMLInputElement | null>(null);
  const range = birthRange();

  /* Kod bosqichiga o'tilganda ham fokus ko'chadi: odam robotdan
     qaytganda kursor allaqachon kod maydonida tursin. */
  useEffect(() => {
    first.current?.focus();
  }, [codeStep]);

  /* Profil oynasi: serverdagi ma'lumot o'qiladi — bir marta to'ldirgan
     odamdan qayta so'ralmasin. */
  const uid = auth.account?.uid;
  useEffect(() => {
    if (mode !== 'profile' || !uid) return;
    let alive = true;
    void loadDetails().then((details) => {
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

    if (codeStep) {
      // Kod aynan olti raqam: shaklni shu yerda tekshirish kerak,
      // aks holda yarim terilgan kod serverga ketib, uning uch
      // urinishidan birini yeb qo'yardi.
      if (!/^\d{6}$/.test(code.trim())) {
        return setInvalid('Kod olti raqamdan iborat');
      }
      if (await auth.signInWithCode(code)) close();
      return;
    }

    const nameProblem = nicknameError(name);
    /* Faqat raqam — ilovadagidek.
     *
     * Pochta bo'limi olib tashlandi: hisob raqamga bog'lanadi va
     * parolni tiklash ham raqam bo'yicha ishlaydi (`parolbot`),
     * ya'ni ikkinchi yo'l shaklni murakkablashtirardi. Ilgari
     * pochta bilan ochilgan hisoblar bor va ularga pastdagi izoh
     * yo'l ko'rsatadi. */
    const loginProblem =
      phone.length === PHONE_LENGTH ? null : 'Telefon raqamni to‘liq kiriting';
    const passProblem =
      password.length >= 6 ? null : 'Parol kamida 6 belgidan iborat bo‘lsin';

    if (mode === 'register') {
      if (nameProblem) return setInvalid(nameProblem);
      if (loginProblem) return setInvalid(loginProblem);
      if (passProblem) return setInvalid(passProblem);
      const joined = await auth.register({
        email: phone,
        password,
        nickname: name,
      });
      if (joined) close();
      return;
    }
    if (mode === 'signIn') {
      if (loginProblem) return setInvalid(loginProblem);
      if (passProblem) return setInvalid(passProblem);
      if (await auth.signIn({ email: phone, password })) {
        close();
      }
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

  /** Tug'ilgan sana va jins — **faqat profil oynasida**.
   *
   *  Hisob ochishda so'ralmaydi. Ikkalasi ham o'yinga ta'sir qilmaydi:
   *  na ball, na jadval, na jang ularga qaraydi. Yangi odam uchun esa
   *  bu shaklning yarmi edi va har qo'shimcha maydon bir qancha odamni
   *  yo'ldan qaytaradi. Xohlagan odam keyin profilda to'ldiradi —
   *  oyna o'sha-o'sha. */
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
            <strong>
              <PlayerName uid={auth.account.uid} name={auth.account.nickname} />
            </strong>
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
            Mehmon hisobi shu brauzerga bog‘langan. Telefon raqam
            qo‘shsangiz natijalaringiz boshqa qurilmadan ham ko‘rinadi —{' '}
            <button className="link" onClick={() => open('register')}>
              raqam qo‘shish
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
        lead="Telefon raqamingiz bilan. Natijalaringiz saqlanadi, jadvalda ko‘rinadi va boshqa qurilmadan ham ochiladi."
        onClose={close}
      >
        <form className="form" onSubmit={submit}>
          {nameField('Ismingiz yoki taxallusingiz', true)}
          <PhoneField value={phone} onChange={setPhone} autoComplete="tel" />
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
        </div>
      </Modal>
    );
  }

  /* Kod bosqichi — robot ochilgandan keyingi ko'rinish.
     Oyna o'sha-o'sha, ichidagi shakl almashadi: odam robotdan
     qaytganda ayni shu yerni ko'radi. */
  if (codeStep) {
    return (
      <Modal
        title="Telegram orqali kirish"
        lead="Robot bergan olti xonali kodni kiriting. Kod uch daqiqa yashaydi."
        onClose={close}
      >
        <form className="form" onSubmit={submit}>
          <label className="field">
            <span>Kod</span>
            <input
              ref={first}
              /* `text` + `inputMode`: `number` turi telefonda ham
                 o'q tugmachalarini chizadi va boshida nol turgan
                 kodni kesib yuborishi mumkin. */
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(event) =>
                setCode(event.target.value.replace(/\D/g, '').slice(0, 6))
              }
              placeholder="000000"
              maxLength={6}
            />
          </label>
          {status}
          <button className="btn" disabled={auth.busy}>
            {auth.busy ? 'Kirilmoqda…' : 'Kirish'}
          </button>
        </form>

        <div className="modal__tabs">
          <a className="link" href={links.loginBot} target="_blank" rel="noreferrer">
            Robotni qayta ochish
          </a>
          <button
            className="link"
            onClick={() => {
              setInvalid(null);
              setCode('');
              setCodeStep(false);
            }}
          >
            Parol bilan kirish
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title="Hisobga kirish"
      lead="Statistika, aqcha va jadvaldagi o‘rningiz tiklanadi."
      onClose={close}
    >
      <form className="form" onSubmit={submit}>
        <PhoneField
          value={phone}
          onChange={setPhone}
          inputRef={first}
          autoComplete="tel"
        />
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

      {/* Pochta bilan ochilgan eski hisoblar uchun yagona yo'l.
          Ilovada ham aynan shu izoh turadi (`authEmailMoved`): ular
          raqamga bog'lanmagan va shakl orqali kira olmaydi. */}
      <a className="modal__hint" href={links.telegramGroup} target="_blank" rel="noreferrer">
        Ilgari email bilan kirgan bo‘lsangiz, hisobingizni telefon raqamga
        o‘tkazish uchun Telegram orqali yozing
      </a>

      {/* Telegram — ikkinchi yo'l, tanlov emas.
          Bo'lim qilib qo'yilmadi: ko'pchilik raqam va parol bilan
          kiradi, Telegram esa parolini unutganlar va yangi
          kelganlar uchun qulayroq. Shuning uchun u asosiy tugma
          ostida turadi — ko'rinadi, lekin yo'lni to'smaydi.
          Ilovadagi joylashuvning o'zi. */}
      <div className="form__or">
        <span>yoki</span>
      </div>
      <a
        className="btn btn--outline btn--wide"
        href={links.loginBot}
        target="_blank"
        rel="noreferrer"
        onClick={() => {
          /* Robot boshqa varaqda ochiladi, shuning uchun bu oyna
             yopilmaydi: odam qaytganda kod maydoni tayyor turadi.
             Havolaning o'zi to'silmaydi — `target="_blank"` ni
             brauzer bajaradi, biz faqat ko'rinishni almashtiramiz. */
          setInvalid(null);
          setCodeStep(true);
        }}
      >
        Telegram orqali kirish
      </a>

      <div className="modal__tabs">
        {/* Parolni tiklash — robot orqali.
            Avtomatik xat yuborish kanali yo'q va raqamli hisobda u
            baribir ishlamasdi: manzil `<raqam>@gmail.com` bo'lib
            chiqadi va xat begona qutiga ketardi. Robot esa raqamni
            Telegram orqali tasdiqlaydi — ilovada ham shu havola. */}
        <a className="link" href={links.parolBot} target="_blank" rel="noreferrer">
          Parolni unutdingizmi?
        </a>
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
          <span className="account__name">
            <PlayerName uid={auth.account.uid} name={auth.account.nickname} size={14} />
          </span>
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
