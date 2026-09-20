/** Rejim va so'z uzunligi tanlovi.
 *
 *  Alohida hook, chunki uni ikki joy ishlatadi: taxta va uning yonidagi
 *  statistika paneli. Ular bir xil rejimni ko'rsatishi kerak, shuning
 *  uchun tanlov yuqorida — sahifada turadi.
 *
 *  Rejim ataylab saqlanmaydi: sahifa har doim kunlik so'zdan boshlanadi
 *  («kuniga bitta so'z» — loyihaning o'zagi). Uzunlik esa saqlanadi:
 *  cheksiz rejimni 7 harfda o'ynagan odam har safar qaytadan tanlab
 *  o'tirmasligi kerak. */
import { useCallback, useMemo, useState } from 'react';
import { DAILY_LENGTH, DEFAULT_LENGTH, LENGTHS, type Mode } from './modes';

const LENGTH_KEY = 'sozgir.length';

function storedLength(): number {
  try {
    const raw = Number(localStorage.getItem(LENGTH_KEY));
    return LENGTHS.includes(raw as (typeof LENGTHS)[number]) ? raw : DEFAULT_LENGTH;
  } catch {
    return DEFAULT_LENGTH;
  }
}

/** [start] — sahifa qaysi rejim va uzunlikdan boshlanishi.
 *
 *  Standart holat kunlik so'z («kuniga bitta so'z» — loyihaning
 *  o'zagi). Uzunlik bo'yicha sahifalar (`/cheksiz/6-harf`) esa o'z
 *  holatini beradi: odam aynan o'sha o'yin uchun kelgan va uni yana
 *  qo'lda tanlab o'tirmasligi kerak. */
export function useGameChoice(start?: { mode?: Mode; length?: number }) {
  const [mode, setMode] = useState<Mode>(start?.mode ?? 'daily');
  const [endlessLength, setEndlessLength] = useState(
    () => start?.length ?? storedLength(),
  );

  const pickLength = useCallback((next: number) => {
    setEndlessLength(next);
    try {
      localStorage.setItem(LENGTH_KEY, String(next));
    } catch {
      // Tanlov saqlanmasa — keyingi tashrifda standart uzunlik bo'ladi.
    }
  }, []);

  return useMemo(
    () => ({
      mode,
      setMode,
      endlessLength,
      pickLength,
      length: mode === 'daily' ? DAILY_LENGTH : endlessLength,
    }),
    [endlessLength, mode, pickLength],
  );
}

export type GameChoice = ReturnType<typeof useGameChoice>;
