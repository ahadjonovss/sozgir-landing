/** Mardu maydon — bo'lim va kutish xonasining holati.
 *
 *  Ikkala yo'l bitta holatdan o'tadi: tezkor maydon (notanishlar bilan,
 *  60 soniyalik sanoq) va do'stlar maydoni (kod va havola, sanoqsiz).
 *  Farqi ko'rinishda — bu yerda esa bitta xona: qo'shilganlar ro'yxati,
 *  sanoq yoki havola, va chiqish.
 *
 *  Maydon boshlangach o'yinning o'zi **mavjud ekranlarda** o'ynaladi:
 *  `showBattle` jangni ochadi va G'uncha jangi yoki So'zjang sahifasiga
 *  o'tadi. Shu sababli bu yerda o'yin mantiqi yo'q. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './auth';
import { functionError } from '../firebase/functions';
import { showBattle } from './activeBattle';
import type { BattleGame } from './battle';
import type { Unsubscribe } from '../firebase/live';
import {
  createMardu,
  joinMardu,
  leaveMardu,
  quickMardu,
  rankArena,
  startMardu,
  watchMardu,
  MARDU_COUNTDOWN_SECONDS,
  MARDU_MIN_PLAYERS,
  type MarduDoc,
  type MarduReply,
} from './mardu';

/** Ochiq xona — sahifa yangilansa ham o'sha yerga qaytadi. */
const KEY = 'sozgir.mardu';

function readRoom(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function writeRoom(id: string | null): void {
  try {
    if (id) localStorage.setItem(KEY, id);
    else localStorage.removeItem(KEY);
  } catch {
    // Shaxsiy rejim — xona faqat shu sahifada qoladi.
  }
}

export function useMardu() {
  const { account, nickname, openPrompt } = useAuth();
  const uid = account?.uid ?? '';

  const [game, setGame] = useState<BattleGame>('guncha');
  const [battleId, setBattleId] = useState<string | null>(readRoom);
  const [battle, setBattle] = useState<MarduDoc | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Server soati bilan farq: sanoq **farq** bo'yicha yuritiladi, ya'ni
   *  qurilma soati bir soat noto'g'ri bo'lsa ham qolgan vaqt to'g'ri
   *  ko'rinadi.
   *
   *  Holat, `ref` emas: qolgan vaqt render paytida hisoblanadi va farq
   *  o'zgarganda ekran darhol to'g'rilanishi kerak. */
  const [drift, setDrift] = useState(0);
  /** Zaxira yo'l bir marta: sanog'i tugagan mijoz maydonni o'zi
   *  boshlaydi (Cloud Tasks ishlamay qolsa ham maydon boshlanishi
   *  kerak), lekin har soniyada emas. */
  const nudged = useRef(false);

  const open = useCallback((reply: MarduReply) => {
    if (reply.serverNow) setDrift(reply.serverNow - Date.now());
    nudged.current = false;
    setBattleId(reply.battleId);
    setBattle(null);
    setError(null);
    writeRoom(reply.battleId);
  }, []);

  /** Xonani yopadi — «Chiqish» bosilganda. */
  const close = useCallback(() => {
    setBattleId(null);
    setBattle(null);
    writeRoom(null);
  }, []);

  // Xonani kuzatamiz: ro'yxat ham, sanoq ham, boshlangani ham shundan.
  useEffect(() => {
    if (!battleId) return;
    let alive = true;
    let stop: Unsubscribe | null = null;

    void watchMardu(battleId, (doc) => {
      if (alive) setBattle(doc);
    }).then((unsubscribe) => {
      if (alive) stop = unsubscribe;
      else unsubscribe();
    });

    return () => {
      alive = false;
      stop?.();
    };
  }, [battleId]);

  const status = battle?.status;
  const marduGame: BattleGame = battle?.game === 'soztop' ? 'soztop' : 'guncha';

  /** Kutish xonasi ochiqmi. Holat **hisoblanadi**, hujjat kelganda
   *  yangilanmaydi: boshlangan, yopilgan yoki muddati o'tgan xona shu
   *  zahoti ekrandan ketadi va bo'lim qaytadi. */
  const waiting =
    !!battleId && (status === undefined || status === 'waiting');

  // Maydon boshlandi — o'yin o'z ekranida davom etadi. Bu yerda holat
  // o'zgarmaydi, faqat tashqi ish: sahifa almashadi va saqlangan xona
  // o'chiriladi (brauzer yangilansa bo'lim ochilsin).
  useEffect(() => {
    if (!battleId || status === undefined || status === 'waiting') return;
    writeRoom(null);
    if (status === 'running') showBattle(marduGame, battleId);
  }, [battleId, marduGame, status]);

  // Sanoq. Faqat tezkor maydonda bo'ladi va u **ikkinchi** odamdan
  // boshlanadi: yolg'iz kutgan odam uchun sanoq yolg'on bo'lardi — nol
  // bo'lganda o'ynaydigan hech kim yo'q.
  const startsAt = battle?.startsAt?.seconds;
  const ticking = !!startsAt && status === 'waiting';

  // Soat holatda, qolgan vaqt esa **hisoblanadi** — sanoq bir render
  // kechikmaydi va qurilma soati o'rniga serverniki ishlatiladi.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!ticking) return;
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, [ticking]);

  const left = ticking
    ? Math.max(0, Math.ceil((startsAt * 1000 - (now + drift)) / 1000))
    : null;

  // Zaxira yo'l: sanog'i nolga yetgan mijoz ham boshlashni so'raydi,
  // server esa `now >= startsAt` ni o'zi tekshiradi. Bir marta — Cloud
  // Tasks odatda o'zi keladi.
  useEffect(() => {
    if (left !== 0 || nudged.current || !battleId) return;
    nudged.current = true;
    void startMardu(battleId).catch(() => undefined);
  }, [battleId, left]);

  const rows = useMemo(() => rankArena({ battle, uid }), [battle, uid]);

  /** Kirish shart: maydon hisobga bog'lanadi (reyting, ball, jadval). */
  const guard = useCallback(() => {
    if (account) return true;
    openPrompt('signIn');
    return false;
  }, [account, openPrompt]);

  const run = useCallback(
    async (action: () => Promise<MarduReply | { battleId: string }>) => {
      if (busy || !guard()) return;
      setBusy(true);
      setError(null);
      try {
        open((await action()) as MarduReply);
      } catch (cause) {
        setError(functionError(cause));
      } finally {
        setBusy(false);
      }
    },
    [busy, guard, open],
  );

  const quick = useCallback(
    (choice: BattleGame = game) =>
      run(() => quickMardu({ game: choice, nickname })),
    [game, nickname, run],
  );

  const create = useCallback(
    (choice: BattleGame = game) =>
      run(() => createMardu({ game: choice, nickname })),
    [game, nickname, run],
  );

  const join = useCallback(
    (code: string) => run(() => joinMardu({ code: code.toUpperCase(), nickname })),
    [nickname, run],
  );

  /** Do'stlar maydonini yaratuvchi boshlaydi. Kamida ikki kishi bo'lishi
   *  shart — serverda ham shu tekshiruv turadi. */
  const start = useCallback(async () => {
    if (!battleId || busy) return;
    setBusy(true);
    setError(null);
    try {
      await startMardu(battleId);
    } catch (cause) {
      setError(functionError(cause));
    } finally {
      setBusy(false);
    }
  }, [battleId, busy]);

  const leave = useCallback(async () => {
    if (!battleId) return;
    const id = battleId;
    // Ekran darhol yopiladi: server javobini kutib turish odamni
    // «chiqolmadim» degan taassurotda qoldirardi.
    close();
    await leaveMardu(id).catch(() => undefined);
  }, [battleId, close]);

  const host = battle?.host ?? battle?.createdBy;
  const players = rows.length;

  return {
    account,
    game,
    setGame,
    battleId: waiting ? battleId : null,
    battle,
    rows,
    players,
    /** Sanoqda qolgan soniya; sanoq yo'q bo'lsa `null`. */
    left,
    countdown: MARDU_COUNTDOWN_SECONDS,
    mine: uid,
    isHost: !!host && host === uid,
    canStart: players >= MARDU_MIN_PLAYERS,
    code: battle?.inviteCode ?? null,
    mode: battle?.mode ?? 'quick',
    marduGame,
    busy,
    error,
    quick,
    create,
    join,
    start,
    leave,
  };
}

export type Mardu = ReturnType<typeof useMardu>;
