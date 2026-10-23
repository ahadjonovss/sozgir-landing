/** Yashirilgan so'z ustidagi o'yin holati — taxta, klaviatura va taxmin.
 *
 *  So'zjangdagi (`useSozjang.ts`) o'yin qismining aynan o'zi, chunki
 *  qoida ham o'sha: javob serverda, mijoz faqat ranglar qatorini oladi.
 *  Farqi ikkitada — raqib yo'q (kuzatiladigan hujjat ham yo'q, demak
 *  holat faqat chaqiruvlardan keladi) va urinish tugaganda javob
 *  ochilmaydi: uni server hech kimga bermaydi.
 *
 *  Davom etish serverda: `challengeOpen` o'z qatorlarimni ham,
 *  terilgan so'zlarimni ham qaytaradi — ya'ni sahifa yangilansa yoki
 *  odam boshqa qurilmadan kelsa, o'yin joyidan davom etadi. Brauzerda
 *  hech narsa saqlanmaydi. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiError } from '../api/errors';
import { useAuth } from './auth';
import { autoFill, verdictsOf } from './battle';
import {
  guessChallenge,
  claimChallenge,
  guestGuess,
  openChallenge,
  peekChallenge,
  type ChallengeState,
} from './challenge';
import { attemptsFor } from './modes';
import { useSettings } from './settings';
import type { BoardRow } from './useSozjang';
import { keyAction, lengthOf, normalize, split, type Verdict } from './uz';
import { gameKey } from './useScript';

export type Phase =
  /** Seans hali o'qilmadi — kirganmi yoki mehmonmi, hali noma'lum. */
  | 'idle'
  | 'loading'
  | 'playing'
  | 'won'
  | 'lost'
  /** Kod noto'g'ri, so'z yopilgan yoki o'zi yashirgan — sabab `error` da. */
  | 'error';

export interface Challenge {
  phase: Phase;
  /** Hisobsiz o'ynalyaptimi — natija hech qayerga yozilmaydi. */
  guest: boolean;
  /** Sarlavha va yashirgan odamning taxallusi — ikkalasi ham bo'lmasligi
   *  mumkin (`challengeOpen` bo'sh satr qaytaradi). */
  title: string;
  host: string;
  /** Yashirgan odamning hisobi — ismi uning profiliga bog'lanadi. */
  hostUid: string;
  length: number;
  rows: BoardRow[];
  keyState: Map<string, Verdict>;
  flipRow: number;
  shake: boolean;
  activeRow: number;
  attempts: number;
  message: string | null;
  error: string | null;
  press: (key: string) => void;
  retry: () => void;
}

export function useChallenge(code: string): Challenge {
  const { account, ready } = useAuth();
  const settings = useSettings();

  const [busy, setBusy] = useState(false);
  /** Qayta urinish: hisob o'zgarmasa ham `challengeOpen` takrorlansin. */
  const [attempt, setAttempt] = useState(0);
  /** Qaysi so'zga tegishli ekani holatning **ichida** turadi.
   *
   *  Shunda boshqa kodga o'tilganda (yoki qayta urinilganda) eskisini
   *  effektning o'zi tozalashi shart emas: kalit mos kelmay qoladi va
   *  javob o'z-o'zidan eskiradi. Tozalash effektda bo'lsa, sahifa bir
   *  lahza eski so'zning to'ri bilan chizilardi. */
  const key = `${code}#${attempt}`;
  const [loaded, setLoaded] = useState<{
    key: string;
    state: ChallengeState | null;
    error: string | null;
  } | null>(null);
  const [typed, setTyped] = useState<{ row: number; units: string[] }>({
    row: 0,
    units: [],
  });
  const [flip, setFlip] = useState<{ key: string; row: number } | null>(null);
  const [shake, setShake] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fresh = loaded?.key === key ? loaded : null;
  const state = fresh?.state ?? null;
  const error = fresh?.error ?? null;
  const flipRow = flip?.key === key ? flip.row : -1;

  /** Vaqtlagichlar komponent yopilganda to'xtatiladi. */
  const timers = useRef<number[]>([]);
  useEffect(
    () => () => {
      for (const timer of timers.current) window.clearTimeout(timer);
    },
    [],
  );
  const later = useCallback((action: () => void, delay: number) => {
    timers.current.push(window.setTimeout(action, delay));
  }, []);

  const nickname = account?.nickname ?? '';

  /** Mehmonmi — ya'ni hisobsiz o'ynayaptimi.
   *
   *  Seans o'qilgunicha (`ready`) bu savolga javob yo'q: kirgan odamga
   *  ham bir lahza «mehmon» deyilsa, uning yarmida qolgan o'yini
   *  bo'sh to'r bilan ochilardi. */
  const guest = ready && !account;

  /** Mehmon sifatida tergan so'zlar.
   *
   *  Holatda ham turadi, lekin bu yerda **alohida** saqlanadi: odam
   *  kirgan zahoti quyidagi effekt qayta ishga tushadi va holatni
   *  serverdagi (bo'sh) yozuv bilan almashtiradi. Ro'yxat o'shandan
   *  oldin olinishi kerak. */
  const guestWords = useRef<string[]>([]);
  useEffect(() => {
    if (guest && state) guestWords.current = state.words;
  }, [guest, state]);

  /** O'yinga kirish.
   *
   *  Kirgan odamniki serverda saqlanadi (`openChallenge`: qatnashchi
   *  yoziladi va yashirgan odam statistikada ko'radi). Mehmonniki
   *  saqlanmaydi (`peekChallenge`) — server qatorlarni ham, urinishlarni
   *  ham eslab qolmaydi, ya'ni o'yin shu sahifada, xotirada boradi.
   *
   *  Mehmon o'ynab bo'lib **keyin kirsa**, o'yini yo'qolmaydi: tergan
   *  so'zlari avval serverga ko'chiriladi (`claimChallenge`) va
   *  o'shandan keyin yozuv o'qiladi — ya'ni ekranda o'sha o'yinning
   *  o'zi qoladi, endi saqlangan holida. */
  useEffect(() => {
    if (!ready || !code) return;
    let alive = true;

    const start = async () => {
      if (!account) return peekChallenge({ code });
      const kept = guestWords.current;
      if (kept.length > 0) {
        guestWords.current = [];
        // Yiqilsa ham o'yin ochiladi: ko'chirilmagani sahifani
        // to'xtatish uchun sabab emas.
        await claimChallenge({ code, words: kept }).catch(() => null);
      }
      return openChallenge({ code });
    };

    void start()
      .then((reply) => {
        if (alive) setLoaded({ key, state: reply, error: null });
      })
      .catch((raw) => {
        // Serverning izohi o'zbekcha va aniq: «Bunday kod topilmadi»,
        // «Bu so'z yopilgan», «Bu so'zni o'zingiz yashirgansiz».
        if (alive) setLoaded({ key, state: null, error: apiError(raw) });
      });

    return () => {
      alive = false;
    };
  }, [account, code, key, nickname, ready]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  const length = state?.length ?? 5;
  const maxAttempts = attemptsFor(length);
  const myRows = useMemo(() => state?.rows ?? [], [state]);
  const words = useMemo(() => state?.words ?? [], [state]);
  const finished = state?.finished === true;

  const phase: Phase = error
    ? 'error'
    : !ready
      ? 'idle'
      : !state
        ? 'loading'
        : !finished
          ? 'playing'
          : state.won
            ? 'won'
            : 'lost';

  /** Keyingi qatorga o'zi tushadigan harflar — sozlamaga bo'ysunadi. */
  const locked = useMemo(
    () =>
      settings.autoFill
        ? autoFill(myRows, words, length)
        : Array.from({ length }, () => ''),
    [length, myRows, settings.autoFill, words],
  );

  const current = useMemo(() => {
    const fresh = typed.row === myRows.length ? typed.units : [];
    return locked.map((unit, index) => unit || fresh[index] || '');
  }, [locked, myRows.length, typed]);

  const rows = useMemo<BoardRow[]>(() => {
    const out: BoardRow[] = myRows.map((row, index) => ({
      units: split(words[index] ?? ''),
      verdicts: verdictsOf(row),
    }));
    if (!finished) {
      out.push({
        units: current,
        verdicts: locked.map((unit) => (unit ? 'lock' : null)),
      });
    }
    while (out.length < maxAttempts) out.push({ units: [], verdicts: null });
    return out.slice(0, maxAttempts);
  }, [current, finished, locked, maxAttempts, myRows, words]);

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
      setShake(true);
      later(() => setShake(false), 420);
      later(() => setMessage(null), 1800);
    },
    [later],
  );

  const edit = useCallback(
    (change: (units: string[]) => string[]) => {
      setTyped((previous) => {
        const base = previous.row === myRows.length ? previous.units : [];
        const filled = locked.map((unit, index) => unit || base[index] || '');
        return {
          row: myRows.length,
          units: change(filled).map((unit, index) =>
            locked[index] ? '' : unit,
          ),
        };
      });
    },
    [locked, myRows.length],
  );

  /** Oxirgi yozilgan (qulflanmagan) katak — o'chirish va qo'shma harf uchun. */
  const lastTyped = useCallback(
    (units: string[]) => {
      for (let index = units.length - 1; index >= 0; index -= 1) {
        if (units[index] && !locked[index]) return index;
      }
      return -1;
    },
    [locked],
  );

  const submit = useCallback(async () => {
    if (!state || busy) return;
    const word = normalize(current.join(''));
    if (current.some((unit) => !unit) || lengthOf(word) !== length) {
      bump('Yetarli harf yo‘q');
      return;
    }

    setBusy(true);
    try {
      const reply = guest
        ? // Birinchi taxmin — «nechta mehmon o'ynadi» sanog'i uchun.
          await guestGuess({ code, word, first: myRows.length === 0 })
        : await guessChallenge({ code, word });
      if (!reply.accepted) {
        bump(reply.reason ?? 'Bu so‘z qabul qilinmadi');
        return;
      }

      /* Mehmonda yakunni **sayt** hisoblaydi.
       *
       * Server uning urinishlarini sanamaydi (sanash uchun uni eslab
       * qolish kerak bo'lardi), shuning uchun «urinish tugadi» qarori
       * shu yerda: qatorlar soni urinishlar chegarasiga yetdimi. */
      const attempts = myRows.length + 1;
      const over = reply.won === true || attempts >= maxAttempts;

      // Holat serverdan kelgan javobdan yig'iladi: kuzatiladigan hujjat
      // yo'q, ya'ni to'rni yangilaydigan boshqa manba ham yo'q.
      setLoaded((previous) =>
        previous === null || previous.key !== key || previous.state === null
          ? previous
          : {
              ...previous,
              state: {
                ...previous.state,
                rows: [...previous.state.rows, reply.row ?? ''],
                words: [...previous.state.words, word],
                attempts: reply.attempts ?? attempts,
                won: reply.won === true,
                finished: guest ? over : reply.finished === true,
              },
            },
      );
      setFlip({ key, row: myRows.length });
      setTyped({ row: myRows.length + 1, units: [] });
    } catch (raw) {
      bump(apiError(raw));
    } finally {
      setBusy(false);
    }
  }, [
    busy,
    bump,
    code,
    current,
    guest,
    key,
    length,
    maxAttempts,
    myRows.length,
    state,
  ]);

  const press = useCallback(
    (key: string) => {
      if (phase !== 'playing' || busy) return;
      if (key === 'enter') {
        void submit();
        return;
      }
      if (key === 'back') {
        edit((units) => {
          const index = lastTyped(units);
          if (index === -1) return units;
          const next = [...units];
          next[index] = '';
          return next;
        });
        return;
      }
      const slot = current.findIndex((unit) => !unit);
      if (slot === -1) {
        bump('Katak to‘lgan');
        return;
      }
      edit((units) => {
        const next = [...units];
        next[slot] = key;
        return next;
      });
    },
    [bump, busy, current, edit, lastTyped, phase, submit],
  );

  // Kompyuter klaviaturasi — o'yinning qolgan joylaridagi qoidaning o'zi
  // (`s`+`h` → SH, `o`+`'` → O‘).
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const focused = document.activeElement;
      if (
        focused instanceof HTMLInputElement ||
        focused instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const last = lastTyped(current);
      const action = keyAction(
        gameKey(event.key),
        last === -1 ? undefined : current[last],
      );
      if (!action) return;
      event.preventDefault();

      if (action.kind === 'enter') press('enter');
      else if (action.kind === 'back') press('back');
      else if (action.kind === 'letter') press(action.unit);
      else {
        edit((units) => {
          const next = [...units];
          next[last] = action.unit;
          return next;
        });
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current, edit, lastTyped, press]);

  return {
    phase,
    guest,
    title: state?.title ?? '',
    host: state?.hostNickname ?? '',
    hostUid: state?.hostUid ?? '',
    length,
    rows,
    keyState,
    flipRow,
    shake,
    activeRow: myRows.length,
    attempts: state?.attempts ?? 0,
    message,
    error,
    press,
    retry,
  };
}
