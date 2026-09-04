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
