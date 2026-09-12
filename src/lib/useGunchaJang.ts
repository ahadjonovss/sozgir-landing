/** G'uncha jangining holati: chaqiruv, tezkor jang, sanoq va so'zlar.
 *
 *  Ikki narsa So'zjangdan farq qiladi:
 *
 *  **Vaqt.** Ekrandagi teskari sanoq — ko'rsatma, chegara emas: chegarani
 *  server hal qiladi. Sanoq `Date.now()` ga emas, `performance.now()` ga
 *  tayanadi — qurilma soati o'yin o'rtasida o'zgartirilsa ham sakramaydi.
 *  Qolgan vaqt serverdan kelgan ikki sondan olinadi (`endsAt` va
 *  `serverNow` farqi) va har qaytishda qaytadan so'raladi. Sinxrondan
 *  keyin vaqt faqat **qisqaradi**: odamga bor vaqtdan kamroq ko'rsatish —
 *  noqulaylik, ko'proq ko'rsatish esa aldov.
 *
 *  **So'z.** Har bir so'z serverga boradi, lekin javob kutilmaydi: uch
 *  daqiqalik poygada har so'z uchun borib kelish sezilarli. Shuning uchun
 *  so'z avval brauzerdagi lug'at bilan baholanadi va ball darhol
 *  ko'rinadi, server javobi kelgach esa hisob to'g'rilanadi. Ikkalasi
 *  deyarli har doim mos keladi — mos kelmaydigan holat muddat o'tib
 *  ketgani va u jangning oxirgi soniyasida bo'ladi. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { functionError } from '../firebase/functions';
import type { Unsubscribe } from '../firebase/live';
import { onBattleOpen, readActive, setActive } from './activeBattle';
import { useAuth } from './auth';
import {
  forfeit,
  joinByCode,
  leaveQueue,
  quickMatch,
  watchBattle,
  watchQueue,
  type BattleDoc,
  type BattlePlayer,
} from './battle';
import { shuffled } from './daily';
import {
  gunchaFromLetters,
  judge,
  maxScoreOf,
  VERDICT_TEXT,
  wordOf,
  type GunchaPuzzle,
} from './guncha';
import {
  createGunchaBattle,
  finishGunchaBattle,
  GUNCHA_SECONDS,
  sendGunchaWord,
  WORD_REASON,
} from './gunchaBattle';
import { gunchaLexicon } from './gunchaLexicon';
import { DEFAULT_LENGTH } from './modes';
import {
  REACTION_COOLDOWN_MS,
  sendReaction,
  watchReactions,
  type ReactionKey,
} from './reactions';
import { keyAction, normalize } from './uz';
import { gameKey } from './useScript';

export type GunchaPhase =
  | 'lobby'
  | 'searching'
  | 'loading'
  | 'waiting'
  | 'playing'
  | 'finishing'
  | 'finished';

const wordsKey = (battleId: string) => `sozgir.guncha.battle.words.${battleId}`;

/** Navbatda turganda qidiruv shu oraliqda takrorlanadi — So'zjangdagi
 *  bilan bir xil sabab: server 60 soniyadan eski yozuvni ko'rmaydi. */
const RETRY_MS = 10_000;

/** Yengil sinxronlash: raqib bali bilan bir yo'la vaqt ham tekshiriladi. */
const SYNC_MS = 30_000;

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
    // Shaxsiy rejim — so'zlar faqat shu sahifada qoladi.
  }
}

export function useGunchaJang() {
  const { account } = useAuth();
  const uid = account?.uid ?? '';

  const [battleId, setBattleId] = useState<string | null>(() => readActive('guncha'));
  const [battle, setBattle] = useState<BattleDoc | null>(null);
  const [puzzle, setPuzzle] = useState<GunchaPuzzle | null>(null);
  const [order, setOrder] = useState<string[]>([]);
  const [typed, setTyped] = useState<string[]>([]);
  /** Mening topgan so'zlarim. Serverda ular jang tugamaguncha yashirin
   *  (raqibga tayyor javob bo'lardi), shuning uchun brauzerda saqlanadi. */
  const [mine, setMine] = useState<string[]>(() => {
    const id = readActive('guncha');
    return id ? read<string[]>(wordsKey(id), []) : [];
  });
  const [left, setLeft] = useState(GUNCHA_SECONDS);
  const [searching, setSearching] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [praise, setPraise] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [incoming, setIncoming] = useState<{ key: ReactionKey; token: number } | null>(
    null,
  );
  const [sentReaction, setSentReaction] = useState<ReactionKey | null>(null);

  /** Sanoqning tayanchi: serverdan olingan qolgan vaqt va o'sha paytdagi
   *  `performance.now()`. Qurilma soatiga umuman qaralmaydi. */
  const base = useRef<{ ms: number; at: number } | null>(null);
  const waiting = useRef(true);
  const lastLeft = useRef<string | null>(null);
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

  /** Serverdan kelgan ikki son — qolgan vaqt shundan. Sinxrondan keyin
   *  vaqt faqat qisqaradi. */
  const sync = useCallback((endsAt?: number, serverNow?: number) => {
    if (!endsAt || !serverNow) return;
    const ms = Math.max(0, endsAt - serverNow);
    const previous = base.current;
    const now = performance.now();
    const current = previous ? Math.max(0, previous.ms - (now - previous.at)) : Infinity;
    if (ms > current) return;
    base.current = { ms, at: now };
    setLeft(Math.ceil(ms / 1000));
  }, []);

  const open = useCallback((id: string) => {
    setBattleId(id);
    setBattle(null);
    setPuzzle(null);
    setActive('guncha', id);
    setMine(read<string[]>(wordsKey(id), []));
    setTyped([]);
    setMessage(null);
    setError(null);
    setIncoming(null);
    setFinishing(false);
    base.current = null;
    setLeft(GUNCHA_SECONDS);
  }, []);

  useEffect(() => onBattleOpen('guncha', open), [open]);

  const close = useCallback(() => {
    setBattleId(null);
    setBattle(null);
    setPuzzle(null);
    setMine([]);
    setTyped([]);
    setFinishing(false);
    base.current = null;
    setActive('guncha', null);
  }, []);

  // Jangni kuzatamiz: raqibning bali shu orqali o'sadi.
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

  // Raqibning reaksiyalari — jang hujjatidan alohida kolleksiya.
  useEffect(() => {
    if (!battleId || !uid) return;
    let alive = true;
    let stop: Unsubscribe | null = null;

    void watchReactions(battleId, uid, (key) => {
      if (!alive) return;
      setIncoming((previous) => ({ key, token: (previous?.token ?? 0) + 1 }));
    }).then((unsubscribe) => {
      if (alive) stop = unsubscribe;
      else unsubscribe();
    });

    return () => {
      alive = false;
      stop?.();
    };
  }, [battleId, uid]);

  // G'uncha harflari hujjatda: so'zlar ro'yxatini brauzer o'zi yig'adi.
  const center = battle?.guncha?.center;
  const petals = battle?.guncha?.petals;
  useEffect(() => {
    if (!center || !petals?.length) return;
    let alive = true;

    void gunchaLexicon()
      .then((lexicon) => {
        if (!alive) return;
        const next = gunchaFromLetters({
          lexicon,
          center,
          petals,
          number: 0,
          daily: false,
        });
        setPuzzle(next);
        setOrder(next.petals);
      })
      .catch(() => {
        // Lug'at yuklanmadi yoki eskirgan: o'yin baribir o'ynaladi —
        // so'zni server tekshiradi, faqat ball kechikib ko'rinadi.
        if (alive) setOrder(petals);
      });

    return () => {
      alive = false;
    };
  }, [center, petals]);

  // Navbat: kimdir bizni tanlasa yozuvimizga `matchId` tushadi.
  useEffect(() => {
    if (!searching || !uid) return;
    let alive = true;
    let stop: Unsubscribe | null = null;

    void watchQueue(uid, (entry) => {
      if (!alive) return;
      waiting.current = !entry || entry.status === 'waiting';
      if (!entry?.matchId || entry.matchId === lastLeft.current) return;
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
      if (!waiting.current) return;
      void quickMatch({
        length: DEFAULT_LENGTH,
        nickname: account.nickname,
        game: 'guncha',
      })
        .then((reply) => {
          if (reply.battleId) {
            setSearching(false);
            open(reply.battleId);
          }
        })
        .catch(() => undefined);
    }, RETRY_MS);

    return () => {
      window.clearInterval(tick);
      window.clearInterval(retry);
    };
  }, [account, open, searching]);

  const me: BattlePlayer | undefined = battle?.players?.[uid];
  const opponentUid = useMemo(() => {
    const keys = Object.keys(battle?.players ?? {});
    return keys.find((key) => key !== uid) ?? null;
  }, [battle, uid]);
  const opponent = opponentUid ? battle?.players?.[opponentUid] : undefined;

  const status = battle?.status;
  const running = status === 'running';
  const done = status === 'finished' || status === 'expired';

  const phase: GunchaPhase = !battleId
    ? searching
      ? 'searching'
      : 'lobby'
    : !battle
      ? 'loading'
      : done
        ? 'finished'
        : status === 'waiting'
          ? 'waiting'
          : finishing
            ? 'finishing'
            : 'playing';

  /** Serverdan qolgan vaqtni so'raydi.
   *
   *  `gunchaFinish` ikki ishni bajaradi: muddat o'tgan bo'lsa jangni
   *  yakunlaydi, o'tmagan bo'lsa `endsAt` va `serverNow` ni qaytaradi.
   *  Ya'ni sinxronlash ham, yakunlash ham bitta chaqiruv. */
  const resync = useCallback(async () => {
    if (!battleId) return;
    try {
      const reply = await finishGunchaBattle(battleId);
      if (!reply.finished) sync(reply.endsAt, reply.serverNow);
    } catch {
      // Sinxronlanmadi — sanoq o'z tayanchi bilan davom etadi.
    }
  }, [battleId, sync]);

  // Jang boshlangan zahoti va har qaytishda qolgan vaqt qayta so'raladi.
  useEffect(() => {
    if (!running || !battleId) return;
    void resync();

    const timer = window.setInterval(() => void resync(), SYNC_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void resync();
    };
    window.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('visibilitychange', onVisible);
    };
  }, [battleId, resync, running]);

  // Ekrandagi sanoq — `performance.now()` bo'yicha.
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      const anchor = base.current;
      if (!anchor) return;
      const ms = Math.max(0, anchor.ms - (performance.now() - anchor.at));
      setLeft(Math.ceil(ms / 1000));
      if (ms <= 0) {
        // Nol bo'lgach ekran darhol yopilmaydi: «Yakunlanmoqda…» turadi
        // va server javobi kutiladi — aks holda oxirgi so'z hisoblanmay
        // qolgandek tuyulardi.
        setFinishing(true);
        void resync();
      }
    }, 250);
    return () => window.clearInterval(timer);
  }, [resync, running]);

  const score = useMemo(() => {
    if (puzzle) {
      return mine.reduce((sum, word) => sum + (wordOf(puzzle, word)?.score ?? 0), 0);
    }
    // Lug'atsiz qolgan holat: serverdagi hisob ko'rsatiladi.
    return me?.score ?? 0;
  }, [me?.score, mine, puzzle]);

  const maxScore = useMemo(() => (puzzle ? maxScoreOf(puzzle) : 0), [puzzle]);

  const bump = useCallback(
    (text: string) => {
      setMessage(text);
      setShake(true);
      later(() => setShake(false), 420);
      later(() => setMessage(null), 1800);
    },
    [later],
  );

  /** Topgan so'zlarim — har doim **oldingi holatdan** yangilanadi:
   *  serverning javobi kechikib kelganda oradagi so'z yo'qolmasin. */
  const remember = useCallback(
    (change: (words: string[]) => string[]) => setMine(change),
    [],
  );

  // Ro'yxat brauzerda saqlanadi: sahifa yangilansa ham so'zlar qoladi
  // (serverda ular jang tugamaguncha yashirin).
  useEffect(() => {
    if (battleId) write(wordsKey(battleId), mine);
  }, [battleId, mine]);

  const submit = useCallback(() => {
    if (!battleId || phase !== 'playing') return;
    const word = normalize(typed.join(''));
    if (!word) return;
    setTyped([]);

    // Brauzerdagi lug'at bilan darhol baholanadi — kutish yo'q.
    if (puzzle) {
      const verdict = judge({ puzzle, word, found: new Set(mine) });
      if (verdict !== 'accepted') {
        bump(VERDICT_TEXT[verdict]);
        return;
      }
      const entry = wordOf(puzzle, word)!;
      remember((words) => [...words, word]);
      setPraise(entry.pangram ? `Pangramma! +${entry.score}` : `+${entry.score}`);
      later(() => setPraise(null), 1400);
    }

    void sendGunchaWord({ battleId, word })
      .then((reply) => {
        if (reply.accepted) {
          // Lug'atsiz o'ynayotgan bo'lsak so'z shu yerda qo'shiladi.
          if (!puzzle) {
            remember((words) => (words.includes(word) ? words : [...words, word]));
          }
          return;
        }
        // Server rad etdi — so'z ekrandan olinadi va ball tushadi.
        remember((words) => words.filter((item) => item !== word));
        bump(WORD_REASON[reply.reason ?? ''] ?? 'So‘z qabul qilinmadi');
        if (reply.reason === 'expired') setFinishing(true);
      })
      .catch((raw) => {
        remember((words) => words.filter((item) => item !== word));
        bump(functionError(raw));
      });
  }, [battleId, bump, later, mine, phase, puzzle, remember, typed]);

  const letters = useMemo(
    () => (center ? [center, ...(petals ?? [])] : []),
    [center, petals],
  );

  const press = useCallback(
    (unit: string) => {
      if (phase !== 'playing') return;
      if (unit === 'enter') {
        submit();
        return;
      }
      if (unit === 'back') {
        setTyped((units) => units.slice(0, -1));
        return;
      }
      if (!letters.includes(unit)) return;
      setTyped((units) => (units.length >= 12 ? units : [...units, unit]));
    },
    [letters, phase, submit],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const active = document.activeElement;
      if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) {
        return;
      }

      const action = keyAction(gameKey(event.key), typed[typed.length - 1]);
      if (!action) return;
      event.preventDefault();

      if (action.kind === 'enter') press('enter');
      else if (action.kind === 'back') press('back');
      else if (action.kind === 'letter') press(action.unit);
      else if (letters.includes(action.unit)) {
        setTyped((units) => [...units.slice(0, -1), action.unit]);
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [letters, press, typed]);

  const shuffle = useCallback(() => {
    setOrder((current) => shuffled(current, Date.now() % 100000));
  }, []);

  const clear = useCallback(() => setTyped([]), []);

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

  const create = useCallback(
    () =>
      run(async () => {
        if (!account) return;
        const reply = await createGunchaBattle({ nickname: account.nickname });
        open(reply.battleId);
      }),
    [account, open, run],
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
        // Sanoq shu ikki sondan boshlanadi.
        sync(reply.endsAt, reply.serverNow);
      }),
    [account, open, run, sync],
  );

  const quick = useCallback(
    () =>
      run(async () => {
        if (!account) return;
        setSeconds(0);
        waiting.current = true;
        const reply = await quickMatch({
          length: DEFAULT_LENGTH,
          nickname: account.nickname,
          game: 'guncha',
        });
        if (reply.battleId) open(reply.battleId);
        else setSearching(true);
      }),
    [account, open, run],
  );

  const cancelSearch = useCallback(async () => {
    setSearching(false);
    await leaveQueue().catch(() => undefined);
  }, []);

  /** Jangdan chiqish.
   *
   *  Boshlangan jangda taslim bo'lamiz — So'zjangdagi bilan bir xil
   *  munosabat: raqib cheksiz kutib qolmasligi kerak. */
  const leave = useCallback(async () => {
    const id = battleId;
    lastLeft.current = id;
    close();
    if (!id) return;
    if (phase === 'playing' || phase === 'loading' || phase === 'waiting') {
      await forfeit(id).catch(() => undefined);
    }
  }, [battleId, close, phase]);

  const again = useCallback(async () => {
    const type = battle?.type;
    await leave();
    if (type === 'quick') await quick();
  }, [battle?.type, leave, quick]);

  const react = useCallback(
    (key: ReactionKey) => {
      if (!battleId || !uid || sentReaction) return;
      setSentReaction(key);
      later(() => setSentReaction(null), REACTION_COOLDOWN_MS);
      void sendReaction(battleId, uid, key).catch(() => undefined);
    },
    [battleId, later, sentReaction, uid],
  );

  /** Jang tugagach ochiladigan so'zlar — ikkalasiniki.
   *
   *  «Buni qanday topding?» degan savol shu yerda tug'iladi, shuning
   *  uchun ro'yxat natijaning eng yoqimli qismi. */
  const revealed = useMemo(
    () => ({
      mine: me?.found ?? mine,
      theirs: opponent?.found ?? [],
    }),
    [me?.found, mine, opponent?.found],
  );

  return {
    account,
    phase,
    battle,
    battleId,
    code: battle?.inviteCode ?? null,
    center,
    order,
    letters,
    puzzle,
    typed,
    mine,
    revealed,
    me,
    opponent,
    opponentUid,
    score,
    maxScore,
    left,
    seconds,
    searching,
    message,
    praise,
    shake,
    error,
    busy,
    incoming,
    sentReaction,
    create,
    join,
    quick,
    cancelSearch,
    leave,
    again,
    press,
    submit,
    clear,
    shuffle,
    react,
    clearError: () => setError(null),
  };
}

export type GunchaJang = ReturnType<typeof useGunchaJang>;
