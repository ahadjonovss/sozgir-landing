/** Tasdiqlangan hisoblar — mashhur odamlar.
 *
 *  Taxallusni har kim o'ziga qo'yishi mumkin, shuning uchun ro'yxat
 *  **uid bo'yicha**: «Serobov» deb yozib olgan boshqa odam belgini
 *  olmaydi. Uid o'zgarmaydi — hisob nomi almashsa ham belgi o'z
 *  egasida qoladi.
 *
 *  Ro'yxat qo'lda: bu marketing qarori, avtomatik shart emas. Yangi
 *  odam qo'shilsa shu yerga bitta qator yoziladi. Serverdan o'qilmaydi
 *  — jadvalning har qatori uchun qo'shimcha so'rov qilishning ma'nosi
 *  yo'q va ro'yxat kichik. */

export interface VerifiedPerson {
  /** Profilda belgi bosilganda chiqadigan nom. */
  name: string;
  /** Bir jumlalik izoh: odam kimligi. Bo'sh bo'lsa umumiy matn chiqadi. */
  note?: string;
}

const PEOPLE: Record<string, VerifiedPerson> = {
  // SHAKA
  kaSkYxgd4JgBSoVgjNvYCoF8q9p1: { name: 'SHAKA' },
  // Serobov
  iWmZwBmMehUPLTFIPvfNFC9n3r33: { name: 'Serobov' },
  // Samandar — So'zgir moderatori
  qQ7QXBdFh0QYNS50DgoPJEBacFB3: { name: 'Samandar' },
};

/** Hisob tasdiqlangan bo'lsa — kim ekani, bo'lmasa `null`. */
export const verifiedOf = (uid: string | null | undefined): VerifiedPerson | null =>
  uid ? (PEOPLE[uid] ?? null) : null;

export const isVerified = (uid: string | null | undefined) => verifiedOf(uid) !== null;

/** Belgi bosilganda chiqadigan matn. */
export function verifiedNote(person: VerifiedPerson): string {
  return person.note
    ? `Tasdiqlangan hisob: ${person.note}`
    : `Tasdiqlangan hisob — bu haqiqatan ham ${person.name}. So‘zgir jamoasi hisob egasini tekshirgan.`;
}
