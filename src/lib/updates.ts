/** Yangiliklar: o'qilgani va o'qilmagani.
 *
 *  Sarlavhadagi belgida o'qilmagan yangiliklar soni turadi — odam
 *  saytga qaytganda «nima o'zgardi?» degan savolga javob shu yerdan
 *  chiqadi. Sahifa ochilgach sanoq o'chadi.
 *
 *  Brauzerda faqat **bitta sana** saqlanadi: oxirgi ko'rilgan yangilik
 *  sanasi. Shundan keyingi yozuvlar o'qilmagan hisoblanadi, ya'ni
 *  ro'yxat o'sganda alohida hisob yuritish kerak emas. */
import { useEffect, useState } from 'react';
import { UPDATES } from '../data/updates';

const KEY = 'sozgir.updates.seen';

function seenDate(): string {
  try {
    return localStorage.getItem(KEY) ?? '';
  } catch {
    return '';
  }
}

const listeners = new Set<() => void>();

/** Hammasi o'qilgan deb belgilaydi — yangiliklar sahifasi ochilganda. */
export function markUpdatesSeen(): void {
  try {
    localStorage.setItem(KEY, UPDATES[0]?.date ?? '');
  } catch {
    // Kesh yo'q — belgi qolaveradi, zarari yo'q.
  }
  for (const listener of listeners) listener();
}

/** O'qilmagan yangiliklar soni.
 *
 *  Birinchi tashrifda **nol**: saytga endi kirgan odamga «uchta yangilik
 *  bor» deyishning ma'nosi yo'q — u hali eskisini ham ko'rmagan. Shu
 *  sabab sana bo'sh bo'lsa ro'yxat o'qilgan hisoblanadi. */
export function useUnreadUpdates(): number {
  const [seen, setSeen] = useState(seenDate);

  useEffect(() => {
    const listener = () => setSeen(seenDate());
    listeners.add(listener);
    // Birinchi tashrif: sana yo'q bo'lsa hozirgi holat «o'qilgan» deb
    // yoziladi va belgi chiqmaydi.
    if (!seenDate()) markUpdatesSeen();
    return () => {
      listeners.delete(listener);
    };
  }, []);

  if (!seen) return 0;
  return UPDATES.filter((update) => update.date > seen).length;
}
