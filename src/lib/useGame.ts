/** O'yin dvigateli — ilovadagi `GameCubit` ning veb ko'rinishi.
 *
 *  Bir xil bo'lishi kerak bo'lgan joylar: kunlik so'z tanlovi, taxminni
 *  baholash, ball va topilgan harflarni avtomatik to'ldirish. */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { serverDaily } from './daily';
import {
  attemptsFor,
  dailyKeyFor,
  dailyNumberFor,
  descriptionDelayMs,
  hintDelayMs,
  scoreFor,
  selectDaily,
  type Mode,
} from './game';
import {
  answersOfCategory,
  isValidGuess,
  loadDictionary,
  type Dictionary,
  type WordInfo,
} from './dictionary';
import {
  addFound,
  clearGame,
  gameKey,
  loadGame,
  recordGame,
  saveGame,
  wasFound,
  type SavedGame,
  type Stats,
  type Status,
} from './storage';
import { display, evaluate, LETTERS, split, type Verdict } from './uz';

export const FLIP_MS = 320;
export const STAGGER_MS = 170;

export type Row = { units: string[]; verdicts: Verdict[] | null };

export type GameOptions = {
  mode: Mode;
  length: number;
  categoryId?: string;
};

export type Game = ReturnType<typeof useGame>;

const rowsOf = (guesses: string[][], answer: string[]): Row[] =>
  guesses.map((units) => ({ units, verdicts: evaluate(units, answer) }));

/** Har pozitsiya bo'yicha topilgan harf — keyingi qatorga o'zi yoziladi. */
function knownUnits(guesses: string[][], answer: string[]): (string | null)[] {
  const known: (string | null)[] = answer.map(() => null);
  for (const units of guesses) {
    units.forEach((unit, i) => {
      if (unit === answer[i]) known[i] = unit;
    });
  }
  return known;
}

export function useGame({ mode, length, categoryId }: GameOptions) {
  const number = useMemo(() => dailyNumberFor(), []);
  const key = useMemo(
    () => gameKey(mode, length, mode === 'daily' ? number : categoryId ? `${categoryId}.${length}` : length),
    [categoryId, length, mode, number],
  );

  const [dictionary, setDictionary] = useState<Dictionary | null>(null);
  const [answer, setAnswer] = useState<string[]>([]);
  const [word, setWord] = useState('');
  const [guesses, setGuesses] = useState<string[][]>([]);
  const [typed, setTyped] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>('playing');
  const [message, setMessage] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [flipRow, setFlipRow] = useState(-1);
  const [showResult, setShowResult] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [meaningUsed, setMeaningUsed] = useState(false);
  const [hintReady, setHintReady] = useState(false);
  const [meaningReady, setMeaningReady] = useState(false);
  const [score, setScore] = useState(0);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState(false);

  const timers = useRef<number[]>([]);
  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    },
    [],
  );

  const maxAttempts = attemptsFor(length);

  /** So'zni tanlaydi: kunlikda sana bo'yicha, qolganida tasodifiy. */
  const pick = useCallback(
    (dict: Dictionary): string => {
      if (mode === 'daily') return selectDaily(dict.answers, number, length);
      const pool = categoryId ? answersOfCategory(dict, categoryId) : dict.answers;
      const list = pool.length > 0 ? pool : dict.answers;
      return list[Math.floor(Math.random() * list.length)];
    },
    [categoryId, length, mode, number],
  );

  const start = useCallback(
    (dict: Dictionary, saved: SavedGame | null, preferred?: string) => {
      const chosen = saved?.answer ?? preferred ?? pick(dict);
      const units = split(chosen);
      setWord(chosen);
      setAnswer(units);
      setGuesses(saved?.guesses ?? []);
      setStatus(saved?.status ?? 'playing');
      setHintUsed(saved?.hint ?? false);
      setMeaningUsed(saved?.meaning ?? false);
      setTyped([]);
      setFlipRow(-1);
      setShowResult(false);
      setScore(saved?.score ?? 0);
      // Saqlangan o'yin ochilganda animatsiya bo'lmaydi, lekin yordam
      // tugmasi darhol ishlashi kerak — odam allaqachon o'ylagan.
      const played = (saved?.guesses.length ?? 0) > 0;
      setHintReady(played);
      setMeaningReady(played && (saved?.hint ?? false));
    },
    [pick],
  );

  useEffect(() => {
    let alive = true;
    // Lug'at tashqi manba — uzunlik o'zgarganda qaytadan yuklanadi.
    // oxlint-disable-next-line react/set-state-in-effect
    setDictionary(null);
    setError(false);
    loadDictionary(length)
      .then(async (dict) => {
        if (!alive) return;
        const saved = loadGame(key);
        // Kunlik so'z avval serverdan so'raladi — ilovadagi tartib.
        // Javob kelmasa deterministik tanlov ishlaydi va o'yin
        // kutib qolmaydi.
        const preferred =
          mode === 'daily' && !saved
            ? ((await serverDaily(dailyKeyFor(), length)) ?? undefined)
            : undefined;
        if (!alive) return;
        setDictionary(dict);
        start(dict, saved, preferred);
      })
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [key, length, mode, start]);

  /** Yordam taymerlari: avval mavzu, keyin ta'rif taklif qilinadi. */
  useEffect(() => {
    if (status !== 'playing') return;
    const hint = setTimeout(() => setHintReady(true), hintDelayMs(length));
    const meaning = setTimeout(() => setMeaningReady(true), descriptionDelayMs(length));
    return () => {
      clearTimeout(hint);
      clearTimeout(meaning);
    };
  }, [length, status]);

  const known = useMemo(() => knownUnits(guesses, answer), [answer, guesses]);

  /** Kiritilayotgan qator: topilgan harflar o'z joyida turadi. */
  const current = useMemo(() => {
    const row: string[] = [];
    let next = 0;
    for (const unit of known) {
      if (unit) row.push(unit);
      else if (next < typed.length) row.push(typed[next++]);
      else break;
    }
    return row;
  }, [known, typed]);

  const freeSlots = useMemo(() => known.filter((unit) => !unit).length, [known]);
  const complete = typed.length >= freeSlots;

  const info: WordInfo | undefined = dictionary?.words[word];

  const bump = useCallback((text: string) => {
    setMessage(text);
    setShake(true);
    setTimeout(() => setShake(false), 420);
    setTimeout(() => setMessage((old) => (old === text ? null : old)), 1600);
  }, []);

  const finish = useCallback(
    (won: boolean, attempts: number) => {
      const earned = won
        ? scoreFor({
            mode,
            length,
            attempts,
            maxAttempts,
            repeated: wasFound(word),
          })
        : 0;
      if (won && earned > 0) addFound(word, earned);
      setScore(earned);
      // Natija yopilib qayta ochilganda ham ball ko'rinsin.
      const finished = loadGame(key);
      if (finished) saveGame(key, { ...finished, score: earned });
      setStats(
        recordGame({ mode, length, won, attempts, number }),
      );
      setStatus(won ? 'won' : 'lost');
      later(() => setShowResult(true), 420);
    },
    [key, later, length, maxAttempts, mode, number, word],
  );

  const submit = useCallback(() => {
    if (status !== 'playing' || !dictionary) return;
    if (!complete) {
      bump('Harflar yetarli emas');
      return;
    }

    const guess = current;
    const text = guess.join('');
    if (!isValidGuess(dictionary, text)) {
      bump('Bunday so‘z lug‘atda yo‘q');
      return;
    }
    if (guesses.some((row) => row.join('') === text)) {
      bump('Bu so‘zni allaqachon aytdingiz');
      return;
    }

    const next = [...guesses, guess];
    setGuesses(next);
    setTyped([]);
    setFlipRow(next.length - 1);

    const won = guess.every((unit, i) => unit === answer[i]);
    const finished = won || next.length >= maxAttempts;
    const saved: SavedGame = {
      answer: word,
      guesses: next,
      status: won ? 'won' : finished ? 'lost' : 'playing',
      hint: hintUsed,
      meaning: meaningUsed,
    };
    saveGame(key, saved);

    if (finished) {
      later(() => finish(won, next.length), answer.length * STAGGER_MS + FLIP_MS);
    }
  }, [
    answer,
    bump,
    complete,
    current,
    dictionary,
    finish,
    guesses,
    hintUsed,
    key,
    later,
    maxAttempts,
    meaningUsed,
    status,
    word,
  ]);

  const press = useCallback(
    (unit: string) => {
      if (status !== 'playing') return;
      if (unit === 'enter') {
        submit();
        return;
      }
      if (unit === 'back') {
        setTyped((old) => old.slice(0, -1));
        return;
      }
      setTyped((old) => (old.length >= freeSlots ? old : [...old, unit]));
    },
    [freeSlots, status, submit],
  );

  const clear = useCallback(() => setTyped([]), []);

  /** Fizik klaviatura: `sh`, `ch`, `oʻ`, `gʻ` ikki bosishdan yig'iladi. */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const active = document.activeElement;
      if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) return;

      if (event.key === 'Enter') return press('enter');
      if (event.key === 'Backspace') {
        event.preventDefault();
        return press('back');
      }

      const ch = event.key.toLowerCase();
      if (ch.length !== 1) return;
      const last = typed.at(-1);

      if (ch === 'h' && (last === 's' || last === 'c')) {
        event.preventDefault();
        setTyped((old) => [...old.slice(0, -1), `${last}h`]);
        return;
      }
      if ("'`‘’".includes(ch) && (last === 'o' || last === 'g')) {
        event.preventDefault();
        setTyped((old) => [...old.slice(0, -1), `${last}ʻ`]);
        return;
      }
      if (LETTERS.includes(ch)) {
        event.preventDefault();
        press(ch);
      }
    };

    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [press, typed]);

  /** Klaviatura ranglari — har harfning eng yaxshi natijasi. */
  const keyState = useMemo(() => {
    const rank: Record<Verdict, number> = { absent: 1, present: 2, correct: 3 };
    const map = new Map<string, Verdict>();
    for (const row of rowsOf(guesses, answer)) {
      row.verdicts?.forEach((verdict, i) => {
        const unit = row.units[i];
        const previous = map.get(unit);
        if (!previous || rank[verdict] > rank[previous]) map.set(unit, verdict);
      });
    }
    return map;
  }, [answer, guesses]);

  const rows: Row[] = useMemo(() => {
    const out: Row[] = rowsOf(guesses, answer);
    if (status === 'playing' && answer.length > 0) out.push({ units: current, verdicts: null });
    while (out.length < maxAttempts) out.push({ units: [], verdicts: null });
    return out.slice(0, maxAttempts);
  }, [answer, current, guesses, maxAttempts, status]);

  /** Saqlangan o'yinga qo'shimcha belgi yozadi (yordam olingani kabi). */
  const remember = useCallback(
    (patch: Partial<SavedGame>) => {
      const saved = loadGame(key);
      if (saved) saveGame(key, { ...saved, ...patch });
    },
    [key],
  );

  const restart = useCallback(() => {
    if (!dictionary || mode === 'daily') return;
    clearGame(key);
    start(dictionary, null);
  }, [dictionary, key, mode, start]);

  /** Ulashish matni — ilovadagi `shareText()` bilan bir xil ko'rinishda. */
  const shareText = useCallback(() => {
    const header =
      mode === 'daily' ? `So‘zgir №${number}` : 'So‘zgir · Cheksiz';
    const result = status === 'won' ? `${guesses.length}/${maxAttempts}` : `X/${maxAttempts}`;
    const grid = rowsOf(guesses, answer)
      .map((row) =>
        row.verdicts
          ?.map((verdict) =>
            verdict === 'correct' ? '🟩' : verdict === 'present' ? '🟨' : '⬜',
          )
          .join(''),
      )
      .join('\n');
    const link = mode === 'daily' ? 'https://sozgir.uz/kunlik' : 'https://sozgir.uz';
    return `${header} · ${length} harf · ${result}\n\n${grid}\n\n${link}`;
  }, [answer, guesses, length, maxAttempts, mode, number, status]);

  return {
    loading: dictionary === null && !error,
    error,
    number,
    mode,
    length,
    maxAttempts,
    word,
    answerText: display(word),
    info,
    rows,
    activeRow: guesses.length,
    flipRow,
    status,
    message,
    shake,
    keyState,
    known,
    score,
    stats,
    showResult,
    hintReady,
    meaningReady,
    hintUsed,
    meaningUsed,
    revealHint: () => {
      setHintUsed(true);
      remember({ hint: true });
    },
    revealMeaning: () => {
      setHintUsed(true);
      setMeaningUsed(true);
      remember({ hint: true, meaning: true });
    },
    closeResult: () => setShowResult(false),
    openResult: () => setShowResult(true),
    press,
    clear,
    restart,
    shareText,
  };
}
