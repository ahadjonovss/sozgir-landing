/** Bildirishnomalar — ilovadagi `features/notifications` ning veb
 *  ko'chirmasi (`soztop/docs/friends.md`).
 *
 *  Alohida kolleksiya **yo'q**. Ro'yxat bor ma'lumotdan yig'iladi:
 *  do'stlik so'rovlari `friend_requests` dan, chaqiruvlar
 *  `battle_invites` dan. Shuning uchun so'rovga javob berilishi bilan
 *  qator ro'yxatdan o'zi ketadi va «o'qildi» degan bayroqni yozib
 *  yurish kerak emas. Yangi hujjat turi kiritilsa har bir xabar ikki
 *  joyda (kolleksiyada va manbada) yashagan bo'lardi va ular
 *  bir-biridan chetlab ketardi.
 *
 *  «Qayergacha ko'rilgani» brauzerda saqlanadi va **vaqt bo'yicha**
 *  sanaladi, sanoq bo'yicha emas: xabarlar ro'yxatdan chiqib ham ketadi
 *  (chaqiruv so'nadi, so'rovga javob beriladi) va sanoq kamayganda
 *  hisob buzilardi. */
import { useEffect, useState } from 'react';
import { watchInvites, type LiveInvite, type Unsubscribe } from '../firebase/live';
import {
  watchAcceptedRequests,
  watchIncomingRequests,
  type FriendRequest,
} from './friends';

export type NotificationKind = 'friendRequest' | 'friendAccepted' | 'battleInvite';

export interface NotificationItem {
  /** Manba hujjatining nomi — javob shu bo'yicha beriladi. */
  id: string;
  kind: NotificationKind;
  /** Xabar kim haqidaligi: so'rov yuborgan yoki qabul qilgan odam. */
  who: string;
  nickname: string;
  /** Qator vaqti (ms). Server vaqti hali kelmagan yozuvda `0` — qator
   *  eng tepada turadi, chunki u endi yaratilgan. */
  at: number;
  /** Chaqiruv qatorining manbasi: javob berish uchun butun yozuv kerak
   *  (o'yin turi, muddat). */
  invite?: LiveInvite;
}

/** Vaqtsiz qator eng tepada: u endi yaratilgan. */
const sortKey = (item: NotificationItem) => (item.at > 0 ? item.at : Date.now());

/** Ro'yxatni yig'adi — yangisi tepada.
 *
 *  `accepted` dan faqat **men yuborgan** so'rovlar olinadi: qabul
 *  qilgan odamga «siz qabul qildingiz» degan xabar kerak emas, u buni
 *  o'zi biladi. */
export function buildNotifications({
  uid,
  incoming,
  accepted,
  invites,
  now = Date.now(),
}: {
  uid: string;
  incoming: FriendRequest[];
  accepted: FriendRequest[];
  invites: LiveInvite[];
  now?: number;
}): NotificationItem[] {
  const items: NotificationItem[] = [];

  for (const request of incoming) {
    if (request.status !== 'pending') continue;
    items.push({
      id: request.id,
      kind: 'friendRequest',
      who: request.fromUid,
      nickname: request.fromNickname,
      at: request.createdAt,
    });
  }

  for (const request of accepted) {
    if (request.fromUid !== uid || request.status !== 'accepted') continue;
    items.push({
      id: request.id,
      kind: 'friendAccepted',
      who: request.toUid,
      nickname: request.toNickname,
      at: request.respondedAt,
    });
  }

  for (const invite of invites) {
    // Muddati o'tgan chaqiruv ro'yxatda turmaydi: javob tugmalari
    // baribir ishlamaydi va qator faqat aldab qo'yardi.
    if (invite.expiresAt > 0 && invite.expiresAt <= now) continue;
    items.push({
      id: invite.id,
      kind: 'battleInvite',
      who: invite.fromUid,
      nickname: invite.fromNickname,
      at: invite.createdAt,
      invite,
    });
  }

  return items.sort((a, b) => sortKey(b) - sortKey(a));
}

/* ── «Qayergacha ko'rilgan» ───────────────────────────────────────── */

const SEEN_KEY = (uid: string) => `sozgir.notifications.seenAt.${uid}`;

export function seenAt(uid: string): number {
  try {
    return Number(localStorage.getItem(SEEN_KEY(uid))) || 0;
  } catch {
    return 0;
  }
}

/** Ro'yxat ochildi — shu paytgacha hammasi ko'rilgan. */
export function markSeen(uid: string): void {
  try {
    localStorage.setItem(SEEN_KEY(uid), String(Date.now()));
  } catch {
    // Shaxsiy rejim — belgi shu sessiyada qoladi.
  }
}

/** Qator yangimi. Hali hech qachon ochilmagan bo'lsa hammasi yangi:
 *  birinchi kirishda tugma qizarib turadi va odam bo'limni topadi. */
const isFresh = (item: NotificationItem, seen: number) => seen === 0 || sortKey(item) > seen;

/* ── Hook ─────────────────────────────────────────────────────────── */

export interface Notifications {
  items: NotificationItem[];
  /** Oxirgi ochilishdan keyin kelganlari soni. */
  fresh: number;
  /** Ro'yxat ochilganda chaqiriladi. */
  see: () => void;
}

const EMPTY: Notifications = { items: [], fresh: 0, see: () => undefined };

export function useNotifications(uid: string | null | undefined): Notifications {
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [accepted, setAccepted] = useState<FriendRequest[]>([]);
  const [invites, setInvites] = useState<LiveInvite[]>([]);
  /** «Ko'rilgan» belgisi brauzerda turadi va render paytida o'qiladi;
   *  bu sanoq esa uni qayta o'qishga majbur qiladi (ro'yxat ochilganda). */
  const [seenBump, setSeenBump] = useState(0);

  useEffect(() => {
    if (!uid) return;
    let alive = true;
    const stops: Unsubscribe[] = [];
    const keep = (stop: Unsubscribe) => {
      if (alive) stops.push(stop);
      else stop();
    };

    void watchIncomingRequests(uid, (list) => alive && setIncoming(list)).then(keep);
    void watchAcceptedRequests(uid, (list) => alive && setAccepted(list)).then(keep);
    void watchInvites(uid, (list) => alive && setInvites(list)).then(keep);

    return () => {
      alive = false;
      for (const stop of stops) stop();
      setIncoming([]);
      setAccepted([]);
      setInvites([]);
    };
  }, [uid]);

  if (!uid) return EMPTY;

  // `seenBump` ning qiymati kerak emas — u faqat belgini qayta
  // o'qitadi (ro'yxat ochilganda).
  void seenBump;
  const seen = seenAt(uid);
  const items = buildNotifications({ uid, incoming, accepted, invites });
  return {
    items,
    fresh: items.filter((item) => isFresh(item, seen)).length,
    see: () => {
      markSeen(uid);
      setSeenBump((value) => value + 1);
    },
  };
}
