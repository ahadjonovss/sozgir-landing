/** Jonli kuzatuv (`onSnapshot`).
 *
 *  Qolgan sahifalar `firestore/lite` bilan ishlaydi — u kichik, lekin
 *  tinglashni bilmaydi. Jangda esa raqibning har qatori darhol ko'rinishi
 *  kerak, shuning uchun shu yerda to'liq SDK ishlatiladi. U alohida chunk
 *  va faqat So'zjang sahifasida yuklanadi.
 *
 *  Ikki variant bitta `FirebaseApp` ustida yonma-yon yashaydi: SDK ularni
 *  alohida komponent sifatida ro'yxatga oladi. */
import { client } from './client';
import { EMULATOR, useEmulator } from './config';

export type Unsubscribe = () => void;

export async function watchDoc<T>(
  path: string,
  onData: (data: T | null) => void,
): Promise<Unsubscribe> {
  const { app } = await client();
  const { connectFirestoreEmulator, getFirestore, doc, onSnapshot } =
    await import('firebase/firestore');

  const db = getFirestore(app);
  if (useEmulator) connectFirestoreEmulator(db, EMULATOR.host, EMULATOR.firestore);

  return onSnapshot(
    doc(db, path),
    (snapshot) => onData(snapshot.exists() ? (snapshot.data() as T) : null),
    // Ulanish uzilsa jim o'tamiz: chaqiruvchi oxirgi holat bilan qoladi.
    () => onData(null),
  );
}
