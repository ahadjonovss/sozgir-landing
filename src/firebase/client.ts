/** Firebase SDK — faqat kerak bo'lganda yuklanadi.
 *
 *  Sahifaning asosiy vazifasi — tanishtirish, shuning uchun SDK bosh
 *  paketga qo'shilmaydi: `import()` uni alohida chunk qilib ajratadi va u
 *  faqat foydalanuvchi kirganda yoki natija saqlanganda tortiladi.
 *  O'yinning o'zi (lug'at, kunlik so'z) SDK'siz, REST bilan ishlaydi.
 *
 *  `firestore/lite` tanlandi: bizga faqat hujjat o'qish-yozish kerak,
 *  jonli tinglash (`onSnapshot`) va offline kesh kerak emas — lite variant
 *  esa to'liq SDK'dan ancha kichik. */
import { firebaseConfig } from './config';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore/lite';

export interface Client {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

let pending: Promise<Client> | null = null;

export function client(): Promise<Client> {
  pending ??= (async () => {
    const [{ initializeApp }, { getAuth }, { getFirestore }] = await Promise.all([
      import('firebase/app'),
      import('firebase/auth'),
      import('firebase/firestore/lite'),
    ]);

    const app = initializeApp(firebaseConfig);
    return { app, auth: getAuth(app), db: getFirestore(app) };
  })();
  return pending;
}
