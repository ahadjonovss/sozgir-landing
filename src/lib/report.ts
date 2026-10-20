/** So'z haqidagi murojaat — ilovadagi `WordReport` bilan bir xil hujjat.
 *
 *  Murojaat moderatsiya navbatiga tushadi: moderator so'zni lug'atdan
 *  chiqarishi mumkin. Marshrut hisob talab qiladi, shuning uchun
 *  mehmonga avval kirish taklif qilinadi.
 *
 *  Sabab kalitlari ilovadagi `WordReportReason.name` bilan bir xil —
 *  admin panel ikkalasini bir ro'yxatda ko'radi.
 *
 *  Serverga faqat so'z, sabab va izoh ketadi: kim yuborganini u
 *  token'dan biladi, qolgan maydonlar (uzunlik, qayerda uchragani)
 *  esa jadvalda yo'q. */
import { api } from '../api/client';

export type ReportReason = 'notAWord' | 'misspelled' | 'wrongMeaning' | 'offensive' | 'other';

export const REASONS: { key: ReportReason; label: string }[] = [
  { key: 'notAWord', label: 'Bunday so‘z yo‘q' },
  { key: 'misspelled', label: 'Xato yozilgan' },
  { key: 'wrongMeaning', label: 'Ta’rifi to‘g‘ri emas' },
  { key: 'offensive', label: 'Nomaqbul so‘z' },
  { key: 'other', label: 'Boshqa sabab' },
];

export const COMMENT_MAX = 240;

export async function submitWordReport(input: {
  word: string;
  length: number;
  reason: ReportReason;
  comment: string;
  /** `daily`, `endless` yoki `battle` — qayerda uchragani.
   *
   *  Serverdagi jadvalda bunday maydon yo'q, shuning uchun izohga
   *  qo'shiladi: moderator uchun «qayerda uchradi» degan ma'lumot
   *  butunlay yo'qolib ketgandan ko'ra shu yaxshi. */
  mode: string;
}): Promise<void> {
  const comment = input.comment.trim().slice(0, COMMENT_MAX);
  await api.post('/v1/web/words/report', {
    body: {
      word: input.word,
      reason: input.reason,
      comment: [comment, `(${input.mode}, ${input.length} harf)`]
        .filter(Boolean)
        .join(' ')
        .slice(0, COMMENT_MAX),
    },
  });
}

/* ── O'yinchi ustidan shikoyat ──────────────────────────────────────── */

/** Shikoyat sabablari — ilovadagi `ReportReason` enum'ining aynan o'zi
 *  (`soztop/lib/features/moderation/domain/entities/report_reason.dart`).
 *  Kalitlar bir xil: moderator ikkala manbadan kelgan shikoyatni bitta
 *  ro'yxatda ko'radi. */
export type PlayerReason = 'nickname' | 'avatar' | 'cheating' | 'offensive' | 'other';

export const PLAYER_REASONS: { key: PlayerReason; label: string }[] = [
  { key: 'nickname', label: 'Nomaqbul taxallus' },
  { key: 'avatar', label: 'Nomaqbul rasm' },
  { key: 'cheating', label: 'Aldov' },
  { key: 'offensive', label: 'Haqorat' },
  { key: 'other', label: 'Boshqa sabab' },
];

/** Shikoyat yoziladi, chora ko'rilmaydi: qarorni moderator qabul qiladi
 *  (serverdagi izohning o'zi). Shuning uchun sahifa ham «yuborildi»
 *  deydi, «bloklandi» demaydi. */
export async function submitPlayerReport(input: {
  uid: string;
  reason: PlayerReason;
  note: string;
  /** Qaysi jangdan — izohga qo'shiladi: jadvalda bunday maydon yo'q,
   *  lekin moderatorga «qayerda bo'ldi» degan ma'lumot kerak. */
  battleId?: string;
}): Promise<void> {
  const note = input.note.trim().slice(0, COMMENT_MAX);
  await api.post('/v1/web/reports/player', {
    body: {
      uid: input.uid,
      reason: input.reason,
      note: [note, input.battleId ? `(jang: ${input.battleId})` : '']
        .filter(Boolean)
        .join(' ')
        .slice(0, COMMENT_MAX),
    },
  });
}

/* ── Shikoyat qayerda chizilsa ham ─────────────────────────────────── */

/** Nima ustidan shikoyat qilinayapti. */
export type ReportKind = 'word' | 'player';

/** Sarlavha va izoh shu yerda: ular sahifada ham (`ReportPage`),
 *  jangdagi oynada ham (`ReportDialog`) bir xil gapni aytishi kerak. */
export const reportTitle = (kind: ReportKind): string =>
  kind === 'player' ? 'O‘yinchi ustidan shikoyat' : 'So‘z haqida xabar berish';

export const reportLead = (kind: ReportKind): string =>
  kind === 'player'
    ? 'Shikoyatni moderator o‘qib chiqadi. Chora darhol ko‘rilmaydi: qarorni odam qabul qiladi.'
    : 'Sababni tanlang — moderator o‘qib chiqadi va so‘zni lug‘atdan chiqarishi mumkin.';
