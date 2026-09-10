/** Qo'llab-quvvatlash — loyiha hisobi, donatlar va to'lov.
 *
 *  Ma'lumot manbasi ilova bilan bir xil: `app/support` hujjati va
 *  `donations` kolleksiyasi. Ikkalasi ham qoidalarda hammaga ochiq
 *  (`allow read: if true`), shuning uchun ular REST orqali, SDK'siz
 *  o'qiladi — sahifa ochilishida hech narsa yuklanmaydi.
 *
 *  To'lovni esa server ochadi: inPAY kalitlari `donationCreate`
 *  funksiyasida turadi, sayt faqat chaqiradi va qaytgan manzilga
 *  o'tadi. Funksiya hisobni talab qiladi (`requireUid`), donat esa
 *  webhook orqali tasdiqlanadi — mijoz hech narsa yozmaydi. */

import { callFunction } from '../firebase/functions';
import { listDocs, readDoc } from '../firebase/rest';

/** inPAY 1 000 so'mdan past to'lovni qabul qilmaydi. */
export const DONATION_MIN = 1000;
export const DONATION_MAX = 10_000_000;

/** Tayyor summalar — ko'pchilik shulardan birini tanlaydi (ilovadagidek). */
export const PRESETS = [5000, 10000, 25000, 50000] as const;

export interface Donation {
  name: string;
  amount: number;
  /** Donat qilgan hisob — ro'yxatda «Bu siz» belgisi shunga qarab qo'yiladi. */
  uid?: string;
  /** Saralash uchun: hujjatda bo'lmasa eng eskisi hisoblanadi. */
  at: number;
}

export interface SupportBalance {
  /** Yig'ilgan summa (so'mda) — uni `onDonationWrite` funksiyasi hisoblaydi. */
  earned: number;
  /** Donatlar soni. */
  count: number;
  /** Bo'lim ko'rinadimi — adminkadagi `donation.show` kaliti. */
  visible: boolean;
}

export const EMPTY_BALANCE: SupportBalance = {
  earned: 0,
  count: 0,
  visible: true,
};

/** `1200000` → «1 200 000» (ilovadagi `formatSum` ning o'zi). */
export function formatSum(value: number): string {
  const digits = Math.abs(Math.round(value)).toString();
  let out = '';
  for (let i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 === 0) out += ' ';
    out += digits[i];
  }
  return out;
}

/** Loyiha hisobi. Hujjat bo'lmasa yoki tarmoq yiqilsa — nol hisob.
 *
 *  `donation.hidden_version` ilovaning do'kondagi versiyasi uchun:
 *  tekshiruv paytida aynan o'sha versiyada donat ko'rinmaydi. Saytda
 *  versiya tushunchasi yo'q, shuning uchun bu yerda faqat umumiy
 *  kalit (`show`) ishlaydi. */
export async function loadBalance(): Promise<SupportBalance> {
  const data = await readDoc('app/support');
  if (!data) return EMPTY_BALANCE;

  const donation = (data.donation ?? {}) as Record<string, unknown>;
  return {
    earned: Number(data.earned ?? 0) || 0,
    count: Number(data.donations ?? 0) || 0,
    visible: donation.show !== false,
  };
}

/** Oxirgi donatlar.
 *
 *  Ataylab `orderBy` ishlatilmaydi: Firestore `createdAt` maydoni yo'q
 *  hujjatlarni saralashda butunlay tashlab ketadi, adminka orqali qo'lda
 *  qo'shilgan donatda esa u bo'lmasligi mumkin. Shuning uchun bir necha
 *  o'nlab yozuv olinadi va tartib shu yerda beriladi — ilovadagidek. */
export async function loadDonations(limit = 10): Promise<Donation[]> {
  const docs = await listDocs('donations', { pageSize: 50 });

  return docs
    .map((doc) => {
      const amount = Number(doc.fields.amount ?? 0);
      const created = doc.fields.createdAt;
      return {
        name: String(doc.fields.name ?? '').trim(),
        amount: Math.round(amount),
        uid: String(doc.fields.uid ?? '').trim() || undefined,
        at: typeof created === 'string' ? Date.parse(created) || 0 : 0,
      };
    })
    .filter((donation) => donation.amount > 0)
    .sort((a, b) => b.at - a.at)
    .slice(0, limit);
}

/** To'lovni ochadi va inPAY sahifasining manzilini qaytaradi.
 *
 *  Funksiya hisobni talab qiladi — chaqirishdan oldin foydalanuvchi
 *  kirgan bo'lishi kerak. */
export async function createDonation({
  amount,
  nickname,
}: {
  amount: number;
  nickname: string;
}): Promise<string> {
  const data = await callFunction<{ payUrl?: string }>('donationCreate', {
    amount,
    nickname,
  });
  const payUrl = data?.payUrl ?? '';
  if (!payUrl) throw new Error('To‘lov manzili kelmadi');
  return payUrl;
}

/** Donat haqidagi matn. Bir xil «Rahmat!» takrorlanmasin: variant
 *  donatning o'rniga bog'lab tanlanadi, shuning uchun ro'yxat qayta
 *  chizilganda matn sakramaydi. */
const PHRASES = [
  '{ism} {summa} hissa qo‘shdi',
  '{ism} loyihaga {summa} qo‘shdi',
  '{ism}dan {summa} — rahmat!',
  '{ism} {summa} bilan qo‘llab-quvvatladi',
  '{summa} — {ism}ning hissasi',
  '{ism} So‘zgirga {summa} ajratdi',
];

export function donationPhrase(donation: Donation, seed: number): string {
  const name = donation.name || 'Xayrixoh';
  const sum = `${formatSum(donation.amount)} so‘m`;
  return PHRASES[Math.abs(seed) % PHRASES.length]
    .replaceAll('{ism}', name)
    .replaceAll('{summa}', sum);
}

/** Hisob ostidagi izoh — summaga qarab ohang o'zgaradi (ilovadagidek). */
export function balanceHint(earned: number): string {
  if (earned <= 0) return 'Lekin siz buni o‘zgartira olasiz';
  if (earned < 100_000) return 'Boshlanishi shu — davomi sizdan';
  return 'Qo‘llab-quvvatlaganlarga rahmat';
}

export interface TopDonor {
  /** Hisob — bo'lmasa (hisobsiz donat) faqat ism bo'yicha yig'iladi. */
  uid?: string;
  name: string;
  total: number;
  count: number;
}

/** Eng ko'p hissa qo'shganlar — yig'indi bo'yicha.
 *
 *  Hisobli donatlar `uid` bo'yicha, hisobsizlari ism bo'yicha yig'iladi
 *  (bir odam ikki marta chiqmasin). Tarix uzayganda ham 300 yozuv
 *  yetadi — ro'yxat oxirgilaridan hisoblanadi. */
export async function loadTopDonors(limit = 5): Promise<TopDonor[]> {
  const docs = await listDocs('donations', { pageSize: 300 });
  const map = new Map<string, TopDonor>();
  for (const doc of docs) {
    const amount = Math.round(Number(doc.fields.amount ?? 0));
    if (!Number.isFinite(amount) || amount <= 0) continue;
    const uid = String(doc.fields.uid ?? '').trim();
    const name = String(doc.fields.name ?? '').trim() || 'Xayrixoh';
    const key = uid ? `u:${uid}` : `n:${name.toLowerCase()}`;
    const row = map.get(key) ?? { uid: uid || undefined, name, total: 0, count: 0 };
    row.total += amount;
    row.count += 1;
    if (!row.name || row.name === 'Xayrixoh') row.name = name;
    map.set(key, row);
  }
  return [...map.values()].sort((a, b) => b.total - a.total).slice(0, limit);
}
