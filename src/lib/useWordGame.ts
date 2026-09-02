import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { demoWords, type DemoWord } from '../data/words';
import { evaluate, LETTERS, split, type Verdict } from './uz';

const MAX_ROWS = 6;

/** Kunlik so'z ilovadagi kabi sanadan deterministik tanlanadi — sahifani
 *  ochgan hamma bir kunda bir xil so'zni ko'radi. */
function wordOfDay(offset: number): DemoWord {
  const days = Math.floor(Date.now() / 86_400_000);
  return demoWords[(days + offset) % demoWords.length];
}

export type Row = { units: string[]; verdicts: Verdict[] | null };
export type Status = 'playing' | 'won' | 'lost';

export function useWordGame() {
  const [round, setRound] = useState(0);
  const target = useMemo(() => wordOfDay(round), [round]);
  const answer = useMemo(() => split(target.w), [target]);

  const [past, setPast] = useState<Row[]>([]);
  const [current, setCurrent] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>('playing');
  const [shake, setShake] = useState(false);
  const [flipRow, setFlipRow] = useState(-1);
  const shakeTimer = useRef<number>(0);

  const reset = useCallback(() => {
    setPast([]);
    setCurrent([]);
    setStatus('playing');
    setFlipRow(-1);
    setRound((r) => r + 1);
  }, []);

  const bump = useCallback(() => {
    setShake(true);
    clearTimeout(shakeTimer.current);
    shakeTimer.current = setTimeout(() => setShake(false), 420);
  }, []);

  const press = useCallback(
    (key: string) => {
      if (status !== 'playing') return;

      if (key === 'enter') {
        if (current.length < answer.length) {
          bump();
          return;
        }
        const verdicts = evaluate(current, answer);
        const rowIndex = past.length;
        setPast((rows) => [...rows, { units: current, verdicts }]);
        setCurrent([]);
        setFlipRow(rowIndex);

        const won = verdicts.every((v) => v === 'correct');
        // Natija kataklar ag'darilib bo'lgach ko'rsatiladi.
        setTimeout(
          () => {
            if (won) setStatus('won');
            else if (rowIndex + 1 >= MAX_ROWS) setStatus('lost');
          },
          answer.length * 130 + 320,
        );
        return;
      }

      if (key === 'back') {
        setCurrent((u) => u.slice(0, -1));
        return;
      }

      if (current.length >= answer.length) {
        bump();
        return;
      }
      setCurrent((u) => [...u, key]);
    },
    [answer, bump, current, past.length, status],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const active = document.activeElement;
      if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) return;

      if (e.key === 'Enter') {
        press('enter');
        return;
      }
      if (e.key === 'Backspace') {
        press('back');
        return;
      }
      const ch = e.key.toLowerCase();
      if (ch.length !== 1) return;
      // `sh`/`ch`/`oʻ`/`gʻ` uchun: oldingi harf bilan birikadi.
      if (ch === 'h' && (current.at(-1) === 's' || current.at(-1) === 'c')) {
        e.preventDefault();
        setCurrent((u) => [...u.slice(0, -1), `${u.at(-1)}h`]);
        return;
      }
      if ("'`‘’".includes(ch) && (current.at(-1) === 'o' || current.at(-1) === 'g')) {
        e.preventDefault();
        setCurrent((u) => [...u.slice(0, -1), `${u.at(-1)}ʻ`]);
        return;
      }
      if (LETTERS.includes(ch)) {
        e.preventDefault();
        press(ch);
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
      row.verdicts?.forEach((v, i) => {
        const unit = row.units[i];
        const prev = map.get(unit);
        if (!prev || rank[v] > rank[prev]) map.set(unit, v);
      });
    }
    return map;
  }, [past]);

  const rows: Row[] = useMemo(() => {
    const out: Row[] = [...past];
    if (status === 'playing') out.push({ units: current, verdicts: null });
    while (out.length < MAX_ROWS) out.push({ units: [], verdicts: null });
    return out.slice(0, MAX_ROWS);
  }, [current, past, status]);

  return {
    target,
    answer,
    rows,
    activeRow: past.length,
    flipRow,
    status,
    shake,
    keyState,
    press,
    reset,
    tries: past.length,
  };
}
