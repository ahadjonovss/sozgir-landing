/** Turnirning holati: ochish, kirish, kuzatish va davraga tushish.
 *
 *  Hamma narsa **hujjat kuzatuvidan** keladi (`mardu_series/{KOD}`):
 *  kim qo'shildi, qaysi davra ketyapti, kim o'tdi. Shu sababli sahifa
 *  yangilansa ham holat tiklanadi — saqlanadigan narsa yo'q, manzildagi
 *  kodning o'zi yetarli.
 *
 *  Davra boshlanganda qatnashchi **o'z guruh jangiga** tushadi: hujjatda
 *  `groups` paydo bo'ladi, ichidan o'z maydonim topiladi va mavjud
 *  `showBattle` yo'li ochiladi — jang ichida hech narsa o'zgarmaydi,
 *  u o'sha mardu maydonining o'zi. */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from './auth';
import { functionError } from '../firebase/functions';
import { showBattle } from './activeBattle';
import { gameOf, type BattleDoc, type BattleGame } from './battle';
import { watchMardu, type MarduDoc } from './mardu';
import type { Unsubscribe } from '../firebase/live';
import {
  buildLadder,
  createTurnir,
  groupOf,
  joinTurnir,
  kickFromTurnir,
  leaveTurnir,
  playerCount,
  runOf,
  seriesOf,
  startTurnir,
  turnirPath,
  watchTurnir,
  TURNIR_MIN_PLAYERS,
  type TurnirCapacity,
  type TurnirDoc,
} from './turnir';

/** Qaysi jangga o'zi o'tkazib yuborilgani — sahifa yangilansa ham
 *  eslanadi.
 *
 *  Kerak, chunki o'tkazish **bir martalik** bo'lishi shart: jangini
 *  tugatib «Turnirga qaytish» bosgan odam shu zahoti yana jangga
 *  qaytarilsa, turnir sahifasini umuman ko'rolmasdi. Guruh esa hamma
 *  tugatgunicha `done` bo'lmaydi. */
const SEEN_KEY = 'sozgir.turnir';

function readSeen(): string {
  try {
    return localStorage.getItem(SEEN_KEY) ?? '';
  } catch {
    return '';
  }
}

function writeSeen(value: string): void {
  try {
    localStorage.setItem(SEEN_KEY, value);
  } catch {
    // Shaxsiy rejim — o'tkazish shu sahifada bir marta ishlaydi.
  }
}

/** Sayt ichidagi o'tish — router `popstate` ni kutadi. */
function go(path: string): void {
  if (window.location.pathname === path) return;
  window.history.pushState(null, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function useTurnir(code: string) {
  const { account, nickname, openPrompt } = useAuth();
  const uid = account?.uid ?? '';

  const [snap, setSnap] = useState<{ code: string; doc: TurnirDoc | null } | null>(null);
  const [battles, setBattles] = useState<Record<string, MarduDoc | null>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Bo'limdagi tanlovlar — turnir ochishdan oldin.
  const [game, setGame] = useState<BattleGame>('guncha');
  const [size, setSize] = useState<TurnirCapacity>(8);
  const [title, setTitle] = useState('');

  // ── Hujjat kuzatuvi ──────────────────────────────────────────────────
  // Hujjat **kodi bilan birga** saqlanadi va render paytida solishtiriladi:
  // boshqa turnirga o'tilganda eskisi bir kadr ko'rinib qolmaydi va
  // tozalash uchun qo'shimcha yangilanish kerak bo'lmaydi.
  useEffect(() => {
    if (!code) return;
    let alive = true;
    let stop: Unsubscribe | null = null;

    void watchTurnir(code, (next) => {
      if (alive) setSnap({ code, doc: next });
    }).then((unsubscribe) => {
      if (alive) stop = unsubscribe;
      else unsubscribe();
    });

    return () => {
      alive = false;
      stop?.();
    };
  }, [code]);

  const fresh = !!code && snap?.code === code;
  const doc = fresh ? snap.doc : null;
  /** Hujjat bir marta kelganmi. Kelmagunicha «topilmadi» deyilmaydi:
   *  birinchi kadrda hamma turnir yo'q bo'lib ko'rinardi. */
  const loaded = fresh;

  // ── Joriy davradagi guruh janglari ───────────────────────────────────
  // To'rda jonli hisob turadi: chiqib ketgan odam o'zi o'ynamasa ham
  // davrani tomosha qiladi. Kalit **qator** bo'lib yasaladi — hujjatning
  // o'zi har yozuvda almashadi va massiv har safar yangi bo'lib chiqardi.
  const groupKey = (doc?.groups ?? []).map((group) => group.battleId ?? '').join(',');

  useEffect(() => {
    const ids = groupKey.split(',').filter(Boolean);
    if (ids.length === 0) return;
    let alive = true;
    const stops: Unsubscribe[] = [];

    for (const id of ids) {
      void watchMardu(id, (battle) => {
        if (alive) setBattles((prev) => ({ ...prev, [id]: battle }));
      }).then((unsubscribe) => {
        if (alive) stops.push(unsubscribe);
        else unsubscribe();
      });
    }

    return () => {
      alive = false;
      for (const stop of stops) stop();
    };
  }, [groupKey]);

  // Faqat joriy davraning janglari — o'tgan davralarniki to'rda
  // serverning jadvalidan keladi. Shu sababli to'plam tozalanmaydi,
  // undan kerakligi ajratib olinadi.
  const live = useMemo(() => {
    const ids = groupKey.split(',').filter(Boolean);
    return Object.fromEntries(ids.map((id) => [id, battles[id] ?? null]));
  }, [battles, groupKey]);

  // ── Davra boshlandi — o'z guruhimga ─────────────────────────────────
  const mineGroup = groupOf(doc, uid);
  const myBattle = mineGroup?.done === true ? null : (mineGroup?.battleId ?? null);
  const turnirGame = gameOf(doc?.game);

  useEffect(() => {
    if (!myBattle || doc?.status !== 'running') return;
    const mark = `${code}:${myBattle}`;
    if (readSeen() === mark) return;
    writeSeen(mark);
    showBattle(turnirGame, myBattle);
  }, [code, doc?.status, myBattle, turnirGame]);

  /** Jangga qo'lda qaytish — bir marta o'tkazilgandan keyingi yo'l. */
  const enter = useCallback(() => {
    if (myBattle) showBattle(turnirGame, myBattle);
  }, [myBattle, turnirGame]);

  // ── Keyingi davra sanog'i ────────────────────────────────────────────
  // Sanoq **ko'rsatuvchi**, boshqaruvchi emas: davrani hujjatdagi
  // `groups` ochadi, ya'ni qurilma soati bir necha soniya adashsa ham
  // hech narsa buzilmaydi. Shu sababli bu yerda server bilan farq
  // hisoblanmaydi — tanaffus yigirma soniya, xato esa undan kichik.
  const nextAt = doc?.nextRoundAt?.seconds;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!nextAt) return;
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, [nextAt]);

  const nextIn = nextAt ? Math.max(0, Math.ceil((nextAt * 1000 - now) / 1000)) : null;

  // ── Ro'yxatlar ───────────────────────────────────────────────────────
  const members = useMemo(
    () =>
      Object.entries(doc?.members ?? {})
        .map(([id, member]) => ({
          uid: id,
          nickname: member.nickname ?? 'Mehmon',
          joinedAt: member.joinedAt?.seconds ?? 0,
          mine: id === uid,
        }))
        // Kirish tartibi — `seeds` ham shundan olinadi, ya'ni ro'yxatdagi
        // o'rin keyinchalik tenglikni buzadigan tartibning o'zi.
        .sort((a, b) => a.joinedAt - b.joinedAt),
    [doc, uid],
  );

  const rounds = useMemo(() => buildLadder({ doc, uid, live }), [doc, uid, live]);
  const run = useMemo(() => runOf(doc, uid), [doc, uid]);

  // ── Chaqiruvlar ──────────────────────────────────────────────────────
  /** Kirish shart: turnir hisobga bog'lanadi (reyting, jadval, o'rin). */
  const guard = useCallback(() => {
    if (account) return true;
    openPrompt('signIn');
    return false;
  }, [account, openPrompt]);

  const call = useCallback(
    async (action: () => Promise<unknown>) => {
      if (busy || !guard()) return;
      setBusy(true);
      setError(null);
      try {
        await action();
      } catch (cause) {
        setError(functionError(cause));
      } finally {
        setBusy(false);
      }
    },
    [busy, guard],
  );

  const create = useCallback(
    () =>
      call(async () => {
        const reply = await createTurnir({
          game,
          capacity: size,
          title: title.trim() || undefined,
        });
        go(turnirPath(reply.code));
      }),
    [game, call, size, title],
  );

  const join = useCallback(
    (value: string) =>
      call(async () => {
        const reply = await joinTurnir({ code: value.toUpperCase(), nickname });
        go(turnirPath(reply.code ?? value));
      }),
    [nickname, call],
  );

  const start = useCallback(() => call(() => startTurnir(code)), [code, call]);

  const kick = useCallback(
    (target: string) => call(() => kickFromTurnir(code, target)),
    [code, call],
  );

  const leave = useCallback(() => {
    // Ekran darhol yopiladi: server javobini kutib turish odamni
    // «chiqolmadim» degan taassurotda qoldirardi.
    go('/turnir');
    void leaveTurnir(code).catch(() => undefined);
  }, [code]);

  /** «Yana bir turnir» — o'sha sozlamalar bilan yangi kod. */
  const again = useCallback(
    () =>
      call(async () => {
        const reply = await createTurnir({
          game: gameOf(doc?.game),
          capacity: (doc?.capacity ?? 8) as TurnirCapacity,
          length: doc?.length,
          title: doc?.title,
        });
        go(turnirPath(reply.code));
      }),
    [doc, call],
  );

  const host = doc?.host ?? doc?.createdBy;
  const players = playerCount(doc);

  return {
    account,
    code,
    doc,
    loaded,
    /** Hujjat kelmadi — kod xato yoki turnir o'chirilgan. */
    missing: loaded && !doc,
    status: doc?.status ?? 'gathering',
    turnirGame,
    capacity: doc?.capacity ?? size,
    players,
    members,
    rounds,
    run,
    live,
    joined: !!uid && !!doc?.members?.[uid],
    isHost: !!host && host === uid,
    canStart: players >= TURNIR_MIN_PLAYERS,
    mine: uid,
    /** Joriy davrada o'z jangim bor-yo'qligi — «Jangga qaytish» uchun. */
    myBattle,
    nextIn,
    busy,
    error,
    /* Bo'limdagi tanlovlar. */
    game,
    setGame,
    size,
    setSize,
    title,
    setTitle,
    /* Harakatlar. */
    create,
    join,
    start,
    kick,
    leave,
    again,
    enter,
  };
}

export type Turnir = ReturnType<typeof useTurnir>;

/** Guruh jangidan keyingi davraga o'tkazadi — jang ekranining o'zida.
 *
 *  Turnir sahifasi o'tkazishni biladi, lekin jangni tugatgan odam
 *  natija ekranida o'tiradi va u sahifani kuzatmaydi. Shu sababli jang
 *  ekrani ham turnir hujjatini tinglaydi: `groups` da menga yangi
 *  `battleId` chiqishi bilan ekran o'zi almashadi. Odam hech narsa
 *  bosmaydi — tadbirda «keyingi davra boshlandi» degan qichqiriqni
 *  eshitmay qolish oson.
 *
 *  Turnir guruhi bo'lmagan jangda hech narsa qilmaydi: `seriesId` yo'q,
 *  demak kuzatuv ham ochilmaydi. */
export function useTurnirHop(
  battleId: string | null,
  battle: BattleDoc | null,
): string | null {
  const { account } = useAuth();
  const uid = account?.uid ?? '';
  const code = seriesOf(battle);
  const [snap, setSnap] = useState<{ code: string; doc: TurnirDoc | null } | null>(null);

  useEffect(() => {
    if (!code) return;
    let alive = true;
    let stop: Unsubscribe | null = null;

    void watchTurnir(code, (next) => {
      if (alive) setSnap({ code, doc: next });
    }).then((unsubscribe) => {
      if (alive) stop = unsubscribe;
      else unsubscribe();
    });

    return () => {
      alive = false;
      stop?.();
    };
  }, [code]);

  const doc = code && snap?.code === code ? snap.doc : null;
  const next = groupOf(doc, uid)?.battleId ?? null;
  const game = gameOf(doc?.game);

  useEffect(() => {
    if (!code || !next || next === battleId) return;
    // Turnir sahifasi ham shu belgidan o'qiydi — ikkalasi bitta jangni
    // ikki marta ochmasligi uchun.
    writeSeen(`${code}:${next}`);
    showBattle(game, next);
  }, [battleId, code, game, next]);

  return code;
}
