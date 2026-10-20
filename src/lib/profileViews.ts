/** Profil ochilgani qayd etiladi — `profile_views/{ownerUid}/viewers/{uid}`.
 *
 *  Yozuv **ko'rgan odam** nomida bo'ladi (hujjat nomi — uning hisobi):
 *  shunda bir odamning o'n marta ochishi bitta hujjatda qoladi va
 *  «nechta odam ko'rdi» degan son to'g'ri sanaladi. Ro'yxatni faqat
 *  profil egasi o'qiydi, ilova esa undan ism chiqarmaydi — ko'rish izsiz
 *  qolishi kerak.
 *
 *  Push xabarni sayt yubormaydi: hujjat yaratilganda Cloud Function
 *  (`onProfileView`) ishga tushadi va egasiga xabar boradi — birinchi
 *  ko'rishda va soatiga bir martadan ko'p emas. Ya'ni saytga faqat shu
 *  yozuvni qo'shish kerak bo'ldi, boshqa hech narsa emas.
 *
 *  Vaqtni server qo'yadi (qoidalar `at == request.time` ni tekshiradi),
 *  `count` esa bittaga oshadi — bir bosishda yuzta ko'rish yozib
 *  bo'lmaydi. Mehmon yoza olmaydi: qoidalar yozuvchidan hisob talab
 *  qiladi. */
import { api } from '../api/client';

/** Shu tashrifda qaysi profillar qayd etilgan.
 *
 *  Odam ro'yxat bilan profil orasida bir necha marta yurishi mumkin —
 *  har qaytishda yozuv yuborilsa hisob ham, serverdagi yuk ham
 *  bekorga o'sardi. Ilovadagi qoida ham shu: bitta seansda bir profil
 *  bir marta sanaladi. */
const recorded = new Set<string>();

export async function recordProfileView({
  ownerUid,
  viewerUid,
}: {
  ownerUid: string;
  viewerUid: string;
}): Promise<void> {
  const owner = ownerUid.trim();
  const viewer = viewerUid.trim();
  // O'z profilini ochish sanalmaydi.
  if (!owner || !viewer || owner === viewer) return;
  if (recorded.has(owner)) return;
  recorded.add(owner);

  try {
    // Kim ko'rganini server token'dan biladi — `viewer` faqat shu
    // yerdagi tekshiruv uchun.
    await api.post(`/v1/web/profiles/${encodeURIComponent(owner)}/view`);
  } catch {
    // Qayd yozilmasa ham profil ochilaveradi — keyingi tashrifda qayta
    // urinib ko'riladi.
    recorded.delete(owner);
  }
}
