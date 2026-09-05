/** So'zjang holati: chaqiruv, tezkor jang va jangning o'zi.
 *
 *  Butun mantiq serverda — bu yerda faqat chaqiruvlar, kuzatuv va taxta
 *  holati bor. Javob so'zi jang tugamaguncha mijozga kelmaydi, shuning
 *  uchun taxminni tekshirish ham serverda: `sendGuess` faqat ranglar
 *  qatorini qaytaradi.
 *
 *  Boshlangan jang brauzerda eslab qolinadi — sahifa yangilansa yoki
 *  odam adashib chiqib ketsa, o'yin joyidan davom etadi. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { functionError } from '../firebase/functions';
import type { Unsubscribe } from '../firebase/live';
import { useAuth } from './auth';
import {
  createChallenge,
  forfeit,
  joinByCode,
  leaveQueue,
  quickMatch,
  sendGuess,
  verdictsOf,
  watchBattle,
  watchQueue,
  type BattleDoc,
  type BattlePlayer,
} from './battle';
import { attemptsFor, DEFAULT_LENGTH, LENGTHS } from './modes';
import { keyAction, lengthOf, normalize, split, type Verdict } from './uz';

export type Phase = 'lobby' | 'searching' | 'waiting' | 'playing' | 'finished';

export interface BoardRow {
  units: string[];
  verdicts: Verdict[] | null;
}

const ACTIVE_KEY = 'sozgir.battle';
const LENGTH_KEY = 'sozgir.battle.length';
const wordsKey = (battleId: string) => `sozgir.battle.words.${battleId}`;

/** Navbatda turganda qidiruv shu oraliqda takrorlanadi.
 *
 *  Ikki sabab: ikki odam bir vaqtda qidirsa, har biri ikkinchisining
 *  yozuvi paydo bo'lishidan oldin qidirib ulgurishi mumkin; server esa
 *  navbatdagi 60 soniyadan eski yozuvni ko'rmaydi. */
const RETRY_MS = 10_000;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Shaxsiy rejim — jang faqat shu sahifada davom etadi.
  }
}

function drop(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // e'tiborsiz
  }
}

function storedLength(): number {
  const raw = read<number>(LENGTH_KEY, DEFAULT_LENGTH);
  return LENGTHS.includes(raw as (typeof LENGTHS)[number]) ? raw : DEFAULT_LENGTH;
}

export function useSozjang() {
  const { account } = useAuth();
  const uid = account?.uid ?? '';

  const [battleId, setBattleId] = useState<string | null>(() =>
    read<string | null>(ACTIVE_KEY, null),
  );
  const [battle, setBattle] = useState<BattleDoc | null>(null);
  const [searching, setSearching] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [length, setLength] = useState(storedLength);
  const [current, setCurrent] = useState<string[]>([]);
  /** Mening taxminlarim — serverda ular jang tugamaguncha yashirin, shu
   *  sabab harflarni ko'rsatish uchun brauzerda saqlanadi. Sahifa
   *  yangilanganda ham o'qiladi: aks holda taxta ranglar bilan qolib,
   *  harflar yo'qolardi. */
  const [words, setWords] = useState<string[]>(() => {
    const id = read<string | null>(ACTIVE_KEY, null);
    return id ? read<string[]>(wordsKey(id), []) : [];
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<{ index: number; unit: string } | null>(null);

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

  const open = useCallback((id: string) => {
    setBattleId(id);
    write(ACTIVE_KEY, id);
    setWords(read<string[]>(wordsKey(id), []));
    setCurrent([]);
    setHint(null);
    setMessage(null);
    setError(null);
  }, []);

  const close = useCallback(() => {
    setBattleId(null);
    setBattle(null);
    setWords([]);
    setCurrent([]);
    setHint(null);
    drop(ACTIVE_KEY);
  }, []);

  // Jangni kuzatamiz: raqibning har qatori shu orqali keladi.
  useEffect(() => {
    if (!battleId || !account) return;
    let alive = true;
    let stop: Unsubscribe | null = null;

    void watchBattle(battleId, (doc) => {
      if (alive) setBattle(doc);
    }).then((unsubscribe) => {
      if (alive) stop = unsubscribe;
      else unsubscribe();
    });

    return () => {
      alive = false;
      stop?.();
    };
  }, [account, battleId]);

  // Navbat: kimdir bizni tanlasa yozuvimizga `matchId` tushadi.
  useEffect(() => {
    if (!searching || !uid) return;
    let alive = true;
    let stop: Unsubscribe | null = null;

    void watchQueue(uid, (entry) => {
      if (!alive || !entry?.matchId) return;
      setSearching(false);
      open(entry.matchId);
    }).then((unsubscribe) => {
      if (alive) stop = unsubscribe;
      else unsubscribe();
    });

    return () => {
      alive = false;
      stop?.();
    };
  }, [open, searching, uid]);

  // Qidiruv davom etayotganini ko'rsatish va takroriy so'rov.
  useEffect(() => {
    if (!searching || !account) return;

    const tick = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    const retry = window.setInterval(() => {
      void quickMatch({ length, nickname: account.nickname })
        .then((reply) => {
          if (reply.battleId) {
            setSearching(false);
            open(reply.battleId);
          }
        })
        // Xato bo'lsa qidiruv to'xtamaydi — keyingi urinishda tuzalishi
        // mumkin (masalan raqib ayni damda boshqa jangga ketgan bo'lsa).
        .catch(() => undefined);
    }, RETRY_MS);

    return () => {
      window.clearInterval(tick);
      window.clearInterval(retry);
    };
  }, [account, length, open, searching]);

  const me: BattlePlayer | undefined = battle?.players?.[uid];
  const opponentUid = useMemo(() => {
    const keys = Object.keys(battle?.players ?? {});
    return keys.find((key) => key !== uid) ?? null;
  }, [battle, uid]);
  const opponent = opponentUid ? battle?.players?.[opponentUid] : undefined;

  const boardLength = battle?.length ?? length;
  const maxAttempts = attemptsFor(boardLength);

  const phase: Phase = !battleId
    ? searching
      ? 'searching'
      : 'lobby'
    : battle?.status === 'finished' || battle?.status === 'expired'
      ? 'finished'
      : battle?.status === 'waiting'
        ? 'waiting'
        : 'playing';

  // `me` hujjat bilan birga o'zgaradi — ro'yxat har renderda yangi
  // bo'lib qolmasligi uchun eslab qo'yiladi.
  const myRows = useMemo(() => me?.rows ?? [], [me]);
  const finished = me?.finished === true;

  const rows = useMemo<BoardRow[]>(() => {
    const out: BoardRow[] = myRows.map((row, index) => ({
      // Sahifa yangilangan bo'lsa harflar yo'q — faqat ranglar qoladi.
      units: split(words[index] ?? ''),
      verdicts: verdictsOf(row),
    }));
    if (!finished && phase === 'playing') out.push({ units: current, verdicts: null });
    while (out.length < maxAttempts) out.push({ units: [], verdicts: null });
    return out.slice(0, maxAttempts);
  }, [current, finished, maxAttempts, myRows, phase, words]);

  const keyState = useMemo(() => {
    const rank: Record<Verdict, number> = { absent: 1, present: 2, correct: 3 };
    const map = new Map<string, Verdict>();
    myRows.forEach((row, index) => {
      const units = split(words[index] ?? '');
      verdictsOf(row).forEach((verdict, position) => {
        const unit = units[position];
        if (!unit) return;
        const previous = map.get(unit);
        if (!previous || rank[verdict] > rank[previous]) map.set(unit, verdict);
      });
    });
    return map;
  }, [myRows, words]);

  const bump = useCallback(
    (text: string) => {
      setMessage(text);
      later(() => setMessage(null), 1800);
    },
    [later],
  );

  const submit = useCallback(async () => {
    if (!battleId || busy) return;
    const word = normalize(current.join(''));
    if (lengthOf(word) !== boardLength) {
      bump('Yetarli harf yo‘q');
      return;
    }

    setBusy(true);
    try {
      const reply = await sendGuess({ battleId, word });
      if (!reply.accepted) {
        bump(reply.reason ?? 'Bu so‘z qabul qilinmadi');
        return;
      }

      const next = [...words, word];
      setWords(next);
      write(wordsKey(battleId), next);
      setCurrent([]);
      if (reply.hint) {
        setHint(reply.hint);
        bump(`Maslahat: ${reply.hint.index + 1}-katak`);
      }
    } catch (raw) {
      bump(functionError(raw));
    } finally {
      setBusy(false);
    }
  }, [battleId, boardLength, bump, busy, current, words]);

  const press = useCallback(
    (key: string) => {
      if (phase !== 'playing' || finished || busy) return;
      if (key === 'enter') {
        void submit();
        return;
      }
      if (key === 'back') {
        setCurrent((units) => units.slice(0, -1));
        return;
      }
      if (current.length >= boardLength) {
        bump('Katak to‘lgan');
        return;
      }
      setCurrent((units) => [...units, key]);
    },
    [boardLength, bump, busy, current.length, finished, phase, submit],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const active = document.activeElement;
      if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) {
        return;
      }

      const action = keyAction(event.key, current.at(-1));
      if (!action) return;
      event.preventDefault();

      if (action.kind === 'enter') press('enter');
      else if (action.kind === 'back') press('back');
      else if (action.kind === 'letter') press(action.unit);
      else setCurrent((units) => [...units.slice(0, -1), action.unit]);
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current, press]);

  /** Har bir amal uchun bir xil o'ram: bandlik va xato. */
  const run = useCallback(async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (raw) {
      setError(functionError(raw));
    } finally {
      setBusy(false);
    }
  }, []);

  const pickLength = useCallback((next: number) => {
    setLength(next);
    write(LENGTH_KEY, next);
  }, []);

  const create = useCallback(
    () =>
      run(async () => {
        if (!account) return;
        const reply = await createChallenge({
          length,
          nickname: account.nickname,
        });
        open(reply.battleId);
      }),
    [account, length, open, run],
  );

  const join = useCallback(
    (code: string) =>
      run(async () => {
        if (!account) return;
        const reply = await joinByCode({
          code: code.toUpperCase().trim(),
          nickname: account.nickname,
        });
        open(reply.battleId);
      }),
    [account, open, run],
  );

  const quick = useCallback(
    () =>
      run(async () => {
        if (!account) return;
        setSeconds(0);
        const reply = await quickMatch({ length, nickname: account.nickname });
        if (reply.battleId) open(reply.battleId);
        else setSearching(true);
      }),
    [account, length, open, run],
  );

  const cancelSearch = useCallback(async () => {
    setSearching(false);
    await leaveQueue().catch(() => undefined);
  }, []);

  /** Jangdan chiqish. Boshlangan jangda taslim bo'lamiz: raqib cheksiz
   *  kutib qolmasligi kerak. */
  const leave = useCallback(async () => {
    const id = battleId;
    close();
    if (!id) return;
    if (phase === 'playing' && !finished) {
      await forfeit(id).catch(() => undefined);
    }
  }, [battleId, close, finished, phase]);

  return {
    account,
    phase,
    battle,
    battleId,
    code: battle?.inviteCode ?? null,
    me,
    opponent,
    opponentUid,
    length,
    boardLength,
    maxAttempts,
    rows,
    keyState,
    current,
    words,
    hint,
    message,
    error,
    busy,
    seconds,
    searching,
    pickLength,
    create,
    join,
    quick,
    cancelSearch,
    leave,
    press,
    clearError: () => setError(null),
  };
}

export type Sozjang = ReturnType<typeof useSozjang>;
