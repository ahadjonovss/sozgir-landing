/** Landing faqat prod muhitiga ulanadi — sayt ochiq, dev bazasi kerak emas.
 *
 *  Bu kalitlar mijoz tomonida ochiq bo'lishi normal (Firebase web config).
 *  Ular endi faqat **kirish** uchun: ma'lumot `api.sozgir.uz` da va uni
 *  server tokenga qarab beradi.
 *
 *  `appId` admin panel bilan bir xil web ilova — Firebase konsolida
 *  landing uchun alohida ilova ochilsa, faqat shu fayl yangilanadi. */
export const firebaseConfig = {
  projectId: 'soztop-prod',
  apiKey: 'AIzaSyCWqqyVZdjBY6FSonDLfjXhfWBt_RODcfQ',
  authDomain: 'soztop-prod.firebaseapp.com',
  storageBucket: 'soztop-prod.firebasestorage.app',
  messagingSenderId: '599308684224',
  appId: '1:599308684224:web:a15f3cbef1169adabf1625',
} as const;

/** Lokal emulyatorga ulanish — endi faqat hisob uchun.
 *
 *  Prodda hisob ochmay kirishni sinash kerak bo'lganda:
 *
 *      firebase emulators:start --only auth --project soztop-prod
 *      VITE_EMULATOR=1 npm run dev
 *
 *  Ishlab chiqarish paketida bu shox butunlay yo'q: `import.meta.env.DEV`
 *  `false` bo'lganda bundler uni olib tashlaydi. */
export const useEmulator =
  import.meta.env.DEV && import.meta.env.VITE_EMULATOR === '1';

export const EMULATOR = {
  host: '127.0.0.1',
  auth: 9099,
} as const;
