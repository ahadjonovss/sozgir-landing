/** Jangga chaqiruvlar — ilovadagi `WatchIncomingInvites` ning veb
 *  ko'chirmasi.
 *
 *  Ikkala platforma bitta jadvalni o'qiydi, shuning uchun telefondan
 *  yuborilgan chaqiruv brauzerda ham ko'rinadi — faqat darhol emas,
 *  keyingi so'rovda (`api/poll.ts`). Chaqiruv bir necha daqiqa
 *  yashaydi va bir necha soniyalik kechikish uni buzmaydi.
 *
 *  Muddati o'tganini **server** chiqarib tashlaydi
 *  (`expires_at > now()`), ya'ni ro'yxatda faqat javob berish mumkin
 *  bo'lganlari turadi. */
import { api } from '../api/client';
import { sharedPoll, type Unsubscribe } from '../api/poll';

export type { Unsubscribe };

export interface LiveInvite {
  id: string;
  /** Kim chaqirgani — bildirishnomalar ro'yxatida uning profiliga
   *  havola bo'ladi. */
  fromUid: string;
  fromNickname: string;
  /** Qayerdan kelgani: `rematch`, `nearby` yoki `profile`. */
  kind: string;
  /** Qaysi o'yinga chaqirilgan: `soztop` yoki `guncha`. */
  game: string;
  /** Muddati tugaydigan payt (millisekundda). Noma'lum bo'lsa `0`. */
  expiresAt: number;
  /** Chaqiruv yaratilgan payt (ms).
   *
   *  Server bu maydonni qaytarmaydi — u faqat tartiblash uchun
   *  ishlatiladi (`ORDER BY created_at DESC`). Shu sabab bu yerda doim
   *  `0`, ya'ni ro'yxatdagi tartib serverdan kelgan tartib bo'lib
   *  qoladi. Bildirishnomalarda vaqtsiz qator eng tepada turadi va bu
   *  yangi chaqiruv uchun to'g'ri xulq. */
  createdAt: number;
}

const PERIOD = 10_000;

const millis = (value: unknown): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Date.parse(value) || 0;
  return 0;
};

function inviteOf(row: Record<string, unknown>): LiveInvite {
  return {
    id: String(row.id ?? ''),
    fromUid: String(row.fromUid ?? ''),
    fromNickname: String(row.fromNickname ?? '').trim() || 'Raqib',
    kind: String(row.kind ?? 'profile'),
    // Maydoni yo'q chaqiruv So'ztopniki — eski server ham shunday
    // yozardi.
    game: String(row.game ?? 'soztop'),
    expiresAt: millis(row.expiresAt),
    createdAt: 0,
  };
}

/** Menga kelgan chaqiruvlar. */
export function watchInvites(
  uid: string,
  onData: (invites: LiveInvite[]) => void,
): Unsubscribe {
  return sharedPoll<LiveInvite[]>(
    `invites:${uid}`,
    async () => {
      const data = await api.get<{ items?: unknown }>('/v1/invites');
      return Array.isArray(data.items)
        ? data.items.map((row) => inviteOf(row as Record<string, unknown>))
        : [];
    },
    onData,
    { period: PERIOD },
  );
}

/** Chaqiruvni qabul qiladi va jang raqamini qaytaradi.
 *
 *  Jangni **server** yaratadi: ikki odam bir vaqtda qabul qilsa ham
 *  bitta jang bo'lishi kerak. */
export async function acceptInvite(inviteId: string): Promise<string> {
  const reply = await api.post<{ battleId?: string; id?: string }>(
    `/v1/invites/${encodeURIComponent(inviteId)}/accept`,
  );
  return String(reply.battleId ?? reply.id ?? '');
}

export async function declineInvite(inviteId: string): Promise<void> {
  await api.post(`/v1/invites/${encodeURIComponent(inviteId)}/decline`);
}
