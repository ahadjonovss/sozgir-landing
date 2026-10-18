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
  await api.post('/v1/words/report', {
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
