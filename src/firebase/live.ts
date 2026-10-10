/** Jonli kuzatuv (`onSnapshot`).
 *
 *  Qolgan sahifalar `firestore/lite` bilan ishlaydi — u kichik, lekin
 *  tinglashni bilmaydi. Jangda esa raqibning har qatori darhol ko'rinishi
 *  kerak, shuning uchun shu yerda to'liq SDK ishlatiladi. U alohida chunk
 *  va faqat kerak bo'lganda yuklanadi: kirgan odamda chaqiruv kuzatuvi
 *  (sayt darajasida) va jangning o'zi.
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

/** Kolleksiyadagi hujjatlarni kuzatadi — `battles/{id}/reactions` kabi
 *  kichik, tez-tez o'zgaradigan ro'yxatlar uchun. */
export async function watchCollection<T>(
  path: string,
  onData: (docs: { id: string; data: T }[]) => void,
  { skipCache = false }: { skipCache?: boolean } = {},
): Promise<Unsubscribe> {
  const { app } = await client();
  const { connectFirestoreEmulator, getFirestore, collection, onSnapshot } =
    await import('firebase/firestore');

  const db = getFirestore(app);
  if (useEmulator) connectFirestoreEmulator(db, EMULATOR.host, EMULATOR.firestore);

  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      if (skipCache && snapshot.metadata.fromCache) return;
      onData(snapshot.docs.map((item) => ({ id: item.id, data: item.data() as T })));
    },
    // Ulanish uzilsa jim o'tamiz — chaqiruvchi oxirgi holat bilan qoladi.
    () => onData([]),
  );
}

/** Hozir yig'ilayotgan turnirlar — eng yangisi birinchi.
 *
 *  Ilovadagi `watchOpen` ning aynan ko'chirmasi. Bo'lim sahifasida
 *  ro'yxat bo'lib turadi: «hozir qanday turnirlar yig'ilmoqda»
 *  degan savolga kod kiritmasdan javob beradi. */
export async function watchOpenTurnirs<T>(
  onData: (list: { id: string; data: T }[]) => void,
  max = 20,
): Promise<Unsubscribe> {
  const { app } = await client();
  const {
    connectFirestoreEmulator,
    getFirestore,
    collection,
    limit,
    onSnapshot,
    orderBy,
    query,
    where,
  } = await import('firebase/firestore');

  const db = getFirestore(app);
  if (useEmulator) connectFirestoreEmulator(db, EMULATOR.host, EMULATOR.firestore);

  return onSnapshot(
    query(
      collection(db, 'mardu_series'),
      where('status', '==', 'gathering'),
      orderBy('createdAt', 'desc'),
      limit(max),
    ),
    (snapshot) => {
      const now = Date.now();
      onData(
        snapshot.docs
          .filter((item) => {
            // Muddati o'tgan, lekin hali yopilmagan xona ro'yxatda
            // qolib ketishi mumkin — unga kirgan odam kutib qolardi.
            const expires = (item.data() as Record<string, unknown>).expiresAt as
              | { seconds?: number }
              | undefined;
            return !expires?.seconds || expires.seconds * 1000 > now;
          })
          .map((item) => ({ id: item.id, data: item.data() as T })),
      );
    },
    () => onData([]),
  );
}

/** Shu odam o'ynagan tugagan turnirlar — eng yangisi birinchi. */
export async function watchTurnirHistory<T>(
  uid: string,
  onData: (list: { id: string; data: T }[]) => void,
  max = 10,
): Promise<Unsubscribe> {
  const { app } = await client();
  const {
    connectFirestoreEmulator,
    getFirestore,
    collection,
    limit,
    onSnapshot,
    orderBy,
    query,
    where,
  } = await import('firebase/firestore');

  const db = getFirestore(app);
  if (useEmulator) connectFirestoreEmulator(db, EMULATOR.host, EMULATOR.firestore);

  return onSnapshot(
    query(
      collection(db, 'mardu_series'),
      where('uids', 'array-contains', uid),
      where('status', '==', 'finished'),
      orderBy('createdAt', 'desc'),
      limit(max),
    ),
    (snapshot) =>
      onData(snapshot.docs.map((item) => ({ id: item.id, data: item.data() as T }))),
    () => onData([]),
  );
}

/** Shu odamning tugamagan turniri — ko'pi bilan bittasi.
 *
 *  Bir vaqtda bitta turnir qoidasi serverda (`requireOneTurnir`),
 *  ya'ni bu yerda ro'yxat emas, bitta hujjat kutiladi. Ilovada ham
 *  shunday (`watchMine`): bo'limning tepasida o'z turniri turadi,
 *  qolgan yo'llar esa yopiq — ular baribir xato bilan tugardi. */
export async function watchMyTurnir<T>(
  uid: string,
  onData: (turnir: { id: string; data: T } | null) => void,
): Promise<Unsubscribe> {
  const { app } = await client();
  const {
    connectFirestoreEmulator,
    getFirestore,
    collection,
    limit,
    onSnapshot,
    orderBy,
    query,
    where,
  } = await import('firebase/firestore');

  const db = getFirestore(app);
  if (useEmulator) connectFirestoreEmulator(db, EMULATOR.host, EMULATOR.firestore);

  return onSnapshot(
    query(
      collection(db, 'mardu_series'),
      where('uids', 'array-contains', uid),
      where('status', 'in', ['gathering', 'running']),
      orderBy('createdAt', 'desc'),
      limit(1),
    ),
    (snapshot) => {
      const doc = snapshot.docs[0];
      if (!doc) {
        onData(null);
        return;
      }
      const data = doc.data() as Record<string, unknown>;
      // Muddati o'tgan, lekin hali yopilmagan turnir ro'yxatda qolib
      // ketishi mumkin (uni keyingi tozalash yopadi) — sahifada esa u
      // yolg'on umid bo'lardi.
      const expires = data.expiresAt as { seconds?: number } | undefined;
      if (
        data.status === 'gathering' &&
        expires?.seconds &&
        expires.seconds * 1000 < Date.now()
      ) {
        onData(null);
        return;
      }
      onData({ id: doc.id, data: data as T });
    },
    // Ulanish uzilsa jim o'tamiz: kartochka chiqmaydi, xolos.
    () => onData(null),
  );
}

/** Menga kelgan, javob kutayotgan chaqiruv. */
export interface LiveInvite {
  id: string;
  /** Kim chaqirgani — bildirishnomalar ro'yxatida uning profiliga
   *  havola bo'ladi. */
  fromUid: string;
  fromNickname: string;
  /** Qayerdan kelgani: `rematch`, `nearby` yoki `profile` (ilovadagi
   *  ochiq profil / saytdagi reyting qatori). Yozuvi `inviteSource` da. */
  kind: string;
  /** Qaysi o'yinga chaqirilgan: `soztop` yoki `guncha`. Maydoni yo'q
   *  chaqiruv So'ztopniki — eski server aynan shunday yozardi. */
  game: string;
  /** Muddati tugaydigan payt (millisekundda). Noma'lum bo'lsa `0`. */
  expiresAt: number;
  /** Chaqiruv yaratilgan payt (ms) — ro'yxat shu bo'yicha saralanadi. */
  createdAt: number;
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
          const created = data.createdAt as { seconds?: number } | undefined;
          return {
            id: item.id,
            fromUid: String(data.fromUid ?? ''),
            fromNickname: String(data.fromNickname ?? 'Raqib'),
            kind: String(data.kind ?? 'rematch'),
            game: data.game === 'guncha' ? 'guncha' : 'soztop',
            expiresAt: expires?.seconds ? expires.seconds * 1000 : 0,
            createdAt: created?.seconds ? created.seconds * 1000 : 0,
          };
        }),
      ),
    // Ulanish uzilsa jim o'tamiz: xabar chiqmaydi, xolos.
    () => onData([]),
  );
}
