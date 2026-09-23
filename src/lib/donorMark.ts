/** Homiy muhri — ilovadagi `DonorMark` ning veb ko'chirmasi.
 *
 *  Muhr — loyihani qo'llagan odam **o'zi tanlaydigan** kichik belgi. U
 *  ism yonida turadi (Telegramdagi emoji-maqom kabi) va faqat
 *  homiylarda chiqadi.
 *
 *  Nishondan farqi: nishon qilingan ishning izi, muhr esa tanlov.
 *  Darajadan ham farq qiladi: daraja yig'indidan o'zi kelib chiqadi,
 *  muhr esa ochilgan ro'yxatdan tanlanadi — aynan shu tanlov muhrni
 *  qiziq qiladi, ikki «Zodagon» ham bir xil ko'rinmaydi.
 *
 *  Bir vaqtda bittasi turadi: ikkitasi ism yonida yonma-yon turgan
 *  zahoti ism o'qilmay qoladi.
 *
 *  Tekshiruv **chizishda**: muhr hujjatda qolib ketishi mumkin
 *  (moderator donatni tuzatsa yig'indi kamayadi), lekin ochilmagan muhr
 *  ko'rinmaydi. Hujjatni tozalash shart emas — daraja qaytsa muhr ham
 *  qaytadi.
 *
 *  Rasmlar `public/muhr/{id}.png` — ilovaning `assets/marks/` idan. */
import { useEffect, useState } from 'react';
import { listDocs } from '../firebase/rest';
import { client } from '../firebase/client';
import { PATHS } from '../firebase/paths';
import { DONOR_TIERS, useDonorTier, type DonorTier } from './donor';

export interface Mark {
  /** Firestore'da (`donors/{uid}.mark`) va rasm nomida turadigan kalit.
   *  O'zgartirilmaydi: o'zgarsa odamlar tanlagan muhr yo'qoladi. */
  id: string;
  label: string;
  /** Shu muhr ochiladigan eng past daraja. */
  minTier: DonorTier;
  /** Bir jumlalik izoh — tanlash oynasida muhr ostida turadi. */
  story: string;
}

export const MARKS: Mark[] = [
  // ── Saxovatpesha (5 000) ──────────────────────────────────────
  { id: 'lola', label: 'Lola', minTier: 'saxovatpesha', story: 'Bahorda birinchi ochiladi.' },
  { id: 'girih', label: 'Girih', minTier: 'saxovatpesha', story: 'Usta qo‘ygan ilk tugun.' },
  { id: 'chiroq', label: 'Chiroq', minTier: 'saxovatpesha', story: 'Kichkina, lekin o‘chmaydi.' },
  { id: 'anor', label: 'Anor', minTier: 'saxovatpesha', story: 'Donasi ko‘p — bittadan.' },
  // ── Boyvachcha (20 000) ───────────────────────────────────────
  { id: 'tumor', label: 'Tumor', minTier: 'boyvachcha', story: 'Yomon ko‘zdan asraydi.' },
  { id: 'tugun', label: 'Tugun', minTier: 'boyvachcha', story: 'Uchi ham, boshi ham yo‘q.' },
  // ── Eski boylardan (50 000) ───────────────────────────────────
  { id: 'doppi', label: 'Do‘ppi', minTier: 'eskiBoylardan', story: 'Eng o‘ziniki bo‘lgan naqsh.' },
  {
    id: 'kashta',
    label: 'Kashta',
    minTier: 'eskiBoylardan',
    story: 'Har tugmasi bir kishining qo‘lidan.',
  },
  // ── Zodagon (150 000) ─────────────────────────────────────────
  { id: 'humo', label: 'Humo', minTier: 'zodagon', story: 'Soyasi tushgan joyga baraka.' },
  { id: 'toj', label: 'Toj', minTier: 'zodagon', story: 'Og‘irligi ko‘rinmaydi.' },
  // ── Oqsuyak (500 000) ─────────────────────────────────────────
  { id: 'sadaf', label: 'Sadaf', minTier: 'oqsuyak', story: 'Yillar yig‘ib bergan marvarid.' },
  {
    id: 'gumbaz',
    label: 'Gumbaz',
    minTier: 'oqsuyak',
    story: 'Bir kishining puliga emas, ko‘pning hissasiga.',
  },
];

/** Daraja qanchalik baland — solishtirish uchun. Ro'yxat yuqoridan
 *  pastga tartiblangan, shuning uchun teskari indeks olinadi. */
const rankOf = (tier: DonorTier | null): number =>
  tier ? DONOR_TIERS.length - DONOR_TIERS.findIndex((level) => level.tier === tier) : 0;

/** Shu daraja bilan ochilganmi. Yuqori daraja quyidagi hammasini
 *  ochadi. */
export const unlockedBy = (mark: Mark, tier: DonorTier | null): boolean =>
  rankOf(tier) >= rankOf(mark.minTier);

/** Noma'lum kalit — eski yoki keyingi versiyaning muhri. Ekran xato
 *  bermaydi, shunchaki muhrsiz chiziladi. */
export const markById = (id: string | null | undefined): Mark | null =>
  MARKS.find((mark) => mark.id === (id ?? '').trim()) ?? null;

/* ── Tanlangan muhrlar do'koni ────────────────────────────────────────
   Darajalar bilan bir uslubda (`donor.ts`): har ism o'zi so'rov
   yubormaydi — hammasi bitta o'qishdan chiqadi. `donors` ochiq
   kolleksiya, bir necha yuz yozuv. */

const CACHE_KEY = 'sozgir.donor.marks';
const TTL_MS = 60 * 60 * 1000;
const PAGE = 300;

let marks: Record<string, string> | null = null;
let loading: Promise<Record<string, string>> | null = null;
const listeners = new Set<() => void>();

function fromCache(): Record<string, string> | null {
  try {
    const raw = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null') as {
      t: number;
      v: Record<string, string>;
    } | null;
    if (!raw || Date.now() - raw.t > TTL_MS) return null;
    return raw.v;
  } catch {
    return null;
  }
}

function loadMarks(): Promise<Record<string, string>> {
  if (marks) return Promise.resolve(marks);
  const cached = fromCache();
  if (cached) {
    marks = cached;
    return Promise.resolve(cached);
  }
  if (loading) return loading;

  loading = listDocs(PATHS.donors, { pageSize: PAGE })
    .then((docs) => {
      const next: Record<string, string> = {};
      for (const doc of docs) {
        // Hujjat nomi — uid.
        const id = String(doc.fields.mark ?? '').trim();
        if (doc.id && id) next[doc.id] = id;
      }
      marks = next;
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), v: next }));
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

/** Odam tanlagan muhr. `null` — tanlamagan, ma'lumot kelmagan yoki
 *  **darajasi yetmaydi**. */
export function useDonorMark(uid: string | null | undefined): Mark | null {
  const tier = useDonorTier(uid ?? undefined);
  const [, bump] = useState(0);

  useEffect(() => {
    if (!uid || marks) return;
    const listener = () => bump((value) => value + 1);
    listeners.add(listener);
    void loadMarks();
    return () => {
      listeners.delete(listener);
    };
  }, [uid]);

  if (!uid || !marks) return null;
  const mark = markById(marks[uid]);
  return mark && unlockedBy(mark, tier) ? mark : null;
}

/** Muhrni tanlaydi: avval serverga yozadi, keyin xotirani yangilaydi.
 *
 *  Tartib shunday, chunki muhr — ko'rinadigan narsa: yozuv qoida bilan
 *  rad etilsa (darajasi yetmaydi, hisob boshqa) ekranda yangi muhr
 *  turib qolmasligi kerak. `id` bo'sh bo'lsa muhr olib tashlanadi. */
export async function chooseMark(uid: string, id: string): Promise<void> {
  const { db } = await client();
  const { doc, updateDoc } = await import('firebase/firestore/lite');
  await updateDoc(doc(db, PATHS.donors, uid), { mark: id });

  marks = { ...(marks ?? {}), [uid]: id };
  if (!id) delete marks[uid];
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), v: marks }));
  } catch {
    // kesh shart emas
  }
  for (const listener of listeners) listener();
}
