/** Onlayn maydondagi janglar tarixi — ilovadagi `ArenaHistoryDataSource`
 *  ning veb ko'chirmasi.
 *
 *  So'rov ikkala o'yin uchun bitta: `battles` to'plami umumiy, ro'yxat ham
 *  ataylab ikkalasini birga ko'rsatadi — «kim bilan o'ynadim» degan savol
 *  o'yinga qarab bo'linmaydi.
 *
 *  Saralash `players.{uid}.joinedAt` bo'yicha: hujjatda ishtirokchilar
 *  xarita bo'lib yotadi, ya'ni «mening janglarim» aynan shu yo'l bilan
 *  topiladi va alohida indeks kerak emas. */
import { client } from '../firebase/client';
import { gameOf, type BattleGame } from './battle';

/** Jang natijasi — ikkala o'yin uchun ham bir xil uchta holat. */
export type ArenaOutcome = 'win' | 'loss' | 'draw' | 'open';

export interface ArenaBattle {
  id: string;
  game: BattleGame;
  opponent: string;
  opponentUid: string | null;
  outcome: ArenaOutcome;
  /** O'yinga xos qisqa izoh: g'unchada hisob («41 : 17»), So'ztopda
   *  yashirin so'z — jang tugagach u eng yaxshi eslatma bo'ladi. */
  detail: string;
  /** Reyting shu jangda qancha o'zgargani. Hisoblanmagan bo'lsa `null`. */
  ratingDelta: number | null;
}

const int = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : null;

/** Hujjatdan tarix qatori. */
export function arenaBattleFrom(
  id: string,
  data: Record<string, unknown>,
  uid: string,
): ArenaBattle {
  // Maydoni yo'q eski janglar So'ztopniki.
  const game = gameOf(data.game);
  const players = (data.players ?? {}) as Record<string, Record<string, unknown>>;
  const me = players[uid] ?? {};
  const rivalUid = Object.keys(players).find((key) => key !== uid) ?? null;
  const rival = (rivalUid ? players[rivalUid] : {}) ?? {};

  const finished = data.status === 'finished';
  const winner = data.winnerUid;
  const outcome: ArenaOutcome = !finished
    ? 'open'
    : !winner
      ? 'draw'
      : winner === uid
        ? 'win'
        : 'loss';

  const before = int(me.ratingBefore);
  const after = int(me.ratingAfter);

  return {
    id,
    game,
    opponent: typeof rival.nickname === 'string' ? rival.nickname : '',
    opponentUid: rivalUid,
    outcome,
    detail:
      game === 'guncha'
        ? `${int(me.score) ?? 0} : ${int(rival.score) ?? 0}`
        : typeof data.answer === 'string'
          ? data.answer
          : '',
    ratingDelta: before === null || after === null ? null : after - before,
  };
}

/** Mening janglarim — yangisidan boshlab.
 *
 *  Xato yutiladi: tarix ro'yxati ikkinchi darajali, u ochilmagani uchun
 *  sahifa buzilmasligi kerak. */
export async function myBattles({
  uid,
  limit: max = 20,
}: {
  uid: string;
  limit?: number;
}): Promise<ArenaBattle[]> {
  try {
    const { db } = await client();
    const { collection, getDocs, limit, orderBy, query } =
      await import('firebase/firestore/lite');

    const snapshot = await getDocs(
      query(
        collection(db, 'battles'),
        orderBy(`players.${uid}.joinedAt`, 'desc'),
        limit(max),
      ),
    );
    return snapshot.docs.map((item) =>
      arenaBattleFrom(item.id, item.data() as Record<string, unknown>, uid),
    );
  } catch {
    return [];
  }
}
