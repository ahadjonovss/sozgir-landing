/** Firebase SDK — faqat **kirish** uchun va faqat kerak bo'lganda.
 *
 *  Sahifaning asosiy vazifasi — tanishtirish, shuning uchun SDK bosh
 *  paketga qo'shilmaydi: `import()` uni alohida chunk qilib ajratadi va
 *  u faqat foydalanuvchi kirganda tortiladi.
 *
 *  Ilgari bu yerda Firestore ham bor edi — o'yin ma'lumotlari o'sha
 *  yerdan o'qilardi. Endi hammasi `api.sozgir.uz` da (`src/api/`), bu
 *  faylda esa faqat hisob qoldi: token server uchun shu yerdan olinadi.
 *  Kirishning o'zi serverga ko'chganda bu papka butunlay yo'qoladi. */
import { EMULATOR, firebaseConfig, useEmulator } from './config';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';

export interface Client {
  app: FirebaseApp;
  auth: Auth;
}

let pending: Promise<Client> | null = null;

export function client(): Promise<Client> {
  pending ??= (async () => {
    const [{ initializeApp }, { getAuth }] = await Promise.all([
      import('firebase/app'),
      import('firebase/auth'),
    ]);

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);

    if (useEmulator) {
      const { connectAuthEmulator } = await import('firebase/auth');
      connectAuthEmulator(auth, `http://${EMULATOR.host}:${EMULATOR.auth}`, {
        disableWarnings: true,
      });
    }

    return { app, auth };
  })();
  return pending;
}
