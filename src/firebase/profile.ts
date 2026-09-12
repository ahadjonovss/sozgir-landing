/** `users/{uid}` hujjati — ilovadagi `saveProfile` bilan bir xil shakl.
 *  Admin paneldagi foydalanuvchilar ro'yxati shu hujjatlardan tuziladi,
 *  shuning uchun maydon nomlari o'zgarmasligi kerak. */
import { client } from './client';
import { PATHS } from './paths';

/** Hisobning demografik ma'lumoti — ilovadagi `ProfileDetails`.
 *
 *  Sozlama emas: hisobga tegishli va serverda turadi, ya'ni odam boshqa
 *  qurilmadan kirsa qayta so'ralmaydi. Ilovaning birinchi versiyalarida
 *  bu maydonlar yo'q edi, shuning uchun ikkalasi ham bo'sh bo'lishi
 *  mumkin. */
export interface ProfileDetails {
  /** `YYYY-MM-DD`. Ataylab satr: sana har qanday vaqt zonasida bir xil
   *  o'qiladi va admin panelda ham shundayligicha ko'rinadi. */
  birthDate?: string | null;
  gender?: 'male' | 'female' | null;
}

/** Sana tanlagichining chegaralari — ilovadagi `minAge`/`maxAge`. */
export const MIN_AGE = 6;
export const MAX_AGE = 100;

export async function saveProfile({
  uid,
  email,
  nickname,
  details,
}: {
  uid: string;
  email?: string | null;
  nickname?: string | null;
  details?: ProfileDetails;
}): Promise<void> {
  const { db } = await client();
  const { doc, setDoc, serverTimestamp } = await import('firebase/firestore/lite');

  await setDoc(
    doc(db, PATHS.users, uid),
    {
      ...(email ? { email } : {}),
      ...(nickname ? { nickname } : {}),
      // Bo'sh qiymat yozilmaydi: har kirishda `saveProfile` chaqiriladi,
      // ma'lumotsiz chaqiruv esa allaqachon to'ldirilgan sana va jinsni
      // o'chirib yuborardi.
      ...(details?.birthDate ? { birthDate: details.birthDate } : {}),
      ...(details?.gender ? { gender: details.gender } : {}),
      // Sayt orqali kelgan hisobni ajratib turish uchun.
      platform: 'web',
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

/** Profildagi tug'ilgan sana va jins.
 *
 *  Yangi qurilmada kerak: ma'lumot serverda turadi, ya'ni bir marta
 *  to'ldirgan odamdan qayta so'ralmaydi. */
export async function loadDetails(uid: string): Promise<ProfileDetails> {
  try {
    const { db } = await client();
    const { doc, getDoc } = await import('firebase/firestore/lite');
    const data = (await getDoc(doc(db, PATHS.users, uid))).data() as
      | Record<string, unknown>
      | undefined;

    const birthDate = data?.birthDate;
    const gender = data?.gender;
    return {
      birthDate: typeof birthDate === 'string' ? birthDate : null,
      gender: gender === 'male' || gender === 'female' ? gender : null,
    };
  } catch {
    // O'qilmasa — profil oynasi bo'sh maydonlar bilan ochiladi.
    return {};
  }
}
