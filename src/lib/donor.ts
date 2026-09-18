/** Homiylik darajalari — donat qilgan o'yinchining ko'rinishi.
 *
 *  Loyihani qo'llagan odam boshqalardan ajralib tursin: avatar atrofida
 *  daraja rangidagi halqa, reyting kartochkasida daraja chipi. Daraja
 *  umumiy summadan (`donations`, `uid` bo'yicha yig'indi): 5 000 —
 *  «Saxovatpesha», 20 000 — «Boyvachcha», 50 000 — «Eski boylardan»,
 *  150 000 — «Zodagon», 500 000 — «Oqsuyak». Chegaralar hozirgi donatlarga qarab qo'yilgan (eng
 *  kattasi 25 000 so'm atrofida): pastki daraja ko'pchilikka yetadigan,
 *  yuqorisi intilish uchun. Hisobsiz
 *  qilingan donat sanalmaydi — unda `uid` yo'q.
 *
 *  Yig'indi hamma uchun bir marta olinadi: `donations` ochiq kolleksiya,
 *  bir necha yuz yozuv, ya'ni bitta REST so'rov. Har avatar alohida
 *  so'ramaydi — do'kondan **so'raydi** (avatarlar do'koni kabi). Natija
 *  xotirada va brauzer keshida (bir soat) turadi.
 *
 *  O'sha bitta o'qishdan reklamasizlik muddati ham chiqadi ([isAdFree]):
 *  yozuvlar baribir qo'lda, ikkinchi so'rovning hojati yo'q. */
import { useEffect, useState } from 'react';
import { listDocs } from '../firebase/rest';

export type DonorTier =
  | 'saxovatpesha'
  | 'boyvachcha'
  | 'eskiBoylardan'
  | 'zodagon'
  | 'oqsuyak';

/** Darajalar — yuqoridan pastga: birinchi mos kelgani olinadi. */
export const DONOR_TIERS: { tier: DonorTier; min: number; label: string; slug: string }[] = [
  { tier: 'oqsuyak', min: 500_000, label: 'Oqsuyak', slug: 'oqsuyak' },
  { tier: 'zodagon', min: 150_000, label: 'Zodagon', slug: 'zodagon' },
  { tier: 'eskiBoylardan', min: 50_000, label: 'Eski boylardan', slug: 'eski-boylardan' },
  { tier: 'boyvachcha', min: 20_000, label: 'Boyvachcha', slug: 'boyvachcha' },
  { tier: 'saxovatpesha', min: 5_000, label: 'Saxovatpesha', slug: 'saxovatpesha' },
];

export function donorTier(amount: number): DonorTier | null {
  for (const level of DONOR_TIERS) if (amount >= level.min) return level.tier;
  return null;
}

export function donorLabel(tier: DonorTier): string {
  return DONOR_TIERS.find((level) => level.tier === tier)?.label ?? '';
}

/** Daraja nishonining fayli: `public/homiy/{slug}.png`. */
export function donorSlug(tier: DonorTier): string {
  return DONOR_TIERS.find((level) => level.tier === tier)?.slug ?? '';
}

/** Keyingi daraja — donatga sabab. Eng yuqorida `null`. */
export function nextDonorTier(amount: number): { tier: DonorTier; min: number; label: string } | null {
  for (const level of [...DONOR_TIERS].reverse()) if (amount < level.min) return level;
  return null;
}

/** Joriy darajadan keyingisiga qadar bosilgan yo'l (0..1). */
export function donorProgress(amount: number): number {
  const next = nextDonorTier(amount);
  if (!next) return 1;
  const current = donorTier(amount);
  const from = current ? (DONOR_TIERS.find((level) => level.tier === current)?.min ?? 0) : 0;
  return Math.min(1, Math.max(0, (amount - from) / (next.min - from)));
}

/* ── Reklamasiz rejim ──────────────────────────────────────────────────
   Shart ilovadagi `AdFreePlan` bilan aynan bir xil, chunki hisob ham
   bitta: oxirgi `WINDOW` ichidagi qo'llovlar yig'indisi `PRICE` ga yetsa,
   odamga reklama ko'rsatilmaydi. Bu obuna emas — eski qo'llov oynadan
   chiqqach yig'indi o'zi kamayadi va rejim jimgina tugaydi. */

/** Oyna: oxirgi yetti kunlik qo'llovlar sanaladi. */
const AD_FREE_WINDOW = 7 * 24 * 60 * 60 * 1000;

/** Shu oyna ichida yig'ilishi kerak bo'lgan summa (so'm) — eng kam donat
 *  bilan bir xil, ya'ni bitta eng kichik qo'llov ham bir haftaga yetadi. */
const AD_FREE_PRICE = 5555;

/** Bitta odamning qo'llovlaridan rejim tugash vaqtini topadi.
 *
 *  Qo'llovlar eng yangisidan boshlab qo'shiladi va yig'indini narxga
 *  yetkazgan **oxirgisi** belgilanadi: aynan o'sha qo'llov oynadan
 *  chiqqanda yig'indi narxdan pastga tushadi, demak rejim ham shunda
 *  tugaydi. Yetmasa `0` — reklama odatdagidek ko'rinadi.
 *
 *  Kelajakdagi sanali qo'llov chiqarib tashlanmaydi: vaqtni server
 *  qo'yadi, brauzer soati esa ortda bo'lishi mumkin. */
function adFreeUntil(
  donations: { at: number; amount: number }[],
  now = Date.now(),
): number {
  const recent = donations
    .filter((donation) => donation.amount > 0 && donation.at > now - AD_FREE_WINDOW)
    .sort((a, b) => b.at - a.at);

  let collected = 0;
  for (const donation of recent) {
    collected += donation.amount;
    if (collected >= AD_FREE_PRICE) return donation.at + AD_FREE_WINDOW;
  }
  return 0;
}

const CACHE_KEY = 'sozgir.donors';
const TTL_MS = 60 * 60 * 1000;
/** Shuncha yozuv bir so'rovda — tarix uzayganda yig'indi ham shuncha
 *  yozuvdan hisoblanadi. */
const PAGE = 300;

/** Bitta o'qishdan chiqadigan ikki javob: yig'indi va reklamasizlik
 *  muddati (`uid` → millisekund; rejim yo'q bo'lsa kalit ham yo'q). */
interface Donors {
  totals: Record<string, number>;
  adFree: Record<string, number>;
}

let donors: Donors | null = null;
let loading: Promise<Donors> | null = null;
const listeners = new Set<() => void>();

function fromCache(): Donors | null {
  try {
    const raw = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null') as {
      t: number;
      v: Record<string, number>;
      a?: Record<string, number>;
    } | null;
    if (!raw || Date.now() - raw.t > TTL_MS) return null;
    // `a` yo'q — kesh eski ko'rinishda yozilgan. Qayta o'qiladi: aks holda
    // qo'llagan odam kesh eskirguncha reklama ko'rib turardi.
    if (!raw.a) return null;
    return { totals: raw.v, adFree: raw.a };
  } catch {
    return null;
  }
}

/** Donatchilar: yig'indi va reklamasizlik muddati — bitta so'rovda. */
function loadDonors(): Promise<Donors> {
  if (donors) return Promise.resolve(donors);
  const cached = fromCache();
  if (cached) {
    donors = cached;
    return Promise.resolve(cached);
  }
  if (loading) return loading;
  loading = listDocs('donations', { pageSize: PAGE })
    .then((docs) => {
      const totals: Record<string, number> = {};
      const history: Record<string, { at: number; amount: number }[]> = {};
      for (const doc of docs) {
        const uid = String(doc.fields.uid ?? '').trim();
        const amount = Number(doc.fields.amount ?? 0);
        if (!uid || !Number.isFinite(amount) || amount <= 0) continue;
        totals[uid] = (totals[uid] ?? 0) + Math.round(amount);
        // Sanasiz yozuv (adminka qo'lda qo'shgani) yig'indiga kiradi,
        // lekin oynaga joylashtirib bo'lmaydi — ilovadagi qoida shu.
        const at = Date.parse(String(doc.fields.createdAt ?? ''));
        if (Number.isFinite(at)) {
          (history[uid] ??= []).push({ at, amount: Math.round(amount) });
        }
      }

      const adFree: Record<string, number> = {};
      for (const [uid, donations] of Object.entries(history)) {
        const until = adFreeUntil(donations);
        if (until > 0) adFree[uid] = until;
      }

      const next: Donors = { totals, adFree };
      donors = next;
      try {
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ t: Date.now(), v: totals, a: adFree }),
        );
      } catch {
        // kesh shart emas
      }
      for (const listener of listeners) listener();
      return next;
    })
    .finally(() => {
      loading = null;
    });
  return loading;
}

/** Hamma donatchining yig'indisi: `uid` → so'm. */
export function loadDonorTotals(): Promise<Record<string, number>> {
  return loadDonors().then((data) => data.totals);
}

/** Odamning yig'indisi (so'm). Ma'lumot kelmaguncha `null`, donat
 *  qilmagan bo'lsa `0`. */
export function useDonorTotal(uid: string | undefined): number | null {
  useDonors(uid);
  if (!uid || !donors) return null;
  return donors.totals[uid] ?? 0;
}

/** Yangi donatdan keyin kesh eskiradi — qaytib kelganda qayta o'qilsin. */
export function forgetDonorTotals(): void {
  donors = null;
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // e'tiborsiz
  }
}

/** Odamning homiylik darajasi. Ma'lumot kelmaguncha va donat qilmagan
 *  bo'lsa `null`. */
export function useDonorTier(uid: string | undefined): DonorTier | null {
  useDonors(uid);
  if (!uid || !donors) return null;
  return donorTier(donors.totals[uid] ?? 0);
}

/** Ro'yxat kelishini kutadigan umumiy qism: birinchi so'ragan komponent
 *  o'qishni boshlaydi, qolganlari tayyor javobni oladi. */
function useDonors(uid: string | undefined): void {
  const [, bump] = useState(0);

  useEffect(() => {
    if (!uid || donors) return;
    const listener = () => bump((value) => value + 1);
    listeners.add(listener);
    void loadDonors();
    return () => {
      listeners.delete(listener);
    };
  }, [uid]);
}

/** Shu odamga reklama ko'rsatilmaydimi.
 *
 *  Ataylab `Promise`: banner talabni yuborishdan **oldin** javobni
 *  kutadi. Sinxron hook bo'lsa ro'yxat kelmasidan avval so'ragan banner
 *  qo'llagan odamga ham ko'rinib ketardi.
 *
 *  Muddat tugagan bo'lsa `false` — rejim o'zi so'nadi. So'rov yiqilsa
 *  ham `false`: reklamani o'chirib qo'yish uchun aniq sabab kerak. */
export function isAdFree(uid: string | undefined): Promise<boolean> {
  if (!uid) return Promise.resolve(false);
  return loadDonors().then((data) => (data.adFree[uid] ?? 0) > Date.now());
}
