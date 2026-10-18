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
 *  ## Ro'yxat kodda emas
 *
 *  Ilgari muhrlar shu faylda ro'yxat bo'lib, rasmlari
 *  `public/muhr/{id}.png` da yotardi. Yangi muhr qo'shish uch joyga
 *  tegishni talab qilardi: ilovadagi `enum`, saytdagi ro'yxat va
 *  Firestore qoidasidagi chegaralar. Endi ro'yxat **admin panelidan**
 *  kiritiladi va bulutda turadi (`donor_marks/{id}`) — ya'ni yangi muhr
 *  chiqarish uchun na ilovaning yangi versiyasi, na saytning yangi
 *  yig'ilmasi kerak. Sayt ham, ilova ham o'sha bitta katalogni o'qiydi
 *  (`soztop/lib/features/donor/domain/donor_mark_catalog.dart`).
 *
 *  Chegara ham o'zgardi: ilgari u daraja edi (`minTier`), endi **so'm**
 *  (`min`). Daraja beshta va ular sayt bilan umumiy — admin ularni
 *  o'zgartira olmaydi, ya'ni «35 000 dan ochiladigan muhr» degan narsa
 *  chiqmasdi. So'm esa erkin.
 *
 *  Tekshiruv **chizishda**: muhr hujjatda qolib ketishi mumkin
 *  (moderator donatni tuzatsa yig'indi kamayadi), lekin ochilmagan muhr
 *  ko'rinmaydi. Hujjatni tozalash shart emas — yig'indi qaytsa muhr ham
 *  qaytadi. */
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { loadDonorTotals } from './donor';
import { useDonorTotal } from './donor';

export interface Mark {
  /** Firestore'da (`donors/{uid}.mark`) va katalog hujjatining nomida
   *  turadigan kalit. O'zgartirilmaydi: o'zgarsa odamlar tanlagan muhr
   *  noma'lum kalitga aylanadi va ekranda yo'qoladi. */
  id: string;
  label: string;
  /** Bir jumlalik izoh — tanlash to'rida muhr ostida turadi. */
  story: string;
  /** Shu muhr ochiladigan eng kam yig'indi (so'm). `0` — hammaga ochiq. */
  min: number;
  /** Tanlash ro'yxatidagi o'rni — kichikdan kattaga. */
  order: number;
  /** Tanlash ro'yxatida chiqadimi. Muhrni iste'moldan chiqarish uchun
   *  hujjat **o'chirilmaydi**: o'chirilgan hujjat kalitni noma'lum
   *  qiladi va o'sha muhrni tanlab qo'ygan homiyning belgisi yo'qoladi.
   *  `false` esa faqat ro'yxatdan oladi — taqib yurgan odamda muhr
   *  chizilaveradi ([markById]). */
  active: boolean;
  /** 240 px kvadrat WebP, base64 — hujjatning ichidan (avatarlardagi
   *  bilan bir xil sabab: Storage qo'shilsa yana bitta servis, uning
   *  qoidalari va chiqish trafigi hisobi paydo bo'lardi).
   *
   *  Bo'sh satr — ichki ro'yxatdagi muhr: rasmi `public/muhr/` da
   *  ([markArt]). */
  image: string;
}

/** Katalog bulutdan kelmaguncha turadigan ro'yxat — **vaqtinchalik**.
 *
 *  Sayt tirik: muhrlar hozir ham ism yonida turibdi va ularni katalog
 *  to'lgunicha ekrandan olib qo'yish bo'lmaydi. Shuning uchun eski o'n
 *  ikkitasi shu yerda qoldi, chegaralari esa darajadan so'mga
 *  o'girildi — qaysi daraja qaysi summadan boshlanishi `donor.ts` da.
 *
 *  Bulutdagi katalog bir marta o'qilgan zahoti bu ro'yxat butunlay
 *  almashadi: ichki muhr ham, uning rasmi ham qolmaydi. Admin paneliga
 *  muhrlar bo'limi qo'shilib, `donor_marks` to'lgach — shu ro'yxatni
 *  ham, `public/muhr/` ni ham o'chirish kerak. */
const BUILT_IN: Mark[] = [
  { id: 'lola', label: 'Lola', min: 5_000, story: 'Bahorda birinchi ochiladi.' },
  { id: 'girih', label: 'Girih', min: 5_000, story: 'Usta qo‘ygan ilk tugun.' },
  { id: 'chiroq', label: 'Chiroq', min: 5_000, story: 'Kichkina, lekin o‘chmaydi.' },
  { id: 'anor', label: 'Anor', min: 5_000, story: 'Donasi ko‘p — bittadan.' },
  { id: 'tumor', label: 'Tumor', min: 20_000, story: 'Yomon ko‘zdan asraydi.' },
  { id: 'tugun', label: 'Tugun', min: 20_000, story: 'Uchi ham, boshi ham yo‘q.' },
  { id: 'doppi', label: 'Do‘ppi', min: 50_000, story: 'Eng o‘ziniki bo‘lgan naqsh.' },
  {
    id: 'kashta',
    label: 'Kashta',
    min: 50_000,
    story: 'Har tugmasi bir kishining qo‘lidan.',
  },
  { id: 'humo', label: 'Humo', min: 150_000, story: 'Soyasi tushgan joyga baraka.' },
  { id: 'toj', label: 'Toj', min: 150_000, story: 'Og‘irligi ko‘rinmaydi.' },
  { id: 'sadaf', label: 'Sadaf', min: 500_000, story: 'Yillar yig‘ib bergan marvarid.' },
  {
    id: 'gumbaz',
    label: 'Gumbaz',
    min: 500_000,
    story: 'Bir kishining puliga emas, ko‘pning hissasiga.',
  },
].map((mark, index) => ({ ...mark, order: index, active: true, image: '' }));

/* ── Katalog ──────────────────────────────────────────────────────────
   Ro'yxat kamdan-kam o'zgaradi, lekin har ism yonida kerak bo'ladi va
   rasmlari bilan ≈ 220 KB. Shuning uchun u har ochilishda emas,
   **versiya o'zgarganda** olinadi:

     1. brauzerdagi nusxa darhol o'qiladi — birinchi kadrda muhr joyida
        bo'lsin, aks holda u ro'yxat kelgach sakrab paydo bo'lardi;
     2. bulutdan versiya so'raladi — kichkina hujjat;
     3. versiya o'zgargan bo'lsagina butun katalog yuklanadi.

   Ya'ni odatdagi ochilish bitta kichik o'qish bilan tugaydi. Xato
   bo'lsa jim o'tiladi: brauzerdagi nusxa qoladi va muhrlar yo'qolmaydi
   — internet uzilgani odamning muhrini bekor qilmaydi. */

/** Katalog versiyasi turgan hujjat: `{ version, updatedAt }`. */

const CATALOG_KEY = 'sozgir.donor.catalog';

/** Katalog bitta so'rovga sig'adi: muhr o'nlab bo'ladi, yuzlab emas. */

/** Chegarasi yozilmagan muhr hech qachon ochilmaydi. Tasodifan tushib
 *  qolgan maydon butun ro'yxatni bepul qilib yubormasligi kerak. */
const UNREACHABLE = 2 ** 40;

let catalog: Mark[] = BUILT_IN;
let catalogVersion = 0;
let catalogRead = false;
let catalogLoading: Promise<void> | null = null;
const catalogListeners = new Set<() => void>();

/** Hujjatdan muhr. Chala yoki buzuq yozuv `null` qaytaradi: admin
 *  panelida yarim to'ldirilgan muhr qolib ketsa sayt yiqilmasligi
 *  kerak, o'sha bittasi ro'yxatga tushmay qo'ya qoladi. */
function markFromDoc(id: string, fields: Record<string, unknown>): Mark | null {
  const key = id.trim();
  if (!key) return null;
  const label = typeof fields.label === 'string' ? fields.label.trim() : '';
  const image = typeof fields.image === 'string' ? fields.image : '';
  if (!label || !image) return null;
  return {
    id: key,
    label,
    story: typeof fields.story === 'string' ? fields.story.trim() : '',
    min: typeof fields.min === 'number' ? Math.round(fields.min) : UNREACHABLE,
    order: typeof fields.order === 'number' ? Math.round(fields.order) : 0,
    // Yozilmagan bo'lsa ko'rinadi: admin yangi muhr qo'shganda bayroqni
    // esdan chiqarsa ham ro'yxatga tushsin.
    active: fields.active !== false,
    image,
  };
}

/** Tartib: avval [Mark.order], teng bo'lsa kalit bo'yicha. Ikkinchi
 *  shart muhim — admin ikki muhrga bir xil raqam qo'ysa ro'yxat har
 *  ochilishda boshqacha tartibda chiqmasligi kerak. */
function applyCatalog(marks: Mark[]): void {
  catalog = [...marks].sort(
    (a, b) => a.order - b.order || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
  );
  for (const listener of catalogListeners) listener();
}

function catalogFromCache(): { version: number; marks: Mark[] } | null {
  try {
    const raw = JSON.parse(localStorage.getItem(CATALOG_KEY) ?? 'null') as {
      v?: unknown;
      m?: unknown;
    } | null;
    if (!raw || typeof raw.v !== 'number' || !Array.isArray(raw.m)) return null;
    const marks: Mark[] = [];
    for (const item of raw.m) {
      if (!item || typeof item !== 'object') continue;
      const row = item as Record<string, unknown>;
      const mark = markFromDoc(String(row.id ?? ''), row);
      if (mark) marks.push(mark);
    }
    return marks.length > 0 ? { version: raw.v, marks } : null;
  } catch {
    // Buzilgan nusxa — bulutdan qayta olinadi.
    return null;
  }
}

/** Katalogni beradi: brauzerdagi nusxa darhol, bulutdagisi bir marta. */
function loadCatalog(): Promise<void> {
  if (catalogLoading) return catalogLoading;

  if (!catalogRead) {
    const cached = catalogFromCache();
    if (cached) {
      catalogVersion = cached.version;
      applyCatalog(cached.marks);
    }
    catalogRead = true;
  }

  catalogLoading = api
    .get<{ version?: unknown }>('/v1/donor-marks/version', { auth: false })
    .catch(() => ({ version: 0 }))
    .then(async (data) => {
    const raw = data.version;
    const version = typeof raw === 'number' ? Math.round(raw) : 0;
    // `0` — sozlama yo'q yoki tarmoq yiqildi. Brauzerdagi nusxani
    // bunday javob bilan almashtirmaymiz.
    if (version === 0 || version === catalogVersion) return;

    const list = await api
      .get<{ items?: unknown }>('/v1/donor-marks', { auth: false })
      .catch(() => ({ items: [] as unknown }));

    const fresh: Mark[] = [];
    for (const row of Array.isArray(list.items) ? list.items : []) {
      const fields = row as Record<string, unknown>;
      const mark = markFromDoc(String(fields.id ?? ''), fields);
      if (mark) fresh.push(mark);
    }
    // Bo'sh javob ishonchsiz: bitta so'rov yiqilsa butun ro'yxat o'chib
    // ketardi. Katalogni haqiqatan bo'shatish uchun admin muhrlarni
    // `active: false` qiladi.
    if (fresh.length === 0) return;

    catalogVersion = version;
    applyCatalog(fresh);
    try {
      localStorage.setItem(CATALOG_KEY, JSON.stringify({ v: version, m: fresh }));
    } catch {
      // kesh shart emas — ro'yxat shu sahifada xotirada ishlaydi
    }
  });
  return catalogLoading;
}

/** Tanlash ro'yxatida ko'rinadigan muhrlar. Ro'yxatdan olingani
 *  (`active: false`) bu yerda yo'q: yangi odam uni tanlay olmaydi. */
const offeredMarks = (): Mark[] => catalog.filter((mark) => mark.active);

/** Kalit bo'yicha muhr. Ro'yxatdan olingani ham qaytadi: uni **tanlab
 *  qo'ygan** odam o'z belgisini yo'qotmasligi kerak.
 *
 *  Noma'lum kalit — eski yoki keyingi versiyaning muhri. Ekran xato
 *  bermaydi, shunchaki muhrsiz chiziladi. */
export const markById = (id: string | null | undefined): Mark | null =>
  catalog.find((mark) => mark.id === (id ?? '').trim()) ?? null;

/** Muhr rasmi. Katalogdagisi hujjat ichida base64 bo'lib keladi, ichki
 *  ro'yxatdagisi esa `public/muhr/` da yotadi ([BUILT_IN]). */
export const markArt = (mark: Mark): string =>
  mark.image ? `data:image/webp;base64,${mark.image}` : `/muhr/${mark.id}.png`;

/** Shu yig'indi bilan ochilganmi. Yig'indi hali kelmagan bo'lsa — yo'q. */
export const unlockedBy = (mark: Mark, total: number | null): boolean =>
  total !== null && total >= mark.min;

/** Tanlash ro'yxati — katalog kelganda qaytadan chiziladi. */
export function useMarks(): Mark[] {
  const [, bump] = useState(0);

  useEffect(() => {
    const listener = () => bump((value) => value + 1);
    catalogListeners.add(listener);
    void loadCatalog();
    return () => {
      catalogListeners.delete(listener);
    };
  }, []);

  return offeredMarks();
}

/* ── Tanlangan muhrlar do'koni ────────────────────────────────────────
   Darajalar bilan bir uslubda (`donor.ts`): har ism o'zi so'rov
   yubormaydi — hammasi bitta o'qishdan chiqadi. `donors` ochiq
   kolleksiya, bir necha yuz yozuv. */

const CACHE_KEY = 'sozgir.donor.marks';
/** Bir so'rovda shuncha `uid` — serverdagi chegara ham shu. */
const LOOKUP_CHUNK = 100;

const TTL_MS = 60 * 60 * 1000;

let chosen: Record<string, string> | null = null;
let loading: Promise<Record<string, string>> | null = null;
const chosenListeners = new Set<() => void>();

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

function loadChosen(): Promise<Record<string, string>> {
  if (chosen) return Promise.resolve(chosen);
  const cached = fromCache();
  if (cached) {
    chosen = cached;
    return Promise.resolve(cached);
  }
  if (loading) return loading;

  /*
   * Tanlovlar **donatchilar ro'yxati bo'yicha** so'raladi.
   *
   * Firestore'da `donors` to'plamini butunligicha o'qish mumkin edi va
   * tanlov o'sha hujjatning maydoni edi. Serverda esa tanlovni faqat
   * `uid` lar bilan so'rash mumkin (`/v1/donors/lookup`, bir so'rovda
   * yuztagacha). Zarari yo'q: muhrni faqat donat qilgan odam tanlay
   * oladi, ya'ni izlanadigan ro'yxat aynan o'sha.
   */
  loading = loadDonorTotals()
    .then(async (totals) => {
      const uids = Object.keys(totals);
      const next: Record<string, string> = {};

      for (let from = 0; from < uids.length; from += LOOKUP_CHUNK) {
        const reply = await api
          .post<{ items?: unknown }>('/v1/donors/lookup', {
            body: { uids: uids.slice(from, from + LOOKUP_CHUNK) },
          })
          .catch(() => ({ items: [] as unknown }));

        for (const row of Array.isArray(reply.items) ? reply.items : []) {
          const item = row as { uid?: unknown; mark?: unknown };
          const uid = String(item.uid ?? '').trim();
          const id = String(item.mark ?? '').trim();
          if (uid && id) next[uid] = id;
        }
      }
      chosen = next;
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), v: next }));
      } catch {
        // kesh shart emas
      }
      for (const listener of chosenListeners) listener();
      return next;
    })
    .finally(() => {
      loading = null;
    });
  return loading;
}

/** Odam tanlagan muhr. `null` — tanlamagan, ma'lumot kelmagan yoki
 *  **yig'indisi yetmaydi**. */
export function useDonorMark(uid: string | null | undefined): Mark | null {
  const total = useDonorTotal(uid ?? undefined);
  const [, bump] = useState(0);

  useEffect(() => {
    if (!uid) return;
    // Ikkala ro'yxatga ham obuna: muhr kaliti bir joydan, muhrning
    // o'zi boshqasidan keladi va ikkovi har xil vaqtda yetib boradi.
    const listener = () => bump((value) => value + 1);
    chosenListeners.add(listener);
    catalogListeners.add(listener);
    void loadChosen();
    void loadCatalog();
    return () => {
      chosenListeners.delete(listener);
      catalogListeners.delete(listener);
    };
  }, [uid]);

  if (!uid || !chosen) return null;
  const mark = markById(chosen[uid]);
  return mark && unlockedBy(mark, total) ? mark : null;
}

/** Muhrni tanlaydi: avval serverga yozadi, keyin xotirani yangilaydi.
 *
 *  Tartib shunday, chunki muhr — ko'rinadigan narsa: yozuv qoida bilan
 *  rad etilsa (yig'indisi yetmaydi, hisob boshqa) ekranda yangi muhr
 *  turib qolmasligi kerak. `id` bo'sh bo'lsa muhr olib tashlanadi. */
export async function chooseMark(uid: string, id: string): Promise<void> {
  // Kimning tanlovi ekanini server token'dan biladi; `uid` faqat
  // xotiradagi jadvalni yangilash uchun.
  await api.put('/v1/me/donor-look', { body: { mark: id || null } });

  chosen = { ...(chosen ?? {}), [uid]: id };
  if (!id) delete chosen[uid];
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), v: chosen }));
  } catch {
    // kesh shart emas
  }
  for (const listener of chosenListeners) listener();
}
