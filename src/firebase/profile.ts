/** `users/{uid}` hujjati — ilovadagi `saveProfile` bilan bir xil shakl.
 *  Admin paneldagi foydalanuvchilar ro'yxati shu hujjatlardan tuziladi,
 *  shuning uchun maydon nomlari o'zgarmasligi kerak. */
import { client } from './client';
import { PATHS } from './paths';

export async function saveProfile({
  uid,
  email,
  nickname,
}: {
  uid: string;
  email?: string | null;
  nickname?: string | null;
}): Promise<void> {
  const { db } = await client();
  const { doc, setDoc, serverTimestamp } = await import('firebase/firestore/lite');

  await setDoc(
    doc(db, PATHS.users, uid),
    {
      ...(email ? { email } : {}),
      ...(nickname ? { nickname } : {}),
      // Sayt orqali kelgan hisobni ajratib turish uchun.
      platform: 'web',
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
