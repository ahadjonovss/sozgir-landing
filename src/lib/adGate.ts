/** Onlayn o'yin oldidagi reklama darvozasi.
 *
 *  Ilovadagi `InterstitialPrompter` ning ko'zgusi va o'sha sonlar
 *  bilan ishlaydi. Qoida bitta joyda yozilgani muhim: ikki ekranda
 *  ikki xil tez-tez chiqadigan reklama odamga «sayt ilovadan
 *  qiziqroq» yoki aksincha degan his qoldirardi.
 *
 *  **Qachon.** Faqat onlayn o'yin **boshlanishidan oldin**. O'yin
 *  oxirida emas: u odam uchun kutilmagan joy va to'liq ekranli oyna
 *  o'sha paytda sayt buzilgandek taassurot qoldirardi. O'rtasida ham
 *  emas — o'ynayotgan odamning qo'lidan hech narsa olinmaydi.
 *
 *  **Kimga.** Yakka o'yin (So'ztop, g'uncha, cheksiz) sanoqqa
 *  **kirmaydi**: oyna o'zi bilan o'zi o'ynagan odamdan so'ralmaydi.
 *  Qo'llagan va tasdiqlangan hisob reklama umuman ko'rmaydi, ya'ni
 *  ularga oyna ham chiqmaydi — aks holda «Reklamani ko'rish» bosilardi
 *  va hech narsa ochilmasdi.
 *
 *  **Uch chegara birga ishlaydi.** Ular bir-birini almashtirmaydi:
 *  yangi odamga umuman chiqmaydi, keyin har beshinchisida, va ikki
 *  reklama orasida eng kam tanaffus bor.
 *
 *  Sanoq `localStorage` da: u brauzerda qoladi va sahifa
 *  yangilanganda ham yo'qolmaydi. Hisobga bog'lanmagan — chegara
 *  odamni emas, brauzerni o'lchaydi va serverga yana bitta yozuv
 *  qo'shishga arzimaydi. */
import { fullscreenReady, showFullscreen } from './ads';
import { isAdFree } from './donor';
import { isVerifiedAsync } from './verified';

/** Shuncha o'yin o'ynamagan odamga darvoza umuman chiqmaydi.
 *
 *  Saytni endi ochgan odam birinchi o'yinidayoq to'liq ekranli
 *  reklamaga duch kelsa, u qaytib kelmaydi. */
const FIRST_AFTER_GAMES = 5;

/** Har nechanchi reklamasiz o'ynalgan onlayn o'yindan keyin.
 *
 *  Son oynaning o'zida ham aytiladi — odam nimadan qutulishini
 *  biladi. */
export const EVERY_GAMES = 5;

/** Ikki reklama orasidagi eng kam tanaffus.
 *
 *  Beshta o'yin tez o'ynalsa (g'unchada uch daqiqalik jang) oyna
 *  ketma-ket chiqib ketardi. */
const COOLDOWN_MS = 5 * 60_000;

const KEY_GAMES = 'sozgir.adgate.games';
const KEY_TOTAL = 'sozgir.adgate.total';
const KEY_LAST = 'sozgir.adgate.lastAt';

/** Yashirin rejimda yoki saqlash bloklangan brauzerda `localStorage`
 *  xato beradi. Bunda darvoza umuman ishlamaydi va o'yin to'xtamaydi:
 *  reklama yo'qligi odamni o'yinga kiritmaslik uchun sabab emas. */
function read(key: string): number {
  try {
    return Number(localStorage.getItem(key)) || 0;
  } catch {
    return 0;
  }
}

function write(key: string, value: number): void {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // Saqlanmadi — sanoq shu varaq ochiq turguncha yashaydi.
  }
}

/** Tugagan onlayn o'yin qayd etiladi.
 *
 *  Reklama bu yerda chiqmaydi — faqat sanoq o'sadi. U keyingi onlayn
 *  o'yin oldidagi oynani uyg'otadi ([gateBeforeOnlineGame]). */
export function registerOnlineGame(): void {
  write(KEY_GAMES, read(KEY_GAMES) + 1);
  write(KEY_TOTAL, read(KEY_TOTAL) + 1);
}

/* ── Oyna bilan aloqa ───────────────────────────────────────────────── */

/** Odamning javobi: reklamani ko'rish yoki oynani yopish. */
export type GateAnswer = 'watch' | 'closed';

type Show = (open: boolean) => void;

let onShow: Show | null = null;
let answer: ((value: GateAnswer) => void) | null = null;

/** Oyna o'zini ro'yxatga oladi (`AdGate`). Bitta nusxa yetadi. */
export function watchGate(show: Show): () => void {
  onShow = show;
  return () => {
    onShow = null;
  };
}

/** Oyna javobni shu yerga qaytaradi. */
export function answerGate(value: GateAnswer): void {
  const resolve = answer;
  answer = null;
  onShow?.(false);
  resolve?.(value);
}

function ask(): Promise<GateAnswer> {
  if (onShow === null) return Promise.resolve('watch');
  return new Promise<GateAnswer>((resolve) => {
    answer = resolve;
    onShow?.(true);
  });
}

/* ── Qaror ──────────────────────────────────────────────────────────── */

async function due(uid: string | undefined): Promise<boolean> {
  // Reklama yo'q bo'lsa **oyna ham yo'q**: u bo'sh va'da bo'lib
  // qolardi — «Reklamani ko'rish» bosilardi-yu, hech narsa
  // ochilmasdi.
  if (!fullscreenReady()) return false;
  if (read(KEY_TOTAL) < FIRST_AFTER_GAMES) return false;
  if (read(KEY_GAMES) < EVERY_GAMES) return false;

  const last = read(KEY_LAST);
  if (last > 0 && Date.now() - last < COOLDOWN_MS) return false;

  // Qo'llagan va tasdiqlangan hisobga reklama umuman so'ralmaydi —
  // `AdBanner` dagi shartning o'zi.
  const [adFree, verified] = await Promise.all([
    isAdFree(uid),
    isVerifiedAsync(uid),
  ]);
  return !adFree && !verified;
}

/** Hozir ketayotgan darvoza — bo'lmasa `null`.
 *
 *  Ikkita chaqiruv bitta oyna ko'rsin: ikkala tugma ham sanoqni bir
 *  xil (hali nolga qaytmagan) holda ko'rib, ikkalasi ham «navbat
 *  keldi» deyishi mumkin. */
let pending: Promise<boolean> | null = null;

/**
 * Onlayn o'yin boshlanishidan oldin chaqiriladi.
 *
 * Javob — **reklama chiqdimi** emas, **o'yinni boshlash mumkinmi**:
 *
 *   * `true` — davom etadi (navbat kelmagan, reklama ko'rildi yoki
 *     reklamaning o'zi chiqmadi);
 *   * `false` — odam oynani yopdi, ya'ni o'yindan voz kechdi. Uni
 *     zo'rlab raqib qidiruviga tashlab bo'lmaydi.
 *
 * Sanoq **faqat reklama ko'rilganda** nolga qaytadi. Oyna yopilsa
 * joyida qoladi va keyingi o'yinda yana so'raladi — shunda oyna
 * e'tiborsiz qoldirib ketadigan narsaga aylanmaydi.
 */
export function gateBeforeOnlineGame(uid: string | undefined): Promise<boolean> {
  return (pending ??= run(uid).finally(() => {
    pending = null;
  }));
}

async function run(uid: string | undefined): Promise<boolean> {
  if (!(await due(uid))) return true;

  if ((await ask()) === 'closed') return false;

  const shown = await showFullscreen();
  // Reklama kelmadi — odam to'xtatib qolinmaydi va sanoq ham joyida
  // qoladi: keyingi qulay paytda yana uriniladi.
  if (!shown) return true;

  write(KEY_GAMES, 0);
  write(KEY_LAST, Date.now());
  return true;
}
