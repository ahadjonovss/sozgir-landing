/** G'uncha jangi — chaqiruvlar va serverdagi qoidalar.
 *
 *  Qoida bitta jumlada: *ikkalangizga bir xil g'uncha beriladi, uch
 *  daqiqa vaqt bor, kim ko'p ball yig'sa — o'sha yutadi.*
 *
 *  Jang So'zjang bilan **bitta to'plamda** yashaydi (`battles`): juftlash,
 *  chaqiruv, muddati o'tganini tozalash va tarix ikkalasiga umumiy, farq
 *  faqat `game` maydonida va o'yinga xos qismda.
 *
 *  Vaqtning asosiy qoidasi: *ekrandagi teskari sanoq — ko'rsatma, chegara
 *  emas. Chegarani server hal qiladi.* Har bir so'z serverga boradi va u
 *  muddatni **o'z soati** bo'yicha tekshiradi, ya'ni qurilma soatini
 *  o'zgartirib vaqt yutib bo'lmaydi. */
import { callFunction } from '../firebase/functions';

/** Jangning davomiyligi — serverdagi `GUNCHA_SECONDS`. Sanoq baribir
 *  serverdan kelgan `endsAt` bo'yicha yuradi, bu faqat birinchi
 *  ko'rsatish uchun. */
export const GUNCHA_SECONDS = 180;

/** Serverning so'zga bergan javobi. */
export interface GunchaWordReply {
  accepted: boolean;
  reason?: 'accepted' | 'expired' | 'finished' | 'unknown' | 'repeated';
  score?: number;
  total?: number;
}

/** Rad javobining o'zbekcha matni. */
export const WORD_REASON: Record<string, string> = {
  expired: 'Vaqt tugadi — so‘z hisoblanmadi',
  finished: 'Jang yakunlandi',
  unknown: 'Bunday so‘z lug‘atda yo‘q',
  repeated: 'Bu so‘zni topgansiz',
};

/** Do'st bilan jang: server g'unchani tanlaydi va kod beradi. */
export const createGunchaBattle = (input: { nickname: string }) =>
  callFunction<{ battleId: string; code: string }>('gunchaCreate', input);

/** Topshirilgan so'z. Ball ham serverda hisoblanadi — mijozdagi lug'at
 *  faqat darhol javob berish uchun. */
export const sendGunchaWord = (input: { battleId: string; word: string }) =>
  callFunction<GunchaWordReply>('gunchaWord', input);

/** Sanoq nolga yetdi — natijani chiqarish.
 *
 *  Server o'z soatiga qaraydi: mijozning sanog'i oldinda ketgan bo'lsa
 *  jang yakunlanmaydi va javobda yangi `endsAt` bilan `serverNow`
 *  qaytadi. Shu bilan bir yo'la **qayta sinxronlash** ham shu funksiya
 *  orqali bo'ladi. */
export const finishGunchaBattle = (battleId: string) =>
  callFunction<{ finished: boolean; endsAt?: number; serverNow?: number }>(
    'gunchaFinish',
    { battleId },
  );
