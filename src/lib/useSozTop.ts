/** So'ztop o'yin holati — kunlik va cheksiz rejim.
 *
 *  Demo emas: so'z ilovadagi lug'atning o'zidan olinadi, kunlik so'z esa
 *  avval serverdan (`daily/{sana}_5`), u bo'lmasa ilovadagi deterministik
 *  tanlov bilan aniqlanadi. Ya'ni saytdagi bugungi so'z telefondagisi
 *  bilan bir xil.
 *
 *  Boshlangan o'yin brauzerda saqlanadi: sahifa yangilanganda taxta
 *  o'sha holatda qaytadi va kunlik so'z ikki marta o'ynalmaydi. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { links } from '../data/site';
import { useAuth } from './auth';
import { dailyKey, dailyNumber, selectDailyWord } from './daily';
import { fetchDailyAnswer, loadDictionary, type Dictionary } from './dictionary';
import { attemptsFor, type Mode } from './modes';
import {
  ensureRestored,
  fetchDailyEntry,
  flushPending,
  foundSummary,
  nextEndlessNumber,
  readStats,
  recordOutcome,
  type FoundSummary,
  type GameStats,
} from './progress';
import {
  display,
  EMOJI,
  evaluate,
  isPlayable,
  LETTERS,
  lengthOf,
  normalize,
  split,
  TUTUQ,
  type Verdict,
} from './uz';

export interface Puzzle {
  answer: string;
  units: string[];
  mode: Mode;
  length: number;
  number: number;
  dateKey: string;
  categoryId?: string;
  description?: string;
}

export type Phase = 'loading' | 'playing' | 'won' | 'lost' | 'error';

export interface Row {
  units: string[];
  verdicts: Verdict[] | null;
}

export interface Result {
  points: number;
  stats: GameStats;
  total: FoundSummary;
  /** Nechanchi urinishda topilgan (yutqazilganda 0). */
  attempts: number;
  /** O'yin shu yerda emas, ilovada yoki boshqa qurilmada o'ynalgan.
   *  Bunda taxta ko'rsatilmaydi — bizda taxminlar yo'q. */
  elsewhere?: boolean;
}

interface StoredSession {
  answer: string;
  number: number;
  dateKey: string;
  guesses: string[];
  points?: number;
  done?: boolean;
  /** Natija boshqa joyda (ilovada) yozilgan — taxminlar bizda yo'q. */
  elsewhere?: boolean;
  attempts?: number;
}

const sessionKey = (mode: Mode, length: number) => `sozgir.game.${mode}.${length}`;

/** Kataklar ag'darilib bo'lgunicha ketadigan vaqt (CSS bilan bir xil). */
const revealMs = (length: number) => length * 130 + 320;

function readSession(mode: Mode, length: number): StoredSession | null {
  try {
    const raw = localStorage.getItem(sessionKey(mode, length));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    return parsed.answer ? parsed : null;
  } catch {
    return null;
  }
}

function writeSession(mode: Mode, length: number, session: StoredSession): void {
  try {
    localStorage.setItem(sessionKey(mode, length), JSON.stringify(session));
  } catch {
    // Saqlanmasa — o'yin faqat shu sahifada davom etadi.
  }
}

function describe(dictionary: Dictionary, answer: string) {
  const info = dictionary.words[answer];
  return {
    ...(info?.c ? { categoryId: info.c } : {}),
    ...(info?.d ? { description: info.d } : {}),
  };
}

/** Kunlik topishmoq: serverdagi so'z ustun, bo'lmasa lokal tanlov. */
async function dailyPuzzle(length: number): Promise<Puzzle> {
  const dictionary = await loadDictionary(length);
  const now = new Date();
  const dateKey = dailyKey(now);
  const number = dailyNumber(now);

  const remote = await fetchDailyAnswer({ dateKey, length });
  const usable =
    remote !== null && isPlayable(remote) && lengthOf(remote) === length;
  const answer = usable
    ? remote
    : selectDailyWord({ answers: dictionary.answers, number, length });

  return {
    answer,
    units: split(answer),
    mode: 'daily',
    length,
    number,
    dateKey,
    ...describe(dictionary, answer),
  };
}

async function endlessPuzzle(length: number, number: number): Promise<Puzzle> {
  const dictionary = await loadDictionary(length);
  const answer =
    dictionary.answers[Math.floor(Math.random() * dictionary.answers.length)]!;
  return {
    answer,
    units: split(answer),
    mode: 'endless',
    length,
    number,
    dateKey: '',
    ...describe(dictionary, answer),
  };
}

export function useSozTop({ mode, length }: { mode: Mode; length: number }) {
  const { account } = useAuth();

  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [past, setPast] = useState<Row[]>([]);
  const [current, setCurrent] = useState<string[]>([]);
  const [flipRow, setFlipRow] = useState(-1);
  const [shake, setShake] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [stats, setStats] = useState<GameStats>(() => readStats(mode, length));
  /** Barcha rejimlar bo'yicha jamlangan ball — statistika panelida
   *  ko'rsatiladi, shuning uchun holatda turadi. */
  const [total, setTotal] = useState<FoundSummary>(foundSummary);
  const [round, setRound] = useState(0);

  const accountRef = useRef(account);
  useEffect(() => {
    accountRef.current = account;
  }, [account]);

  const dictionary = useRef<Dictionary | null>(null);
  const timers = useRef<number[]>([]);
  /** «Yana bir so'z» bosilganmi — shundagina yangi raqam olinadi.
   *  Aks holda uzunlik almashtirilganda ham raqam behuda o'sardi. */
  const wantsNew = useRef(false);

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

  // Kirilganda: cloud'dagi natijalar tiklanadi va navbatdagi (mehmon
  // holatida o'ynalgan) natijalar reytingga yoziladi.
  useEffect(() => {
    if (!account) return;
    void ensureRestored(account)
      .then(() => flushPending(account))
      .then(() => {
        setStats(readStats(mode, length));
        setTotal(foundSummary());
      });
  }, [account, length, mode]);

  /** Natijani yozadi: ball, statistika, topilgan so'z va reyting. */
  const finish = useCallback(
    async (won: boolean, attempts: number, target: Puzzle) => {
      const recorded = await recordOutcome(
        {
          mode: target.mode,
          length: target.length,
          won,
          attempts,
          number: target.number,
          dateKey: target.dateKey,
          answer: target.answer,
          ...(target.categoryId ? { categoryId: target.categoryId } : {}),
        },
        account,
      );
      setResult({ ...recorded, attempts: won ? attempts : 0 });
      setStats(recorded.stats);
      setTotal(recorded.total);

      const session = readSession(target.mode, target.length);
      if (session) {
        writeSession(target.mode, target.length, {
          ...session,
          done: true,
          points: recorded.points,
          attempts,
        });
      }
    },
    [account],
  );

  /** `finish` hisob o'zgarganda yangilanadi, lekin topishmoq effekti unga
   *  bog'lanmasligi kerak — aks holda o'yin o'rtasida kirilganda taxta
   *  qaytadan yuklanardi. */
  const finishRef = useRef(finish);
  useEffect(() => {
    finishRef.current = finish;
  }, [finish]);

  /** Topishmoqni tayyorlaydi: boshlangan o'yin bo'lsa davom ettiradi. */
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        // Lug'at birinchi olinadi. Holat faqat shundan keyin yangilanadi:
        // eski taxta yangi so'z kelgunicha o'z holida turadi, ekran
        // bekorga «sakramaydi».
        const loaded = await loadDictionary(length);
        if (!alive) return;
        dictionary.current = loaded;

        const stored = readSession(mode, length);
        // Tugallanmagan cheksiz o'yin davom etadi — yangi raqam olinmaydi.
        const resume = mode === 'endless' && stored && !stored.done && !wantsNew.current;
        wantsNew.current = false;

        const next: Puzzle =
          resume && stored
            ? {
                answer: stored.answer,
                units: split(stored.answer),
                mode,
                length,
                number: stored.number,
                dateKey: '',
                ...describe(loaded, stored.answer),
              }
            : mode === 'daily'
              ? await dailyPuzzle(length)
              : await endlessPuzzle(length, nextEndlessNumber(length));

        if (!alive) return;

        // Kunlik o'yinni bir kunda bir marta: saqlangan holat qaytariladi.
        const sameGame =
          stored &&
          stored.answer === next.answer &&
          stored.number === next.number &&
          (mode !== 'daily' || stored.dateKey === next.dateKey);

        const guesses = sameGame ? stored.guesses : [];
        const rows: Row[] = guesses.map((word) => {
          const units = split(word);
          return { units, verdicts: evaluate(units, next.units) };
        });
        const won = rows.at(-1)?.verdicts?.every((v) => v === 'correct') ?? false;
        const lost = !won && rows.length >= attemptsFor(length);

        setPuzzle(next);
        setPast(rows);
        setCurrent([]);
        setMessage(null);
        setFlipRow(-1);
        setResult(null);
        setStats(readStats(mode, length));
        setTotal(foundSummary());
        setPhase(won ? 'won' : lost ? 'lost' : 'playing');
        if (won || lost) {
          if (stored?.done) {
            setResult({
              points: stored.points ?? 0,
              stats: readStats(mode, length),
              total: foundSummary(),
              attempts: stored.attempts ?? rows.length,
              ...(stored.elsewhere ? { elsewhere: true } : {}),
            });
          } else {
            // Oxirgi taxmindan keyin sahifa darhol yopilgan bo'lsa natija
            // yozilmagan qoladi — shu yerda yozib qo'yamiz.
            void finishRef.current(won, rows.length, next);
          }
        }
        if (!sameGame) {
          writeSession(mode, length, {
            answer: next.answer,
            number: next.number,
            dateKey: next.dateKey,
            guesses: [],
          });
        }
      } catch {
        if (alive) setPhase('error');
      }
    })();

    return () => {
      alive = false;
    };
    // `account` ataylab kuzatilmaydi: o'yin o'rtasida kirilsa taxta
    // qaytadan yuklanmasligi kerak.
  }, [length, mode, round]);

  /** Kunlik o'yin kuniga bitta — qurilmadan qat'i nazar.
   *
   *  Brauzerdagi yozuv faqat shu brauzerni biladi, telefonda o'ynalgan
   *  o'yinni esa bilmaydi. Shuning uchun kirilgan bo'lsa, kunlik
   *  reytingdagi bugungi yozuv tekshiriladi: u bor bo'lsa taxta yopiladi
   *  va natija ko'rsatiladi.
   *
   *  Bu shunchaki qoida emas, himoya ham: aks holda saytdagi o'yin
   *  `daily_results` dagi yozuvni qayta yozib, ilovada olingan yaxshiroq
   *  natijani yo'qotib yuborardi. */
  useEffect(() => {
    if (mode !== 'daily' || !account || !puzzle) return;
    if (phase !== 'playing') return;
    if (readSession(mode, length)?.done) return;

    let alive = true;
    (async () => {
      const entry = await fetchDailyEntry({
        uid: account.uid,
        dateKey: puzzle.dateKey,
        length: puzzle.length,
      });
      if (!alive || !entry || entry.number !== puzzle.number) return;

      writeSession(mode, length, {
        answer: puzzle.answer,
        number: puzzle.number,
        dateKey: puzzle.dateKey,
        guesses: [],
        done: true,
        elsewhere: true,
        points: entry.points,
        attempts: entry.attempts,
      });

      setPast([]);
      setCurrent([]);
      setPhase(entry.won ? 'won' : 'lost');
      setResult({
        points: entry.points,
        stats: readStats(mode, length),
        total: foundSummary(),
        attempts: entry.won ? entry.attempts : 0,
        elsewhere: true,
      });
    })();

    return () => {
      alive = false;
    };
  }, [account, length, mode, phase, puzzle]);

  const bump = useCallback(
    (text: string) => {
      setMessage(text);
      setShake(true);
      later(() => setShake(false), 420);
      later(() => setMessage(null), 1600);
    },
    [later],
  );

  const press = useCallback(
    (key: string) => {
      if (phase !== 'playing' || !puzzle) return;
      const answer = puzzle.units;

      if (key === 'back') {
        setCurrent((units) => units.slice(0, -1));
        return;
      }

      if (key === 'enter') {
        if (current.length < answer.length) {
          bump('Yetarli harf yo‘q');
          return;
        }
        const word = normalize(current.join(''));
        if (!dictionary.current?.valid.has(word)) {
          bump('Bu so‘z lug‘atda yo‘q');
          return;
        }

        const verdicts = evaluate(current, answer);
        const rowIndex = past.length;
        const attempts = rowIndex + 1;
        const won = verdicts.every((verdict) => verdict === 'correct');
        const lost = !won && attempts >= attemptsFor(puzzle.length);

        setPast((rows) => [...rows, { units: current, verdicts }]);
        setCurrent([]);
        setFlipRow(rowIndex);

        const session = readSession(puzzle.mode, puzzle.length);
        writeSession(puzzle.mode, puzzle.length, {
          answer: puzzle.answer,
          number: puzzle.number,
          dateKey: puzzle.dateKey,
          guesses: [...(session?.guesses ?? []), word],
        });

        // Natija kataklar ag'darilib bo'lgach ko'rsatiladi.
        if (won || lost) {
          later(() => {
            setPhase(won ? 'won' : 'lost');
            void finishRef.current(won, attempts, puzzle);
          }, revealMs(puzzle.length));
        }
        return;
      }

      if (current.length >= answer.length) {
        bump('Katak to‘lgan');
        return;
      }
      setCurrent((units) => [...units, key]);
    },
    [bump, current, later, past.length, phase, puzzle],
  );

  /** Fizik klaviatura: `sh`, `ch`, `oʻ`, `gʻ` oldingi harf bilan birikadi. */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const active = document.activeElement;
      if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) {
        return;
      }

      if (event.key === 'Enter') return press('enter');
      if (event.key === 'Backspace') return press('back');

      const char = event.key.toLowerCase();
      if (char.length !== 1) return;
      const last = current.at(-1);

      if (char === 'h' && (last === 's' || last === 'c')) {
        event.preventDefault();
        setCurrent((units) => [...units.slice(0, -1), `${last}h`]);
        return;
      }
      if ("'`‘’\u02bb\u02bc".includes(char)) {
        event.preventDefault();
        // `o` yoki `g` dan keyingi apostrof — tovush belgisi (`oʻ`, `gʻ`),
        // qolgan holatda tutuq belgisi (`maʼno`).
        if (last === 'o' || last === 'g') {
          setCurrent((units) => [...units.slice(0, -1), `${last}\u02bb`]);
        } else {
          press(TUTUQ);
        }
        return;
      }
      if (LETTERS.includes(char)) {
        event.preventDefault();
        press(char);
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current, press]);

  /** Klaviatura tugmalarining rangi — eng yaxshi natija saqlanadi. */
  const keyState = useMemo(() => {
    const rank: Record<Verdict, number> = { absent: 1, present: 2, correct: 3 };
    const map = new Map<string, Verdict>();
    for (const row of past) {
      row.verdicts?.forEach((verdict, index) => {
        const unit = row.units[index]!;
        const previous = map.get(unit);
        if (!previous || rank[verdict] > rank[previous]) map.set(unit, verdict);
      });
    }
    return map;
  }, [past]);

  const rows = useMemo<Row[]>(() => {
    const total = attemptsFor(puzzle?.length ?? length);
    const out: Row[] = [...past];
    if (phase === 'playing') out.push({ units: current, verdicts: null });
    while (out.length < total) out.push({ units: [], verdicts: null });
    return out.slice(0, total);
  }, [current, length, past, phase, puzzle]);

  /** Cheksiz rejimda yangi so'z. Kunlik o'yin bir kunda bitta. */
  const playAgain = useCallback(() => {
    if (mode === 'daily') return;
    wantsNew.current = true;
    setRound((value) => value + 1);
  }, [mode]);

  const retry = useCallback(() => setRound((value) => value + 1), []);

  /** Ulashish uchun spoylersiz matn — ilovadagi shakl bilan bir xil. */
  const shareText = useCallback(() => {
    if (!puzzle) return 'So‘ztop';
    const header =
      puzzle.mode === 'daily' ? `So‘ztop №${puzzle.number}` : 'So‘ztop · Cheksiz';
    const score =
      phase === 'won' ? `${past.length}/${attemptsFor(puzzle.length)}` : `X/${attemptsFor(puzzle.length)}`;
    const grid = past
      .map((row) => row.verdicts?.map((verdict) => EMOJI[verdict]).join('') ?? '')
      .join('\n');
    return `${header} · ${puzzle.length} harf · ${score}\n\n${grid}\n\n${links.share}`;
  }, [past, phase, puzzle]);

  return {
    phase,
    puzzle,
    rows,
    activeRow: past.length,
    flipRow,
    shake,
    message,
    keyState,
    result,
    stats,
    total,
    answerWord: puzzle ? display(puzzle.answer) : '',
    press,
    playAgain,
    retry,
    shareText,
  };
}

export type Game = ReturnType<typeof useSozTop>;
