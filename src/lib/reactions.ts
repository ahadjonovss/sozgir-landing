/** Jang davomida raqibga yuboriladigan reaksiyalar — ilovadagi
 *  `BattleReaction` ning veb ko'chirmasi.
 *
 *  Ro'yxat **yopiq**: erkin matn yo'q, demak moderatsiya ham kerak emas.
 *  Firestore qoidalari aynan shu yetti kalitni qabul qiladi, shuning uchun
 *  ro'yxat ilovadagi bilan bir xil bo'lishi shart.
 *
 *  Hujjat: `battles/{id}/reactions/{uid}` — har o'yinchiga bitta, yangisi
 *  eskisining ustiga yoziladi. Jang hujjatining o'ziga tegilmaydi
 *  (u serverniki), shuning uchun bu yo'l mijozga ochiq: yozish ham
 *  to'g'ridan-to'g'ri Firestore'ga ketadi, Cloud Function orqali emas. */
import { client } from '../firebase/client';
import { watchCollection, type Unsubscribe } from '../firebase/live';

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

const KEYS: readonly string[] = REACTIONS.map((item) => item.key);

/** Notanish kalit — `null`: saytning eski nusxasi yangi reaksiyani
 *  ko'rsatolmaydi, lekin yiqilmaydi ham. */
export const emojiOf = (key: string | null | undefined): string | null =>
  REACTIONS.find((item) => item.key === key)?.emoji ?? null;

/** Ketma-ket bosishning oldi. Qoidalarda chegara 1.5 soniya — tugma
 *  undan uzunroq «sovib» turadi, ya'ni yozuv rad etilmaydi. */
export const REACTION_COOLDOWN_MS = 2000;

/** Reaksiyani yozadi.
 *
 *  Vaqt mijozdan: hujjat har safar o'zgarishi kerak (bir xil belgi
 *  ketma-ket yuborilsa ham raqib buni ko'rsin) va qoidalar yangi yozuvni
 *  eskisidan kamida 1.5 soniya keyin qabul qiladi. */
export async function sendReaction(
  battleId: string,
  uid: string,
  key: ReactionKey,
): Promise<void> {
  const { db } = await client();
  const { doc, setDoc } = await import('firebase/firestore/lite');
  await setDoc(doc(db, `battles/${battleId}/reactions/${uid}`), {
    key,
    at: Date.now(),
  });
}

/** Raqibdan kelgan reaksiyalarni kuzatadi.
 *
 *  Yangi voqea hujjatdagi `at` ni **o'zim bilan solishtirib** emas,
 *  oldingi suratdagi qiymat bilan solishtirib aniqlanadi: `at` raqibning
 *  soatidan olinadi va u biznikidan orqada bo'lsa (telefon vaqti noto'g'ri
 *  qo'yilgan bo'lsa) hech qachon «yangi» bo'lmasdi. Birinchi surat esa
 *  faqat boshlang'ich nuqta — jangdan oldin yoki qayta kirishdan avval
 *  yuborilgan reaksiya qaytadan chiqmaydi. */
export function watchReactions(
  battleId: string,
  uid: string,
  onEvent: (key: ReactionKey) => void,
): Promise<Unsubscribe> {
  let first = true;
  const seen = new Map<string, number>();

  return watchCollection<{ key?: string; at?: number }>(
    `battles/${battleId}/reactions`,
    (docs) => {
      for (const item of docs) {
        if (item.id === uid) continue;
        const at = Number(item.data.at ?? 0);
        const previous = seen.get(item.id);
        seen.set(item.id, at);
        if (first || previous === at) continue;
        const key = item.data.key;
        if (key && KEYS.includes(key)) onEvent(key as ReactionKey);
      }
      first = false;
    },
    // Keshdan kelgan surat hisobga olinmaydi: u eski yozuvni «yangi»
    // qilib ko'rsatishi mumkin.
    { skipCache: true },
  );
}
