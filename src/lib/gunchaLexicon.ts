/** G'uncha lug'ati — bir marta yig'iladi.
 *
 *  To'rtta hujjat (4–7 harf) o'qiladi va ulardan g'uncha uchun so'zlar
 *  ro'yxati tuziladi. Yakka o'yin ham, jang ham shu yerdan oladi: hisob
 *  og'ir emas, lekin uni har sahifada qaytarishning ma'nosi yo'q. */
import { loadDictionary } from './dictionary';
import { buildLexicon, type GunchaLexicon } from './guncha';
import { LENGTHS } from './modes';

let task: Promise<GunchaLexicon> | null = null;

export function gunchaLexicon(): Promise<GunchaLexicon> {
  task ??= Promise.all(LENGTHS.map((length) => loadDictionary(length)))
    .then(buildLexicon)
    .catch((error: unknown) => {
      // Yiqilgan urinish keshda qolib ketmasin — keyingi chaqiruv
      // qaytadan urinsin.
      task = null;
      throw error;
    });
  return task;
}
