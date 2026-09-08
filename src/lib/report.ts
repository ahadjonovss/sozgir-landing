/** So'z haqidagi murojaat — ilovadagi `WordReport` bilan bir xil hujjat.
 *
 *  `word_reports/{id}` ga yoziladi va admin panelida moderatsiyaga tushadi:
 *  moderator so'zni lug'atdan chiqarishi mumkin. Qoidalar bo'yicha yozish
 *  faqat kirgan foydalanuvchiga ruxsat etilgan (`uid` o'zining bo'lishi
 *  shart), shuning uchun mehmonga avval kirish taklif qilinadi.
 *
 *  Sabab kalitlari ilovadagi `WordReportReason.name` bilan bir xil —
 *  admin panel ikkalasini bir ro'yxatda ko'radi. */
import { client } from '../firebase/client';
import { PATHS } from '../firebase/paths';

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
  /** `daily`, `endless` yoki `battle` — qayerda uchragani. */
  mode: string;
  uid: string;
  nickname: string;
}): Promise<void> {
  const { db } = await client();
  const { addDoc, collection, serverTimestamp } = await import('firebase/firestore/lite');
  const comment = input.comment.trim().slice(0, COMMENT_MAX);
  await addDoc(collection(db, PATHS.wordReports), {
    word: input.word,
    length: input.length,
    reason: input.reason,
    comment: comment || null,
    mode: input.mode,
    uid: input.uid,
    nickname: input.nickname,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
}
