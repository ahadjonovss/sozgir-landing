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
import { functionError } from '../firebase/functions';
import { useAuth } from './auth';
import { autoFill, verdictsOf } from './battle';
import {
  guessChallenge,
  openChallenge,
  type ChallengeState,
} from './challenge';
import { attemptsFor } from './modes';
import { useSettings } from './settings';
import type { BoardRow } from './useSozjang';
import { keyAction, lengthOf, normalize, split, type Verdict } from './uz';
import { gameKey } from './useScript';

export type Phase =
  /** Hisob kutilmoqda — kirmagan odamga taxta ochilmaydi. */
  | 'idle'
  | 'loading'
  | 'playing'
  | 'won'
  | 'lost'
  /** Kod noto'g'ri, so'z yopilgan yoki o'zi yashirgan — sabab `error` da. */
  | 'error';

export interface Challenge {
  phase: Phase;
  /** Sarlavha va yashirgan odamning taxallusi — ikkalasi ham bo'lmasligi
   *  mumkin (`challengeOpen` bo'sh satr qaytaradi). */
  title: string;
  host: string;
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

  // O'yinga kirish. Hisobsiz chaqirilmaydi: funksiya `requireUid` bilan
  // boshlanadi va statistikadagi qator aynan shu hisobniki bo'ladi.
  useEffect(() => {
    if (!account || !code) return;
    let alive = true;

    void openChallenge({ code, nickname })
      .then((reply) => {
        if (alive) setLoaded({ key, state: reply, error: null });
      })
      .catch((raw) => {
        // Serverning izohi o'zbekcha va aniq: «Bunday kod topilmadi»,
        // «Bu so'z yopilgan», «Bu so'zni o'zingiz yashirgansiz».
        if (alive) setLoaded({ key, state: null, error: functionError(raw) });
      });

    return () => {
      alive = false;
    };
  }, [account, code, key, nickname]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  const length = state?.length ?? 5;
  const maxAttempts = attemptsFor(length);
  const myRows = useMemo(() => state?.rows ?? [], [state]);
  const words = useMemo(() => state?.words ?? [], [state]);
  const finished = state?.finished === true;

  const phase: Phase = error
    ? 'error'
    : !ready || !account
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
      const reply = await guessChallenge({ code, word });
      if (!reply.accepted) {
        bump(reply.reason ?? 'Bu so‘z qabul qilinmadi');
        return;
      }

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
                attempts: reply.attempts ?? previous.state.attempts + 1,
                won: reply.won === true,
                finished: reply.finished === true,
              },
            },
      );
      setFlip({ key, row: myRows.length });
      setTyped({ row: myRows.length + 1, units: [] });
    } catch (raw) {
      bump(functionError(raw));
    } finally {
      setBusy(false);
    }
  }, [busy, bump, code, current, key, length, myRows.length, state]);

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
    title: state?.title ?? '',
    host: state?.hostNickname ?? '',
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
