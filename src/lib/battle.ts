/** So'zjang — ilovadagi bellashuv rejimining veb ko'rinishi.
 *
 *  Ma'lumot modeli va chaqiruvlar ilova bilan bir xil, ya'ni saytda
 *  yaratilgan chaqiruvga telefondan qo'shilish mumkin va aksincha.
 *
 *  Yozishning hammasi serverda: javob so'zi mijozga hech qachon
 *  yuborilmaydi va har taxmin `/v1/web/battles/:id/guess` da tekshiriladi.
 *
 *  O'qish endi `onSnapshot` emas, davriy so'rov (`api/poll.ts`) —
 *  ilovada ham shunday (`battle_api_repository.dart`, uch soniya).
 *  Jang holati jadvalda turadi va uni kuzatish uchun ochiq kanal
 *  shart emas; g'uncha jangining har so'zi esa socket orqali ketadi
 *  (`api/socket.ts`). */
import { api } from '../api/client';
import { refreshPlays } from './plays';
import { poll, type Unsubscribe } from '../api/poll';
import { split, type Verdict } from './uz';

export type BattleStatus = 'waiting' | 'running' | 'finished' | 'expired';
/** Jang qanday yig'ilgan.
 *
 *  `mardu` — Mardu maydon, ya'ni ikki kishidan ko'p (`mardu.ts`). Eski
 *  ilovalar uni tanimaydi va `challenge` deb o'qiydi: zarari yo'q, faqat
 *  yorlig'i noto'g'ri chiqadi. Shu sababli **yangi holat** (`status`)
 *  qo'shilmaydi, yangi tur esa xavfsiz. */
export type BattleType = 'quick' | 'challenge' | 'group' | 'mardu';

/** Jang qaysi o'yinniki.
 *
 *  `battles` to'plami ikkalasiga umumiy: juftlash, chaqiruv, muddati
 *  o'tganini tozalash va tarix bir xil, farq faqat shu maydonda va
 *  o'yinga xos qismda. Maydoni yo'q eski janglar — So'ztopniki. */
export type BattleGame = 'soztop' | 'guncha';

export const gameOf = (value: unknown): BattleGame =>
  value === 'guncha' ? 'guncha' : 'soztop';

export interface BattlePlayer {
  nickname?: string;
  /** Ranglar qatorlari (`srryy`). Harflar yo'q — raqib javobni bilmasin. */
  rows?: string[];
  attempts?: number;
  won?: boolean;
  finished?: boolean;
  score?: number;
  durationMs?: number;
  /** Jang tugagach oshkor qilinadigan taxminlar (So'zjang) yoki topilgan
   *  so'zlar (g'uncha). */
  words?: string[];
  /** G'unchada topilgan so'zlar **soni**.
   *
   *  Ataylab `words` emas: So'zjangda o'sha nom ostida ro'yxat yotadi va
   *  ikkalasi bitta to'plamda yashaydi — bir nom ikki xil turda bo'lsa,
   *  tarixni o'qiyotgan mijoz qulab tushadi. */
  wordCount?: number;
  /** G'uncha jangi tugagach ochiladigan so'zlar. */
  found?: string[];
  /** Reyting shu jangda qancha o'zgargani — natija ekrani jadvalni
   *  kutmasdan shu ikkisidan o'qiydi. */
  ratingBefore?: number;
  ratingAfter?: number;
  /** Maslahat olgan — raqib buni ko'radi, harfni esa bilmaydi. */
  hintUsed?: boolean;
}

/** G'uncha jangining harflari — ikkala o'yinchiga bir xil. */
export interface BattleGuncha {
  center?: string;
  petals?: string[];
}

export interface BattleDoc {
  game?: BattleGame;
  type?: BattleType;
  status?: BattleStatus;
  length?: number;
  createdBy?: string;
  inviteCode?: string;
  players?: Record<string, BattlePlayer>;
  winnerUid?: string | null;
  /** Jang tugagach oshkor qilinadi. */
  answer?: string | null;
  /** G'uncha jangida — harflar. */
  guncha?: BattleGuncha;
  /** G'uncha jangi tugaydigan payt (serverning soati bo'yicha). */
  endsAt?: { seconds?: number } | null;
  /** Do'st bilan jangda raqib kirishi kerak bo'lgan muddat (2 daqiqa) —
   *  kutish ekranidagi «pilik» shundan hisoblanadi. */
  expiresAt?: { seconds?: number } | null;
}

/** Manzilli chaqiruv qayerdan yuborilgani — ilovadagi `BattleInviteKind`.
 *  Uchalasi bir oqim, farqi faqat manba va raqibga boradigan push
 *  sarlavhasi: `rematch` — jangdan keyingi revansh, `nearby` — yaqin
 *  atrofdagi o'yinchi, `profile` — reytingda ko'rilgan o'yinchiga
 *  (ilovada ochiq profil, saytda jadval qatori). */
export type InviteKind = 'rematch' | 'nearby' | 'profile';

/** Chaqiruv manbasining yozuvi — ilovadagi `battleInviteSource`. */
export function inviteSource(kind: string): string {
  if (kind === 'nearby') return 'yaqin atrofdan';
  if (kind === 'profile') return 'profil orqali';
  return 'revansh';
}

/** `battle_invites/{id}` — chaqirgan tomon kuzatadigan qismi. */
export interface InviteDoc {
  status?: 'pending' | 'accepted' | 'declined' | 'expired';
  /** Qabul qilinganda server yaratgan jang. */
  battleId?: string;
  /** Qaysi o'yinga chaqirilgan — qabul qilingach shu ekran ochiladi. */
  game?: BattleGame;
  expiresAt?: { seconds?: number } | null;
}

export interface GuessReply {
  accepted: boolean;
  reason?: string;
  row?: string;
  won?: boolean;
  finished?: boolean;
  attempts?: number;
  /** Server bergan maslahat — faqat shu o'yinchiga qaytadi. */
  hint?: { index: number; unit: string } | null;
}

/** Server qaytaradigan rang belgilari. */
export const VERDICT_OF: Record<string, Verdict> = {
  s: 'correct',
  r: 'present',
  y: 'absent',
};

export const verdictsOf = (row: string): Verdict[] =>
  [...row].map((mark) => VERDICT_OF[mark] ?? 'absent');

/** Oldingi taxminlardan joyi topilgan harflar — keyingi qator shulardan
 *  boshlanadi. Ilovadagi `_autoFilledInput` bilan bir xil qoida.
 *
 *  `verdictsOf` yonida turadi va shu sababdan: ikkalasi ham serverning
 *  qator yozuvini o'qiydi, ya'ni So'zjang ham, So'zTop ham (`challenge.ts`)
 *  bir xil javobni bir xil tushunadi. */
export function autoFill(
  rows: string[],
  words: string[],
  length: number,
): string[] {
  const out = Array.from({ length }, () => '');
  rows.forEach((row, index) => {
    const units = split(words[index] ?? '');
    verdictsOf(row).forEach((verdict, position) => {
      if (verdict === 'correct' && units[position] && position < length) {
        out[position] = units[position];
      }
    });
  });
  return out;
}

/** Jangni **server** yaratadi va javob so'zini o'zi tanlaydi.
 *
 *  Kod alohida so'raladi (`/code`): tezkor o'yinda u kerak emas va
 *  har jangga bekorga kod yozib yurishning ma'nosi yo'q.
 *
 *  Taxallus yuborilmaydi — serverdagi yozuvga hisobning o'z taxallusi
 *  qo'yiladi. */
export async function createChallenge(input: {
  length: number;
}): Promise<{ battleId: string; code: string }> {
  const { battle } = await api.post<{ battle: { id: string } }>('/v1/web/battles', {
    body: { game: 'soztop', length: input.length },
  });
  const { code } = await api.post<{ code: string }>(
    `/v1/web/battles/${encodeURIComponent(battle.id)}/code`,
  );
  // Kunlik sanoq o'zgardi — ekrandagi qolgani yangilansin.
  refreshPlays();
  return { battleId: battle.id, code };
}

/** Kod bilan qo'shilish — ikkala o'yin uchun bir xil marshrut.
 *
 *  `serverNow` qaytmaydi (serverda bunday maydon yo'q), shuning uchun
 *  u javob kelgan paytdagi brauzer soati bilan to'ldiriladi: mijoz
 *  baribir `endsAt` bilan **farqni** oladi, ya'ni qurilma soati
 *  keyinchalik o'zgarsa ham sanoq sakramaydi. Tarmoqdagi kechikish
 *  sanoqqa bir necha yuz millisekund xato qo'shadi — g'uncha jangi
 *  uchun bu sezilmaydi. */
export async function joinByCode(input: {
  code: string;
}): Promise<{ battleId: string; endsAt?: number; serverNow?: number }> {
  const { battle } = await api.post<{ battle: { id: string; endsAt?: string | null } }>(
    '/v1/web/battles/join-by-code',
    { body: { code: input.code } },
  );
  refreshPlays();
  const endsAt = battle.endsAt ? Date.parse(battle.endsAt) : undefined;
  return { battleId: battle.id, endsAt, serverNow: Date.now() };
}

/** Tezkor jang. Raqib topilmasa `queued` — mijoz navbatda qoladi va
 *  javobni `watchQueue` orqali oladi. */
export async function quickMatch(input: {
  length: number;
  game?: BattleGame;
}): Promise<{ battleId?: string; queued?: boolean }> {
  const reply = await api.post<{ battleId?: string | null }>('/v1/web/battles/quick', {
    body: { game: input.game ?? 'soztop', length: input.length },
  });
  const battleId = reply.battleId ?? undefined;
  // Navbatda qolgan odam hali o'ynamadi — sanoq ham o'zgarmadi.
  if (battleId) refreshPlays();
  return battleId ? { battleId } : { queued: true };
}

export const leaveQueue = () => api.delete<unknown>('/v1/web/battles/quick');

/** Taxmin. `attempt` — nechanchi urinish ekani: server uni yozib
 *  boradi va yakunda ballni mijozdan so'ramaydi. */
export async function sendGuess(input: {
  battleId: string;
  word: string;
  attempt: number;
}): Promise<GuessReply> {
  const reply = await api.post<{
    accepted?: boolean;
    statuses?: unknown;
    won?: boolean;
    answer?: string | null;
  }>(`/v1/web/battles/${encodeURIComponent(input.battleId)}/guess`, {
    body: { guess: input.word, attempt: input.attempt },
  });

  const statuses = Array.isArray(reply.statuses)
    ? reply.statuses.filter((mark): mark is string => typeof mark === 'string')
    : [];

  return {
    accepted: reply.accepted === true,
    // Server naqshni massiv qilib beradi, sayt esa satr bilan ishlaydi
    // (`verdictsOf`) — ikkalasining alifbosi bir xil.
    row: statuses.join(''),
    won: reply.won === true,
    attempts: input.attempt,
    // Javob faqat o'yin tugaganda qaytadi, ya'ni uning borligining
    // o'zi «tugadi» degani.
    finished: reply.won === true || typeof reply.answer === 'string',
  };
}

export const forfeit = (battleId: string) =>
  api.post<unknown>(`/v1/web/battles/${encodeURIComponent(battleId)}/forfeit`);

/** Aniq raqibga chaqiruv. Yozuvni server yaratadi, raqibga push boradi
 *  va ilova yoki sayt ochiq bo'lsa chaqiruv oynasi chiqadi. Javobsiz
 *  chaqiruv bir necha daqiqada eskiradi.
 *
 *  Takrorini server **jim** to'xtatadi: o'sha raqibga ochiq chaqiruv
 *  bor bo'lsa yangisi yaratilmaydi va o'shaning raqami qaytadi. Shu
 *  sabab `repeated` bayrog'i yo'q — ekran baribir «yuborildi» deb
 *  ko'rsatadi va odam ikkinchi marta bosganini bilmay qoladi. */
export async function sendInvite(input: {
  toUid: string;
  length: number;
  kind: InviteKind;
  game?: BattleGame;
}): Promise<{ inviteId: string }> {
  const reply = await api.post<{ id?: string }>('/v1/web/invites', {
    body: {
      toUid: input.toUid,
      game: input.game ?? 'soztop',
      length: input.length,
      kind: input.kind,
    },
  });
  return { inviteId: String(reply.id ?? '') };
}

/** Chaqiruvni bekor qilish — chaqirganning o'zi ham shu marshrut bilan
 *  yopadi. */
export const cancelInvite = (inviteId: string) =>
  api.post<unknown>(`/v1/web/invites/${encodeURIComponent(inviteId)}/decline`);

const millis = (value: unknown): number =>
  typeof value === 'string' ? Date.parse(value) || 0 : 0;

/** Yuborilgan chaqiruvning javobi: qabul qilinsa `battleId` tushadi. */
export const watchInvite = (
  inviteId: string,
  onData: (invite: InviteDoc | null) => void,
): Unsubscribe =>
  poll<InviteDoc | null>(
    async () => {
      const { invite } = await api.get<{ invite?: Record<string, unknown> }>(
        `/v1/web/invites/${encodeURIComponent(inviteId)}`,
      );
      if (!invite) return null;
      return {
        status: invite.status as InviteDoc['status'],
        battleId: typeof invite.battleId === 'string' ? invite.battleId : undefined,
        game: gameOf(invite.game),
        expiresAt: { seconds: Math.floor(millis(invite.expiresAt) / 1000) },
      };
    },
    onData,
    // Chaqiruv javobi kutib turilgan payt — bu yerda kechikish
    // seziladi, shuning uchun davr qisqaroq.
    { period: 3000 },
  );

/** Jang holati. Ilovadagi `watch` bilan bir xil davr (uch soniya). */
export const watchBattle = (
  battleId: string,
  onData: (battle: BattleDoc | null) => void,
): Unsubscribe =>
  poll<BattleDoc | null>(
    () => readBattle(battleId),
    onData,
    { period: 3000 },
  );

interface ApiPlayer {
  uid?: unknown;
  nickname?: unknown;
  score?: unknown;
  attempts?: unknown;
  words?: unknown;
  statuses?: unknown;
  finishedAt?: unknown;
}

const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

/** Serverdagi yozuvni saytning hujjat shakliga o'giradi.
 *
 *  Shakl ataylab o'zgarmadi: `BattleDoc` ni o'nlab joy o'qiydi va uni
 *  almashtirish butun So'zjangni qayta yozish degani bo'lardi.
 *
 *  Ikki maydon serverda yo'q va shu sabab to'ldirilmaydi:
 *  `durationMs` (yakuniy ball ichida hisoblangan) va `hintUsed`
 *  (saytda maslahat yo'q). */
export async function readBattle(battleId: string): Promise<BattleDoc | null> {
  let data: {
    battle?: Record<string, unknown>;
    players?: unknown;
  };
  try {
    data = await api.get(`/v1/web/battles/${encodeURIComponent(battleId)}`);
  } catch {
    // Topilmadi yoki tarmoq uzildi — chaqiruvchi oxirgi holat bilan
    // qoladi, `live.ts` dagi xulq ham shunday edi.
    return null;
  }

  const battle = data.battle;
  if (!battle) return null;

  const players: Record<string, BattlePlayer> = {};
  for (const row of Array.isArray(data.players) ? data.players : []) {
    const player = row as ApiPlayer;
    const uid = String(player.uid ?? '');
    if (!uid) continue;

    const rows = strings(player.statuses);
    const words = strings(player.words);
    players[uid] = {
      nickname: typeof player.nickname === 'string' ? player.nickname : undefined,
      rows,
      attempts: typeof player.attempts === 'number' ? player.attempts : rows.length,
      // Oxirgi qator butunlay to'g'ri bo'lsa — topgan.
      won: rows.length > 0 && /^s+$/.test(rows[rows.length - 1]),
      finished: player.finishedAt !== null && player.finishedAt !== undefined,
      score: typeof player.score === 'number' ? player.score : 0,
      words,
      wordCount: words.length,
      found: words,
    };
  }

  return {
    game: gameOf(battle.game),
    type: battle.type as BattleType,
    status: battle.status as BattleStatus,
    length: typeof battle.length === 'number' ? battle.length : undefined,
    createdBy: typeof battle.hostUid === 'string' ? battle.hostUid : undefined,
    players,
    winnerUid: typeof battle.winnerUid === 'string' ? battle.winnerUid : null,
    endsAt: { seconds: Math.floor(millis(battle.endsAt) / 1000) },
    expiresAt: { seconds: Math.floor(millis(battle.expiresAt) / 1000) },
  };
}

/** Navbat yozuvi — tezkor o'yin juftlashdimi.
 *
 *  Keshdan eski yozuv kelishi muammosi yo'q bo'ldi: har so'rov
 *  serverga boradi. */
export const watchQueue = (
  _uid: string,
  onData: (entry: { status?: string; matchId?: string } | null) => void,
): Unsubscribe =>
  poll<{ status?: string; matchId?: string } | null>(
    async () => {
      const data = await api.get<{ battleId?: string | null }>('/v1/web/battles/quick');
      const battleId = data.battleId;
      return typeof battleId === 'string' && battleId
        ? { status: 'matched', matchId: battleId }
        : { status: 'waiting' };
    },
    onData,
    { period: 3000 },
  );

/** Chaqiruv havolasi — bosgan odam kodni terib o'tirmasligi uchun.
 *
 *  O'yin bo'yicha boshqa sahifaga olib boradi: g'uncha jangining kodi
 *  So'zjang sahifasida ishlamaydi (u boshqa funksiyani chaqiradi).
 *
 *  So'zjangniki — ilova ulashadigan manzilning aynan o'zi
 *  (`sozgir.uz/jang/AB12CD`, ilovadagi `DeepLink.battleUrl`): telefonda u
 *  ilovani ochadi, ilovasi yo'q odamda esa saytda qoladi. G'unchada
 *  bunday yo'l yo'q — kod ikkala o'yinda ham olti belgili va bitta
 *  to'plamda yashaydi, ya'ni koddan turini bilib bo'lmaydi, shuning uchun
 *  ilova `/jang/` ni har doim So'zjang deb ochadi. */
export const inviteLink = (code: string, game: BattleGame = 'soztop') =>
  game === 'guncha'
    ? `https://sozgir.uz/gunchajang?kod=${code.toUpperCase()}`
    : `https://sozgir.uz/jang/${code.toUpperCase()}`;
