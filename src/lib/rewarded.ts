/** Mukofotli reklama — ko'rsang ochiladi.
 *
 *  Ilovadagi `RewardedAdService` va `RewardedPlacement` ning sayt
 *  tarafdagi juftligi. To'rtta qoida o'sha yerdan keladi va ularning
 *  har biri sababga ega:
 *
 *  1. **Mukofot o'yinda ustunlik bermaydi.** U faqat *kirish* yoki
 *     *qulaylik* sotadi. Ball baribir terish orqali olinadi, ya'ni
 *     jadval reklama bilan sotib olinmaydi.
 *  2. **Reklama o'zi chiqmaydi** — faqat odam so'raganda. Majburlab
 *     chiqarilgani mukofotli emas, oraliq reklama bo'lib qoladi va
 *     tarmoq qoidasini buzadi. Majburiysi alohida joyda
 *     (`lib/adGate.ts`).
 *  3. **Qo'llagan va tasdiqlangan hisobdan so'ralmaydi** — ular buni
 *     pul bilan olgan.
 *  4. **Reklama topilmasa mukofot baribir beriladi.** Tarmoqning
 *     to'ldirish topolmagani odamning aybi emas va uni shu sababdan
 *     mahrum qilish saytni buzilgandek ko'rsatadi.
 *
 *  **Muddat ma'lumotning tabiatiga qarab tanlanadi** va bu eng
 *  muhim qaror. Abadiy ochib qo'yilgan o'zgaruvchan son ertaga
 *  eskirgan holda bepul ko'rinadi; har qarashda so'ralgan narsa esa
 *  ortga qaytib qarashni jazoga aylantiradi. */
import { rewardedReady, showRewarded } from './ads';
import { isAdFree } from './donor';
import { isVerifiedAsync } from './verified';

/** Mukofot qancha vaqt ochiq turadi. */
export type Scope =
  /** Shu varaq yopilguncha. O'zgarib turadigan sonlar uchun:
   *  keyingi safar qaraganda ular boshqacha bo'ladi. */
  | 'session'
  /** Bugun kechgacha. Bugun haqida gapiradigan kesimlar uchun. */
  | 'day'
  /** Butunlay — o'zgarmaydigan yoki bir martalik narsa uchun. */
  | 'forever';

/** Mukofot qayerda so'ralayotgani — ilovadagi `RewardedPlacement`.
 *
 *  Nom konsolda ham ishlatiladi: har mukofotga alohida blok ochilsa,
 *  qaysi biri qancha daromad keltirgani ajralib ko'rinadi. */
export type Placement =
  | 'profileViews'
  | 'headToHead'
  | 'scoreHistory'
  | 'answerReveal';

const SCOPES: Record<Placement, Scope> = {
  /* Ro'yxat o'sib boradi: yangi odam ochgan bo'lishi mumkin. */
  profileViews: 'session',
  /* Hisob faqat yangi jangdan keyin o'zgaradi, ya'ni kamdan-kam.
     Lekin «abadiy» ham to'g'ri emas: odam bugun ochib, ertaga
     o'ynab, yangi hisobni bepul ko'rardi. */
  headToHead: 'session',
  /* Har kuni yangi ustun qo'shiladi. */
  scoreHistory: 'day',
  /* Topilmay qolgan so'z — **abadiy**, lekin o'sha so'zga.
     Kalit topishmoqning raqami bo'ladi, ya'ni bugungi javobni
     ochgan odam ertangisini ochgan bo'lmaydi. Bir marta
     to'langan narsani ikkinchi marta so'rash esa noto'g'ri: so'z
     o'zgarmaydi va «yana ko'ring» degan taklif aldov bo'lardi. */
  answerReveal: 'forever',
};

const KEY = 'sozgir.rewarded';

/** Bugungi kun — `YYYY-MM-DD`, qurilma soati bo'yicha.
 *
 *  Server sanasi so'ralmaydi: bu qulf xavfsizlik emas, qulaylik. Soat
 *  o'zgartirilsa odam bir kunlik mukofotni erta oladi — zarari yo'q,
 *  chunki ochiladigan narsa uning o'z ma'lumoti. */
const today = (): string => new Date().toISOString().slice(0, 10);

/** Saqlanadigan kalit: joylashuv va (bo'lsa) nimaga tegishli ekani.
 *
 *  `subject` — mukofot bitta odamga yoki bitta qatorga tegishli
 *  bo'lganda: bir raqibning hisobini ochgan odam ikkinchisini
 *  ko'rgan bo'lmaydi. */
const keyOf = (placement: Placement, subject?: string): string =>
  subject ? `${placement}:${subject}` : placement;

/** Yashirin rejimda yoki saqlash bloklangan brauzerda `Storage` xato
 *  beradi. Bunda mukofot shu varaq ochiq turguncha xotirada qoladi:
 *  qulflab qo'yishdan ko'ra shunisi ma'qul. */
const memory = new Set<string>();

function store(scope: Scope): Storage | null {
  try {
    return scope === 'session' ? sessionStorage : localStorage;
  } catch {
    return null;
  }
}

/** Shu mukofot hozir ochiqmi. */
export function unlocked(placement: Placement, subject?: string): boolean {
  const key = keyOf(placement, subject);
  if (memory.has(key)) return true;

  const scope = SCOPES[placement];
  const box = store(scope);
  if (box === null) return false;

  try {
    const raw = box.getItem(`${KEY}.${key}`);
    if (raw === null) return false;
    // `day` da yozuvning o'zi sana: boshqa kun — yopiq.
    return scope === 'day' ? raw === today() : true;
  } catch {
    return false;
  }
}

function remember(placement: Placement, subject?: string): void {
  const key = keyOf(placement, subject);
  memory.add(key);

  const scope = SCOPES[placement];
  const box = store(scope);
  try {
    box?.setItem(`${KEY}.${key}`, scope === 'day' ? today() : '1');
  } catch {
    // Saqlanmadi — yuqoridagi xotira nusxasi shu varaqda ishlaydi.
  }
}

/** Shu odamdan reklama umuman so'ralmaydimi.
 *
 *  Uchinchi qoida. Blok sozlanmagan bo'lsa ham `true`: o'shanda
 *  ochiladigan narsa reklamasiz ochiladi va ekranda hech qanday qulf
 *  ko'rinmaydi. */
export async function freeFor(
  placement: Placement,
  uid: string | undefined,
): Promise<boolean> {
  if (!rewardedReady(placement)) return true;
  const [adFree, verified] = await Promise.all([
    isAdFree(uid),
    isVerifiedAsync(uid),
  ]);
  return adFree || verified;
}

/**
 * Reklamani ko'rsatadi va mukofotni ochadi.
 *
 * Javob har doim `true` — to'rtinchi qoida: reklama kelmasa ham
 * mukofot beriladi. Natija baribir qaytariladi, chunki chaqiruvchi
 * «ochildi» deb bilishi kerak.
 */
export async function watchFor(
  placement: Placement,
  subject?: string,
): Promise<boolean> {
  // Javobi e'tiborga olinmaydi: ko'rilgan ham, kelmagan ham
  // mukofotni ochadi. Farqi faqat daromadda.
  await showRewarded(placement);
  remember(placement, subject);
  return true;
}
