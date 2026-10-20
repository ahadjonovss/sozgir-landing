/** G'uncha jangi — chaqiruvlar va serverdagi qoidalar.
 *
 *  Qoida bitta jumlada: *ikkalangizga bir xil g'uncha beriladi, uch
 *  daqiqa vaqt bor, kim ko'p ball yig'sa — o'sha yutadi.*
 *
 *  Jang So'zjang bilan **bitta jadvalda** yashaydi (`battles`): juftlash,
 *  chaqiruv, muddati o'tganini tozalash va tarix ikkalasiga umumiy, farq
 *  faqat `game` maydonida va o'yinga xos qismda.
 *
 *  Vaqtning asosiy qoidasi: *ekrandagi teskari sanoq — ko'rsatma, chegara
 *  emas. Chegarani server hal qiladi.* Har bir so'z serverga boradi va u
 *  muddatni **o'z soati** bo'yicha tekshiradi, ya'ni qurilma soatini
 *  o'zgartirib vaqt yutib bo'lmaydi.
 *
 *  Migratsiyaning asosiy yutug'i shu yerda. Firestore'da har so'z hujjat
 *  yozuvi edi va uni kuzatayotgan raqibga yetkazish alohida o'qish bo'lib
 *  hisoblanardi — uch daqiqalik jangda bu yuzlab amal. Endi so'zlar ochiq
 *  kanal bo'ylab ketadi (`api/socket.ts`), ball xonada yig'iladi va
 *  bazaga **faqat yakunda** tushadi. */
import { api } from '../api/client';
import { BattleSocket } from '../api/socket';

/** Jangning davomiyligi — serverdagi `GUNCHA_SECONDS`. Sanoq baribir
 *  serverdan kelgan `endsAt` bo'yicha yuradi, bu faqat birinchi
 *  ko'rsatish uchun. */
export const GUNCHA_SECONDS = 180;

/** Serverning so'zga bergan javobi. */
export interface GunchaWordReply {
  accepted: boolean;
  reason?: 'accepted' | 'expired' | 'finished' | 'unknown' | 'repeated' | 'offline';
  score?: number;
  total?: number;
}

/** Rad javobining o'zbekcha matni. */
export const WORD_REASON: Record<string, string> = {
  expired: 'Vaqt tugadi — so‘z hisoblanmadi',
  finished: 'Jang yakunlandi',
  unknown: 'Bunday so‘z lug‘atda yo‘q',
  /* Kanal javob bermadi. Ilgari bu ham «lug'atda yo'q» deb
     ko'rsatilardi va odam o'zining to'g'ri so'zidan shubhalanardi —
     aslida so'z serverga yetib bormagan edi. */
  offline: 'Aloqa uzildi — so‘z yuborilmadi, qayta urinib ko‘ring',
  repeated: 'Bu so‘zni topgansiz',
};

/** Do'st bilan jang: server g'unchani tanlaydi va kod beradi. */
export async function createGunchaBattle(): Promise<{
  battleId: string;
  code: string;
}> {
  const { battle } = await api.post<{ battle: { id: string } }>('/v1/web/battles', {
    body: { game: 'guncha' },
  });
  const { code } = await api.post<{ code: string }>(
    `/v1/web/battles/${encodeURIComponent(battle.id)}/code`,
  );
  return { battleId: battle.id, code };
}

/** Jangning harflari. Javoblar ro'yxati **berilmaydi** — u serverda
 *  qoladi va har so'z kanal orqali tekshiriladi. */
export async function gunchaLetters(
  battleId: string,
): Promise<{ center: string; petals: string[] }> {
  const data = await api.get<{ center?: unknown; petals?: unknown }>(
    `/v1/web/battles/${encodeURIComponent(battleId)}/guncha`,
  );
  return {
    center: String(data.center ?? ''),
    petals: Array.isArray(data.petals)
      ? data.petals.filter((item): item is string => typeof item === 'string')
      : [],
  };
}

/* ── Kanal ─────────────────────────────────────────────────────────── */

/** Ochiq kanallar: jang raqami → socket.
 *
 *  Modul darajasida turadi, chunki chaqiruvchilar (`useGunchaJang`)
 *  so'zni oddiy funksiya chaqiruvi sifatida yuboradi va ulanishni
 *  o'zlari boshqarmaydi. Jang tugaganda [closeGuncha] uni yopadi. */
const sockets = new Map<string, BattleSocket>();

async function socketOf(battleId: string): Promise<BattleSocket> {
  const open = sockets.get(battleId);
  if (open !== undefined) return open;

  const socket = new BattleSocket();
  sockets.set(battleId, socket);
  await socket.join(battleId);
  return socket;
}

/** Raqibning balli o'zgarganda chaqiriladi.
 *
 *  Firestore'da bu jang hujjatining kuzatuvi edi; endi xonadagi
 *  `rival` xabari. Qaysi so'z topilgani kelmaydi — faqat ball, aks
 *  holda raqib uni ko'chirib yozardi. */
export async function watchGunchaRival(
  battleId: string,
  onScore: (entry: { uid: string; total: number }) => void,
): Promise<() => void> {
  const socket = await socketOf(battleId);
  return socket.on((event) => {
    if (event.type !== 'rival') return;
    onScore({ uid: String(event.uid ?? ''), total: Number(event.total ?? 0) });
  });
}

/** Topshirilgan so'z. Ball **serverda** hisoblanadi — mijozdagi lug'at
 *  faqat darhol javob berish uchun. */
export async function sendGunchaWord(input: {
  battleId: string;
  word: string;
}): Promise<GunchaWordReply> {
  const socket = await socketOf(input.battleId);
  try {
    const event = await socket.submitWord(input.word);
    if (event.accepted !== true) {
      return {
        accepted: false,
        reason: (event.reason as GunchaWordReply['reason']) ?? 'unknown',
      };
    }
    return {
      accepted: true,
      reason: 'accepted',
      score: Number(event.score ?? 0),
      total: Number(event.total ?? 0),
    };
  } catch {
    // Javob kelmadi — so'z yo'qolganini odam bilishi kerak, lekin
    // sababi lug'at emas: xabar kanalda qolib ketgan.
    return { accepted: false, reason: 'offline' };
  }
}

/** Sanoq nolga yetdi — natijani chiqarish.
 *
 *  Server o'z soatiga qaraydi: mijozning sanog'i oldinda ketgan bo'lsa
 *  jang yakunlanmaydi. Xabar javobsiz ketadi va natija jang yozuvining
 *  keyingi o'qilishida ko'rinadi. */
export async function finishGunchaBattle(
  battleId: string,
): Promise<{ finished: boolean }> {
  const socket = sockets.get(battleId);
  socket?.finish();
  return { finished: true };
}

/** Jang ekranidan chiqilganda — kanal yopiladi. */
export function closeGuncha(battleId: string): void {
  sockets.get(battleId)?.dispose();
  sockets.delete(battleId);
}
