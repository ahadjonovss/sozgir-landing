/** Mardu maydon — ko'p kishilik jangning veb ko'rinishi.
 *
 *  Yangi o'yin emas, **yangi shakl**: ichida o'ynaladigani baribir
 *  So'zjang yoki G'uncha, qoidalari, lug'ati va ball hisobi o'sha. Farqi
 *  bitta — raqib bittadan ko'p (`docs/mardu_maydon.md` ilovada).
 *
 *  Yangi to'plam ochilmaydi: maydon ham `battles/{id}` hujjatida yashaydi,
 *  `type: 'mardu'` bilan. Shu sababli jang ekranlari, tarix va muddati
 *  o'tganini tozalash o'zgarmaydi — ular bitta o'yinchi yozuvini biladi,
 *  nechtaligi ularning ishi emas.
 *
 *  Yozishning hammasi Cloud Functions orqali (`battle.ts` dagidek): xona
 *  ochish, qo'shilish va boshlash — hammasi tranzaksiyada, chunki bir
 *  vaqtda kirgan ikki odam bitta xonaga tushishi kerak. */
import { callFunction } from '../firebase/functions';
import { watchDoc, type Unsubscribe } from '../firebase/live';
import type { BattleGame, BattleDoc, BattlePlayer } from './battle';

/** Bir maydonga sig'adigan eng ko'p o'yinchi (serverdagi `MARDU_CAPACITY`).
 *
 *  Hamma bitta hujjatga yozadi, hujjat esa barqaror ~1 yozuv/soniya
 *  ko'taradi — sakkizda boshlanish cho'qqisi shu chegarada qoladi. */
export const MARDU_CAPACITY = 8;

/** Maydon shuncha odamdan kam bo'lsa boshlanmaydi. */
export const MARDU_MIN_PLAYERS = 2;

/** Ikkinchi odam kirganda boshlanadigan sanoq (soniya). */
export const MARDU_COUNTDOWN_SECONDS = 60;

/** Do'stlar maydoni boshlanmasa shuncha vaqtdan keyin o'zi yopiladi. */
export const MARDU_LOBBY_MINUTES = 30;

/** Maydon qanday yig'ilgan: tezkor — notanishlar bilan, do'stlar — kod
 *  va havola bilan. Sanoq faqat birinchisida bo'ladi. */
export type MarduMode = 'quick' | 'friends';

/** Maydon hujjati — `BattleDoc` ning maydonga tegishli qismi bilan. */
export interface MarduDoc extends BattleDoc {
  mode?: MarduMode;
  /** Do'stlar maydonini kim boshlaydi. Yaratuvchi chiqib ketsa egalik
   *  eng erta qo'shilganga o'tadi — maydon o'lik qolmaydi. */
  host?: string;
  capacity?: number;
  /** Tezkor maydonda sanoq shu paytda tugaydi (serverning soati). */
  startsAt?: { seconds?: number } | null;
  /** Yakuniy jadval — server bir marta hisoblaydi va saqlaydi.
   *
   *  Mijoz uni har ochilganda qayta tartiblasa, saytning va ilovaning
   *  ikki versiyasi ikki xil jadval ko'rsatishi mumkin edi. */
  standings?: ArenaStanding[];
}

/** Jadvaldagi bitta qator. */
export interface ArenaStanding {
  uid: string;
  rank: number;
  score: number;
}

export const isMardu = (battle: BattleDoc | null | undefined) =>
  (battle as MarduDoc | null | undefined)?.type === 'mardu';

/** Hujjatdagi o'yinchilar — qo'shilgan tartibida emas, kalit tartibida.
 *  Ro'yxatni ko'rsatishdan oldin `rankArena` bilan tartiblanadi. */
export const playersOf = (battle: MarduDoc | null | undefined) =>
  Object.entries(battle?.players ?? {}) as [string, BattlePlayer][];

// ── Jadval ──────────────────────────────────────────────────────────────

/** Tartiblash kaliti — **katta yaxshi**, birinchi son asosiy.
 *
 *  Serverdagi `soztopKey`/`gunchaKey` ning aynan o'zi: jang ketayotganda
 *  jadval mijozda tuziladi (server uni faqat yakunda yozadi), ya'ni ikki
 *  joyda bir xil bo'lishi shart. */
export function arenaKey(game: BattleGame, player: BattlePlayer): number[] {
  if (game === 'guncha') return [player.score ?? 0];
  // Topmaganlarniki bitta son: ular o'zaro teng va oxirgi o'rinni
  // bo'lishadi. Urinish bo'yicha ajratilsa, so'zni topa olmagan ikki odam
  // orasida «kim ko'proq urindi» degan ma'nosiz tartib chiqardi.
  if (player.won !== true) return [0];
  return [1, -(player.attempts ?? 0), -(player.durationMs ?? 0)];
}

/** Ikki kalitni solishtiradi: manfiy — `a` yuqori (`sort` uchun). */
function compareKeys(a: number[], b: number[]): number {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const left = a[i] ?? 0;
    const right = b[i] ?? 0;
    if (left !== right) return right - left;
  }
  return 0;
}

/** Maydondagi bitta qator — jadvalda ham, jang tepasidagi kartochkada ham. */
export interface ArenaRow {
  uid: string;
  nickname: string;
  player: BattlePlayer;
  /** O'rin: teng natija — teng o'rin, keyingisi o'tkazib yuboriladi
   *  (1, 2, 2, 4). Sport jadvalidagi odatiy qoida. */
  rank: number;
  /** Jadvalda ko'rinadigan natija: g'unchada ball, So'zjangda urinishlar. */
  score: number;
  mine: boolean;
}

/** Natijalardan jadval — serverdagi `rankArena` ning ko'chirmasi. */
export function rankArena({
  battle,
  uid,
}: {
  battle: MarduDoc | null | undefined;
  uid: string;
}): ArenaRow[] {
  const game = battle?.game === 'guncha' ? 'guncha' : 'soztop';
  const entries = playersOf(battle).map(([playerUid, player]) => ({
    uid: playerUid,
    player,
    key: arenaKey(game, player),
    score: game === 'guncha' ? (player.score ?? 0) : (player.attempts ?? 0),
  }));

  // Server yakunda o'z jadvalini yozadi — u bor bo'lsa o'sha ishlatiladi:
  // qoidalar keyin o'zgarsa ham eski maydon o'z natijasi bilan qoladi.
  const final = new Map(
    (battle?.standings ?? []).map((row) => [row.uid, row] as const),
  );

  const sorted = [...entries].sort((a, b) =>
    final.size > 0
      ? (final.get(a.uid)?.rank ?? 99) - (final.get(b.uid)?.rank ?? 99)
      : compareKeys(a.key, b.key),
  );

  const rows: ArenaRow[] = [];
  let rank = 1;
  sorted.forEach((entry, index) => {
    if (index > 0 && compareKeys(sorted[index - 1]!.key, entry.key) !== 0) {
      rank = index + 1;
    }
    rows.push({
      uid: entry.uid,
      nickname: entry.player.nickname ?? 'Mehmon',
      player: entry.player,
      rank: final.get(entry.uid)?.rank ?? rank,
      score: final.get(entry.uid)?.score ?? entry.score,
      mine: entry.uid === uid,
    });
  });
  return rows;
}

/** Jang tepasidagi **uchta** kartochka: o'zim, yetakchi va undan keyingisi.
 *
 *  Nega uchta: sakkiz kishilik qator ekranni kesib o'tardi va «kim
 *  oldinda» degan savolga javob olish uchun surish kerak bo'lardi — o'yin
 *  ketayotganda esa hech kim surmaydi. Uchtasi shu savolga to'liq javob
 *  beradi: o'z o'rnim va quvib yetishim kerak bo'lgan ikkitasi.
 *
 *  O'zim yetakchi bo'lsam yonimdagilar ikkinchi va uchinchi bo'ladi, ya'ni
 *  bitta odam qatorda ikki marta chiqmaydi. */
export function arenaTiles(rows: ArenaRow[]): ArenaRow[] {
  if (rows.length <= 3) return rows;
  const mineAt = rows.findIndex((row) => row.mine);
  if (mineAt < 0) return rows.slice(0, 3);
  // Yetakchi bo'lsam — men va keyingi ikkitasi; aks holda men va yuqoridagi
  // ikkitasi (yetakchi doim ko'rinadi).
  if (mineAt === 0) return rows.slice(0, 3);
  if (mineAt === 1) return rows.slice(0, 3);
  return [rows[0]!, rows[mineAt - 1]!, rows[mineAt]!];
}

// ── Server chaqiruvlari ─────────────────────────────────────────────────

export interface MarduReply {
  battleId: string;
  /** Tezkor maydonda sanoq shu paytda tugaydi (ms). Yo'q bo'lsa sanoq
   *  hali boshlanmagan — maydonda yolg'iz odam turibdi. */
  startsAt?: number | null;
  endsAt?: number | null;
  /** Serverning soati: sanoq **farq** bo'yicha yuritiladi, ya'ni qurilma
   *  soati noto'g'ri bo'lsa ham qolgan vaqt to'g'ri ko'rinadi. */
  serverNow?: number;
}

/** Do'stlar maydoni — kod va havola bilan yig'iladi, sanoq yo'q. */
export const createMardu = (input: {
  game: BattleGame;
  nickname: string;
  length?: number;
}) =>
  // `mode` yuborilmaydi: server uni o'zi qo'yadi — kod bilan ochilgan
  // xona har doim do'stlar maydoni.
  callFunction<{ battleId: string; code: string }>('marduCreate', input);

/** Kod bilan qo'shilish. Takroriy chaqiruv xato bermaydi: xonadan chiqib
 *  qaytgan odam o'sha maydonga tushadi. */
export const joinMardu = (input: { code: string; nickname: string }) =>
  callFunction<MarduReply>('marduJoin', input);

/** Tezkor maydon — ochiq xonani ko'rsatkichdan topadi yoki yangisini
 *  ochadi. Navbat hujjati kerak emas: maydonning o'zi navbat vazifasini
 *  bajaradi. */
export const quickMardu = (input: { game: BattleGame; nickname: string }) =>
  callFunction<MarduReply>('marduQuick', input);

/** Maydonni boshlash. Do'stlar maydonida yaratuvchi bosadi; tezkorda esa
 *  sanog'i nolga yetgan mijoz ham chaqiradi — Cloud Tasks ishlamay qolsa
 *  ham maydon boshlanishi kerak. Idempotent. */
export const startMardu = (battleId: string) =>
  callFunction<{ endsAt?: number; serverNow?: number }>('marduStart', {
    battleId,
  });

/** Xonadan chiqish — boshlangunicha izsiz. */
export const leaveMardu = (battleId: string) =>
  callFunction<{ left: boolean; closed?: boolean }>('marduLeave', { battleId });

export const watchMardu = (
  battleId: string,
  onData: (battle: MarduDoc | null) => void,
): Promise<Unsubscribe> => watchDoc<MarduDoc>(`battles/${battleId}`, onData);

/** Maydonga havola — ilova ulashadigan manzilning o'zi
 *  (`lib/core/deeplink/deep_link.dart`). Telefonda u ilovani ochadi,
 *  ilovasi yo'qda esa saytdagi maydon sahifasini. */
export const marduLink = (code: string) =>
  `https://sozgir.uz/maydon/${code.toUpperCase()}`;
