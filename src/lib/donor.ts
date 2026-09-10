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
 *  xotirada va brauzer keshida (bir soat) turadi. */
import { useEffect, useState } from 'react';
import { listDocs } from '../firebase/rest';

export type DonorTier =
  | 'saxovatpesha'
  | 'boyvachcha'
  | 'eskiBoylardan'
  | 'zodagon'
  | 'oqsuyak';

/** Darajalar — yuqoridan pastga: birinchi mos kelgani olinadi. */
export const DONOR_TIERS: { tier: DonorTier; min: number; label: string }[] = [
  { tier: 'oqsuyak', min: 500_000, label: 'Oqsuyak' },
  { tier: 'zodagon', min: 150_000, label: 'Zodagon' },
  { tier: 'eskiBoylardan', min: 50_000, label: 'Eski boylardan' },
  { tier: 'boyvachcha', min: 20_000, label: 'Boyvachcha' },
  { tier: 'saxovatpesha', min: 5_000, label: 'Saxovatpesha' },
];

export function donorTier(amount: number): DonorTier | null {
  for (const level of DONOR_TIERS) if (amount >= level.min) return level.tier;
  return null;
}

export function donorLabel(tier: DonorTier): string {
  return DONOR_TIERS.find((level) => level.tier === tier)?.label ?? '';
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

const CACHE_KEY = 'sozgir.donors';
const TTL_MS = 60 * 60 * 1000;
/** Shuncha yozuv bir so'rovda — tarix uzayganda yig'indi ham shuncha
 *  yozuvdan hisoblanadi. */
const PAGE = 300;

let totals: Record<string, number> | null = null;
let loading: Promise<Record<string, number>> | null = null;
const listeners = new Set<() => void>();

function fromCache(): Record<string, number> | null {
  try {
    const raw = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null') as {
      t: number;
      v: Record<string, number>;
    } | null;
    if (!raw || Date.now() - raw.t > TTL_MS) return null;
    return raw.v;
  } catch {
    return null;
  }
}

/** Hamma donatchining yig'indisi: `uid` → so'm. */
export function loadDonorTotals(): Promise<Record<string, number>> {
  if (totals) return Promise.resolve(totals);
  const cached = fromCache();
  if (cached) {
    totals = cached;
    return Promise.resolve(cached);
  }
  if (loading) return loading;
  loading = listDocs('donations', { pageSize: PAGE })
    .then((docs) => {
      const out: Record<string, number> = {};
      for (const doc of docs) {
        const uid = String(doc.fields.uid ?? '').trim();
        const amount = Number(doc.fields.amount ?? 0);
        if (!uid || !Number.isFinite(amount) || amount <= 0) continue;
        out[uid] = (out[uid] ?? 0) + Math.round(amount);
      }
      totals = out;
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), v: out }));
      } catch {
        // kesh shart emas
      }
      for (const listener of listeners) listener();
      return out;
    })
    .finally(() => {
      loading = null;
    });
  return loading;
}

/** Odamning yig'indisi (so'm). Ma'lumot kelmaguncha `null`, donat
 *  qilmagan bo'lsa `0`. */
export function useDonorTotal(uid: string | undefined): number | null {
  const [, bump] = useState(0);

  useEffect(() => {
    if (!uid || totals) return;
    const listener = () => bump((value) => value + 1);
    listeners.add(listener);
    void loadDonorTotals();
    return () => {
      listeners.delete(listener);
    };
  }, [uid]);

  if (!uid || !totals) return null;
  return totals[uid] ?? 0;
}

/** Yangi donatdan keyin kesh eskiradi — qaytib kelganda qayta o'qilsin. */
export function forgetDonorTotals(): void {
  totals = null;
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // e'tiborsiz
  }
}

/** Odamning homiylik darajasi. Ma'lumot kelmaguncha va donat qilmagan
 *  bo'lsa `null`. */
export function useDonorTier(uid: string | undefined): DonorTier | null {
  const [, bump] = useState(0);

  useEffect(() => {
    if (!uid || totals) return;
    const listener = () => bump((value) => value + 1);
    listeners.add(listener);
    void loadDonorTotals();
    return () => {
      listeners.delete(listener);
    };
  }, [uid]);

  if (!uid || !totals) return null;
  return donorTier(totals[uid] ?? 0);
}
