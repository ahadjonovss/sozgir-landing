/** Ochiq jang — So'zjang ham, g'uncha jangi ham.
 *
 *  Jang o'ynaladigan sahifada boshlanadi, lekin u haqda saytning boshqa
 *  qismlari ham bilishi kerak: kelgan chaqiruv xabari bandlikni shundan
 *  biladi. Shuning uchun yozuv bitta joydan o'tadi.
 *
 *  Ikki o'yin ikki kalitda turadi: odam So'zjangni yarim tashlab g'uncha
 *  jangiga kirsa, birinchisi yo'qolib qolmaydi. Sahifa esa o'yinga qarab
 *  tanlanadi — chaqiruvning `game` maydoni qaysi ekranni ochishni
 *  aytadi (maydoni yo'q chaqiruv So'ztopniki). */
import { useEffect, useState } from 'react';
import { links } from '../data/site';
import type { BattleGame } from './battle';

const GAMES: BattleGame[] = ['soztop', 'guncha'];

const KEY: Record<BattleGame, string> = {
  soztop: 'sozgir.battle',
  guncha: 'sozgir.guncha.battle',
};

const PAGE: Record<BattleGame, string> = {
  soztop: links.battle,
  guncha: links.gunchaBattle,
};

/** Ochiq jang o'zgargani. `storage` hodisasi bu ish uchun yaramaydi: u
 *  faqat boshqa oynalarda ishlaydi, o'zimizda esa jim. */
const ACTIVE_EVENT = 'sozgir:battle-active';

/** Chaqiruv qabul qilinganda jangni ochish hodisasi.
 *
 *  Chaqiruv xabari ilova darajasida turadi va o'yin sahifasiga
 *  to'g'ridan-to'g'ri yeta olmaydi. Shuning uchun jang identifikatori
 *  saqlanadi va hodisa yuboriladi: sahifa ochiq bo'lsa darrov o'tadi,
 *  ochiq bo'lmasa sahifa ochilganda saqlangan jangdan davom etadi. */
const OPEN_EVENT = 'sozgir:battle-open';

export interface ActiveBattle {
  game: BattleGame;
  id: string;
}

export function readActive(game: BattleGame): string | null {
  try {
    const raw = localStorage.getItem(KEY[game]);
    return raw ? (JSON.parse(raw) as string) : null;
  } catch {
    return null;
  }
}

function readAny(): ActiveBattle | null {
  for (const game of GAMES) {
    const id = readActive(game);
    if (id) return { game, id };
  }
  return null;
}

/** Ochiq jangni eslab qo'yadi va o'zgarganini e'lon qiladi. */
export function setActive(game: BattleGame, id: string | null): void {
  try {
    if (id) localStorage.setItem(KEY[game], JSON.stringify(id));
    else localStorage.removeItem(KEY[game]);
  } catch {
    // Shaxsiy rejim — jang faqat shu sahifada davom etadi.
  }
  window.dispatchEvent(new CustomEvent(ACTIVE_EVENT, { detail: { game, id } }));
}

/** Chaqiruvdan kelgan jangni ochadi. */
export function openBattle(game: BattleGame, id: string): void {
  setActive(game, id);
  window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: { game, id } }));
}

/** Jangni ochib, o'sha o'yin sahifasiga o'tadi. Chaqiruv istalgan
 *  sahifada qabul qilinishi mumkin — reytingdan chaqirilgan raqib javob
 *  berganda odam `/oyin` da turadi. */
export function showBattle(game: BattleGame, id: string): void {
  openBattle(game, id);
  if (window.location.pathname !== PAGE[game]) {
    window.history.pushState(null, '', PAGE[game]);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
}

/** Sahifa ochiq bo'lsa jangni shu zahoti ochish uchun obuna. */
export function onBattleOpen(
  game: BattleGame,
  handler: (id: string) => void,
): () => void {
  const listener = (event: Event) => {
    const detail = (event as CustomEvent<ActiveBattle>).detail;
    if (detail?.game === game && detail.id) handler(detail.id);
  };
  window.addEventListener(OPEN_EVENT, listener);
  return () => window.removeEventListener(OPEN_EVENT, listener);
}

/** Brauzerda saqlangan ochiq jang — sahifa almashsa ham qolaveradi.
 *
 *  O'yin sahifasi yopilganda jang tugamaydi: odam boshqa bo'limga o'tib
 *  ketishi mumkin, jang esa serverda davom etaveradi. */
export function useActiveBattle(): ActiveBattle | null {
  const [active, setState] = useState(readAny);

  useEffect(() => {
    const sync = () => setState(readAny());
    // Boshqa oynada boshlangan jang ham hisobga olinadi.
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || Object.values(KEY).includes(event.key)) sync();
    };

    window.addEventListener(ACTIVE_EVENT, sync);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(ACTIVE_EVENT, sync);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return active;
}
