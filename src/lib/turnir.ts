/** Turnir — ketma-ket bir necha **mardu maydoni**.
 *
 *  Yangi o'yin emas va maydonning ustiga qurilgan qavat ham emas:
 *  turnir faqat **tartib** beradi — kim kim bilan, qaysi davrada va kim
 *  o'tadi. O'ynaladigan narsa baribir o'sha mardu maydoni, ya'ni
 *  `battles/{id}` hujjati, o'sha jang ekrani, o'sha jadval
 *  (`docs/mardu_turnir.md`).
 *
 *  Chiqarib yuborish yo'q: hamma oxirgi davragacha o'ynaydi. Har
 *  davrada qatnashchilar **to'rt kishilik** guruhlarga bo'linadi va
 *  guruh jadvaldagi o'rin bo'yicha teriladi — ya'ni odam o'ziga teng
 *  ochkodagilar bilan o'ynaydi. Guruhlar **bir vaqtda** boshlanib bir
 *  vaqtda tugaydi, shu sababli kutish yo'q: pley-off juftlarida
 *  keyingi davra eng sekin juftni kutardi.
 *
 *  Yozishning hammasi serverda — turnir jadvallariga mijoz yoza
 *  olmaydi. Saytga o'qish va chaqirish qoladi.
 *
 *  Ko'rinish bitta so'rovdan keladi (`/v1/turnirs/by-code/:code`):
 *  jadval, joriy bosqich guruhlari va o'tgan bosqichlar birga. Uch
 *  marshrutga bo'linsa har biri o'z vaqtida kelib, jadval sakrab
 *  turardi.
 *
 *  **Serverda hali yo'q** va shu sababli ekranda ko'rinmaydigan
 *  narsalar: tezkor turnir sanog'i (`startsAt`), mukofot summalari
 *  (`prize`), ikkinchi va uchinchi o'rin (`runnerUpUid`, `thirdUid`)
 *  hamda turnirda ishlangan aqcha (`aqcha`, `balance`). Turnir
 *  jadvali `turnirs` jadvalida bu maydonlarsiz yashaydi. Ular
 *  qo'shilsa [docOf] ning ichi to'ldiriladi, qolgan kod tegilmaydi. */
import { api } from '../api/client';
import { poll, sharedPoll, type Unsubscribe } from '../api/poll';
import type { BattleDoc, BattleGame } from './battle';
import type { ArenaStanding, MarduDoc } from './mardu';
import { rankArena } from './mardu';

/** Turnir hajmi. Uchtadan boshqasi yo'q: har davrada odam ikki barobar
 *  kamayishi kerak, ya'ni son ikkining darajasi bo'lishi shart. */
export const TURNIR_SIZES = [8, 16, 32] as const;
export type TurnirCapacity = (typeof TURNIR_SIZES)[number];

/** Shuncha odamdan kam bo'lsa turnir boshlanmaydi. */
export const TURNIR_MIN_PLAYERS = 2;

/** Bir guruhdagi odam — maydon sig'imidan (8) **alohida** son.
 *
 *  To'rtta, chunki turnirda guruh — bitta o'yin, sakkiz kishilik
 *  o'yinda esa o'rtadagi odamning natijasi tasodifga aylanardi:
 *  bitta so'zni bir soniya kech topgan odam uchinchi o'rindan
 *  oltinchiga tushib ketardi. To'rt kishida har davra ma'noli va
 *  davralar soni ham ko'proq — turnir uzoqroq va adolatliroq
 *  bo'ladi. Serverda ham shu son (`TURNIR_GROUP_CAPACITY`). */
export const TURNIR_GROUP = 4;

/** Davralar orasidagi tanaffus: jadvalni o'qishga yetadi, davra
 *  tarqalib ketishiga yetmaydi. */
export const TURNIR_GAP_SECONDS = 20;

/** Kod uzunligi — mardudagi chaqiruv kodi bilan bir xil shaklda. */
export const TURNIR_CODE_LENGTH = 6;

type Stamp = { seconds?: number } | null;

export type TurnirStatus = 'gathering' | 'running' | 'finished' | 'expired';

export interface TurnirMember {
  nickname?: string;
  joinedAt?: Stamp;
}

/** Joriy davradagi bitta maydon. */
export interface TurnirGroup {
  battleId?: string;
  uids?: string[];
  done?: boolean;
}

/** Tugagan davradagi bitta maydon — jadvali bilan. */
export interface TurnirPastGroup {
  battleId?: string;
  standings?: ArenaStanding[];
}

export interface TurnirPastRound {
  round?: number;
  groups?: TurnirPastGroup[];
  /** Shu davrada olingan ochko — qator yonida turadi. Jami emas:
   *  to'rni o'qiyotgan odam har davrada kim qanday o'ynaganini
   *  ko'rishi kerak, jami esa jadvalda (`TurnirDoc.points`). */
  points?: Record<string, number>;
}

/** `mardu_series/{KOD}` — turnirning butun tarixi bitta hujjatda.
 *  Davra beshdan oshmaydi, ya'ni 32 kishida ham hujjat ~30 KB. */
export interface TurnirDoc {
  code?: string;
  title?: string;
  game?: BattleGame;
  /** Tezkor turnir — notanish odamlar bilan, sanoq bilan. Do'stlar
   *  turniridan farqi ikkita: boshlashni hech kim bosmaydi (sanoq
   *  boshlaydi) va odam yetmasa robotlar qo'shiladi. */
  mode?: 'quick' | 'friends';
  /** Tezkor turnirda sanoq shu paytda tugaydi (serverning soati).
   *  Ikkinchi odam kirgunicha yo'q: boshlanmaydigan sanoq
   *  ko'rsatilmaydi. */
  startsAt?: Stamp;
  length?: number;
  capacity?: number;
  status?: TurnirStatus;

  host?: string;
  createdBy?: string;
  createdAt?: Stamp;
  expiresAt?: Stamp;
  startedAt?: Stamp;
  finishedAt?: Stamp;

  members?: Record<string, TurnirMember>;
  uids?: string[];

  round?: number;
  /** Turnir necha davradan iborat — boshlanganda muhrlanadi. */
  rounds?: number;
  /** Boshlanganda muhrlanadigan kirish tartibi — teng ochkoda
   *  jadvaldagi o'rinni shu buzadi va u o'yindan **oldin** hammaga
   *  ko'rinadi. */
  seeds?: string[];
  /** Shu davrada o'ynayotganlar — shveytsarda odatda hamma. */
  alive?: string[];
  /** Jadval tartibi: ochko bo'yicha, teng ochkoda `seeds` bo'yicha. */
  order?: string[];
  /** Yig'ilgan ochko. */
  points?: Record<string, number>;
  /** Joriy davra oxirgisimi — unda birinchi guruh **final** bo'ladi. */
  final?: boolean;
  groups?: TurnirGroup[];
  nextRoundAt?: Stamp;
  ladder?: TurnirPastRound[];

  winnerUid?: string;
  runnerUpUid?: string;

  /** Turnir davomida har kim ishlagan aqcha — davralar yig'indisi.
   *
   *  Serverda `addSeriesAqcha` yozadi: har guruh jangi tugaganda
   *  o'sha jangdagi o'zgarish qo'shiladi. Yakuniy jadvalda aynan shu
   *  son turadi, chunki odam «turnirda qancha ishladim?» deb
   *  so'raydi — bitta davraniki emas. */
  aqcha?: Record<string, number>;

  /** Turnirdan keyingi umumiy hisob — jangdan **keyingi** holat.
   *  Yig'indi emas, oxirgi yozuv: har davra uni yangilab turadi. */
  balance?: Record<string, number>;

  /** Uchinchi o'rin — umumiy jadvaldan olinadi, finaldan emas:
   *  finalda ikki kishi o'ynaydi va uchinchi o'sha paytda boshqa
   *  guruhda bo'ladi. */
  thirdUid?: string;

  /** G'olibga to'langan ustama (aqcha) — sonni **server** hisoblaydi
   *  va shu yerga yozadi (`onTurnirFinished`).
   *
   *  Formula sahifada takrorlanmaydi: ikki joyda ikki xil bo'lib
   *  qolsa, ekrandagi son hisobga tushganidan farq qilardi — ustama
   *  esa `scores/{uid}` da, ya'ni mijozga yopiq.
   *
   *  Nol bo'lishi mumkin: sakkiz kishidan kam turnir mukofot
   *  chiqarmaydi (`rewards.ts`, `TURNIR_PRIZE_MIN_PLAYERS`). */
  prize?: number;
  runnerUpPrize?: number;
  thirdPrize?: number;
}

// ── Chaqiruvlar ────────────────────────────────────────────────────────

export async function createTurnir(input: {
  game: BattleGame;
  capacity: TurnirCapacity;
  length?: number;
  title?: string;
}): Promise<{ code: string }> {
  const { turnir } = await api.post<{ turnir: { code?: string } }>('/v1/turnirs', {
    body: {
      game: input.game,
      capacity: input.capacity,
      title: input.title,
      length: input.length,
    },
  });
  return { code: turnir.code ?? '' };
}

/** Kod bilan qo'shilish. Takroriy chaqiruv xato bermaydi — sahifasini
 *  yangilagan odam o'sha turnirga qaytadi. */
export async function joinTurnir(input: { code: string }): Promise<{ code: string }> {
  const { turnir } = await api.post<{ turnir: { code?: string } }>(
    '/v1/turnirs/join-by-code',
    { body: { code: input.code } },
  );
  return { code: turnir.code ?? input.code };
}

/** Tezkor turnir — ochiq xona topiladi yoki yangisi ochiladi.
 *
 *  Tanlashni **server** qiladi: ro'yxatdan so'rov «o'qi-keyin-yarat»
 *  poygasiga ochiq bo'lardi va bir soniya farq bilan kirgan ikki odam
 *  ikkita bo'sh turnir ochib yuborardi. */
export async function quickTurnir(input: {
  game: BattleGame;
}): Promise<{ code: string; startsAt?: number | null; serverNow?: number }> {
  const { turnir } = await api.post<{ turnir: { code?: string } }>(
    '/v1/turnirs/quick',
    { body: { game: input.game } },
  );
  // Sanoq serverda saqlanmaydi, shuning uchun `startsAt` yo'q: xona
  // boshlanishni tashkilotchining bosishi bilan kutadi.
  return { code: turnir.code ?? '', serverNow: Date.now() };
}

/** Do'stni turnirga chaqiradi — unga push xabar boradi.
 *
 *  Takroriy chaqiruv xabar yubormaydi: serverdagi yozuv bir marta
 *  qo'yiladi va ikkinchi bosish jimgina o'tadi. */
export async function inviteToTurnir(input: {
  code: string;
  toUid: string;
}): Promise<{ sent?: boolean }> {
  const id = await turnirIdOf(input.code);
  await api.post(`/v1/turnirs/${encodeURIComponent(id)}/invite`, {
    body: { toUid: input.toUid },
  });
  return { sent: true };
}

export async function leaveTurnir(code: string): Promise<{ left: boolean }> {
  const id = await turnirIdOf(code);
  await api.post(`/v1/turnirs/${encodeURIComponent(id)}/leave`);
  return { left: true };
}

/** Boshlashni tashkilotchi bosadi. Idempotent: ikki marta bosilsa
 *  ikkinchi davra ochilmaydi. */
export async function startTurnir(code: string): Promise<{ round: number }> {
  const id = await turnirIdOf(code);
  const reply = await api.post<{ round?: number }>(
    `/v1/turnirs/${encodeURIComponent(id)}/start`,
  );
  return { round: reply.round ?? 1 };
}

export async function kickFromTurnir(
  code: string,
  uid: string,
): Promise<{ removed: boolean }> {
  const id = await turnirIdOf(code);
  await api.post(`/v1/turnirs/${encodeURIComponent(id)}/kick`, { body: { uid } });
  return { removed: true };
}

/* ── O'qish ────────────────────────────────────────────────────────── */

/** Kod → ichki raqam.
 *
 *  Marshrutlarning bir qismi kod bilan ishlaydi, bir qismi `id` bilan.
 *  Moslik bir marta olinadi va eslab qolinadi: turnirning kodi
 *  o'zgarmaydi, ya'ni jadvalni eskirtirish kerak emas. */
const ids = new Map<string, string>();

async function turnirIdOf(code: string): Promise<string> {
  const known = ids.get(code);
  if (known !== undefined) return known;

  const full = await api.get<{ turnir?: { id?: string } }>(
    `/v1/turnirs/by-code/${encodeURIComponent(code)}`,
  );
  const id = String(full.turnir?.id ?? '');
  if (id) ids.set(code, id);
  return id;
}

interface ApiPlayer {
  uid?: unknown;
  nickname?: unknown;
}

interface ApiFull {
  turnir?: Record<string, unknown>;
  players?: unknown;
  seeds?: unknown;
  order?: unknown;
  points?: unknown;
  isFinalRound?: unknown;
  groups?: unknown;
  ladder?: unknown;
}

const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const strings = (value: unknown): string[] =>
  list(value).filter((item): item is string => typeof item === 'string');

/** Serverdagi ko'rinishni saytning hujjat shakliga o'giradi.
 *
 *  Shakl ataylab o'zgarmadi: `TurnirDoc` ni turnir sahifasining har
 *  bo'lagi o'qiydi. */
function docOf(full: ApiFull): TurnirDoc {
  const turnir = full.turnir ?? {};
  const players = list(full.players).map((row) => row as ApiPlayer);

  const members: Record<string, TurnirMember> = {};
  for (const player of players) {
    const uid = String(player.uid ?? '');
    if (!uid) continue;
    members[uid] = { nickname: String(player.nickname ?? '').trim() };
  }

  const code = String(turnir.code ?? '');
  if (code && typeof turnir.id === 'string') ids.set(code, turnir.id);

  return {
    code,
    title: typeof turnir.title === 'string' ? turnir.title : '',
    game: turnir.game === 'guncha' ? 'guncha' : 'soztop',
    capacity: typeof turnir.capacity === 'number' ? turnir.capacity : 8,
    status: turnir.status as TurnirStatus,
    host: typeof turnir.hostUid === 'string' ? turnir.hostUid : undefined,
    createdBy: typeof turnir.hostUid === 'string' ? turnir.hostUid : undefined,
    round: typeof turnir.round === 'number' ? turnir.round : 1,
    rounds: typeof turnir.rounds === 'number' ? turnir.rounds : undefined,
    winnerUid: typeof turnir.winnerUid === 'string' ? turnir.winnerUid : undefined,
    members,
    uids: Object.keys(members),
    seeds: strings(full.seeds),
    order: strings(full.order),
    points: (full.points ?? {}) as Record<string, number>,
    final: full.isFinalRound === true,
    groups: list(full.groups).map((row) => {
      const group = row as { battleId?: unknown; uids?: unknown; done?: unknown };
      return {
        battleId: typeof group.battleId === 'string' ? group.battleId : undefined,
        uids: strings(group.uids),
        done: group.done === true,
      };
    }),
    ladder: ladderOf(full.ladder),
  };
}

/** O'tgan bosqichlar — to'rni chizish uchun.
 *
 *  Serverda ular yassi ro'yxat (`{round, slot, standings}`), saytda
 *  esa davra bo'yicha guruhlangan. */
function ladderOf(value: unknown): TurnirPastRound[] {
  const rounds = new Map<number, TurnirPastGroup[]>();

  for (const row of list(value)) {
    const entry = row as { round?: unknown; standings?: unknown };
    const round = typeof entry.round === 'number' ? entry.round : 0;
    const groups = rounds.get(round) ?? [];
    groups.push({ standings: (entry.standings ?? []) as ArenaStanding[] });
    rounds.set(round, groups);
  }

  return [...rounds.entries()]
    .sort(([a], [b]) => a - b)
    .map(([round, groups]) => ({ round, groups }));
}

/** Ro'yxatdagi bitta qator.
 *
 *  To'liq hujjat emas: ro'yxatga to'rt narsa yetadi — qaysi o'yin,
 *  nechta odam, qancha joy va (tarixda) qanday tugagani. Ilovadagi
 *  `TurnirOpen` bilan bir xil qaror. */
export interface TurnirRow {
  code: string;
  title: string;
  game: BattleGame;
  players: number;
  capacity: number;
  quick: boolean;
  status: TurnirStatus;
  /** Tarixda: g'olib kim va men nechanchi bo'ldim. */
  winnerUid: string;
  winnerName: string;
  prize: number;
  doc: TurnirDoc;
}

/** Hozir yig'ilayotgan turnirlar — bo'lim sahifasidagi ro'yxat.
 *
 *  Ro'yxatda to'liq ko'rinish kerak emas: nom, hajm va yig'ilganlar
 *  yetadi, shuning uchun server alohida, yengilroq javob beradi. */
export const watchOpenTurnirList = (
  onData: (rows: TurnirRow[]) => void,
): Unsubscribe =>
  sharedPoll<TurnirRow[]>(
    'turnirs/open',
    async () => {
      const data = await api.get<{ items?: unknown }>('/v1/turnirs/open', {
        auth: false,
      });
      return list(data.items).map((row) => {
        const item = row as Record<string, unknown>;
        const names = (item.names ?? {}) as Record<string, string>;
        const uids = strings(item.uids);
        return {
          code: String(item.code ?? ''),
          title: String(item.title ?? ''),
          game: item.game === 'guncha' ? 'guncha' : 'soztop',
          players: typeof item.players === 'number' ? item.players : uids.length,
          capacity: typeof item.capacity === 'number' ? item.capacity : 8,
          // Serverda turnir turi saqlanmaydi; ro'yxatdagi hamma xona
          // bir xil ko'rinadi.
          quick: false,
          status: 'gathering' as TurnirStatus,
          winnerUid: '',
          winnerName: '',
          prize: 0,
          doc: {
            code: String(item.code ?? ''),
            uids,
            members: Object.fromEntries(
              uids.map((uid) => [uid, { nickname: names[uid] ?? '' }]),
            ),
          },
        };
      });
    },
    onData,
    { period: 10_000 },
  );

/** Shu odam o'ynagan tugagan turnirlar. */
export const watchMyTurnirHistory = (
  uid: string,
  onData: (rows: TurnirRow[]) => void,
): Unsubscribe =>
  sharedPoll<TurnirRow[]>(
    `turnirs/history:${uid}`,
    async () => {
      const data = await api.get<{ items?: unknown }>('/v1/turnirs/history');
      return list(data.items).map((row) => rowOf(docOf(row as ApiFull)));
    },
    onData,
    { period: 30_000 },
  );

function rowOf(doc: TurnirDoc): TurnirRow {
  const winnerUid = doc.winnerUid ?? '';
  return {
    code: doc.code ?? '',
    title: doc.title ?? '',
    game: doc.game === 'soztop' ? 'soztop' : 'guncha',
    players: doc.uids?.length ?? Object.keys(doc.members ?? {}).length,
    capacity: doc.capacity ?? 8,
    quick: doc.mode === 'quick',
    status: doc.status ?? 'gathering',
    winnerUid,
    winnerName: winnerUid ? memberName(doc, winnerUid) : '',
    prize: doc.prize ?? 0,
    doc,
  };
}

/** Shu odamning tugamagan turniri — ko'pi bilan bittasi.
 *
 *  Bir vaqtda bitta turnir qoidasi serverda, ya'ni bu yerda ro'yxat
 *  emas, bitta yozuv kutiladi: bo'lim tepasida o'z turniri turadi. */
export const watchMyTurnir = (
  uid: string,
  onData: (turnir: { code: string; doc: TurnirDoc } | null) => void,
): Unsubscribe =>
  sharedPoll<{ code: string; doc: TurnirDoc } | null>(
    `turnirs/mine:${uid}`,
    async () => {
      const full = await api.get<ApiFull>('/v1/turnirs/mine');
      if (!full.turnir) return null;
      const doc = docOf(full);
      return { code: doc.code ?? '', doc };
    },
    onData,
    { period: 10_000 },
  );

/** Bitta turnirning to'liq ko'rinishi. */
export const watchTurnir = (
  code: string,
  onData: (doc: TurnirDoc | null) => void,
): Unsubscribe =>
  poll<TurnirDoc | null>(
    async () => {
      try {
        const full = await api.get<ApiFull>(
          `/v1/turnirs/by-code/${encodeURIComponent(code)}`,
        );
        return full.turnir ? docOf(full) : null;
      } catch {
        return null;
      }
    },
    onData,
    { period: 3000 },
  );

/** Ulashiladigan havola — QR ham, «Nusxa olish» ham shuni beradi. */
export const turnirLink = (code: string) =>
  `https://sozgir.uz/turnir/${code.toUpperCase()}`;

/** Sayt ichidagi manzil — router shu bo'yicha sahifani tanlaydi. */
export const turnirPath = (code: string) => `/turnir/${code.toUpperCase()}`;

/** Kodni bitta shaklga keltiradi: olti belgi, katta harf. */
export const cleanCode = (value: string) =>
  value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, TURNIR_CODE_LENGTH);

// ── Zinapoya ───────────────────────────────────────────────────────────

/** Turnir necha davradan iborat (8 → 3, 16 → 4, 32 → 5).
 *
 *  Serverdagi `turnirRounds` ning aynan o'zi. Shveytsarda bu «odam
 *  ikki barobar kamayadi» degani emas — hamma hamma davrani
 *  o'ynaydi — faqat davralar soni. Yig'ilish sahifasida va'da bo'lib
 *  turadi: odam birinchi qarashdayoq necha davra o'ynashini va
 *  chiqarib yuborilmasligini bilsin. */
export function turnirRounds(players: number): number {
  let left = Math.max(1, players);
  let rounds = 0;
  while (left > 1) {
    left = Math.ceil(left / 2);
    rounds += 1;
  }
  return rounds;
}

/** Shuncha odam necha guruhga bo'linadi (`ceil(n / 4)`). */
export const groupCount = (players: number) =>
  Math.max(1, Math.ceil(players / TURNIR_GROUP));

/** Guruhning nomi — **nima uchun o'ynayotgani**.
 *
 *  Turnir shveytsar tizimida: chiqarib yuborish yo'q va hamma
 *  oxirigacha o'ynaydi, ya'ni chorak final, yarim final degan
 *  bosqichlar yo'q. Guruhlar jadval bo'yicha tuziladi, demak har
 *  guruh qo'shni o'rinlar uchun bellashadi va nomi aynan shuni
 *  aytishi kerak:
 *
 *  * oxirgi davra, birinchi guruh — **Final**;
 *  * oxirgi davra, qolganlari — «3-o'rin uchun»;
 *  * undan oldingi davralar — «3–6-o'rinlar»;
 *  * birinchi davra — «A guruh»: jadval hali yo'q, o'rin haqida
 *    gapirish yolg'on bo'lardi.
 *
 *  `null` — nom kerak emas (yolg'iz guruh yoki guruhsiz odam).
 *  Ilovadagi `_groupName` ning aynan o'zi.
 *
 *  [sizes] — shu davradagi guruhlarning odam soni, tartibi bilan. */
export function groupName({
  round,
  rounds,
  sizes,
  index,
}: {
  round: number;
  rounds: number;
  sizes: number[];
  index: number;
}): string | null {
  if (index < 0) return null;
  // Final har doim **birinchi** guruh (serverdagi `finalGroups`).
  const last = rounds > 0 && round >= rounds;
  if (last && index === 0) return 'Final';

  // Guruhgacha nechta o'rin band: shu guruhning birinchi o'rni.
  let before = 0;
  for (let at = 0; at < index && at < sizes.length; at += 1) before += sizes[at];
  const from = before + 1;
  const to = before + (sizes[index] ?? 0);

  if (last) return `${from}-o‘rin uchun`;
  if (sizes.length <= 1) return null;
  if (round <= 1) return `${String.fromCharCode(65 + index)} guruh`;
  // Ikki kishilik guruhda oraliq ortiqcha: «3-4-o'rinlar» o'rniga
  // «3-o'rin uchun» aniqroq — ikkovidan biri o'sha o'rinni oladi.
  return from === to - 1 ? `${from}-o‘rin uchun` : `${from}–${to}-o‘rinlar`;
}

/** Shu turnirda odam qo'lga kiritgan aqcha — **ustama bilan**.
 *
 *  `aqcha` da faqat janglardan kelgani turadi: u reytingdan chiqadi
 *  va kuchli raqib bilan o'ynagan odam ikkinchi o'rinni olib ham
 *  minusda qolishi mumkin. Turnir ustamasi esa alohida chelakda
 *  (`scores/{uid}.bonusAqcha`) va jadvalga tushmasdi — ekranda
 *  «2-o'rin, −2 aqcha» degan qarama-qarshilik ko'rinardi.
 *
 *  Shuning uchun uchta sovrinli o'rin uchun ustama shu yerda
 *  qo'shiladi: odam ekranda **haqiqatan olgan** sonini ko'radi.
 *  Ilovadagi `Turnir.earnedBy` ning aynan o'zi. Hali yozilmagan
 *  bo'lsa `null` — jadval bo'sh joy qoldiradi. */
export function earnedBy(
  doc: TurnirDoc | null | undefined,
  uid: string,
): number | null {
  const base = doc?.aqcha?.[uid];
  if (base === undefined) return null;
  if (uid && uid === doc?.winnerUid) return base + (doc.prize ?? 0);
  if (uid && uid === doc?.runnerUpUid) return base + (doc.runnerUpPrize ?? 0);
  if (uid && uid === doc?.thirdUid) return base + (doc.thirdPrize ?? 0);
  return base;
}

export const memberName = (doc: TurnirDoc | null | undefined, uid: string) =>
  doc?.members?.[uid]?.nickname ?? 'Mehmon';

/** Turnirda qatnashayotganlar soni. `uids` qoidalar uchun yoziladi,
 *  `members` esa ko'rsatish uchun — ikkalasi ham bo'lmasa nol. */
export const playerCount = (doc: TurnirDoc | null | undefined) =>
  doc?.uids?.length ?? Object.keys(doc?.members ?? {}).length;

/** Joriy davrada shu odamning maydoni. Chiqib ketgan odamda `null`. */
export function groupOf(
  doc: TurnirDoc | null | undefined,
  uid: string,
): TurnirGroup | null {
  return doc?.groups?.find((group) => group.uids?.includes(uid)) ?? null;
}

/** Shu odamning jadvaldagi holati.
 *
 *  Shveytsarda «chiqib ketdim» degan holat yo'q — hamma oxirigacha
 *  o'ynaydi. Shuning uchun savol boshqacha: **nechanchi o'rindaman va
 *  nechta ochkom bor**. */
export interface TurnirPlace {
  /** Jadvaldagi o'rin (1 dan). Ro'yxatda bo'lmasa 0. */
  rank: number;
  points: number;
  /** Shu davrada o'ynayaptimi. Deyarli doim rost: faqat oxirgi
   *  davrada, qolganlar ikki kishidan kam bo'lsa, bitta odam
   *  o'tkazib yuboriladi. */
  playing: boolean;
  winner: boolean;
}

export function placeOf(
  doc: TurnirDoc | null | undefined,
  uid: string,
): TurnirPlace {
  if (!uid) return { rank: 0, points: 0, playing: false, winner: false };
  const at = doc?.order?.indexOf(uid) ?? -1;
  return {
    rank: at < 0 ? 0 : at + 1,
    points: doc?.points?.[uid] ?? 0,
    playing: doc?.alive?.includes(uid) ?? false,
    winner: doc?.winnerUid === uid,
  };
}

/** Joriy davradagi guruh final guruhimi.
 *
 *  Final har doim **birinchi** guruh (serverdagi `finalGroups`). */
export const isFinalGroup = (
  doc: TurnirDoc | null | undefined,
  group: TurnirGroup,
): boolean =>
  doc?.final === true && doc.groups?.[0]?.battleId === group.battleId;

// ── To'r ───────────────────────────────────────────────────────────────

/** To'rdagi bitta qator. */
export interface LadderSeat {
  uid: string;
  nickname: string;
  /** Guruhdagi o'rin. Hali o'ynalmagan davrada `null`. */
  rank: number | null;
  score: number | null;
  /** Shu davrada olingan ochko. Tugamagan guruhda `null`. */
  points: number | null;
  mine: boolean;
}

export interface LadderGroup {
  battleId: string | null;
  seats: LadderSeat[];
  done: boolean;
}

export interface LadderGroupName {
  /** Oxirgi davradagi birinchi guruh — **final**. */
  final: boolean;
}

export interface LadderRound {
  round: number;
  /** Turnirdagi davralar soni — bosqich nomi shundan chiqadi
   *  (oxirgi davrada birinchi guruh final bo'ladi). */
  rounds: number;
  groups: LadderGroup[];
  players: number;
  /** Hozir o'ynalayotgan davra — ko'rinishda ajralib turadi. */
  current: boolean;
  /** Oxirgi davra: birinchi guruh final, qolganlari jadval uchun. */
  last: boolean;
}

/** Hujjatdan to'r: tugagan davralar `ladder` dan, joriysi `groups` dan.
 *
 *  `live` — joriy davradagi guruh janglarining hujjatlari. Ular bo'lsa
 *  jadval jonli ko'rinadi (kim nechta to'pladi), bo'lmasa qator faqat
 *  ism bo'lib turadi: jang hujjatini o'qiy olmaslik — xato emas, shunchaki
 *  kamroq ma'lumot. */
export function buildLadder({
  doc,
  uid,
  live,
}: {
  doc: TurnirDoc | null | undefined;
  uid: string;
  live?: Record<string, MarduDoc | null>;
}): LadderRound[] {
  const rounds: LadderRound[] = [];

  for (const past of doc?.ladder ?? []) {
    const earned = past.points ?? {};
    const groups: LadderGroup[] = (past.groups ?? []).map((group) => ({
      battleId: group.battleId ?? null,
      done: true,
      seats: [...(group.standings ?? [])]
        .sort((a, b) => a.rank - b.rank)
        .map((row) => ({
          uid: row.uid,
          nickname: memberName(doc, row.uid),
          rank: row.rank,
          score: row.score,
          points: earned[row.uid] ?? null,
          mine: row.uid === uid,
        })),
    }));
    rounds.push({
      round: past.round ?? rounds.length + 1,
      rounds: doc?.rounds ?? 0,
      groups,
      players: groups.reduce((sum, group) => sum + group.seats.length, 0),
      current: false,
      last: (past.round ?? 0) >= (doc?.rounds ?? 0),
    });
  }

  const running = doc?.status === 'running' && (doc.round ?? 0) > 0;
  if (running && !rounds.some((item) => item.round === doc.round)) {
    const groups: LadderGroup[] = (doc.groups ?? []).map((group) => {
      const battle = group.battleId ? live?.[group.battleId] : null;
      const rows = battle ? rankArena({ battle, uid }) : [];
      const byUid = new Map(rows.map((row) => [row.uid, row] as const));
      // Tartib jonli jadvaldan, u yo'q bo'lsa serverdagi ro'yxat
      // tartibidan — ya'ni qator sakrab turmaydi.
      const seats = (group.uids ?? []).map((seat) => {
        const row = byUid.get(seat);
        return {
          uid: seat,
          nickname: row?.nickname ?? memberName(doc, seat),
          rank: row?.rank ?? null,
          score: row?.score ?? null,
          points: null,
          mine: seat === uid,
        };
      });
      seats.sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));
      return { battleId: group.battleId ?? null, seats, done: group.done === true };
    });

    rounds.push({
      round: doc.round ?? rounds.length + 1,
      rounds: doc.rounds ?? 0,
      groups,
      players: groups.reduce((sum, group) => sum + group.seats.length, 0),
      current: true,
      last: doc.final === true,
    });
  }

  return rounds;
}

/** Jang turnir guruhimi — shunday bo'lsa qaysi turnirniki.
 *
 *  Natija ekrani shu bilan «Maydonga qaytish» o'rniga «Turnirga
 *  qaytish» ko'rsatadi: odam o'z turniriga qaytishi kerak, umumiy
 *  maydon bo'limiga emas. */
export const seriesOf = (battle: BattleDoc | null | undefined): string | null =>
  (battle as MarduDoc | null | undefined)?.seriesId ?? null;
