/** So'zTop moduli — o'yinchi yashirgan so'z (`word_challenges/{KOD}`).
 *
 *  Ilovadagi modulning aynan o'zi, veb ko'rinishi: havoladan kelgan odam
 *  `sozgir.uz/soztop/<KOD>` da o'sha so'zni topadi va natija ilovadagi
 *  statistikaga tushadi — ya'ni so'zni yashirgan odam kim necha urinishda
 *  topganini telefonida ko'rib turadi.
 *
 *  **So'z saytga hech qachon yuborilmaydi.** U `word_challenges/{KOD}/
 *  secret/answer` da yotadi va qoida uni hech bir mijozga bermaydi
 *  (`soztop/firestore.rules`). Taxminni `challengeGuess` tekshiradi va
 *  faqat ranglar qatorini qaytaradi. Shundan ikkita natija kelib chiqadi
 *  va ikkalasi ham ataylab: saytda lug'at yuklanmaydi (so'z to'g'rimi —
 *  serverning ishi) va yutqazgan odamga javob ko'rsatilmaydi, chunki biz
 *  uni bilmaymiz.
 *
 *  Yashirish saytda yo'q: so'z lug'atdan **qidirib** tanlanadi va
 *  qidiruv qurilmadagi lug'atga tayanadi (`soztop/docs/soztop.md`).
 *  Shuning uchun sayt — faqat o'ynaydigan tomon, yashiradigan tomon esa
 *  ilovada qolaveradi. */
import { callFunction } from '../firebase/functions';

/** Kod — olti belgi (server `CODE_ALPHABET`: chalkashadigan `I`, `O`,
 *  `0`, `1` yo'q). Tekshiruv **shaklga** qarab: alifbo kengaysa sayt
 *  yangilanishi shart emas — ilovadagi `DeepLink._codePattern` ham
 *  shunday qaraydi. */
export const isChallengeCode = (value: string): boolean =>
  /^[A-Za-z0-9]{6}$/.test(value);

/** `challengeOpen` javobi — yashirilgan so'z **yo'q**.
 *
 *  `rows` va `words` shu odamning o'z taxminlari: ularsiz brauzer
 *  almashganda (yoki sahifa yangilanganda) to'rda ranglar turib, harflar
 *  bo'sh qolardi. Begona o'yinchining so'zlari hech qachon kelmaydi —
 *  javobni aynan shundan topib olish mumkin edi. */
export interface ChallengeState {
  code: string;
  length: number;
  /** Yashirgan odam qo'ygan sarlavha — ixtiyoriy. */
  title: string;
  hostNickname: string;
  /** Ranglar qatorlari (`srryy`) — `battle.ts` dagi `verdictsOf` o'qiydi. */
  rows: string[];
  words: string[];
  attempts: number;
  won: boolean;
  finished: boolean;
}

export interface ChallengeGuess {
  accepted: boolean;
  /** Qabul qilinmaganda — sabab («Bunday so'z lug'atda yo'q»). */
  reason?: string;
  row?: string;
  won?: boolean;
  finished?: boolean;
  attempts?: number;
}

/** O'ynashga kirish. Server yozuv ochadi va «o'ynadi» sanog'ini oshiradi,
 *  ya'ni yarmida tashlab ketgan odam ham statistikada ko'rinadi.
 *
 *  Taxallus yuboriladi: yashirgan odam jadvalda aynan shuni ko'radi. */
export const openChallenge = (input: { code: string; nickname: string }) =>
  callFunction<ChallengeState>('challengeOpen', input);

/** Taxmin. Javob ikki xil bo'ladi: `accepted: false` — so'z lug'atda yo'q
 *  (urinish sarflanmaydi), aks holda ranglar qatori va o'yin holati. */
export const guessChallenge = (input: { code: string; word: string }) =>
  callFunction<ChallengeGuess>('challengeGuess', input);
