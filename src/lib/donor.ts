/** Homiylik darajalari — donat qilgan o'yinchining ko'rinishi.
 *
 *  Loyihani qo'llagan odam boshqalardan ajralib tursin: avatar atrofida
 *  daraja rangidagi halqa, reyting kartochkasida daraja chipi. Daraja
 *  umumiy summadan (`donations`, `uid` bo'yicha yig'indi): 5 000 —
 *  «Homiy», 25 000 — «Oltin homiy», 100 000 — «Platina». Chegaralar
 *  hozirgi donatlarga qarab qo'yilgan (eng kattasi 25 000 so'm atrofida):
 *  pastki daraja ko'pchilikka yetadigan, yuqorisi intilish uchun. Hisobsiz
 *  qilingan donat sanalmaydi — unda `uid` yo'q.
 *
 *  Yig'indi hamma uchun bir marta olinadi: `donations` ochiq kolleksiya,
 *  bir necha yuz yozuv, ya'ni bitta REST so'rov. Har avatar alohida
 *  so'ramaydi — do'kondan **so'raydi** (avatarlar do'koni kabi). Natija
 *  xotirada va brauzer keshida (bir soat) turadi. */
import { useEffect, useState } from 'react';
import { listDocs } from '../firebase/rest';

export type DonorTier = 'homiy' | 'oltin' | 'platina';

/** Darajalar — yuqoridan pastga: birinchi mos kelgani olinadi. */
export const DONOR_TIERS: { tier: DonorTier; min: number; label: string }[] = [
  { tier: 'platina', min: 100_000, label: 'Platina' },
  { tier: 'oltin', min: 25_000, label: 'Oltin homiy' },
  { tier: 'homiy', min: 5_000, label: 'Homiy' },
];

export function donorTier(amount: number): DonorTier | null {
  for (const level of DONOR_TIERS) if (amount >= level.min) return level.tier;
  return null;
}

export function donorLabel(tier: DonorTier): string {
  return DONOR_TIERS.find((level) => level.tier === tier)?.label ?? '';
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
