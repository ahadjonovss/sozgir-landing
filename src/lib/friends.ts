/** Do'stlar — ilovadagi `features/friends` ning veb ko'chirmasi
 *  (`soztop/docs/friends.md`).
 *
 *  Ochiq profildan jangga **faqat do'stlar** chaqiriladi: oldin do'stlik
 *  so'rovi, javobdan keyin chaqiruv. Ilgari reytingdan o'tgan begona
 *  odam istalgancha chaqiruv yuborib turardi va qabul qilmagan
 *  o'yinchining ekrani chaqiruv oynalaridan iborat bo'lib qolardi.
 *
 *  Qolgan chaqiruvlar tegilmaydi: qasos (jang allaqachon o'ynalgan),
 *  yaqindagilar (odam yonma-yon turibdi), kod bilan qo'shilish va
 *  tezkor jang — hammasida tanishuv boshqa yo'ldan bo'lgan.
 *
 *  **Yozishni faqat funksiyalar qiladi.** Do'stlik ikki tomonli yozuv
 *  (`friends/{a}/list/{b}` va teskarisi); mijozga qoldirilsa, odam
 *  o'zini xohlagan kishining ro'yxatiga qo'shib qo'yardi va profildagi
 *  cheklov ma'nosini yo'qotardi. Saytga o'qish va chaqirish qoladi. */
import { callFunction, functionError } from '../firebase/functions';
import { readDoc } from '../firebase/rest';
import { client } from '../firebase/client';
import { EMULATOR, useEmulator } from '../firebase/config';
import type { Unsubscribe } from '../firebase/live';

export interface Friend {
  uid: string;
  nickname: string;
  /** Do'stlik boshlangan payt (ms). Server vaqti kelmagan bo'lsa `0`. */
  since: number;
}

export type RequestStatus = 'pending' | 'accepted' | 'declined';

export interface FriendRequest {
  id: string;
  fromUid: string;
  fromNickname: string;
  toUid: string;
  toNickname: string;
  status: RequestStatus;
  createdAt: number;
  respondedAt: number;
}

/** Ikki o'yinchi uchun **barqaror** so'rov hujjatining nomi — serverdagi
 *  `friendPairId` bilan bir xil.
 *
 *  Nega tasodifiy nom emas: shunda ikki odam orasida bir vaqtda ikkita
 *  ochiq so'rov bo'lib qolishi mumkin emas. Qarama-qarshi so'rov
 *  kelganda server shu hujjatni topadi va ikkinchisini yaratish
 *  o'rniga birinchisini qabul qiladi. */
export const friendPairId = (a: string, b: string) => (a < b ? `${a}_${b}` : `${b}_${a}`);

/** Ro'yxatlar chegarasi — ilovadagi bilan bir xil.
 *
 *  So'rovlar `orderBy` siz o'qiladi, tartib esa ro'yxat yig'ilganda
 *  beriladi (`notifications.ts`): ilovadagi saralangan so'rovlar
 *  qo'shma indeks talab qiladi va indeks yetib bormagan muhitda
 *  so'rov jimgina bo'sh qaytadi. Chegara ikkalasiga ham yetarli. */
const LIMIT = 200;
const ACCEPTED_LIMIT = 30;

const millis = (value: unknown): number => {
  const stamp = value as { seconds?: number; toMillis?: () => number } | undefined;
  if (stamp?.toMillis) return stamp.toMillis();
  return stamp?.seconds ? stamp.seconds * 1000 : 0;
};

const statusOf = (value: unknown): RequestStatus =>
  value === 'accepted' ? 'accepted' : value === 'declined' ? 'declined' : 'pending';

function requestOf(id: string, data: Record<string, unknown>): FriendRequest {
  return {
    id,
    fromUid: String(data.fromUid ?? ''),
    fromNickname: String(data.fromNickname ?? '').trim(),
    toUid: String(data.toUid ?? ''),
    toNickname: String(data.toNickname ?? '').trim(),
    status: statusOf(data.status),
    createdAt: millis(data.createdAt),
    respondedAt: millis(data.respondedAt),
  };
}

/** Jonli kuzatuv uchun umumiy tayyorgarlik — `live.ts` dagidek to'liq
 *  SDK: do'stlik holati va so'rovlar darhol ko'rinishi kerak. */
async function firestore() {
  const { app } = await client();
  const sdk = await import('firebase/firestore');
  const db = sdk.getFirestore(app);
  if (useEmulator) sdk.connectFirestoreEmulator(db, EMULATOR.host, EMULATOR.firestore);
  return { db, sdk };
}

/** Do'stlar ro'yxati — yangisi tepada. Faqat egasi o'qiydi: kim kim
 *  bilan do'st ekani ochiq ma'lumot emas. */
export async function watchFriends(
  uid: string,
  onData: (friends: Friend[]) => void,
): Promise<Unsubscribe> {
  const { db, sdk } = await firestore();
  return sdk.onSnapshot(
    sdk.query(
      sdk.collection(db, `friends/${uid}/list`),
      sdk.orderBy('since', 'desc'),
      sdk.limit(LIMIT),
    ),
    (snapshot) =>
      onData(
        snapshot.docs.map((item) => {
          const data = item.data() as Record<string, unknown>;
          return {
            uid: item.id,
            nickname: String(data.nickname ?? '').trim(),
            since: millis(data.since),
          };
        }),
      ),
    () => onData([]),
  );
}

/** Menga kelgan, javob kutayotgan so'rovlar. */
export async function watchIncomingRequests(
  uid: string,
  onData: (requests: FriendRequest[]) => void,
): Promise<Unsubscribe> {
  const { db, sdk } = await firestore();
  return sdk.onSnapshot(
    sdk.query(
      sdk.collection(db, 'friend_requests'),
      sdk.where('toUid', '==', uid),
      sdk.where('status', '==', 'pending'),
      sdk.limit(LIMIT),
    ),
    (snapshot) =>
      onData(snapshot.docs.map((item) => requestOf(item.id, item.data() as Record<string, unknown>))),
    () => onData([]),
  );
}

/** Men yuborgan va **qabul qilingan** so'rovlar — «so'rovingiz qabul
 *  qilindi» degan xabar shulardan yasaladi. */
export async function watchAcceptedRequests(
  uid: string,
  onData: (requests: FriendRequest[]) => void,
): Promise<Unsubscribe> {
  const { db, sdk } = await firestore();
  return sdk.onSnapshot(
    sdk.query(
      sdk.collection(db, 'friend_requests'),
      sdk.where('fromUid', '==', uid),
      sdk.where('status', '==', 'accepted'),
      sdk.limit(ACCEPTED_LIMIT),
    ),
    (snapshot) =>
      onData(snapshot.docs.map((item) => requestOf(item.id, item.data() as Record<string, unknown>))),
    () => onData([]),
  );
}

/** Bitta odam bilan aloqa: do'stmizmi va orada so'rov bormi.
 *
 *  Ikkalasi bitta kuzatuvda: tugma holati ikkovi kelmaguncha
 *  chizilmaydi — bir ko'rinishdan ikkinchisiga sakrab o'tsa ekran
 *  titrab ketardi. */
export async function watchFriendship(
  uid: string,
  otherUid: string,
  onData: (link: { friend: boolean; request: FriendRequest | null }) => void,
): Promise<Unsubscribe> {
  const { db, sdk } = await firestore();
  let friend = false;
  let request: FriendRequest | null = null;
  const push = () => onData({ friend, request });

  const stopFriend = sdk.onSnapshot(
    sdk.doc(db, `friends/${uid}/list/${otherUid}`),
    (snapshot) => {
      friend = snapshot.exists();
      push();
    },
    () => push(),
  );

  const stopRequest = sdk.onSnapshot(
    sdk.doc(db, `friend_requests/${friendPairId(uid, otherUid)}`),
    (snapshot) => {
      request = snapshot.exists()
        ? requestOf(snapshot.id, snapshot.data() as Record<string, unknown>)
        : null;
      push();
    },
    () => push(),
  );

  return () => {
    stopFriend();
    stopRequest();
  };
}

/* ── Yozish: faqat funksiyalar orqali ─────────────────────────────── */

/** Server sababni o'zbekcha yozadi (bloklangan, allaqachon yopilgan),
 *  shuning uchun xabar shundoq uzatiladi. */
async function call(name: string, payload: Record<string, unknown>): Promise<void> {
  try {
    await callFunction(name, payload);
  } catch (error) {
    throw new Error(functionError(error));
  }
}

export const sendFriendRequest = (toUid: string, nickname: string) =>
  call('friendRequest', { toUid, nickname });

export const respondFriendRequest = (
  requestId: string,
  accept: boolean,
  nickname: string,
) => call('friendRespond', { requestId, accept, nickname });

/** Do'stlikni ikki tomondan bekor qiladi.
 *
 *  So'rov hujjatini ham o'chirgani uchun **yuborilgan so'rovni qaytarib
 *  olish** ham shu funksiya: o'chiradigan do'stlik yo'q, amalda faqat
 *  so'rov ketadi. */
export const removeFriend = (friendUid: string) => call('friendRemove', { friendUid });

/* ── Cheklov bayrog'i ─────────────────────────────────────────────── */

/** Profildan chaqirish do'stlik talab qiladimi — `config/friends`.
 *
 *  Server ilovadan oldin chiqqani uchun cheklov bayroq ortida turadi:
 *  hujjat yo'q bo'lsa chaqirish avvalgidek ishlayveradi. O'qish yiqilsa
 *  ham cheklov o'chiq deb hisoblanadi — bu spamdan himoya, xavfsizlik
 *  chegarasi emas.
 *
 *  Saytdagi tugma bayroqqa qaramaydi (ilovadagidek): u har doim
 *  do'stlik oqimini ko'rsatadi. Bayroq faqat reyting qatoridagi tezkor
 *  chaqiruv uchun o'qiladi — u yerda profil ochilmaydi. */
let flag: Promise<boolean> | null = null;

export function inviteRequiresFriends(): Promise<boolean> {
  flag ??= readDoc('config/friends')
    .then((data) => data?.inviteRequiresFriends === true)
    .catch(() => false);
  return flag;
}
