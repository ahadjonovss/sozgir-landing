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
import { apiError } from '../api/errors';
import { refreshRating } from './battleRating';
import { arenaTiles, isMardu, rankArena } from './mardu';
import type { Unsubscribe } from '../api/poll';
import {
  onBattleOpen,
  readActive,
  setActive as setActiveBattle,
} from './activeBattle';
import { useAuth } from './auth';
import {
  autoFill,
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
import { attemptsFor, DEFAULT_LENGTH } from './modes';
import {
  REACTION_COOLDOWN_MS,
  sendReaction,
  watchReactions,
  type ReactionKey,
} from './reactions';
import { EMOJI, keyAction, lengthOf, normalize, split, type Verdict } from './uz';
import { useSettings } from './settings';
import { gameKey } from './useScript';
import { links, site } from '../data/site';

export type Phase = 'lobby' | 'searching' | 'loading' | 'waiting' | 'playing' | 'finished';

/** Taxta qatori. Faol qatorda `lock` — oldingi taxminda joyi topilgan va
 *  keyingi qatorga o'zi tushgan harf (ilovadagi `lockedPositions`). */
export interface BoardRow {
  units: string[];
  verdicts: (Verdict | 'lock' | null)[] | null;
}

const wordsKey = (battleId: string) => `sozgir.battle.words.${battleId}`;


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

const setActive = (id: string | null) => setActiveBattle('soztop', id);

export function useSozjang() {
  const { account } = useAuth();
  const uid = account?.uid ?? '';

  const [battleId, setBattleId] = useState<string | null>(() =>
    readActive('soztop'),
  );
  const [battle, setBattle] = useState<BattleDoc | null>(null);
  const [searching, setSearching] = useState(false);
  const [seconds, setSeconds] = useState(0);
  /** So'z uzunligi — saytda doim 5: tanlov yo'q, ilovadagi asosiy rejim
   *  bilan bir xil. */
  const [length, setLength] = useState<number>(DEFAULT_LENGTH);
  /** Faol qatorga yozilgan harflar — joy bo'yicha (`''` — bo'sh katak).
   *  `row` — qaysi qatorga tegishli: taxmin qabul qilinib qator
   *  ko'paygach eski yozuv o'z-o'zidan eskiradi va tashlab yuboriladi. */
  const [typed, setTyped] = useState<{ row: number; units: string[] }>({
    row: 0,
    units: [],
  });
  /** Serverdan **javob bilan** qaytgan qatorlar (ranglar naqshi).
   *
   *  Taxta raqib holati bilan bitta so'rovdan oziqlanadi va u uch
   *  soniyada bir keladi. Taxmin esa darhol javob oladi: `POST
   *  .../guess` naqshni o'sha zahoti qaytaradi. Shu ikkisi orasida
   *  qator «yo'qolib» turardi — yozuv keyingi qatorga o'tgan, server
   *  ro'yxati esa hali eski edi va kataklar bo'shab qolardi.
   *
   *  Shuning uchun javob shu yerda saqlanadi va so'rov yetib kelgunча
   *  o'sha ishlatiladi. Keyin server ro'yxati uzunroq bo'ladi va
   *  o'zi egallaydi — bu nusxa faqat oradagi uch soniya uchun. */
  const [sent, setSent] = useState<string[]>([]);
  /** Endigina ochilgan qator — kataklar navbat bilan ag'dariladi. */
  const [flipRow, setFlipRow] = useState(-1);
  const [shake, setShake] = useState(false);
  /** Mening taxminlarim — serverda ular jang tugamaguncha yashirin, shu
   *  sabab harflarni ko'rsatish uchun brauzerda saqlanadi. Sahifa
   *  yangilanganda ham o'qiladi: aks holda taxta ranglar bilan qolib,
   *  harflar yo'qolardi. */
  const [words, setWords] = useState<string[]>(() => {
    const id = readActive('soztop');
    return id ? read<string[]>(wordsKey(id), []) : [];
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  /** Taslim bo'lib chiqdim, raqib esa hali o'ynayapti.
   *
   *  Jang hujjati shu payt hali yopilmagan (uni raqib tugatganda yoki
   *  muddat o'tganda server yopadi), ya'ni holatdan «yutqazdim» degan
   *  javob chiqmaydi — javob shu bayroqdan olinadi. */
  const [forfeited, setForfeited] = useState(false);
  /** Avto to'ldirish — sarlavhadagi «Sozlamalar»dan. */
  const settings = useSettings();
  const [hint, setHint] = useState<{ index: number; unit: string } | null>(null);
  /** Raqibdan endigina kelgan reaksiya. `token` — bayroq emas, sanoq:
   *  raqib ketma-ket ikki marta bir xil belgini yuborsa ham ekran
   *  ikkalasini ko'rsatishi kerak. */
  const [incoming, setIncoming] = useState<{ key: ReactionKey; token: number } | null>(
    null,
  );
  /** Endigina yuborgan reaksiyam — sovish tugagunicha tugmada turadi.
   *  Xira, bosilmaydigan ikonka «buzilib qoldi» degan taassurot berardi;
   *  belgining o'zi esa «ketdi» degan javob bo'ladi. */
  const [sentReaction, setSentReaction] = useState<ReactionKey | null>(null);

  /** Navbatdagi yozuv hali kutyaptimi. `false` bo'lsa bizni allaqachon
   *  juftlashgan — takroriy so'rov yuborilmaydi: server bu so'rovda
   *  yozuvimizni «kutilmoqda» deb qayta yozadi va juftlashuv yo'qoladi
   *  (ilovadagi `_waiting` bilan bir xil himoya). */
  const waiting = useRef(true);
  /** Endigina chiqilgan jang — navbat yozuvida uning `matchId` si qolgan
   *  bo'lsa, u qayta ochilmasin. */
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

  const open = useCallback((id: string) => {
    setBattleId(id);
    // Oldingi jangning hujjati yangi jang holati o'rnida ko'rinmasin.
    setBattle(null);
    setActive(id);
    setWords(read<string[]>(wordsKey(id), []));
    setSent([]);
    setTyped({ row: 0, units: [] });
    setFlipRow(-1);
    setHint(null);
    setMessage(null);
    setError(null);
    setIncoming(null);
    setForfeited(false);
  }, []);

  // Chaqiruv qabul qilindi: sahifa ochiq bo'lsa jang shu zahoti ochiladi.
  useEffect(() => onBattleOpen('soztop', open), [open]);

  const close = useCallback(() => {
    setBattleId(null);
    setBattle(null);
    setForfeited(false);
    setWords([]);
    setSent([]);
    setTyped({ row: 0, units: [] });
    setFlipRow(-1);
    setHint(null);
    setActive(null);
  }, []);

  // Jangni kuzatamiz: raqibning har qatori shu orqali keladi.
  useEffect(() => {
    if (!battleId || !account) return;
    let alive = true;
    const stop: Unsubscribe = watchBattle(battleId, (doc) => {
      if (alive) setBattle(doc);
    });

    return () => {
      alive = false;
      stop();
    };
  }, [account, battleId]);

  // Raqibning reaksiyalari. Jang hujjatidan alohida kolleksiya, shuning
  // uchun alohida kuzatuv — jang holati bekorga qayta chizilmaydi.
  useEffect(() => {
    if (!battleId || !uid) return;
    let alive = true;
    const stop: Unsubscribe = watchReactions(battleId, uid, (key) => {
      if (!alive) return;
      setIncoming((previous) => ({ key, token: (previous?.token ?? 0) + 1 }));
    });

    return () => {
      alive = false;
      stop();
    };
  }, [battleId, uid]);

  // Navbat: kimdir bizni tanlasa yozuvimizga `matchId` tushadi.
  useEffect(() => {
    if (!searching || !uid) return;
    let alive = true;
    const stop: Unsubscribe = watchQueue(uid, (entry) => {
      if (!alive) return;
      waiting.current = !entry || entry.status === 'waiting';
      if (!entry?.matchId || entry.matchId === lastLeft.current) return;
      setSearching(false);
      open(entry.matchId);
    });

    return () => {
      alive = false;
      stop();
    };
  }, [open, searching, uid]);

  /* Qidiruv davom etayotganini ko'rsatadigan sanoq.
   *
   *  Bu yerda **takroriy so'rov yo'q** va bu muhim. Navbatga kirish
   *  (`POST /v1/web/battles/quick`) serverdagi yozuvning vaqtini har
   *  safar noldan boshlaydi (`created_at = now()`), robot esa faqat
   *  sakkiz soniyadan uzoq kutganlarga qo'shiladi. Ya'ni o'n
   *  soniyada bir qayta so'rash robotning taymerini doim qayta
   *  yoqib turardi va raqib besh-o'n soniya o'rniga daqiqalab
   *  topilmasdi.
   *
   *  Navbatdagi o'rin serverda saqlanadi, shuning uchun qayta
   *  so'rashning hojati ham yo'q: javob `watchQueue` orqali
   *  keladi — u faqat **o'qiydi** va vaqtga tegmaydi. */
  useEffect(() => {
    if (!searching || !account) return;
    const tick = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(tick);
  }, [account, searching]);

  const me: BattlePlayer | undefined = battle?.players?.[uid];
  const opponentUid = useMemo(() => {
    const keys = Object.keys(battle?.players ?? {});
    return keys.find((key) => key !== uid) ?? null;
  }, [battle, uid]);
  const opponent = opponentUid ? battle?.players?.[opponentUid] : undefined;

  const boardLength = battle?.length ?? length;
  const maxAttempts = attemptsFor(boardLength);

  /** Maydon jadvali — Mardu maydonda sakkiztagacha qator bo'lishi mumkin.
   *  1v1 jangda ekran o'zgarmaydi: eski «men va raqib» ko'rinishi qoladi. */
  const arena = useMemo(() => rankArena({ battle, uid }), [battle, uid]);
  const mardu = isMardu(battle);
  const tiles = useMemo(() => arenaTiles(arena), [arena]);

  /** Muddat ikkala shaklda ham bor: maydonda bitta sekin o'yinchi
   *  yetti kishini garovda ushlab turmasligi uchun, 1v1 da esa server
   *  besh daqiqalik chegara qo'ygani uchun. Vaqti tugagan jangni
   *  server o'zi yopadi, demak sanoqni yashirish odamni
   *  ogohlantirishsiz uzish degani bo'lardi. */
  const endsAt = battle?.endsAt?.seconds;
  // Soat holatda, qolgan vaqt esa **hisoblanadi**: shunda muddat
  // o'zgarganda sanoq bir render kechikmaydi.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!endsAt) return;
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, [endsAt]);
  const left = endsAt ? Math.max(0, Math.ceil(endsAt - now / 1000)) : 0;

  // Jang hujjati hali kelmagan bo'lsa holat noma'lum — «yuklanmoqda».
  // Ilgari bu payt ham 'playing' deb hisoblanardi: jang ochilishi bilan
  // holat qisqa vaqt 'playing' bo'lib, hujjat kelgach 'waiting' ga
  // qaytardi. Shu «sakrash» boshlanish afishasining sanog'ini o'z paytida
  // yeb qo'yardi va taxta ochilmay qolardi.
  const phase: Phase = !battleId
    ? searching
      ? 'searching'
      : 'lobby'
    : !battle
      ? 'loading'
      // Taslim bo'lgan odam uchun jang tugadi: hujjat hali ochiq
      // bo'lsa ham u yerda kutadigan narsa qolmagan.
      : forfeited ||
          battle.status === 'finished' ||
          battle.status === 'expired'
        ? 'finished'
        : battle.status === 'waiting'
          ? 'waiting'
          : 'playing';

  /* Jang tugadi — reyting kartochkasi darhol qayta so'raladi.
   *
   *  Natija ekrani o'sha kartochkani ko'rsatadi, reyting esa
   *  o'n besh soniyada bir so'raladi: endigina yutgan odam
   *  «0 jang» va boshlang'ich o'ljani ko'rardi. */
  useEffect(() => {
    if (phase !== 'finished') return;
    refreshRating();
    /* Tugagan jang endi «ochiq jang» emas.
     *
     *  Brauzerdagi yozuv jangni ochiq deb turardi va odam boshqa
     *  bo'limga o'tib qaytganda — masalan «O'ynash» dan yana
     *  So'zjangga kirganda — lobbi o'rnida o'tgan jangning
     *  natijasi ochilardi. Natijaning o'zi ekranda qoladi
     *  (`battleId` holatda), lekin keyingi tashrif toza
     *  boshlanadi. */
    setActive(null);
  }, [phase]);

  // `me` hujjat bilan birga o'zgaradi — ro'yxat har renderda yangi
  // bo'lib qolmasligi uchun eslab qo'yiladi.
  const myRows = useMemo(() => {
    const server = me?.rows ?? [];
    return server.length >= sent.length ? server : sent;
  }, [me, sent]);
  const finished = me?.finished === true;

  /** Faol qator: topilgan harflar qulflangan, qolgani yozilgan harflar.
   *
   *  Avto to'ldirish endi sozlamaga bo'ysunadi (ilovadagidek): o'chiq
   *  bo'lsa qator bo'sh qoladi. Serverdan kelgan maslahat esa baribir
   *  o'z katagiga tushadi — u alohida narsa, odam uni ataylab olgan. */
  const locked = useMemo(() => {
    const out = settings.autoFill
      ? autoFill(myRows, words, boardLength)
      : Array.from({ length: boardLength }, () => '');
    // Server bergan maslahat (60 % harf topilgach bitta harf) ham keyingi
    // qatorga tushadi — ilovadagi topilgan harflar kabi qulflanadi.
    if (hint && hint.index < boardLength && !out[hint.index]) out[hint.index] = hint.unit;
    return out;
  }, [boardLength, hint, myRows, settings.autoFill, words]);
  const current = useMemo(() => {
    const fresh = typed.row === myRows.length ? typed.units : [];
    return locked.map((unit, index) => unit || fresh[index] || '');
  }, [locked, myRows.length, typed]);

  const rows = useMemo<BoardRow[]>(() => {
    const out: BoardRow[] = myRows.map((row, index) => ({
      // Sahifa yangilangan bo'lsa harflar yo'q — faqat ranglar qoladi.
      units: split(words[index] ?? ''),
      verdicts: verdictsOf(row),
    }));
    if (!finished && phase === 'playing') {
      out.push({
        units: current,
        verdicts: locked.map((unit) => (unit ? 'lock' : null)),
      });
    }
    while (out.length < maxAttempts) out.push({ units: [], verdicts: null });
    return out.slice(0, maxAttempts);
  }, [current, finished, locked, maxAttempts, myRows, phase, words]);

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

  /** Harflarni o'zgartirish — qulflangan kataklarga tegilmaydi. */
  const edit = useCallback(
    (change: (units: string[]) => string[]) => {
      setTyped((state) => {
        const base = state.row === myRows.length ? state.units : [];
        const filled = locked.map((unit, index) => unit || base[index] || '');
        const next = change(filled);
        return {
          row: myRows.length,
          units: next.map((unit, index) => (locked[index] ? '' : unit)),
        };
      });
    },
    [locked, myRows.length],
  );

  /** Oxirgi yozilgan (qulflanmagan) katak — o'chirish va qo'shma harf uchun. */
  const lastTyped = useCallback((units: string[]) => {
    for (let index = units.length - 1; index >= 0; index -= 1) {
      if (units[index] && !locked[index]) return index;
    }
    return -1;
  }, [locked]);

  const submit = useCallback(async () => {
    if (!battleId || busy) return;
    const word = normalize(current.join(''));
    if (current.some((unit) => !unit) || lengthOf(word) !== boardLength) {
      bump('Yetarli harf yo‘q');
      return;
    }

    setBusy(true);
    try {
      const reply = await sendGuess({ battleId, word, attempt: words.length + 1 });
      if (!reply.accepted) {
        bump(reply.reason ?? 'Bu so‘z qabul qilinmadi');
        return;
      }

      const next = [...words, word];
      setWords(next);
      write(wordsKey(battleId), next);
      // Naqsh darhol taxtaga tushadi — so'rovni kutmaymiz.
      const pattern = reply.row;
      if (pattern) {
        setSent((rows) => [...rows.slice(0, next.length - 1), pattern]);
      }
      // Yangi qator ranglar bilan kelganda ag'dariladi; yozuv esa keyingi
      // qatorga o'tadi (topilgan harflar o'zi tushadi).
      setFlipRow(next.length - 1);
      setTyped({ row: next.length, units: [] });
      if (reply.hint) {
        setHint(reply.hint);
        bump(`Maslahat: ${reply.hint.index + 1}-katak`);
      }
    } catch (raw) {
      bump(apiError(raw));
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
        edit((units) => {
          const index = lastTyped(units);
          if (index === -1) return units;
          const next = [...units];
          next[index] = '';
          return next;
        });
        return;
      }
      // Harf birinchi bo'sh katakka tushadi — qulflanganlar o'tkazib
      // yuboriladi.
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
    [bump, busy, current, edit, finished, lastTyped, phase, submit],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const active = document.activeElement;
      if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) {
        return;
      }

      const last = lastTyped(current);
      const action = keyAction(gameKey(event.key), last === -1 ? undefined : current[last]);
      if (!action) return;
      event.preventDefault();

      if (action.kind === 'enter') press('enter');
      else if (action.kind === 'back') press('back');
      else if (action.kind === 'letter') press(action.unit);
      else {
        // `s`+`h` → SH: oxirgi yozilgan harf qo'shma harfga aylanadi.
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

  /** Har bir amal uchun bir xil o'ram: bandlik va xato. */
  const run = useCallback(async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (raw) {
      setError(apiError(raw));
    } finally {
      setBusy(false);
    }
  }, []);

  const pickLength = useCallback((next: number) => {
    setLength(next);
  }, []);

  const create = useCallback(
    () =>
      run(async () => {
        if (!account) return;
        const reply = await createChallenge({
          length,
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
        waiting.current = true;
        /* Qidiruv ekrani so'rovdan **oldin** yoqiladi: javob kelgunicha
           ekranda lobbi turardi va tugma bosilgani bilinmasdi — sekin
           aloqada bu bir necha soniya edi. Raqib darrov topilsa
           jangning o'zi ochiladi (`open`), ya'ni qidiruv ekrani ko'zga
           ham tashlanmaydi. */
        setSearching(true);
        try {
          const reply = await quickMatch({ length });
          if (reply.battleId) {
            // Navbat kuzatuvchisi (`searching` ga bog'langan effekt)
            // endi keraksiz: jang topilgan.
            setSearching(false);
            open(reply.battleId);
          }
        } catch (error) {
          setSearching(false);
          throw error;
        }
      }),
    [account, length, open, run],
  );

  const cancelSearch = useCallback(async () => {
    setSearching(false);
    await leaveQueue().catch(() => undefined);
  }, []);

  /** Taslim bo'lish: natija shu zahoti ochiladi.
   *
   *  Ilgari «Jangdan chiqish» taslim bilan birga lobbiga qaytarardi va
   *  odam o'zi nima bilan tugatganini ko'rmasdi. Kutishning ham,
   *  qaytarishning ham ma'nosi yo'q: taslim bo'lganning natijasi
   *  allaqachon ma'lum — u yutqazdi. Noma'lumi faqat raqibniki, uni
   *  bilish uchun esa jangda o'tirish shart emas: natija janglar
   *  tarixida chiqadi.
   *
   *  Server javobidan **keyin** belgilanadi: so'rov yiqilsa jang hamon
   *  ketayotgan bo'ladi va «yutqazdingiz» deb turish yolg'on bo'lardi.
   *
   *  Faol jang belgisi darrov o'chiriladi — sahifa yangilansa odam
   *  o'zi chiqib bo'lgan jangga qaytib tushmasin. */
  const surrender = useCallback(async () => {
    const id = battleId;
    if (!id) return;
    await forfeit(id).catch(() => undefined);
    lastLeft.current = id;
    setActive(null);
    setForfeited(true);
  }, [battleId]);

  /** Jangdan chiqish. Boshlangan jangda taslim bo'lamiz: raqib cheksiz
   *  kutib qolmasligi kerak. */
  const leave = useCallback(async () => {
    const id = battleId;
    lastLeft.current = id;
    close();
    if (!id) return;
    // Holat hali noma'lum ('loading') bo'lsa ham taslim bo'lamiz: raqib
    // cheksiz kutib qolmasligi kerak.
    if ((phase === 'playing' || phase === 'loading') && !finished) {
      await forfeit(id).catch(() => undefined);
    }
  }, [battleId, close, finished, phase]);

  /** Natijadagi «Yangi jang» — darhol raqib qidiriladi.
   *
   *  Jang qanday boshlangani (tezkor yoki do'st bilan kod orqali)
   *  bu yerda ahamiyatsiz: tugma bosgan odam **hozir yana
   *  o'ynamoqchi**. Kod yaratib do'stni kutish esa boshqa niyat va
   *  u lobbida o'z joyida turibdi — ilgari bu yerda o'sha chiqardi
   *  va odam kutish ekranida qolib ketardi. Lobbiga qaytarish ham
   *  to'g'ri emas: u yerda baribir bitta tugma bosilardi. */
  const again = useCallback(async () => {
    await leave();
    await quick();
  }, [leave, quick]);

  /** Raqibga reaksiya yuboradi.
   *
   *  Yuborish «optimistik»: tugma darhol sovishga o'tadi va javob
   *  kutilmaydi — bu amal jangni to'xtatib qo'ymasligi kerak. Xato bo'lsa
   *  ham ekranda hech narsa o'zgarmaydi: reaksiya yetib bormagani
   *  o'yinga ta'sir qilmaydi. */
  const react = useCallback(
    (key: ReactionKey) => {
      if (!battleId || !uid || sentReaction) return;
      setSentReaction(key);
      later(() => setSentReaction(null), REACTION_COOLDOWN_MS);
      void sendReaction(battleId, uid, key).catch(() => undefined);
    },
    [battleId, later, sentReaction, uid],
  );

  /** Natijani ulashish matni — So'ztopdagi bilan bir uslubda: sarlavha,
   *  ikki tomonning yo'li ranglar bilan, ostida havola. Harflar yo'q —
   *  javob oshkor bo'lmasin. */
  const shareText = useCallback(() => {
    const max = attemptsFor(boardLength);
    const label = (player: BattlePlayer | undefined, fallback: string) =>
      `${player?.nickname ?? fallback} ${player?.won ? `${player.attempts ?? player.rows?.length ?? 0}/${max}` : `X/${max}`}`;
    const grid = (player: BattlePlayer | undefined) =>
      (player?.rows ?? [])
        .map((row) => verdictsOf(row).map((verdict) => EMOJI[verdict]).join(''))
        .join('\n');
    const meName = account?.nickname ?? 'Men';
    const winner = battle?.winnerUid;
    const outcome = !winner
      ? 'Durang'
      : winner === uid
        ? `${meName} yutdi`
        : `${opponent?.nickname ?? 'Raqib'} yutdi`;
    return [
      `So‘zjang · ${boardLength} harf · ${outcome}`,
      '',
      label(me, meName),
      grid(me),
      '',
      label(opponent, 'Raqib'),
      grid(opponent),
      '',
      `${site}${links.battle}`,
    ].join('\n');
  }, [account, battle, boardLength, me, opponent, uid]);

  return {
    account,
    phase,
    battle,
    battleId,
    code: battle?.inviteCode ?? null,
    me,
    opponent,
    opponentUid,
    arena,
    tiles,
    mardu,
    left,
    length,
    boardLength,
    maxAttempts,
    rows,
    keyState,
    current,
    locked,
    flipRow,
    shake,
    words,
    hint,
    message,
    shareText,
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
    surrender,
    forfeited,
    again,
    press,
    incoming,
    sentReaction,
    react,
    clearError: () => setError(null),
  };
}

export type Sozjang = ReturnType<typeof useSozjang>;
