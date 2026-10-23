/** So'zTop moduli — o'yinchi yashirgan so'z (`word_challenges/{KOD}`).
 *
 *  Ilovadagi modulning aynan o'zi, veb ko'rinishi: havoladan kelgan odam
 *  `sozgir.uz/soztop/<KOD>` da o'sha so'zni topadi va natija ilovadagi
 *  statistikaga tushadi — ya'ni so'zni yashirgan odam kim necha urinishda
 *  topganini telefonida ko'rib turadi.
 *
 *  **So'z saytga hech qachon yuborilmaydi.** U serverda qoladi va
 *  taxminni `/v1/web/challenges/:kod/guess` tekshiradi — javobda faqat
 *  ranglar qatori. Shundan ikkita natija kelib chiqadi
 *  va ikkalasi ham ataylab: saytda lug'at yuklanmaydi (so'z to'g'rimi —
 *  serverning ishi) va yutqazgan odamga javob ko'rsatilmaydi, chunki biz
 *  uni bilmaymiz.
 *
 *  Yashirish saytda yo'q: so'z lug'atdan **qidirib** tanlanadi va
 *  qidiruv qurilmadagi lug'atga tayanadi (`soztop/docs/soztop.md`).
 *  Shuning uchun sayt — faqat o'ynaydigan tomon, yashiradigan tomon esa
 *  ilovada qolaveradi. */
import { api } from '../api/client';

/** Kod — harf-raqamli qisqa satr (server `CODE_ALPHABET`:
 *  chalkashadigan `I`, `O`, `0`, `1` yo'q). Tekshiruv **shaklga**
 *  qarab va uzunligi atay keng olingan: server kodni qisqartirsa ham
 *  (masalan besh belgi) sayt havolani rad etmasligi kerak — kod
 *  haqiqatdan bormi, buni `challengeOpen` ning o'zi aytadi. Avval bu
 *  yerda qat'iy «olti belgi» turardi va ilovadan kelgan besh belgili
 *  havola saytda «kod to'g'ri emas» bo'lib ochilardi. */
export const isChallengeCode = (value: string): boolean =>
  /^[A-Za-z0-9]{4,10}$/.test(value);

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
  /** Yashirgan odamning hisobi — ismini ochiq profiliga bog'lash
   *  uchun. Taxallusning o'zi kam: bir xil ismlar uchraydi va
   *  havola aniq odamga olib borishi kerak. */
  hostUid: string;
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

/** O'ynashga kirish. Server yozuv ochadi va «o'ynadi» sanog'ini
 *  oshiradi, ya'ni yarmida tashlab ketgan odam ham statistikada
 *  ko'rinadi.
 *
 *  Taxallus yuborilmaydi: yozuvga hisobning o'z nomi qo'yiladi va
 *  yashirgan odam jadvalda aynan shuni ko'radi. */
export async function openChallenge(input: {
  code: string;
}): Promise<ChallengeState> {
  const data = await api.post<{
    code?: unknown;
    length?: unknown;
    title?: unknown;
    host?: unknown;
    hostUid?: unknown;
    rows?: unknown;
    words?: unknown;
    won?: unknown;
    finished?: unknown;
  }>(`/v1/web/challenges/${encodeURIComponent(input.code)}/open`);

  const rows = strings(data.rows);
  return {
    code: String(data.code ?? input.code),
    length: typeof data.length === 'number' ? data.length : 5,
    title: typeof data.title === 'string' ? data.title : '',
    // Serverda `host` — yashirgan odamning taxallusi.
    hostNickname: typeof data.host === 'string' ? data.host : '',
    hostUid: typeof data.hostUid === 'string' ? data.hostUid : '',
    rows,
    words: strings(data.words),
    // Urinishlar soni alohida kelmaydi — u qatorlar soniga teng.
    attempts: rows.length,
    won: data.won === true,
    finished: data.finished === true,
  };
}

/** Kirmasdan ochish — `/v1/public`, tokensiz.
 *
 *  Havolani bosgan odamda hisob bo'lmasligi mumkin va o'yin aynan
 *  shunday odam uchun. Serverda bu yo'l hech narsa saqlamaydi:
 *  qatnashchi yozilmaydi, egasining statistikasiga tushmaydi va
 *  shu sabab davom etish ham yo'q — qatorlar faqat shu sahifada,
 *  xotirada turadi. Saqlanishini istagan odam kiradi va o'shanda
 *  `openChallenge` ishlaydi. */
export async function peekChallenge(input: {
  code: string;
}): Promise<ChallengeState> {
  const data = await api.get<{
    code?: unknown;
    length?: unknown;
    title?: unknown;
    host?: unknown;
    hostUid?: unknown;
  }>(`/v1/public/challenges/${encodeURIComponent(input.code)}`, {
    auth: false,
  });

  return {
    code: String(data.code ?? input.code),
    length: typeof data.length === 'number' ? data.length : 5,
    title: typeof data.title === 'string' ? data.title : '',
    hostNickname: typeof data.host === 'string' ? data.host : '',
    hostUid: typeof data.hostUid === 'string' ? data.hostUid : '',
    rows: [],
    words: [],
    attempts: 0,
    won: false,
    finished: false,
  };
}

/** Shu brauzerning mehmon belgisi — bir marta yasaladi va qoladi.
 *
 *  Nima uchun: server mehmonni hech qanday yo'l bilan taniy
 *  olmaydi va shu sabab yashirgan odamning jadvalida ular umuman
 *  ko'rinmasdi — faqat «yettita odam hisobsiz o'ynadi» degan
 *  sanoq turardi. Belgi bitta o'yinni boshqasidan ajratadi,
 *  xolos: u kimligini aytmaydi, boshqa saytga ketmaydi va
 *  brauzer keshi tozalansa yangisi yasaladi.
 *
 *  `localStorage` ishlamasa (shaxsiy oyna, taqiq) bo'sh satr
 *  qaytadi — o'shanda eski yo'l qoladi: mehmon faqat sanoqqa
 *  tushadi. */
function guestId(): string {
  const key = 'sozgir.guest';
  try {
    const saved = localStorage.getItem(key);
    if (saved) return saved;
    const fresh = Math.random().toString(36).slice(2, 10);
    localStorage.setItem(key, fresh);
    return fresh;
  } catch {
    return '';
  }
}

/** Mehmonning taxmini. Server urinishlarni sanamaydi — `finished`
 *  shu yerda, qatorlar sonidan chiqadi (`useChallenge`). */
export async function guestGuess(input: {
  code: string;
  word: string;
  /** Shu mehmonning **birinchi** taxmini — server «nechta mehmon
   *  o'ynadi» sanog'ini shundan oshiradi. Uni server o'zi bila
   *  olmaydi: mehmonni taniydigan hech narsa yo'q. */
  first?: boolean;
}): Promise<ChallengeGuess> {
  const data = await api.post<{
    accepted?: unknown;
    statuses?: unknown;
    won?: unknown;
  }>(`/v1/public/challenges/${encodeURIComponent(input.code)}/guess`, {
    auth: false,
    body: {
      word: input.word,
      first: input.first === true,
      // Belgi har taxminda ketadi: server shu bo'yicha
      // mehmonning qatorini topadi va urinishini sanaydi.
      guestId: guestId(),
    },
  });

  if (data.accepted !== true) {
    return { accepted: false, reason: 'Bunday so‘z lug‘atda yo‘q' };
  }

  return {
    accepted: true,
    row: strings(data.statuses).join(''),
    won: data.won === true,
  };
}

const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

/** Taxmin. Javob ikki xil bo'ladi: `accepted: false` — so'z lug'atda yo'q
 *  (urinish sarflanmaydi), aks holda ranglar qatori va o'yin holati. */
export async function guessChallenge(input: {
  code: string;
  word: string;
}): Promise<ChallengeGuess> {
  const data = await api.post<{
    accepted?: unknown;
    statuses?: unknown;
    won?: unknown;
    finished?: unknown;
  }>(`/v1/web/challenges/${encodeURIComponent(input.code)}/guess`, {
    body: { word: input.word },
  });

  if (data.accepted !== true) {
    return { accepted: false, reason: 'Bunday so‘z lug‘atda yo‘q' };
  }

  return {
    accepted: true,
    // Server naqshni massiv qilib beradi, sayt satr bilan ishlaydi.
    row: strings(data.statuses).join(''),
    won: data.won === true,
    finished: data.finished === true,
  };
}

/** Mehmon o'ynagan o'yinni hisobga ko'chiradi.
 *
 *  Mehmon yo'li hech narsa saqlamaydi, ya'ni o'yin faqat shu
 *  sahifada turadi va yashirgan odam uni ko'rmaydi. Odam o'yindan
 *  keyin kirsa, tergan so'zlari shu marshrutga yuboriladi va
 *  server ularni **qayta tekshirib** ismli qator yozadi.
 *
 *  Faqat so'zlar yuboriladi: ranglar ham, urinishlar soni ham
 *  serverda hisoblanadi — aks holda har kim «bir urinishda topdim»
 *  deb yozdira olardi. */
export async function claimChallenge(input: {
  code: string;
  words: readonly string[];
}): Promise<{ claimed: boolean; won: boolean; attempts: number }> {
  const data = await api.post<{
    claimed?: unknown;
    won?: unknown;
    attempts?: unknown;
  }>(`/v1/web/challenges/${encodeURIComponent(input.code)}/claim`, {
    body: { words: [...input.words] },
  });

  return {
    claimed: data.claimed === true,
    won: data.won === true,
    attempts: Number(data.attempts ?? 0) || 0,
  };
}

/** Yashirgan so'zning ro'yxatdagi ko'rinishi.
 *
 *  Serverdagi `ChallengeRow` ning saytga keragi: kod, sarlavha,
 *  uzunlik, sanoqlar va muddat. Javob ham, qaysi odam o'ynagani
 *  ham bu yerda yo'q — ikkinchisi alohida so'rov
 *  (`challengeBoard`), chunki u faqat ochilgan qatorga kerak. */
export interface MyChallenge {
  code: string;
  title: string;
  length: number;
  /** `open`, `closed` yoki `expired` — serverning o'z yozuvi. */
  status: string;
  /** Hisobi bor o'yinchilar va mehmonlar birga: ro'yxatdagi son
   *  «nechta odam o'ynadi» degan savolga javob beradi va bu
   *  savolda ikkisining farqi yo'q. */
  plays: number;
  solved: number;
  /** Muddati — millisekundda; `0` bo'lsa server muddat qo'ymagan. */
  expiresAt: number;
}

const asRow = (value: unknown): MyChallenge => {
  const row = (value ?? {}) as Record<string, unknown>;
  const expires = Date.parse(String(row.expires_at ?? ''));
  return {
    code: String(row.code ?? ''),
    title: typeof row.title === 'string' ? row.title : '',
    length: Number(row.length ?? 0) || 0,
    status: String(row.status ?? 'open'),
    plays: (Number(row.plays ?? 0) || 0) + (Number(row.guest_plays ?? 0) || 0),
    solved:
      (Number(row.solved ?? 0) || 0) + (Number(row.guest_solved ?? 0) || 0),
    expiresAt: Number.isNaN(expires) ? 0 : expires,
  };
};

/** So'z yashirish. Javobda faqat kod — havola shundan yasaladi.
 *
 *  So'z serverda qayta tekshiriladi (`canBeAnswer`): saytdagi
 *  qidiruv keshdagi lug'atga tayanadi va u bir necha kun eski
 *  bo'lishi mumkin. Shuning uchun bu yerdagi xato matni
 *  serverniki — o'zimiznikini o'ylab topsak, ikkisi ajralib
 *  ketardi. */
export async function createChallenge(input: {
  word: string;
  title?: string;
}): Promise<{ code: string }> {
  const data = await api.post<{ code?: unknown }>('/v1/web/challenges', {
    body: { word: input.word, title: input.title ?? '' },
  });
  return { code: String(data.code ?? '') };
}

/** O'zim yashirgan so'zlar — yangisi birinchi. */
export async function myChallenges(): Promise<MyChallenge[]> {
  const data = await api.get<{ mine?: unknown }>('/v1/web/challenges/mine');
  return (Array.isArray(data.mine) ? data.mine : []).map(asRow);
}

/** Muddatidan oldin yopish — havola endi yangi o'yinchini olmaydi.
 *
 *  O'chirish emas: o'ynab bo'lganlarning natijasi joyida qoladi va
 *  statistika o'qilaveradi. */
export async function closeChallenge(code: string): Promise<void> {
  await api.delete(`/v1/web/challenges/${encodeURIComponent(code)}`);
}

/** Kim o'ynagani — faqat so'z egasiga (serverda tekshiriladi). */
export interface ChallengePlayer {
  nickname: string;
  attempts: number;
  won: boolean;
  finished: boolean;
}

export async function challengeBoard(
  code: string
): Promise<ChallengePlayer[]> {
  const data = await api.get<{ board?: unknown }>(
    `/v1/web/challenges/${encodeURIComponent(code)}/board`
  );
  return (Array.isArray(data.board) ? data.board : []).map((value) => {
    const row = (value ?? {}) as Record<string, unknown>;
    return {
      nickname:
        typeof row.nickname === 'string' && row.nickname ? row.nickname : '',
      attempts: Number(row.attempts ?? 0) || 0,
      won: row.won === true,
      finished: row.finished === true,
    };
  });
}
