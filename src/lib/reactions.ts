/** Jang davomida raqibga yuboriladigan reaksiyalar — ilovadagi
 *  `BattleReaction` ning veb ko'chirmasi.
 *
 *  Ro'yxat **yopiq**: erkin matn yo'q, demak moderatsiya ham kerak emas.
 *  Ro'yxat ilovadagi bilan bir xil bo'lishi shart — raqib yuborgan
 *  belgini sayt taniy olishi kerak.
 *
 *  Serverda har o'yinchiga bitta yozuv (`battle_reactions`), yangisi
 *  eskisining ustiga tushadi — aks holda jang oxirida o'nlab emoji
 *  yig'ilardi.
 *
 *  Yozuvda kalit emas, **emojining o'zi** saqlanadi: ilova ham shunday
 *  yuboradi. Shu sabab o'qishda emoji kalitga qaytariladi va
 *  ro'yxatda yo'q belgi jimgina tashlab yuboriladi. */
import { api } from '../api/client';
import { poll, type Unsubscribe } from '../api/poll';

export const REACTIONS = [
  { key: 'cry', emoji: '😭', label: 'Yig‘lamoq' },
  { key: 'moon', emoji: '🌚', label: 'Jimgina' },
  { key: 'cool', emoji: '😎', label: 'Zo‘r' },
  { key: 'mind', emoji: '🤯', label: 'Hayron' },
  { key: 'crazy', emoji: '🤪', label: 'Hazil' },
  { key: 'disguise', emoji: '🥸', label: 'Niqob' },
  { key: 'salute', emoji: '🫡', label: 'Tan berdim' },
] as const;

export type ReactionKey = (typeof REACTIONS)[number]['key'];

/** Notanish kalit — `null`: saytning eski nusxasi yangi reaksiyani
 *  ko'rsatolmaydi, lekin yiqilmaydi ham. */
export const emojiOf = (key: string | null | undefined): string | null =>
  REACTIONS.find((item) => item.key === key)?.emoji ?? null;

/** Ketma-ket bosishning oldi. Qoidalarda chegara 1.5 soniya — tugma
 *  undan uzunroq «sovib» turadi, ya'ni yozuv rad etilmaydi. */
export const REACTION_COOLDOWN_MS = 2000;

/** Reaksiyani yozadi. Vaqtni **server** qo'yadi (`at = now()`). */
export async function sendReaction(
  battleId: string,
  _uid: string,
  key: ReactionKey,
): Promise<void> {
  const emoji = emojiOf(key);
  if (emoji === null) return;
  await api.post(`/v1/battles/${encodeURIComponent(battleId)}/reaction`, {
    body: { emoji },
  });
}

const keyOf = (emoji: string): ReactionKey | null =>
  REACTIONS.find((item) => item.emoji === emoji)?.key ?? null;

/** Raqibdan kelgan reaksiyalarni kuzatadi.
 *
 *  Yangi voqea `at` ni **o'zim bilan solishtirib** emas, oldingi
 *  javobdagi qiymat bilan solishtirib aniqlanadi. Birinchi javob esa
 *  faqat boshlang'ich nuqta — jangdan oldin yoki qayta kirishdan avval
 *  yuborilgan reaksiya qaytadan chiqmaydi.
 *
 *  Vaqtni endi server qo'yadi, ya'ni raqibning telefoni noto'g'ri
 *  vaqtda bo'lsa ham solishtirish ishonchli.
 *
 *  Davr qisqa: reaksiya jang davomida yuboriladi va kech kelgani
 *  kulgili bo'lib qolardi. */
export function watchReactions(
  battleId: string,
  uid: string,
  onEvent: (key: ReactionKey) => void,
): Unsubscribe {
  let first = true;
  const seen = new Map<string, number>();

  return poll<{ uid: string; emoji: string; at: number }[]>(
    async () => {
      const data = await api.get<{ items?: unknown }>(
        `/v1/battles/${encodeURIComponent(battleId)}/reactions`,
      );
      return (Array.isArray(data.items) ? data.items : []).map((row) => {
        const item = row as { uid?: unknown; emoji?: unknown; at?: unknown };
        return {
          uid: String(item.uid ?? ''),
          emoji: String(item.emoji ?? ''),
          at: Date.parse(String(item.at ?? '')) || 0,
        };
      });
    },
    (items) => {
      for (const item of items) {
        if (item.uid === uid) continue;
        const previous = seen.get(item.uid);
        seen.set(item.uid, item.at);
        if (first || previous === item.at) continue;
        const key = keyOf(item.emoji);
        if (key !== null) onEvent(key);
      }
      first = false;
    },
    { period: 3000 },
  );
}
