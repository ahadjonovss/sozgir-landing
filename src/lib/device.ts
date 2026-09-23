/** Brauzerdagi yozuvlarning egasi — ilovadagi `scores.owner` ning veb
 *  ko'chirmasi (`docs/scores.md`, 4-band).
 *
 *  Bugungi ball brauzerda, **yig'indining farqi** bilan hisoblanadi:
 *  hozirgi yig'indi minus kun boshidagi yig'indi. Hisob almashganda esa
 *  yangi hisobning butun tarixi bulutdan tiklanadi, baza esa avvalgi
 *  hisobdan qolardi — farq «bugun ishlangan ball» bo'lib kunlik jadvalga
 *  tushardi. Ilovada shu sabab prodda hisob almashtirgan odam bir zumda
 *  «kunning eng zo'ri» bo'lib qoldi (soztop, 891ab06).
 *
 *  Endi yozuvlarning egasi belgilanadi: uid almashsa, ballga aylanadigan
 *  hamma narsa tashlanadi va kun **hozirdan** boshlanadi. Hech narsa
 *  yo'qolmaydi — topilgan so'zlar, statistika va g'uncha yig'indisi
 *  bulutda o'z egasida turadi va kirilganda qaytadi.
 *
 *  Mehmon holatida o'ynalgani hisobga **qo'shiladi**: uid'siz o'ynagan
 *  odam kirsa, egasi endi yozib qo'yiladi va hech narsa tashlanmaydi. */
import { clearGuncha } from './gunchaProgress';
import { readNicknameOwner } from './nickname';
import { clearLocalProgress } from './progress';
import { clearDayTally } from './scores';

const OWNER_KEY = 'sozgir.scores.owner';

function readOwner(): string {
  try {
    return localStorage.getItem(OWNER_KEY)?.trim() ?? '';
  } catch {
    return '';
  }
}

function writeOwner(uid: string): void {
  try {
    localStorage.setItem(OWNER_KEY, uid);
  } catch {
    // Shaxsiy rejim — belgi qolmaydi, lekin u yerda yozuv ham qolmaydi.
  }
}

/** Hisobni brauzerga biriktiradi.
 *
 *  Egasi almashgan bo'lsa yozuvlar tashlanadi va `true` qaytadi.
 *
 *  Egasi hali belgilanmagan bo'lsa, oxirgi taxallusni qaysi hisob
 *  tanlagani ishlatiladi (`sozgir.nickname.uid`): shu belgi bu qoidadan
 *  oldin ham yozilgan, ya'ni eski brauzerlarda ham almashuv ko'rinadi.
 *  U ham bo'lmasa — mehmon o'ynagan, hech narsa tashlanmaydi. */
export function claimDevice(uid: string): boolean {
  if (!uid) return false;

  const owner = readOwner() || readNicknameOwner();
  if (owner === uid) return false;

  writeOwner(uid);
  if (!owner) return false;

  clearLocalProgress();
  clearGuncha();
  clearDayTally();
  return true;
}

/** Chiqilganda: yozuvlar egasi bilan ketadi.
 *
 *  Aks holda keyingi odam (yoki mehmon o'yin) avvalgi hisobning ballini
 *  meros qilib olardi. */
export function releaseDevice(): void {
  try {
    localStorage.removeItem(OWNER_KEY);
  } catch {
    // Belgi qolsa ham keyingi kirishda uid solishtiriladi.
  }
  clearLocalProgress();
  clearGuncha();
  clearDayTally();
}
