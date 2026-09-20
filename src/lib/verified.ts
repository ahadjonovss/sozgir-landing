/** Tasdiqlangan hisoblar — ilovadagi `VerifiedRegistry` ning veb
 *  ko'chirmasi.
 *
 *  Belgi **hisob raqami** (`uid`) bo'yicha beriladi, taxallus bo'yicha
 *  emas. Sabab belgining o'z ma'nosida: u «bu haqiqatan ham o'sha odam»
 *  degani. Taxallusga bog'lansa, istagan odam o'sha nomni qo'yib olib
 *  belgini ham olardi — ya'ni belgi aynan o'zi to'xtatishi kerak bo'lgan
 *  narsani osonlashtirardi.
 *
 *  Ro'yxat ilgari shu faylda, qo'lda yozilgan edi. Endi u bulutdagi
 *  bitta hujjatda (`config/verified`) va ikkala platforma o'shani
 *  o'qiydi: yangi odam qo'shish uchun sayt qaytadan yig'ilmaydi, belgi
 *  adminkadan qo'yiladi. Hujjatni faqat admin yozadi (`firestore.rules`),
 *  o'qish hammaga ochiq — kim tasdiqlangani baribir ekranda ko'rinadi.
 *
 *  Ro'yxat sahifa umrida **bir marta** o'qiladi: u kamdan-kam o'zgaradi,
 *  lekin jadvalning har qatorida kerak bo'ladi. Brauzerda ham saqlanadi
 *  — sahifa ochilgan zahoti birinchi kadrda belgi joyida bo'lsin, aks
 *  holda u ro'yxat kelgach sakrab paydo bo'lardi.
 *
 *  Belgi bilan birga reklamasizlik ham keladi ([isVerifiedAsync]):
 *  banner talabni yuborishdan oldin shu javobni kutadi. */
import { useEffect, useState } from 'react';
import { readDoc } from '../firebase/rest';

/** Ro'yxat turgan hujjat: `{ uids: ["...", "..."] }`. */
const DOC = 'config/verified';

const CACHE_KEY = 'sozgir.verified';

/** Belgi haqidagi matnlar — ilovadagi `AppStrings.verified*` bilan
 *  bir xil.
 *
 *  Ohang ikki narsani aytadi: belgi **kimligini** tasdiqlaydi, lekin
 *  o'yindagi hech narsaga ta'sir qilmaydi. Ikkinchisi muhim — aks holda
 *  belgi imtiyoz bo'lib ko'rinardi. */
export const VERIFIED = {
  title: 'Tasdiqlangan hisob',
  body:
    'Bu hisob egasi kimligi tekshirilgan: ekranda ko‘rinib turgan odam ' +
    'haqiqatan ham o‘sha odam. Belgi taniqli shaxslarga beriladi va uni ' +
    'faqat So‘zgir jamoasi qo‘yadi.',
  note:
    'Belgi o‘yin qoidasini o‘zgartirmaydi: aqcha ham, o‘lja ham hammada ' +
    'bir xil yig‘iladi.',
  /** Odam **o'z** belgisini bosganda: tushuntirish emas, minnatdorchilik. */
  thanksTitle: 'Tashakkur',
  thanksBody: 'Bizni tanlaganingiz va biz bilan ekaningiz uchun tashakkur.',
  thanksPerk:
    'Ushbu nishon sizga So‘zgirdagi barcha premium funksionallarni beradi.',
  /** Imtiyozlar bittalab: «premium» so'zining o'zi nimadan ozod
   *  bo'lganini aytmaydi, ro'yxat esa aytadi. */
  perks: [
    'Reklama ko‘rsatilmaydi — sayt sizga bannersiz ochiladi.',
    'Ochiq profilingiz premium ko‘rinishda ochiladi.',
    'Begonalar jangga chaqira olmaydi — chaqiruv tugmasi ularda umuman chiqmaydi.',
  ],
  /** Ochiq profildagi sarlavha maydoni ([ProfileSkin.verified]).
   *
   *  Maqtamaydi, aytadi: nishon mahoratga emas, shaxsga beriladi. */
  ribbon: 'Premium',
  honorific: 'So‘zgir tasdiqlagan hisob',
  profileNote: 'Nishonni So‘zgir jamoasi qo‘yadi — uni sotib bo‘lmaydi.',
} as const;

let uids: Set<string> | null = null;
let loading: Promise<Set<string>> | null = null;
const listeners = new Set<() => void>();

function fromCache(): Set<string> | null {
  try {
    const raw = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null') as
      | string[]
      | null;
    return Array.isArray(raw) ? new Set(raw.filter(Boolean)) : null;
  } catch {
    return null;
  }
}

/** Ro'yxatni beradi: brauzerdagi nusxa darhol, bulutdagisi bir marta.
 *
 *  Kutuvchi javobni keshdan oladi — tasdiqlangan odam tarmoq javobini
 *  kutib turib banner ko'rib qolmasligi kerak. Yangilanish esa fonda
 *  ketaveradi va kelganda kuzatuvchilar xabar topadi.
 *
 *  Xato bo'lsa jim o'tiladi va brauzerdagi nusxa qoladi: internet
 *  uzilgani odamning tasdiqlanganini bekor qilmaydi. Bo'sh javob ham
 *  eski ro'yxatni o'chirmaydi — hujjat haqiqatan bo'shligini so'rov
 *  chala kelganidan ajratib bo'lmaydi. */
function load(): Promise<Set<string>> {
  uids ??= fromCache();
  const fresh = (loading ??= readDoc(DOC).then((data) => {
    const raw = data?.uids;
    const list = Array.isArray(raw)
      ? raw.filter((value): value is string => typeof value === 'string' && !!value)
      : [];
    if (list.length > 0 || !uids) {
      uids = new Set(list);
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(list));
      } catch {
        // kesh shart emas
      }
    }
    for (const listener of listeners) listener();
    return uids ?? new Set<string>();
  }));
  return uids ? Promise.resolve(uids) : fresh;
}

/** Hisob tasdiqlanganmi — hozir ma'lum bo'lgan ro'yxat bo'yicha.
 *
 *  Ro'yxat hali kelmagan bo'lsa `false`: belgi keyin chiqadi. Shu sabab
 *  «ko'rsatmaslik» kerak bo'lgan joyda (reklama) bu funksiya emas,
 *  [isVerifiedAsync] ishlatiladi. */
export const isVerified = (uid: string | null | undefined): boolean =>
  !!uid && !!uids?.has(uid);

/** Hisob tasdiqlanganmi — ro'yxat kelishini kutib.
 *
 *  Ataylab `Promise` ([isAdFree] kabi): banner talabni yuborishdan
 *  **oldin** javobni kutadi, aks holda tasdiqlangan odam bir lahza
 *  bo'lsa ham reklama ko'rib qolardi. */
export function isVerifiedAsync(uid: string | null | undefined): Promise<boolean> {
  if (!uid) return Promise.resolve(false);
  return load().then((list) => list.has(uid));
}

/** Bir ekranda o'nlab qator uchun: ro'yxatni chaqiradi va kelganda
 *  qaytadan chizadi, javobni esa tekshiruvchi funksiya bilan beradi.
 *
 *  [useVerified] har bir `uid` uchun alohida chaqiriladi, ro'yxat ichida
 *  esa unday qilib bo'lmaydi (hook tsiklda turmaydi) — jadval qatorlari
 *  shu yerdan foydalanadi. */
export function useVerifiedList(): (uid: string | null | undefined) => boolean {
  useVerified('*');
  return isVerified;
}

/** Komponent uchun: ro'yxatni chaqiradi va kelganda qaytadan chizadi. */
export function useVerified(uid: string | null | undefined): boolean {
  const [, bump] = useState(0);

  useEffect(() => {
    if (!uid) return;
    // Ro'yxat kelganidan keyin ham obuna bo'linadi: keshdagi nusxa
    // darhol ishlaydi, bulutdagisi esa bir necha yuz millisekunddan
    // keyin — o'shanda yangi qo'shilgan belgi o'z joyiga chiqadi.
    const listener = () => bump((value) => value + 1);
    listeners.add(listener);
    void load();
    return () => {
      listeners.delete(listener);
    };
  }, [uid]);

  return isVerified(uid);
}
