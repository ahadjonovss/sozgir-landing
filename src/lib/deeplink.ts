/** Ilova havolalari.
 *
 *  Sayt manzillari ilovaning universal link'lari bilan bir xil, ya'ni
 *  telefonda ilova o'rnatilgan bo'lsa havola o'zi ilovada ochiladi.
 *  «Ilovada ochish» tugmasi esa zaxira yo'ldan — ilovaning o'z sxemasi
 *  (`sozgir://`) bilan — uriniladi. */

export const SITE_URL = 'https://sozgir.uz';
export const APP_SCHEME = 'sozgir';

/** `/kunlik` → `sozgir://kunlik` */
export const appLink = (path: string) =>
  `${APP_SCHEME}://${path.replace(/^\//, '')}`;

export const battleUrl = (code: string) => `/jang/${code.toUpperCase()}`;
export const profileUrl = (uid: string) => `/u/${uid}`;
export const DAILY_URL = '/kunlik';

/** Jang kodi — server bergan olti belgili kod. */
export const isBattleCode = (value: string) => /^[A-Za-z0-9]{6}$/.test(value);

/** Firebase identifikatori. */
export const isUid = (value: string) => /^[A-Za-z0-9_-]{8,128}$/.test(value);

/** Telefonmi — «Ilovada ochish» faqat telefonda ma'noga ega. */
export const isMobile = () =>
  typeof navigator !== 'undefined' &&
  /android|iphone|ipad|ipod/i.test(navigator.userAgent);

/** Ilovani ochishga urinadi. Ilova yo'q bo'lsa hech narsa ko'rinmaydi,
 *  shuning uchun bir soniyadan keyin [fallback] chaqiriladi — odatda
 *  yuklab olish sahifasi. */
export function openInApp(path: string, fallback: () => void) {
  const started = Date.now();
  const timer = setTimeout(() => {
    // Ilova ochilgan bo'lsa sahifa fonga tushadi va taymer kechikadi.
    if (document.visibilityState === 'visible' && Date.now() - started < 2000) {
      fallback();
    }
  }, 1200);

  const onHide = () => clearTimeout(timer);
  document.addEventListener('visibilitychange', onHide, { once: true });

  location.href = appLink(path);
}
