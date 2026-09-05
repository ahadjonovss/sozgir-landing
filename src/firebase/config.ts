/** Landing faqat prod muhitiga ulanadi — sayt ochiq, dev bazasi kerak emas.
 *
 *  Bu kalitlar mijoz tomonida ochiq bo'lishi normal (Firebase web config).
 *  Haqiqiy himoya — Firestore qoidalari: har kim faqat o'z hujjatlariga
 *  yozadi, lug'at va kunlik so'z esa hammaga faqat o'qish uchun ochiq.
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

/** Lokal emulyatorga ulanish.
 *
 *  So'zjang mantig'i Cloud Functions'da va u faqat prodga
 *  joylashtirilgan — ya'ni jangni sinash uchun prodda hisob ochib, real
 *  yozuv qoldirish kerak bo'lardi. Emulyator shu ehtiyojni yopadi:
 *
 *      firebase emulators:start --only auth,functions,firestore \
 *        --project soztop-prod
 *      VITE_EMULATOR=1 npm run dev
 *
 *  Ishlab chiqarish paketida bu shox butunlay yo'q: `import.meta.env.DEV`
 *  `false` bo'lganda bundler uni olib tashlaydi. */
export const useEmulator =
  import.meta.env.DEV && import.meta.env.VITE_EMULATOR === '1';

export const EMULATOR = {
  host: '127.0.0.1',
  auth: 9099,
  firestore: 8080,
  functions: 5001,
} as const;
