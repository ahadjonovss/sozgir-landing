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

import { api } from '../api/client';
import { API_BASE } from '../api/config';
import { applyPremium, DONATION_MAX, minDonation } from './premium';

export { DONATION_MAX };

/** Eng kam qo'llov.
 *
 *  Qat'iy son emas — adminka qo'yadi (`premium.min`) va ilova ham
 *  **o'sha** sondan ishlaydi. Chegirma e'lon qilinsa pol ham tushishi
 *  kerak va buning uchun saytni qayta yig'ib o'tirib bo'lmaydi.
 *
 *  Ilgari bu yerda `5555` turardi: ilovada narx yangilanganda sayt
 *  eskisida qolib ketgan va bitta loyihaning ikki ekranida ikki xil
 *  son turardi.
 *
 *  Bu yerdagi tekshiruv faqat odamga darhol aytish uchun — qaror
 *  serverniki. */
export const donationMin = minDonation;

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

/** Loyiha hisobi. Server javob bermasa — nol hisob.
 *
 *  `donation.hidden_version` ilovaning do'kondagi versiyasi uchun:
 *  tekshiruv paytida aynan o'sha versiyada donat ko'rinmaydi. Saytda
 *  versiya tushunchasi yo'q, shuning uchun bu yerda faqat umumiy
 *  kalit (`show`) ishlaydi.
 *
 *  Yig'indi va sanoqni server hisoblaydi (`donations.totals()`), ya'ni
 *  ular sozlama hujjatidagi qo'lda yozilgan songa tayanmaydi. */
export async function loadBalance(): Promise<SupportBalance> {
  let data: Record<string, unknown>;
  try {
    data = await api.get<Record<string, unknown>>('/v1/public/support', { auth: false });
  } catch {
    return EMPTY_BALANCE;
  }

  /* Premium narxlari shu javobda keladi va ilova o'qiydigan
     hujjatning aynan o'zi (`app/support` → `premium`). Shuning uchun
     narx bir joyda yoziladi va ikki ekranda ayri tushmaydi. */
  applyPremium(data.premium);

  const donation = (data.donation ?? {}) as Record<string, unknown>;
  return {
    earned: Number(data.earned ?? 0) || 0,
    count: Number(data.donations ?? 0) || 0,
    visible: donation.show !== false,
  };
}

interface DonationRow {
  uid?: unknown;
  nickname?: unknown;
  amount?: unknown;
  created_at?: unknown;
}

const rowsOf = (value: unknown): DonationRow[] =>
  Array.isArray(value) ? (value as DonationRow[]) : [];

/** Serverdagi chegara — undan ortig'ini so'rashning ma'nosi yo'q. */
const RECENT_MAX = 100;

async function recentDonations(limit: number): Promise<DonationRow[]> {
  try {
    const data = await api.get<{ items?: unknown }>('/v1/public/donations/recent', {
      query: { limit: Math.min(limit, RECENT_MAX) },
      auth: false,
    });
    return rowsOf(data.items);
  } catch {
    return [];
  }
}

/** Oxirgi donatlar.
 *
 *  Saralash **serverda** (`ORDER BY created_at DESC`) — ilovadagidek.
 *  Ism endi `nickname`: serverda donat yozuvi hisob taxallusi bilan
 *  qo'yiladi, mijoz yuborgan nom bilan emas. */
export async function loadDonations(limit = 10): Promise<Donation[]> {
  const rows = await recentDonations(limit);

  return rows
    .map((row) => ({
      name: String(row.nickname ?? '').trim(),
      amount: Math.round(Number(row.amount ?? 0)),
      uid: String(row.uid ?? '').trim() || undefined,
      at: Date.parse(String(row.created_at ?? '')) || 0,
    }))
    // Summasi yo'q yoki manfiy yozuv ro'yxatga ham, hisobga ham
    // kirmaydi.
    .filter((donation) => Number.isFinite(donation.amount) && donation.amount > 0);
}

/** To'lovni ochadi va inPAY sahifasining manzilini qaytaradi.
 *
 *  Marshrut hisobni talab qiladi — chaqirishdan oldin foydalanuvchi
 *  kirgan bo'lishi kerak.
 *
 *  Taxallus **yuborilmaydi**: serverdagi yozuvga hisobning o'z
 *  taxallusi qo'yiladi (`startDonation`). Ilgari uni mijoz berardi,
 *  ya'ni ro'yxatdagi nomni istagancha yozish mumkin edi.
 *
 *  `callbackUrl` — serverning o'z manzili: to'lovni inPAY shu yerga
 *  xabar qiladi va server holatni provayderdan qayta so'rab
 *  tasdiqlaydi. U **`/v1/web` ga ko'chmadi**: bu manzilga sayt emas,
 *  inPAY uradi va u provayder tomonida sozlangan. Uni almashtirish
 *  saytga emas, to'lov tizimiga tegadigan ish. `returnUrl` esa odam to'lovdan keyin qaytadigan
 *  sahifa (`public/donat`).
 *
 *  Ilgari ikkala manzilni Cloud Function o'zi qo'yardi; yangi marshrut
 *  ularni mijozdan oladi. */
export async function createDonation({
  amount,
}: {
  amount: number;
}): Promise<string> {
  const data = await api.post<{ payUrl?: string }>('/v1/web/donations', {
    body: {
      amount,
      callbackUrl: `${API_BASE}/v1/donations/callback`,
      returnUrl: `${location.origin}/donat`,
    },
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
 *  Yig'indini **server** beradi (`/v1/public/donors`) va u to'liq: ilgari
 *  ro'yxat oxirgi 300 yozuvdan hisoblangani uchun eski donatlar
 *  yig'indidan tushib qolardi.
 *
 *  Donatlar soni esa oxirgi yozuvlardan sanaladi — serverda uni
 *  beradigan maydon yo'q. Shu sabab son **kamida bitta**: ro'yxatda
 *  turgan odam hech bo'lmasa bir marta qo'llagan, lekin o'sha qo'llov
 *  oxirgi yuztalikdan tashqarida bo'lishi mumkin. Son faqat darajasi
 *  yo'q (ya'ni eng kichik) donatchilarda ko'rsatiladi, shuning uchun
 *  bu yaqinlashish ekranda deyarli sezilmaydi. */
export async function loadTopDonors(limit = 5): Promise<TopDonor[]> {
  const [donorList, recent] = await Promise.all([
    api
      .get<{ items?: unknown }>('/v1/public/donors', { auth: false })
      .catch(() => ({ items: [] as unknown })),
    recentDonations(RECENT_MAX),
  ]);

  const counts = new Map<string, number>();
  for (const row of recent) {
    const uid = String(row.uid ?? '').trim();
    const amount = Number(row.amount ?? 0);
    if (!uid || !Number.isFinite(amount) || amount <= 0) continue;
    counts.set(uid, (counts.get(uid) ?? 0) + 1);
  }

  return rowsOf(donorList.items)
    .map((row): TopDonor => {
      const uid = String(row.uid ?? '').trim();
      return {
        uid: uid || undefined,
        name: String(row.nickname ?? '').trim() || 'Xayrixoh',
        total: Math.round(Number((row as { total?: unknown }).total ?? 0)),
        count: Math.max(1, counts.get(uid) ?? 0),
      };
    })
    .filter((donor) => Number.isFinite(donor.total) && donor.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}
