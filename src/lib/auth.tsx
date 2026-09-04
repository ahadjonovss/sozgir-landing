/** Hisob: anonim «mehmon», email bilan ro'yxatdan o'tish va kirish.
 *
 *  Ilovadagi mantiq saqlanadi:
 *   * mehmon sifatida o'ynagan odam keyin email qo'shsa, hisob **bog'lanadi**
 *     (`linkWithCredential`) — uid o'zgarmaydi, ya'ni ball va streak joyida
 *     qoladi;
 *   * ko'rinadigan nom bir joyda hal qilinadi: brauzerdagi tanlov →
 *     hisobdagi `displayName` → «Mehmon».
 *
 *  Ilovadan farqi bitta va u ataylab: sayt hech kimni **avtomatik**
 *  anonim hisobga kirgizmaydi. Aks holda har bir tashrif Firebase'da yangi
 *  foydalanuvchi yasab, admin paneldagi statistikani buzardi. Kirmasdan ham
 *  o'ynash mumkin — natija shunda faqat brauzerda saqlanadi. */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { User } from 'firebase/auth';
import { client } from '../firebase/client';
import { authError } from '../firebase/errors';
import { saveProfile } from '../firebase/profile';
import {
  GUEST,
  readStoredNickname,
  sanitizeNickname,
  writeStoredNickname,
} from './nickname';

/** Oldingi tashrifda kirilganini eslab qolish kaliti.
 *
 *  Firebase sessiyasi IndexedDB'da yotadi, lekin uni o'qish uchun SDK
 *  yuklanishi kerak. Bu bayroq shu savolga javob beradi: SDK'ni darhol
 *  yuklash kerakmi, yoki tashrifchi umuman kirmaganmi. */
const SESSION_KEY = 'sozgir.session';

export interface Account {
  uid: string;
  isAnonymous: boolean;
  email: string | null;
  /** Reytingda ko'rinadigan nom — har doim to'ldirilgan. */
  nickname: string;
  /** Boshqa qurilmadan kirish uchun tayyormi. */
  linked: boolean;
  initial: string;
}

interface Credentials {
  email: string;
  password: string;
}

/** Hisob oynasining ko'rinishi. Holat provayderda turadi, chunki oynani
 *  sarlavhadagi tugma ham, o'yin natijasi ham chaqiradi. */
export type AuthPrompt = 'guest' | 'register' | 'signIn' | 'profile';

export interface AuthValue {
  account: Account | null;
  /** Hisob holati aniqlanganmi (SDK yuklanib bo'ldimi). */
  ready: boolean;
  busy: boolean;
  error: string | null;
  /** Brauzerda saqlangan nom — kirmagan holatda ham ishlatiladi. */
  nickname: string;
  register: (input: Credentials & { nickname: string }) => Promise<boolean>;
  signIn: (input: Credentials) => Promise<boolean>;
  continueAsGuest: (nickname: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
  saveNickname: (nickname: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  clearError: () => void;
  /** Ochiq oyna (yopiq bo'lsa `null`). */
  prompt: AuthPrompt | null;
  openPrompt: (prompt: AuthPrompt) => void;
  closePrompt: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

function flagSession(active: boolean): void {
  try {
    if (active) localStorage.setItem(SESSION_KEY, '1');
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // Bayroq yo'q bo'lsa ham hammasi ishlaydi, faqat SDK keyinroq yuklanadi.
  }
}

function hadSession(): boolean {
  try {
    return localStorage.getItem(SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(() => !hadSession());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nickname, setNickname] = useState(readStoredNickname);
  const [prompt, setPrompt] = useState<AuthPrompt | null>(null);

  /** `onAuthStateChanged` bir marta ulanadi — keyin har qanday kirish va
   *  chiqish shu orqali bildiriladi. */
  const watching = useRef(false);
  const watch = useCallback(async () => {
    if (watching.current) return;
    watching.current = true;
    const { auth } = await client();
    const { onAuthStateChanged } = await import('firebase/auth');
    onAuthStateChanged(auth, (next) => {
      setUser(next);
      flagSession(next !== null);
      setReady(true);
      // Hisobdagi nom brauzerda yo'q bo'lsa — ko'chirib qo'yamiz. Aks holda
      // yangi qurilmada odam «Mehmon» bo'lib ko'rinardi.
      const account = next?.displayName?.trim();
      if (account && !readStoredNickname()) {
        writeStoredNickname(account);
        setNickname(account);
      }
    });
  }, []);

  // Oldin kirilgan bo'lsa — sessiyani tiklaymiz. Bo'lmasa SDK'ga tegmaymiz.
  useEffect(() => {
    if (!hadSession()) return;
    void watch();
  }, [watch]);

  /** Har bir amal uchun bir xil o'ram: bandlik, xato va natija. */
  const run = useCallback(
    async (action: () => Promise<void>): Promise<boolean> => {
      setBusy(true);
      setError(null);
      try {
        await watch();
        await action();
        return true;
      } catch (raw) {
        const code = (raw as { code?: string }).code;
        setError(code ? authError(code) : 'Amalni bajarib bo‘lmadi');
        return false;
      } finally {
        setBusy(false);
      }
    },
    [watch],
  );

  const continueAsGuest = useCallback(
    (name: string) =>
      run(async () => {
        const { auth } = await client();
        const { signInAnonymously, updateProfile } = await import('firebase/auth');
        const clean = sanitizeNickname(name);
        // Nom kirishdan oldin saqlanadi: `onAuthStateChanged` darhol
        // ishga tushadi va natija yozuvi shu nomni olishi kerak.
        writeStoredNickname(clean);
        setNickname(clean);
        const credential = await signInAnonymously(auth);
        await updateProfile(credential.user, { displayName: clean });
        await saveProfile({ uid: credential.user.uid, nickname: clean });
      }),
    [run],
  );

  /** Ro'yxatdan o'tish.
   *
   *  Tartib muhim: hozir mehmon sifatida o'ynayotgan bo'lsa hisobni
   *  **bog'laymiz** — uid o'zgarmaydi va yig'ilgan ball joyida qoladi. */
  const register = useCallback(
    ({ email, password, nickname: name }: Credentials & { nickname: string }) =>
      run(async () => {
        const { auth } = await client();
        const {
          createUserWithEmailAndPassword,
          EmailAuthProvider,
          linkWithCredential,
          updateProfile,
        } = await import('firebase/auth');

        const clean = sanitizeNickname(name);
        writeStoredNickname(clean);
        setNickname(clean);
        const current = auth.currentUser;
        const credential =
          current && current.isAnonymous
            ? await linkWithCredential(
                current,
                EmailAuthProvider.credential(email, password),
              )
            : await createUserWithEmailAndPassword(auth, email, password);

        await updateProfile(credential.user, { displayName: clean });
        await credential.user.reload();
        setUser(auth.currentUser);
        await saveProfile({
          uid: credential.user.uid,
          email: credential.user.email,
          nickname: clean,
        });
      }),
    [run],
  );

  const signIn = useCallback(
    ({ email, password }: Credentials) =>
      run(async () => {
        const { auth } = await client();
        const { signInWithEmailAndPassword } = await import('firebase/auth');
        const credential = await signInWithEmailAndPassword(auth, email, password);
        // Hisob boshqa — brauzerdagi nom o'sha hisobdagisiga bo'shatiladi.
        const account = credential.user.displayName?.trim();
        if (account) {
          writeStoredNickname(account);
          setNickname(account);
        }
        await saveProfile({
          uid: credential.user.uid,
          email: credential.user.email,
          nickname: account,
        });
      }),
    [run],
  );

  const resetPassword = useCallback(
    (email: string) =>
      run(async () => {
        const { auth } = await client();
        const { sendPasswordResetEmail } = await import('firebase/auth');
        await sendPasswordResetEmail(auth, email);
      }),
    [run],
  );

  /** Taxallusni saqlaydi. Kirmagan holatda ham ishlaydi — nom brauzerda
   *  qoladi va keyin kirilganda hisobga ko'chadi. */
  const saveNickname = useCallback(
    async (name: string) => {
      const clean = sanitizeNickname(name);
      writeStoredNickname(clean);
      setNickname(clean);
      if (!user) return true;
      return run(async () => {
        const { auth } = await client();
        const { updateProfile } = await import('firebase/auth');
        if (!auth.currentUser) return;
        await updateProfile(auth.currentUser, { displayName: clean });
        await saveProfile({ uid: auth.currentUser.uid, nickname: clean });
      });
    },
    [run, user],
  );

  const signOut = useCallback(async () => {
    if (!user) return;
    const { auth } = await client();
    const { signOut: leave } = await import('firebase/auth');
    await leave(auth).catch(() => undefined);
    flagSession(false);
  }, [user]);

  const account = useMemo<Account | null>(() => {
    if (!user) return null;
    const name = nickname.trim() || user.displayName?.trim() || GUEST;
    const source = name || user.email || '';
    return {
      uid: user.uid,
      isAnonymous: user.isAnonymous,
      email: user.email,
      nickname: sanitizeNickname(name),
      linked: !user.isAnonymous && Boolean(user.email),
      initial: source ? source[0]!.toUpperCase() : '?',
    };
  }, [nickname, user]);

  const value = useMemo<AuthValue>(
    () => ({
      account,
      ready,
      busy,
      error,
      nickname,
      register,
      signIn,
      continueAsGuest,
      resetPassword,
      saveNickname,
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
      continueAsGuest,
      error,
      nickname,
      prompt,
      ready,
      register,
      resetPassword,
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
