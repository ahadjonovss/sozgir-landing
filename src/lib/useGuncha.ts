/** G'uncha holati: kunlik g'uncha, mashq va topilgan so'zlar.
 *
 *  Butun mantiq brauzerda — g'uncha lug'atdan yasaladi, so'z ham shu
 *  yerda tekshiriladi (yakka o'yinda yashiradigan narsa yo'q). Serverdan
 *  faqat **kunlik g'unchaning harflari** olinadi: lug'at yangilanganda
 *  tanlov o'zgaradi, «kunlik» esa hamma uchun bir xil bo'lishi kerak.
 *
 *  Boshlangan g'uncha brauzerda eslab qolinadi: sahifa yangilansa ham
 *  topilgan so'zlar joyida turadi. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './auth';
import { dailyKey, dailyNumber } from './daily';
import {
  buildGuncha,
  gunchaFromLetters,
  judge,
  lettersOf,
  maxScoreOf,
  nextRank,
  rankOf,
  scoreForRank,
  VERDICT_TEXT,
  wordOf,
  type GunchaPuzzle,
} from './guncha';
import { gunchaLexicon } from './gunchaLexicon';
import { fetchDailyGuncha } from './gunchaDaily';
import {
  flushGuncha,
  nextPracticeNumber,
  practiceNumber,
  readRound,
  roundScore,
  saveRound,
} from './gunchaProgress';
import { shuffled } from './daily';
import { keyAction, normalize, split } from './uz';
import { gameKey } from './useScript';

export type GunchaMode = 'daily' | 'practice';

/** Yuklangan g'uncha — qaysi tanlovga tegishli ekani bilan.
 *
 *  Kalit bilan saqlanadi: rejim yoki mashq raqami o'zgarganda eskisi
 *  render paytida chiqarib tashlanadi va holatni effekt ichida tozalash
 *  kerak bo'lmaydi (aks holda har tanlovda ikki marta chiziladi). */
interface Loaded {
  key: string;
  puzzle: GunchaPuzzle | null;
  error: string | null;
  found: string[];
  order: string[];
}

/** Bo'sh ro'yxat — har renderda yangi massiv yasalmasin (aks holda
 *  `useMemo` va `useCallback` lar bekorga qayta ishlaydi). */
const NONE: string[] = [];

export function useGuncha() {
  const { account } = useAuth();
  const [mode, setMode] = useState<GunchaMode>('daily');
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  /** Yozilayotgan so'z ham kalit bilan: g'uncha almashsa o'zi tozalanadi. */
  const [input, setInput] = useState<{ key: string; units: string[] }>({
    key: '',
    units: [],
  });
  const [message, setMessage] = useState<string | null>(null);
  const [praise, setPraise] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  /** Mashq raqami — «Yangi g'uncha» bosilganda oshadi. */
  const [practice, setPractice] = useState(() => Math.max(1, practiceNumber()));

  const key = `${mode}-${mode === 'practice' ? practice : 'kunlik'}`;
  const current = loaded?.key === key ? loaded : null;
  const puzzle = current?.puzzle ?? null;
  const error = current?.error ?? null;
  const found = current?.found ?? NONE;
  const order = current?.order ?? NONE;
  const loading = current === null;
  const typed = input.key === key ? input.units : NONE;

  const setFound = useCallback(
    (words: string[]) =>
      setLoaded((state) => (state ? { ...state, found: words } : state)),
    [],
  );
  const setOrder = useCallback(
    (change: (petals: string[]) => string[]) =>
      setLoaded((state) => (state ? { ...state, order: change(state.order) } : state)),
    [],
  );
  const setTyped = useCallback(
    (change: (units: string[]) => string[]) =>
      setInput((state) => ({
        key,
        units: change(state.key === key ? state.units : []),
      })),
    [key],
  );

  const timers = useRef<number[]>([]);
  const later = useCallback((action: () => void, delay: number) => {
    timers.current.push(window.setTimeout(action, delay));
  }, []);
  useEffect(
    () => () => {
      for (const timer of timers.current) window.clearTimeout(timer);
      timers.current = [];
    },
    [],
  );

  // Kirilganda mehmon holatida yig'ilgan ball cloud'ga chiqadi — aks
  // holda u keyingi topilgan so'zgacha reytingda ko'rinmasdi.
  useEffect(() => {
    if (account) void flushGuncha(account);
  }, [account]);

  // G'unchani yasash: kunlikda harflar serverdan, mashqda lug'atdan.
  // Holat faqat `await` dan keyin yoziladi — sahifa bir marta chiziladi.
  useEffect(() => {
    let alive = true;
    const fail = (text: string) =>
      setLoaded({ key, puzzle: null, error: text, found: [], order: [] });

    void (async () => {
      try {
        const words = await gunchaLexicon();
        if (!alive) return;

        let next: GunchaPuzzle;
        if (mode === 'daily') {
          const number = dailyNumber();
          const letters = await fetchDailyGuncha({ dateKey: dailyKey(), number });
          if (!alive) return;
          if (!letters) {
            fail('Kunlik g‘uncha serverdan olinadi — internetni yoqib qayta urining');
            return;
          }
          next = gunchaFromLetters({
            lexicon: words,
            center: letters.center,
            petals: letters.petals,
            number: letters.number,
          });
        } else {
          next = buildGuncha({ lexicon: words, number: practice, daily: false });
        }

        setLoaded({
          key,
          puzzle: next,
          error: null,
          found: readRound(next),
          order: next.petals,
        });
      } catch {
        if (alive) fail('G‘unchani ochib bo‘lmadi — lug‘at yuklanmadi');
      }
    })();

    return () => {
      alive = false;
    };
  }, [key, mode, practice]);

  const score = useMemo(
    () => (puzzle ? roundScore(puzzle, found) : 0),
    [found, puzzle],
  );
  const maxScore = useMemo(() => (puzzle ? maxScoreOf(puzzle) : 0), [puzzle]);
  const allFound = puzzle !== null && found.length === puzzle.words.length;
  const rank = useMemo(
    () => rankOf({ score, maxScore, allFound }),
    [allFound, maxScore, score],
  );
  const toNext = useMemo(() => {
    const next = nextRank(rank);
    return next ? Math.max(0, scoreForRank(next, maxScore) - score) : 0;
  }, [maxScore, rank, score]);

  /** Topilgan so'zlar — yangisi tepada. */
  const foundWords = useMemo(() => {
    if (!puzzle) return [];
    return [...found]
      .reverse()
      .map((word) => wordOf(puzzle, word))
      .filter((word) => word !== null);
  }, [found, puzzle]);

  const bump = useCallback(
    (text: string) => {
      setMessage(text);
      setShake(true);
      later(() => setShake(false), 420);
      later(() => setMessage(null), 1800);
    },
    [later],
  );

  const submit = useCallback(() => {
    if (!puzzle) return;
    const word = normalize(typed.join(''));
    if (!word) return;

    const verdict = judge({ puzzle, word, found: new Set(found) });
    if (verdict !== 'accepted') {
      bump(VERDICT_TEXT[verdict]);
      setTyped(() => []);
      return;
    }

    const entry = wordOf(puzzle, word)!;
    const next = [...found, word];
    setFound(next);
    setTyped(() => []);
    saveRound({ puzzle, words: next, account });

    // Pangramma — o'yinning cho'qqisi, u alohida aytiladi.
    setPraise(
      entry.pangram ? 'Pangramma! +' + entry.score : `+${entry.score}`,
    );
    later(() => setPraise(null), 1400);
    if (next.length === puzzle.words.length) {
      later(() => bump('Barcha so‘zlar topildi!'), 400);
    }
  }, [account, bump, found, later, puzzle, setFound, setTyped, typed]);

  const press = useCallback(
    (unit: string) => {
      if (!puzzle) return;
      if (unit === 'enter') {
        submit();
        return;
      }
      if (unit === 'back') {
        setTyped((units) => units.slice(0, -1));
        return;
      }
      // Faqat g'unchadagi harflar — boshqasi shunchaki bosilmaydi.
      if (!lettersOf(puzzle).includes(unit)) return;
      setTyped((units) => (units.length >= 12 ? units : [...units, unit]));
    },
    [puzzle, setTyped, submit],
  );

  /** Barglarni aralashtirish — faqat ko'rinish, o'yin mantig'iga tegmaydi. */
  const shuffle = useCallback(() => {
    setOrder((petals) => shuffled(petals, Date.now() % 100000));
  }, [setOrder]);

  const clear = useCallback(() => setTyped(() => []), [setTyped]);

  const newPractice = useCallback(() => {
    setMode('practice');
    setPractice(nextPracticeNumber());
  }, []);

  const pickMode = useCallback((next: GunchaMode) => {
    setMode(next);
    // Mashqqa birinchi marta o'tilganda raqam hali yo'q bo'lishi mumkin.
    if (next === 'practice') setPractice((number) => Math.max(1, number));
  }, []);

  // Fizik klaviatura: `s`+`h` → SH qoidasi So'ztopdagi bilan bir xil.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const active = document.activeElement;
      if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) {
        return;
      }

      const last = typed[typed.length - 1];
      const action = keyAction(gameKey(event.key), last);
      if (!action) return;
      event.preventDefault();

      if (action.kind === 'enter') press('enter');
      else if (action.kind === 'back') press('back');
      else if (action.kind === 'letter') press(action.unit);
      else if (puzzle && lettersOf(puzzle).includes(action.unit)) {
        // Qo'shma harf oldingi katak bilan birikadi (`s` + `h` → `sh`).
        setTyped((units) => [...units.slice(0, -1), action.unit]);
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [press, puzzle, setTyped, typed]);

  return {
    account,
    mode,
    puzzle,
    order,
    typed,
    found,
    foundWords,
    score,
    maxScore,
    rank,
    toNext,
    allFound,
    message,
    praise,
    shake,
    error,
    loading,
    units: (word: string) => split(word),
    press,
    submit,
    clear,
    shuffle,
    pickMode,
    newPractice,
  };
}

export type Guncha = ReturnType<typeof useGuncha>;
