/** Hisob profili — taxallus, email va demografik ma'lumot.
 *
 *  Ilgari bu `users/{uid}` hujjati edi va har kirishda qayta
 *  yozilardi. Endi `/v1/web/sign-in`: yozuvni **server** qiladi va faqat
 *  o'zgarish bo'lganda — har kirishda yozish minglab ortiqcha amal
 *  degani edi.
 *
 *  Tug'ilgan sana va jins sozlama emas: ular hisobga tegishli va
 *  serverda turadi, ya'ni odam boshqa qurilmadan kirsa qayta
 *  so'ralmaydi. Ilovaning birinchi versiyalarida bu maydonlar yo'q
 *  edi, shuning uchun ikkalasi ham bo'sh bo'lishi mumkin. */
import { api } from '../api/client';

export interface ProfileDetails {
  /** `YYYY-MM-DD`. Ataylab satr: sana har qanday vaqt zonasida bir xil
   *  o'qiladi va admin panelda ham shundayligicha ko'rinadi. */
  birthDate?: string | null;
  gender?: 'male' | 'female' | null;
}

/** Sana tanlagichining chegaralari — ilovadagi `minAge`/`maxAge`. */
export const MIN_AGE = 6;
export const MAX_AGE = 100;

/** Profilni serverga bildiradi.
 *
 *  `uid` yuborilmaydi — server uni token'dan oladi. Bo'sh qiymat ham
 *  yuborilmaydi: har kirishda chaqiriladigan funksiya, ma'lumotsiz
 *  chaqirilganda allaqachon to'ldirilgan sana va jinsni o'chirib
 *  yuborardi. */
export async function saveProfile({
  email,
  nickname,
  details,
}: {
  uid?: string;
  email?: string | null;
  nickname?: string | null;
  details?: ProfileDetails;
}): Promise<void> {
  await api.post('/v1/web/sign-in', {
    body: {
      ...(email ? { email } : {}),
      ...(nickname ? { nickname } : {}),
      ...(details?.birthDate ? { birthDate: details.birthDate } : {}),
      ...(details?.gender ? { gender: details.gender } : {}),
      // Sayt orqali kelgan hisobni ajratib turish uchun.
      platform: 'web',
    },
  });
}

/** Hisobning ko'rinadigan qismi — taxallus va pochta.
 *
 *  Token'da ular yo'q (u faqat `uid` va muddatni saqlaydi), ya'ni
 *  kirgandan keyin alohida so'raladi. Ilgari ismni Firebase'ning
 *  `displayName` i olib yurardi va kirish bilan birga kelardi.
 *
 *  Yiqilsa bo'sh qaytadi: hisob baribir ochilgan va ism keyingi
 *  yangilashda to'ladi. */
export async function loadProfile(): Promise<{
  nickname: string | null;
  email: string | null;
}> {
  try {
    const data = await api.get<{ nickname?: unknown; email?: unknown }>(
      '/v1/web/me/profile',
    );
    return {
      nickname: typeof data.nickname === 'string' ? data.nickname : null,
      email: typeof data.email === 'string' ? data.email : null,
    };
  } catch {
    return { nickname: null, email: null };
  }
}

/** Profildagi tug'ilgan sana va jins.
 *
 *  Yangi qurilmada kerak: ma'lumot serverda turadi, ya'ni bir marta
 *  to'ldirgan odamdan qayta so'ralmaydi. */
export async function loadDetails(): Promise<ProfileDetails> {
  try {
    const data = await api.get<{ birth_date?: unknown; gender?: unknown }>(
      '/v1/web/me/profile',
    );
    const birthDate = data.birth_date;
    const gender = data.gender;
    return {
      birthDate: typeof birthDate === 'string' ? birthDate : null,
      gender: gender === 'male' || gender === 'female' ? gender : null,
    };
  } catch {
    // O'qilmasa — profil oynasi bo'sh maydonlar bilan ochiladi.
    return {};
  }
}
