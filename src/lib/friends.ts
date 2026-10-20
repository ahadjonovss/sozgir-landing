/** Do'stlar — ilovadagi `features/friends` ning veb ko'chirmasi
 *  (`soztop/docs/friends.md`).
 *
 *  Ochiq profildan jangga **faqat do'stlar** chaqiriladi: oldin do'stlik
 *  so'rovi, javobdan keyin chaqiruv. Ilgari reytingdan o'tgan begona
 *  odam istalgancha chaqiruv yuborib turardi va qabul qilmagan
 *  o'yinchining ekrani chaqiruv oynalaridan iborat bo'lib qolardi.
 *
 *  **Yozishni server qiladi.** Do'stlik ikki tomonli yozuv va u bitta
 *  tranzaksiyada qo'yiladi (`friends/respond`); mijozga qoldirilsa, odam
 *  o'zini xohlagan kishining ro'yxatiga qo'shib qo'yardi.
 *
 *  Kuzatuv endi `onSnapshot` emas, davriy so'rov (`api/poll.ts`) —
 *  ilovada ham shunday. Do'stlar ro'yxati kamdan-kam o'zgaradi va bir
 *  necha soniya kechikish sezilmaydi.
 *
 *  **Serverda hali yo'q:** o'zi yuborgan so'rovlar ro'yxati. Shu sabab
 *  ikki narsa ishlamaydi va ularning o'rni shu faylda ochiq
 *  belgilangan: «so'rovingiz qabul qilindi» xabari
 *  ([watchAcceptedRequests]) va profildagi «so'rov yuborilgan» holati
 *  ([watchFriendship] dagi `outgoing`). Marshrut ochilganda ikkalasi
 *  ham shu yerda tiklanadi. */
import { api } from '../api/client';
import { apiError } from '../api/errors';
import { poll, sharedPoll, type Unsubscribe } from '../api/poll';

export type { Unsubscribe };

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

/** Ikki o'yinchi uchun **barqaror** nom.
 *
 *  Serverda so'rov (`from_uid`, `to_uid`) juftligi bilan taniladi va
 *  alohida `id` yo'q. Bu yerdagi nom esa ro'yxatlarda kalit sifatida
 *  ishlatiladi — u barqaror bo'lishi kifoya. */
export const friendPairId = (a: string, b: string) => (a < b ? `${a}_${b}` : `${b}_${a}`);

/** Kuzatuv davri — ilovadagi `polledStream` bilan bir xil o'lchamda.
 *
 *  Do'stlik holati jang emas: uch soniyalik kechikish ko'rinmaydi,
 *  lekin har ekran uchun socket ochish ancha qimmat tushardi. */
const PERIOD = 10_000;

const millis = (value: unknown): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Date.parse(value) || 0;
  return 0;
};

interface ApiFriend {
  uid?: unknown;
  nickname?: unknown;
  since?: unknown;
}

interface ApiRequest {
  fromUid?: unknown;
  toUid?: unknown;
  fromNickname?: unknown;
  toNickname?: unknown;
  status?: unknown;
  createdAt?: unknown;
  created_at?: unknown;
}

const statusOf = (value: unknown): RequestStatus =>
  value === 'accepted' ? 'accepted' : value === 'declined' ? 'declined' : 'pending';

function requestOf(data: ApiRequest): FriendRequest {
  const fromUid = String(data.fromUid ?? '');
  const toUid = String(data.toUid ?? '');
  return {
    id: friendPairId(fromUid, toUid),
    fromUid,
    fromNickname: String(data.fromNickname ?? '').trim(),
    toUid,
    toNickname: String(data.toNickname ?? '').trim(),
    status: statusOf(data.status),
    createdAt: millis(data.createdAt ?? data.created_at),
    // Serverdagi ro'yxatda faqat javob kutayotganlar bor, ya'ni javob
    // vaqti har doim bo'sh.
    respondedAt: 0,
  };
}

const items = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

/** Do'stlar ro'yxati. Faqat egasi o'qiydi: kim kim bilan do'st ekani
 *  ochiq ma'lumot emas.
 *
 *  Tartibni server beradi (taxallus bo'yicha). Ilgari sayt uni «yangisi
 *  tepada» qilib saralardi — serverdagi jadvalda esa `since` bo'yicha
 *  tartib yo'q va ikkala platformada bir xil ko'rinish muhimroq. */
export function watchFriends(
  uid: string,
  onData: (friends: Friend[]) => void,
): Unsubscribe {
  return sharedPoll<Friend[]>(
    `friends:${uid}`,
    async () => {
      const data = await api.get<{ items?: unknown }>('/v1/web/friends');
      return items(data.items).map((row): Friend => {
        const friend = row as ApiFriend;
        return {
          uid: String(friend.uid ?? ''),
          nickname: String(friend.nickname ?? '').trim(),
          since: millis(friend.since),
        };
      });
    },
    onData,
    { period: PERIOD },
  );
}

/** Menga kelgan, javob kutayotgan so'rovlar. */
export function watchIncomingRequests(
  uid: string,
  onData: (requests: FriendRequest[]) => void,
): Unsubscribe {
  return sharedPoll<FriendRequest[]>(
    `friend-requests:${uid}`,
    async () => {
      const data = await api.get<{ items?: unknown }>('/v1/web/friends/requests');
      return items(data.items).map((row) => requestOf(row as ApiRequest));
    },
    onData,
    { period: PERIOD },
  );
}

/** Men yuborgan va **qabul qilingan** so'rovlar.
 *
 *  Serverda bunday ro'yxat yo'q (`friend_requests` dan faqat kelgani
 *  o'qiladi), shuning uchun hozircha doim bo'sh: «so'rovingiz qabul
 *  qilindi» xabari ko'rinmaydi. Do'stlikning o'zi esa buzilmaydi —
 *  qabul qilingan odam oddiygina do'stlar ro'yxatida paydo bo'ladi.
 *
 *  Marshrut (`/v1/web/friends/sent` kabi) ochilganda bu funksiyaning ichi
 *  [watchIncomingRequests] bilan bir xil shaklda yoziladi. */
export function watchAcceptedRequests(
  _uid: string,
  onData: (requests: FriendRequest[]) => void,
): Unsubscribe {
  onData([]);
  return () => {};
}

/** Bitta odam bilan aloqa: do'stmizmi va orada so'rov bormi.
 *
 *  Ikkalasi bitta so'rovdan chiqadi, ya'ni tugma holati bir
 *  ko'rinishdan ikkinchisiga sakramaydi.
 *
 *  `request` faqat **menga kelgan** so'rovni ko'rsatadi. O'zim
 *  yuborgan so'rov serverdan o'qilmaydi, shuning uchun «so'rov
 *  yuborilgan» holati chiqmaydi: tugma yuborilgandan keyin ham
 *  «do'stlikka chaqirish» bo'lib turadi va qayta bosilsa server
 *  so'rovni yangilaydi (`ON CONFLICT DO UPDATE`), ya'ni takror bosish
 *  zarar qilmaydi. */
export function watchFriendship(
  _uid: string,
  otherUid: string,
  onData: (link: { friend: boolean; request: FriendRequest | null }) => void,
): Unsubscribe {
  return poll<{ friend: boolean; request: FriendRequest | null }>(
    async () => {
      const [friends, requests] = await Promise.all([
        api.get<{ items?: unknown }>('/v1/web/friends'),
        api.get<{ items?: unknown }>('/v1/web/friends/requests'),
      ]);

      const friend = items(friends.items).some(
        (row) => String((row as ApiFriend).uid ?? '') === otherUid,
      );

      const incoming = items(requests.items)
        .map((row) => requestOf(row as ApiRequest))
        .find((request) => request.fromUid === otherUid);

      return { friend, request: incoming ?? null };
    },
    onData,
    { period: PERIOD },
  );
}

/* ── Yozish ───────────────────────────────────────────────────────── */

/** Server sababni o'zbekcha yozadi (bloklangan, allaqachon do'st),
 *  shuning uchun xabar shundoq uzatiladi. */
async function write(run: () => Promise<unknown>): Promise<void> {
  try {
    await run();
  } catch (error) {
    throw new Error(apiError(error));
  }
}

/** Taxallus yuborilmaydi: serverdagi so'rovga hisobning o'z taxallusi
 *  qo'shiladi (`users` jadvalidan), ya'ni uni mijozdan olishning
 *  hojati yo'q. */
export const sendFriendRequest = (toUid: string) =>
  write(() => api.post('/v1/web/friends/request', { body: { toUid } }));

/** So'rovga javob. Serverda so'rov juftlik bilan tanilgani uchun
 *  hujjat nomi emas, **yuboruvchining `uid` si** beriladi. */
export const respondFriendRequest = (fromUid: string, accept: boolean) =>
  write(() => api.post('/v1/web/friends/respond', { body: { fromUid, accept } }));

/** Do'stlikni ikki tomondan bekor qiladi. */
export const removeFriend = (friendUid: string) =>
  write(() => api.delete(`/v1/web/friends/${encodeURIComponent(friendUid)}`));

/* ── Cheklov bayrog'i ─────────────────────────────────────────────── */

/** Profildan chaqirish do'stlik talab qiladimi — `config/friends`.
 *
 *  Cheklov bayroq ortida turadi: sozlama yo'q bo'lsa chaqirish
 *  avvalgidek ishlayveradi. O'qish yiqilsa ham cheklov o'chiq deb
 *  hisoblanadi — bu spamdan himoya, xavfsizlik chegarasi emas.
 *
 *  Saytdagi tugma bayroqqa qaramaydi (ilovadagidek): u har doim
 *  do'stlik oqimini ko'rsatadi. Bayroq faqat reyting qatoridagi tezkor
 *  chaqiruv uchun o'qiladi — u yerda profil ochilmaydi. */
let flag: Promise<boolean> | null = null;

export function inviteRequiresFriends(): Promise<boolean> {
  flag ??= api
    .get<{ value?: unknown }>('/v1/public/config/friends', { auth: false })
    .then((data) => {
      const value = data.value;
      return (
        value !== null &&
        typeof value === 'object' &&
        (value as { inviteRequiresFriends?: unknown }).inviteRequiresFriends === true
      );
    })
    .catch(() => false);
  return flag;
}
