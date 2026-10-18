/** Hisob — ro'yxatdan o'tish, kirish va seans.
 *
 *  Endi **o'z serverimizda**: parol ham, seans ham `api.sozgir.uz` da
 *  (`/v1/auth/*`). Firebase Auth olib tashlandi va saytda Firebase'dan
 *  hech narsa qolmadi.
 *
 *  Ilovadagi mantiq saqlanadi:
 *   * kirish maydoniga **telefon raqam** ham yozish mumkin — u
 *     `loginId.ts` da `<raqam>@gmail.com` ga o'giriladi. Server uchun
 *     bu oddiy pochta, ya'ni telefonda raqam bilan ro'yxatdan o'tgan
 *     odam saytga ham o'sha raqam bilan kiradi;
 *   * ko'rinadigan nom bir joyda hal qilinadi: hisobdagi taxallus →
 *     brauzerdagi tanlov → «Mehmon».
 *
 *  Uch narsa Firebase bilan birga ketdi:
 *
 *   * **mehmon hisobi yo'q** — server nomsiz qator ochmaydi. Sayt
 *     ilgari ham anonim hisob yaratmasdi (har tashrif admin paneldagi
 *     sanoqni buzardi), ya'ni amalda hech narsa o'zgarmadi: kirmasdan
 *     o'ynash mumkin va natija brauzerda qoladi;
 *   * **hisobni bog'lash** (`linkWithCredential`) — bog'lanadigan
 *     anonim hisob qolmagani uchun keraksiz;
 *   * **parolni tiklash** — xabar yuborish kanali hali sozlanmagan.
 *     Ilovada ham shunday, ya'ni ikkalasi bir xil gapni aytadi.
 *
 *  Eski Firebase paroli ishlayveradi: server uning xeshini saqlab
 *  qo'ygan va birinchi kirishda uni o'z sxemasiga jimgina ko'chiradi
 *  (`backend/src/app/auth.ts`). */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, ApiError } from '../api/client';
import {
  clearSession,
  readSession,
  saveSession,
  sessionFrom,
  watchSession,
  type Session,
} from '../api/session';
import { loadProfile, saveProfile, type ProfileDetails } from './profile';
import { patchBattleNickname } from './battleRating';
import { claimDevice, releaseDevice } from './device';
import { toLoginEmail } from './loginId';
import {
  clearStoredNickname,
  GUEST,
  readNicknameOwner,
  readStoredNickname,
  sanitizeNickname,
  writeStoredNickname,
} from './nickname';

export interface Account {
  uid: string;
  /** Har doim `false` — mehmon hisobi qolmadi. Maydon ekranlar uchun
   *  qoldirilgan: ular «kirganmi yoki mehmonmi» deb so'raydi. */
  isAnonymous: boolean;
  email: string | null;
  /** Reytingda ko'rinadigan nom — har doim to'ldirilgan. */
  nickname: string;
  /** Boshqa qurilmadan kirish uchun tayyormi. */
  linked: boolean;
  initial: string;
}

interface Credentials {
  /** Email yoki telefon raqam — `toLoginEmail` ikkalasini bitta shaklga
   *  keltiradi. */
  email: string;
  password: string;
}

/** Hisob oynasining ko'rinishi. Holat provayderda turadi, chunki oynani
 *  sarlavhadagi tugma ham, o'yin natijasi ham chaqiradi. */
export type AuthPrompt = 'register' | 'signIn' | 'profile' | 'password';

export interface AuthValue {
  account: Account | null;
  /** Hisob holati aniqlanganmi. */
  ready: boolean;
  busy: boolean;
  error: string | null;
  /** Brauzerda saqlangan nom — kirmagan holatda ham ishlatiladi. */
  nickname: string;
  register: (
    input: Credentials & { nickname: string; details?: ProfileDetails },
  ) => Promise<boolean>;
  signIn: (input: Credentials) => Promise<boolean>;
  /** Parolni yangilash — kirgan holatda. Joriy parol ham so'raladi. */
  updatePassword: (input: { current: string; next: string }) => Promise<boolean>;
  saveNickname: (nickname: string) => Promise<boolean>;
  /** Tug'ilgan sana va jins — profil oynasida to'ldiriladi. */
  saveDetails: (details: ProfileDetails) => Promise<boolean>;
  signOut: () => Promise<void>;
  clearError: () => void;
  /** Ochiq oyna (yopiq bo'lsa `null`). */
  prompt: AuthPrompt | null;
  openPrompt: (prompt: AuthPrompt) => void;
  closePrompt: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

/** Server xatosining kodini odam tushunadigan matnga o'giradi.
 *
 *  Kodlar `backend/src/app/auth.ts` dagi `AuthError` dan. Ro'yxat
 *  qisqa va ataylab: server «bunday pochta yo'q» bilan «parol xato» ni
 *  ajratmaydi — aks holda hujumchi ro'yxatdagi pochtalarni bittalab
 *  tekshirib chiqardi. */
function authMessage(error: unknown): string {
  const code = error instanceof ApiError ? error.message : '';
  switch (code) {
    case 'bad_email':
      return 'Email manzili noto‘g‘ri';
    case 'email_taken':
      return 'Bu raqam allaqachon band — kirish bo‘limidan foydalaning';
    case 'weak_password':
      return 'Parol juda oddiy — kamida 6 belgi bo‘lsin';
    case 'bad_credentials':
      return 'Raqam yoki parol xato';
    case 'no_session':
      return 'Kirish muddati tugadi — qaytadan kiring';
    default:
      return 'Ulanib bo‘lmadi — internetni tekshirib, qayta urinib ko‘ring';
  }
}

/** Yiqilsa ham amalni to'xtatmaydigan qadam.
 *
 *  Kirish va ro'yxatdan o'tishdan **keyingi** yozuvlar uchun: odam u
 *  paytda allaqachon kirgan va uni xato ekrani bilan qaytarib
 *  yuborish noto'g'ri bo'lardi. Sabab jurnalda qoladi. */
async function quietly(step: () => Promise<unknown>): Promise<void> {
  try {
    await step();
  } catch (raw) {
    console.error('[auth] kirishdan keyingi yozuv o‘tmadi:', raw);
  }
}

/** Kirilgan hisob uchun ko'rinadigan nomni hal qiladi.
 *
 *  Tartib ataylab shunday: **hisobning o'z nomi ustun**. Ilgari
 *  brauzerdagi nom ustun edi va bitta qurilmadan ikkinchi hisobga
 *  kirilganda ekranda eskisining nomi turaverardi — odam o'zining
 *  hisobida deb o'ylab, aslida boshqasida o'ynardi.
 *
 *  Hisobning nomi bo'lmasa, brauzerdagi nom faqat **egasiz** bo'lsa
 *  yoki aynan shu hisobniki bo'lsa qoladi. */
function adoptNickname(uid: string, own: string | null): string {
  const mine = own?.trim();
  if (mine) {
    writeStoredNickname(mine, uid);
    return mine;
  }

  const stored = readStoredNickname();
  const owner = readNicknameOwner();
  if (stored && (!owner || owner === uid)) {
    // Kirmasdan tanlangan nom shu hisobga o'tadi — endi egasi bor.
    writeStoredNickname(stored, uid);
    return stored;
  }

  clearStoredNickname();
  return '';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(readSession);
  /* Seans `localStorage` da, ya'ni birinchi kadrda allaqachon ma'lum —
     kutadigan narsa yo'q. Ilgari bu `false` dan boshlanardi: Firebase
     SDK yuklanib, IndexedDB'dagi seansni o'qiguncha ekran «hali
     bilmayman» holatida turardi. */
  const [ready] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nickname, setNickname] = useState(readStoredNickname);
  const [prompt, setPrompt] = useState<AuthPrompt | null>(null);
  /** Hisobning pochtasi — token'da yo'q, profil so'rovidan keladi.
   *
   *  Egasi bilan birga saqlanadi: hisob almashganda avvalgisining
   *  pochtasi bir lahza ko'rinib qolmasin. */
  const [mail, setMail] = useState<{ uid: string; email: string | null } | null>(
    null,
  );

  /* Seans boshqa joyda o'zgarsa (muddati tugadi, server bekor qildi,
     ikkinchi varaqda chiqildi) ekran ham ergashadi. */
  useEffect(() => watchSession(setSession), []);

  /* Kirilgan bo'lsa profil so'raladi: taxallus va pochta token'da yo'q.
     Ilgari ularni Firebase'ning `displayName` i olib yurardi. */
  const uid = session?.uid ?? null;
  useEffect(() => {
    /* Chiqilganda `email` tozalanmaydi — `account` baribir `null`
       bo'ladi va kirmagan odamga u ko'rinmaydi. Shu yerda tozalash
       effekt ichida ortiqcha qayta chizishni boshlab yuborardi. */
    if (!uid) return;
    claimDevice(uid);
    let alive = true;
    void loadProfile().then((profile) => {
      if (!alive) return;
      setMail({ uid, email: profile.email });
      setNickname(adoptNickname(uid, profile.nickname));
    });
    return () => {
      alive = false;
    };
  }, [uid]);

  /** Har bir amal uchun bir xil o'ram: bandlik, xato va natija. */
  const run = useCallback(
    async (action: () => Promise<void>): Promise<boolean> => {
      setBusy(true);
      setError(null);
      try {
        await action();
        return true;
      } catch (raw) {
        // Sabab jurnalda qoladi: ekrandagi matn qisqa, lekin nosozlik
        // haqidagi xabar ko'pincha ekran rasmi bo'lib keladi.
        console.error('[auth] xato:', raw);
        setError(authMessage(raw));
        return false;
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  /** Seansni ochadi — kirish, ro'yxatdan o'tish va parol almashishi
   *  uchun bitta yo'l. */
  const open = useCallback(
    async (path: string, body: Record<string, unknown>): Promise<void> => {
      const data = await api.post<Record<string, unknown>>(path, {
        // Token so'ralmaydi — aynan uni olyapmiz.
        auth: false,
        body: { ...body, platform: 'web' },
      });

      const next = sessionFrom(data);
      if (next === null) throw new ApiError('Server javobi chala');
      saveSession(next);
    },
    [],
  );

  const register = useCallback(
    ({ email: login, password, nickname: name, details }: Credentials & {
      nickname: string;
      details?: ProfileDetails;
    }) =>
      run(async () => {
        const clean = sanitizeNickname(name);
        await open('/v1/auth/register', {
          email: toLoginEmail(login),
          password,
          ...(clean ? { nickname: clean } : {}),
        });

        writeStoredNickname(clean);
        setNickname(clean);
        // Qolgan maydonlar alohida: ro'yxatdan o'tish marshruti faqat
        // taxallusni oladi. Yiqilsa ham hisob ochilgan.
        if (details?.birthDate || details?.gender) {
          await quietly(() => saveProfile({ details }));
        }
      }),
    [open, run],
  );

  const signIn = useCallback(
    ({ email: login, password }: Credentials) =>
      run(async () => {
        await open('/v1/auth/login', { email: toLoginEmail(login), password });
      }),
    [open, run],
  );

  /** Parolni yangilaydi.
   *
   *  Joriy parol ham kerak: o'g'irlangan qurilmadan parol almashtirib
   *  bo'lmasligi uchun. Server parol almashgach **hamma seansni**
   *  yopadi va shu qurilma uchun yangisini beradi — shuning uchun
   *  javobdagi token saqlanadi, aks holda odam o'zi almashtirgan
   *  paroldan keyin chiqib qolardi. */
  const updatePassword = useCallback(
    ({ current, next }: { current: string; next: string }) =>
      run(async () => {
        const data = await api.post<Record<string, unknown>>('/v1/auth/password', {
          body: { current, next, platform: 'web' },
        });
        const renewed = sessionFrom(data);
        if (renewed !== null) saveSession(renewed);
      }),
    [run],
  );

  /** Taxallusni saqlaydi. Kirmagan holatda ham ishlaydi — nom brauzerda
   *  qoladi va keyin kirilganda hisobga ko'chadi. */
  const saveNickname = useCallback(
    async (name: string) => {
      const clean = sanitizeNickname(name);
      // Kirilgan bo'lsa nom shu hisobga tegishli deb belgilanadi — keyin
      // boshqa hisobga kirilganda u o'zi bilan qolib ketmaydi.
      writeStoredNickname(clean, uid);
      setNickname(clean);
      if (!uid) return true;
      return run(async () => {
        await saveProfile({ nickname: clean });
        // So'zjang jadvali ham yangi nomga o'tadi — aks holda u yerda
        // jangdagi eski nom qolib ketardi.
        await patchBattleNickname();
      });
    },
    [run, uid],
  );

  const saveDetails = useCallback(
    (details: ProfileDetails) =>
      run(async () => {
        if (!uid) return;
        await saveProfile({ details });
      }),
    [run, uid],
  );

  const signOut = useCallback(async () => {
    const token = readSession()?.refreshToken;
    if (token) {
      // Serverdagi seans yopiladi: chiqqan qurilmadagi yangilash
      // token'i boshqa ishlamasin. Tarmoq yo'q bo'lsa ham qurilmadagi
      // seans baribir tozalanadi.
      await quietly(() =>
        api.post('/v1/auth/logout', { auth: false, body: { refreshToken: token } }),
      );
    }
    clearSession();
    // Ball, statistika va topilgan so'zlar hisob bilan ketadi: ular
    // serverda o'z egasida qoladi va qaytib kirilganda tiklanadi. Aks
    // holda keyingi odam avvalgi hisobning ballini meros qilib olardi.
    // Nom ataylab qoladi: chiqqan odam mehmon sifatida o'sha nom bilan
    // o'ynayveradi.
    releaseDevice();
  }, []);

  const account = useMemo<Account | null>(() => {
    if (!session) return null;
    const name = nickname.trim() || GUEST;
    const source = name || mail?.email || '';
    return {
      uid: session.uid,
      isAnonymous: false,
      // Boshqa hisobdan qolgan pochta ko'rinmasin: u faqat shu
      // seansning profili yuklangach to'ladi.
      email: mail?.uid === session.uid ? mail.email : null,
      nickname: sanitizeNickname(name),
      linked: true,
      initial: source ? source[0]!.toUpperCase() : '?',
    };
  }, [mail, nickname, session]);

  const value = useMemo<AuthValue>(
    () => ({
      account,
      ready,
      busy,
      error,
      nickname,
      register,
      signIn,
      updatePassword,
      saveNickname,
      saveDetails,
      signOut,
      clearError: () => setError(null),
      prompt,
      openPrompt: (next: AuthPrompt) => {
        setError(null);
        setPrompt(next);
      },
      closePrompt: () => {
        setError(null);
        setPrompt(null);
      },
    }),
    [
      account,
      busy,
      error,
      nickname,
      prompt,
      ready,
      register,
      updatePassword,
      saveDetails,
      saveNickname,
      signIn,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('AuthProvider topilmadi');
  return value;
}
