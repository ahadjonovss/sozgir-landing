/** Qo'lda taklif qilingan yangi so'z — ilovadagi `WordProposal` ning veb
 *  ko'chirmasi (`soztop/docs/word_proposals.md`).
 *
 *  O'yin paytida yig'iladigan takliflardan (`word_suggestions`) farqi
 *  shunda: uni odam **ataylab** yozadi va ta'rifini ham beradi. Shuning
 *  uchun alohida to'plamda yotadi (`word_proposals`) va admin panelida
 *  alohida navbat bo'lib ko'rinadi — bittasi lug'atning o'sish manbasi,
 *  bunisi esa tayyor nomzod.
 *
 *  Lug'atga qo'shilgan har bir so'z uchun muallifga **3 aqcha**. Yuborish
 *  o'zi hech narsa bermaydi: mukofot moderator so'zni lug'atga
 *  qo'shgandagina paydo bo'ladi — ya'ni uni «ishlab olish» yo'li qilib
 *  bo'lmaydi, oraliqda odam turadi. Ballni ilova hisoblaydi
 *  (`WordProposalScoreSource`), sayt esa faqat taklifni yuboradi. */
import { client } from '../firebase/client';
import { PATHS } from '../firebase/paths';
import { loadDictionary } from './dictionary';
import { isPlayable, lengthOf, normalize } from './uz';

/** Lug'atdagi eng qisqa va eng uzun so'z — o'yin aynan shu oraliqda
 *  ishlaydi, boshqasi hech qachon ishlatilmaydi. */
export const WORD_MIN = 4;
export const WORD_MAX = 7;

/** Ta'rif uzunligi.
 *
 *  Bo'sh ta'rif moderatorga hech nima bermaydi: «bu so'z bor» degan
 *  gapni tekshirib bo'lmaydi. Yuqori chegara esa hujjatni matn omboriga
 *  aylantirmaslik uchun. */
export const DESCRIPTION_MIN = 5;
export const DESCRIPTION_MAX = 240;

/** Yuborishdan oldingi tekshiruv; `null` — hammasi joyida.
 *
 *  Tekshiruv mijozda turadi: odam yuborib bo'lgach «bo'lmadi» deb
 *  eshitsa, sababini bilmay qoladi. Xuddi shu chegaralar Firestore
 *  qoidalarida ham takrorlanadi — u yerdagisi himoya, bu yerdagisi
 *  tushuntirish. */
export function proposalError(word: string, description: string): string | null {
  const clean = normalize(word);
  // Bo'sh maydonga «faqat harflar» deb yozish g'alati bo'lardi — odam
  // hali hech narsa yozmagan, unga uzunlik aytiladi.
  if (!clean) return `So‘z ${WORD_MIN} harfdan ${WORD_MAX} harfgacha bo‘lsin`;
  if (!isPlayable(clean)) return 'Faqat o‘zbek alifbosidagi harflar';

  const units = lengthOf(clean);
  if (units < WORD_MIN) return `So‘z kamida ${WORD_MIN} harf bo‘lsin`;
  if (units > WORD_MAX) return `So‘z ${WORD_MAX} harfdan oshmasin`;

  if (description.trim().length < DESCRIPTION_MIN) {
    return 'Ta’rif kamida 5 belgidan iborat bo‘lsin';
  }
  return null;
}

/** So'z lug'atda bormi.
 *
 *  Bor so'z moderatorga umuman ketmaydi: qarori oldindan ma'lum, navbatni
 *  esa bekorga to'ldirardi. Lug'at o'qilmasa `false` qaytadi — odamni
 *  to'sib qo'yishdan ko'ra moderatorning ko'rgani yaxshi. */
export async function alreadyKnown(word: string): Promise<boolean> {
  const clean = normalize(word);
  try {
    const dictionary = await loadDictionary(lengthOf(clean));
    return dictionary.valid.has(clean);
  } catch {
    return false;
  }
}

/** Taklifni yozadi.
 *
 *  Hujjatdagi maydonlar qoidada sanab qo'yilgan (`hasOnly`), ya'ni
 *  ro'yxatga qo'shimcha maydon qo'shib bo'lmaydi va `status` har doim
 *  `pending`: qarorni faqat moderator yozadi. */
export async function submitWordProposal(input: {
  word: string;
  description: string;
  uid: string;
  nickname: string;
}): Promise<void> {
  const word = normalize(input.word);
  const { db } = await client();
  const { addDoc, collection, serverTimestamp } = await import('firebase/firestore/lite');
  await addDoc(collection(db, PATHS.wordProposals), {
    word,
    // Harf-birlikda: `gʻisht` — olti belgi, lekin to'rt harf.
    length: lengthOf(word),
    description: input.description.trim().slice(0, DESCRIPTION_MAX),
    uid: input.uid,
    nickname: input.nickname.slice(0, 24),
    status: 'pending',
    createdAt: serverTimestamp(),
  });
}
