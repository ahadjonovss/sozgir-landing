import { useEffect, useState } from 'react';
import { PAGES, type Route } from '../data/pages';

export type { Route };

/** Manzillar ro'yxati `src/data/pages.ts` da — u yerda har manzilning
 *  sarlavhasi va statik matni ham turadi, ya'ni router bilan build
 *  paytida yasaladigan HTML fayllar bir manbadan oziqlanadi. */
const routes: readonly string[] = PAGES.map((page) => page.path);

/** Parametrli manzillar: `/<bo'lak>/<parametr>`.
 *
 *  Ro'yxatda ilova ulashadigan havolalar ham bor
 *  (`lib/core/deeplink/deep_link.dart`): telefonda ular ilovani ochadi,
 *  ilovasi yo'q odamda esa brauzerda qoladi — ya'ni saytda ham o'sha
 *  narsa ochilishi kerak, bosh sahifa emas.
 *
 *  | Manzil | Sahifa |
 *  | --- | --- |
 *  | `/oyinchi/{uid}`, `/u/{uid}` | O'yinchining ochiq profili |
 *  | `/shikoyat/soz/{so'z}` | So'z haqida xabar berish |
 *  | `/shikoyat/oyinchi/{uid}` | O'yinchi ustidan shikoyat |
 *  | `/jang/{kod}` | So'zjang — kod bilan darhol qo'shiladi |
 *  | `/maydon/{kod}` | Mardu maydon — kod bilan darhol qo'shiladi |
 *  | `/turnir/{kod}` | Turnir sahifasi — yig'ilish, davralar, g'olib |
 *  | `/soztop/{kod}` | O'yinchi yashirgan so'z — shu yerda o'ynaladi |
 *
 *  Har birining `vercel.json` da o'z qoidasi bor: aks holda manzil
 *  bo'sh `index.html` ni olib, robotga bosh sahifaning matnini
 *  ko'rsatardi. */
const PARAM_ROUTES: { prefix: string; route: Route }[] = [
  { prefix: '/oyinchi/', route: '/oyinchi' },
  /* Shikoyatning ikki turi bitta sahifada: `ReportPage` turini
     yo'lning o'zidan o'qiydi (`/shikoyat/soz/...` yoki
     `/shikoyat/oyinchi/...`). Uzunroq prefiks oldinroq turadi —
     `/shikoyat/` ikkalasini ham yutib yuborardi. */
  { prefix: '/shikoyat/soz/', route: '/shikoyat' },
  { prefix: '/shikoyat/oyinchi/', route: '/shikoyat' },
  { prefix: '/u/', route: '/oyinchi' },
  { prefix: '/jang/', route: '/sozjang' },
  { prefix: '/maydon/', route: '/maydon' },
  { prefix: '/turnir/', route: '/turnir' },
  { prefix: '/soztop/', route: '/soztop' },
];

function paramRouteOf(path: string): { route: Route; value: string } | null {
  for (const { prefix, route } of PARAM_ROUTES) {
    if (!path.startsWith(prefix) || path.length <= prefix.length) continue;
    try {
      return { route, value: decodeURIComponent(path.slice(prefix.length)) };
    } catch {
      return { route, value: '' };
    }
  }
  return null;
}

/** Manzilning parametri (`/oyinchi/abc` → `abc`). Yo'q bo'lsa bo'sh. */
export function routeParam(): string {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  return paramRouteOf(path)?.value ?? '';
}

/** Ilova ulashadigan kunlik havola — o'sha o'yin sahifasi.
 *
 *  `sozgir.uz/kunlik` ilovada bugungi so'zni ochadi (Universal Link /
 *  App Link). Ilovasi yo'q odamda esa brauzerda qoladi, shuning uchun
 *  u yerda ham o'ynaladigan sahifa chiqishi kerak — bosh sahifa emas.
 *  Manzil o'zgarmaydi: ulashilgan havola o'z holicha qolaveradi. */
const aliases: Record<string, Route> = { '/kunlik': '/oyin' };

/** Manzil shu kichik router biladigan sahifami.
 *
 *  `public/` ichidagi mustaqil sahifalar (`/ol`, `/donat`) bu ro'yxatda
 *  yo'q — ular serverdan keladi, ilova ularga tegmasligi kerak. */
function known(path: string): Route | null {
  const param = paramRouteOf(path);
  if (param) return param.route;
  return aliases[path] ?? (routes.includes(path) ? (path as Route) : null);
}

/** Shu varaqda router nechta sahifa surgan.
 *
 *  Brauzerning `history.length` i bu savolga javob bermaydi: u saytga
 *  kirishdan oldingi yozuvlarni ham sanaydi, ya'ni boshqa saytdan
 *  to'g'ri kelgan odamda ham noldan katta bo'ladi va «ortga» tugmasi
 *  uni saytdan chiqarib yuborardi. Bu yerdagi sanoq esa faqat shu
 *  varaqdagi o'z o'tishlarimizni biladi. */
let pushes = 0;

/** Sayt ichida qaytadigan joy bormi — «ortga» tugmalari uchun. */
export function canGoBack(): boolean {
  return pushes > 0;
}

function read(): Route {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  return known(path) ?? '/';
}

/** Bir necha sahifa uchun kichik router — paket qo'shmasdan.
 *  `/oynash` — nimani o'ynashni tanlash; `/oyin`, `/sozjang`, `/guncha` va
 *  `/gunchajang` — o'yinlar.
 *  Langar (`#`) va boshqa domenga havolalarni brauzerning o'ziga qoldiradi,
 *  shuning uchun `/#qoida` ko'rinishidagi havolalar ham ishlaydi. */
export function useRoute(): Route {
  const [route, setRoute] = useState(read);
  // Parametrli manzilda (`/oyinchi/a` → `/oyinchi/b`) marshrut o'zgarmaydi,
  // sahifa esa o'zgarishi kerak — shuning uchun yo'lning o'zi ham holatda.
  const [, setPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const sync = () => {
      setRoute(read());
      setPath(window.location.pathname);
    };

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const link = (event.target as Element | null)?.closest('a');
      if (!link || link.target === '_blank' || link.hasAttribute('download')) return;

      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.hash || url.pathname === window.location.pathname) return;
      // Ilova bilmagan manzil — brauzerning o'ziga qoldiriladi. Aks holda
      // `/ol` bosilganda manzil o'zgarib, ekranda bosh sahifa qolardi.
      if (!known(url.pathname.replace(/\/+$/, '') || '/')) return;

      event.preventDefault();
      window.history.pushState(null, '', url.pathname);
      pushes += 1;
      sync();
      // `instant` — silliq surilish yangi sahifa chizilganda uzilib qolardi.
      window.scrollTo({ top: 0, behavior: 'instant' });
    };

    // Sahifa `/#qoida` bilan ochilganda brauzer langarni topolmaydi — o'sha
    // paytda `#root` hali bo'sh bo'ladi. Shuning uchun o'zimiz suramiz.
    const target = window.location.hash
      ? document.getElementById(window.location.hash.slice(1))
      : null;
    target?.scrollIntoView({ behavior: 'instant' });

    /* Orqaga qaytish sanoqdan ayiriladi — aks holda bir marta qaytgan
       odamda ham «ortga» tugmasi qolib, keyingi bosishda uni saytdan
       chiqarib yuborardi. Ayirish aynan shu yerda: `sync` ni bosilgan
       havola ham chaqiradi va u yerda sanoq o'sishi kerak. */
    const onPop = () => {
      if (pushes > 0) pushes -= 1;
      sync();
    };

    window.addEventListener('popstate', onPop);
    document.addEventListener('click', onClick);
    return () => {
      window.removeEventListener('popstate', onPop);
      document.removeEventListener('click', onClick);
    };
  }, []);

  return route;
}
