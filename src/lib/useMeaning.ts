/** Tugagan o'yindagi so'zning ma'nosi — ilovadagi `GetWordDescription`.
 *
 *  Lug'at o'yin uchun baribir yuklanadi yoki keshda turadi, shuning uchun
 *  bu deyarli har doim darhol qaytadi. So'z yo'q bo'lsa (jang hali
 *  tugamagan) so'ralmaydi ham.
 *
 *  Javob so'zi bilan birga saqlanadi: yangi jangda eski ma'no bir zumga
 *  bo'lsa ham ekranda qolib ketmasin. */
import { useEffect, useState } from 'react';
import { wordMeaning } from './dictionary';

export function useMeaning(word: string | null | undefined, length: number): string | null {
  const [found, setFound] = useState<{ word: string; meaning: string | null } | null>(null);

  useEffect(() => {
    if (!word) return;
    let alive = true;
    void wordMeaning(word, length).then((meaning) => {
      if (alive) setFound({ word, meaning });
    });
    return () => {
      alive = false;
    };
  }, [length, word]);

  return word && found?.word === word ? found.meaning : null;
}
