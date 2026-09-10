/** Jonli kuzatuv (`onSnapshot`).
 *
 *  Qolgan sahifalar `firestore/lite` bilan ishlaydi — u kichik, lekin
 *  tinglashni bilmaydi. Jangda esa raqibning har qatori darhol ko'rinishi
 *  kerak, shuning uchun shu yerda to'liq SDK ishlatiladi. U alohida chunk
 *  va faqat So'zjang sahifasida yuklanadi.
 *
 *  Ikki variant bitta `FirebaseApp` ustida yonma-yon yashaydi: SDK ularni
 *  alohida komponent sifatida ro'yxatga oladi. */
import { client } from './client';
import { EMULATOR, useEmulator } from './config';

export type Unsubscribe = () => void;

export async function watchDoc<T>(
  path: string,
  onData: (data: T | null) => void,
  {
    skipCache = false,
  }: {
    /** Keshdan kelgan (`fromCache`) holatlar tashlab yuboriladi.
     *  SDK oldin tinglangan hujjatni xotirada saqlaydi va yangi
     *  tinglovchiga avval **eski** nusxani beradi — navbat yozuvida bu
     *  o'tgan jangning `matchId` si bo'lib, o'tgan jang qayta ochilardi. */
    skipCache?: boolean;
  } = {},
): Promise<Unsubscribe> {
  const { app } = await client();
  const { connectFirestoreEmulator, getFirestore, doc, onSnapshot } =
    await import('firebase/firestore');

  const db = getFirestore(app);
  if (useEmulator) connectFirestoreEmulator(db, EMULATOR.host, EMULATOR.firestore);

  return onSnapshot(
    doc(db, path),
    (snapshot) => {
      if (skipCache && snapshot.metadata.fromCache) return;
      onData(snapshot.exists() ? (snapshot.data() as T) : null);
    },
    // Ulanish uzilsa jim o'tamiz: chaqiruvchi oxirgi holat bilan qoladi.
    () => onData(null),
  );
}

/** Menga kelgan, javob kutayotgan chaqiruv. */
export interface LiveInvite {
  id: string;
  fromNickname: string;
  /** Qayerdan kelgani: `rematch`, `nearby` yoki `profile` (ilovadagi
   *  ochiq profil / saytdagi reyting qatori). Yozuvi `inviteSource` da. */
  kind: string;
  /** Muddati tugaydigan payt (millisekundda). Noma'lum bo'lsa `0`. */
  expiresAt: number;
}

/** Menga kelgan chaqiruvlarni kuzatadi.
 *
 *  Ilovada bu ish `WatchIncomingInvites` da bajariladi — saytda ham xuddi
 *  shu hujjatlar o'qiladi, shuning uchun telefondan yuborilgan chaqiruv
 *  brauzerda ham darrov ko'rinadi. */
export async function watchInvites(
  uid: string,
  onData: (invites: LiveInvite[]) => void,
): Promise<Unsubscribe> {
  const { app } = await client();
  const {
    connectFirestoreEmulator,
    getFirestore,
    collection,
    onSnapshot,
    query,
    where,
  } = await import('firebase/firestore');

  const db = getFirestore(app);
  if (useEmulator) connectFirestoreEmulator(db, EMULATOR.host, EMULATOR.firestore);

  return onSnapshot(
    query(
      collection(db, 'battle_invites'),
      where('toUid', '==', uid),
      where('status', '==', 'pending'),
    ),
    (snapshot) =>
      onData(
        snapshot.docs.map((item) => {
          const data = item.data() as Record<string, unknown>;
          const expires = data.expiresAt as { seconds?: number } | undefined;
          return {
            id: item.id,
            fromNickname: String(data.fromNickname ?? 'Raqib'),
            kind: String(data.kind ?? 'rematch'),
            expiresAt: expires?.seconds ? expires.seconds * 1000 : 0,
          };
        }),
      ),
    // Ulanish uzilsa jim o'tamiz: xabar chiqmaydi, xolos.
    () => onData([]),
  );
}
