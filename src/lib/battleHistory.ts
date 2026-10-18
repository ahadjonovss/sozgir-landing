/** Onlayn maydondagi janglar tarixi — ilovadagi `ArenaHistoryDataSource`
 *  ning veb ko'chirmasi.
 *
 *  So'rov ikkala o'yin uchun bitta: `battles` jadvali umumiy, ro'yxat ham
 *  ataylab ikkalasini birga ko'rsatadi — «kim bilan o'ynadim» degan savol
 *  o'yinga qarab bo'linmaydi.
 *
 *  Raqibni **server** topadi (`LATERAL`): maydon jangida u birinchi
 *  qo'shilgan boshqa qatnashchi bo'ladi.
 *
 *  Ikki narsa javobda yo'q va shu sabab ro'yxatda ko'rinmaydi:
 *  jangdagi o'lja o'zgarishi (reyting yozuvi tarixda saqlanmaydi) va
 *  So'zjangdagi yashirin so'z. G'unchaning hisobi ham faqat o'z balli
 *  bilan chiqadi — raqibniki javobda yo'q. */
import { api } from '../api/client';
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
  /** Jangda olingan (yoki berilgan) o'lja. Hisoblanmagan bo'lsa `null`.
   *
   *  Hujjatda xom reyting turadi, ekranga esa ikki o'ljaning **ayirmasi**
   *  chiqadi — o'zgarishning yarmi emas (`docs/aqcha.md`). */
  battleAqchaDelta: number | null;
}

const int = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : null;

/** Serverdagi qatordan tarix qatori. */
export function arenaBattleFrom(
  data: Record<string, unknown>,
  uid: string,
): ArenaBattle {
  // Maydoni yo'q eski janglar So'ztopniki.
  const game = gameOf(data.game);
  const rivalUid =
    typeof data.opponent_uid === 'string' ? data.opponent_uid : null;

  const finished = data.status === 'finished';
  const winner = data.winner_uid;
  const outcome: ArenaOutcome = !finished
    ? 'open'
    : !winner
      ? 'draw'
      : winner === uid
        ? 'win'
        : 'loss';

  return {
    id: String(data.id ?? ''),
    game,
    opponent:
      typeof data.opponent_nickname === 'string' ? data.opponent_nickname : '',
    opponentUid: rivalUid,
    outcome,
    // G'unchada o'z balli: raqibniki javobda yo'q.
    detail: game === 'guncha' ? String(int(data.my_score) ?? 0) : '',
    battleAqchaDelta: null,
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
    const { items } = await api.get<{ items?: unknown }>('/v1/me/battles', {
      query: { limit: max },
    });
    return (Array.isArray(items) ? items : []).map((row) =>
      arenaBattleFrom(row as Record<string, unknown>, uid),
    );
  } catch {
    return [];
  }
}
