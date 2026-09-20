/** Nishonlar holati — sonlarni bor joyidan yig'ib, `badges.ts` ga beradi.
 *
 *  Ilovada bu ish `BadgesCubit` da: u ham yangi sanoq yaratmaydi,
 *  statistikani, topilgan so'zlarni va jang reytingini o'qib
 *  [BadgeSnapshot] tuzadi. Saytda manbalar shular:
 *
 *  | Son | Qayerdan |
 *  | --- | --- |
 *  | Kunlik ketma-ketlik | `progress.ts` statistikasi (eng uzuni) |
 *  | Topilgan so'z, mavzu, birinchi urinish | topilgan so'zlar ro'yxati |
 *  | Jang g'alabalari, ketma-ketlik, reyting | `battle_ratings/{uid}` |
 *  | Ball yig'ilgan o'yinlar | g'uncha hisobi + `scores/{uid}.games` |
 *  | Ulashish | brauzerdagi sanoq (`badges.ts`) |
 *
 *  Kirmagan odamda ham ishlaydi: brauzerdagi sonlar yetadi, serverdan
 *  keladigan uchtasi (jang, boshqa o'yinlar, kun odami) esa hisobga
 *  bog'liq — ular kirilganda qo'shiladi.
 *
 *  Nishon qaytarib olinmagani uchun serverdagi son brauzerdagisidan
 *  **kichik** bo'lsa ham zarari yo'q: `badges.ts` olingan nishonni
 *  ro'yxatda saqlaydi. */
import { useCallback, useEffect, useState } from 'react';
import { PATHS } from '../firebase/paths';
import { readDoc } from '../firebase/rest';
import { useAuth } from './auth';
import {
  EMPTY_SNAPSHOT,
  evaluateBadges,
  earnedBadges,
  onBadgesChange,
  shareCount,
  unlockBadge,
  type BadgeSnapshot,
  type BadgeStatus,
} from './badges';
import { readTotals } from './gunchaProgress';
import { LENGTHS, type Mode } from './modes';
import { foundSummary, readFound, readStats } from './progress';

const int = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : 0;

/** Brauzerdagi sonlar — kirmagan odamda ham to'liq ishlaydi. */
function localSnapshot(): BadgeSnapshot {
  const found = readFound();
  const words = Object.values(found);

  let dailyStreak = 0;
  let firstTryWins = 0;
  for (const mode of ['daily', 'endless'] as Mode[]) {
    for (const length of LENGTHS) {
      const stats = readStats(mode, length);
      // Ketma-ketlik faqat kunlikdan: cheksiz rejimda u kunni emas,
      // ketma-ket g'alabani sanaydi va nishonning sharti «kun».
      if (mode === 'daily') dailyStreak = Math.max(dailyStreak, stats.maxStreak);
      firstTryWins += Number(stats.distribution[1]) || 0;
    }
  }

  const categories = new Set(
    words.map((word) => word.categoryId).filter((id): id is string => !!id),
  );

  return {
    ...EMPTY_SNAPSHOT,
    dailyStreak,
    firstTryWins,
    wordsFound: foundSummary(found).count,
    categories: categories.size,
    // So'ztop va G'uncha — brauzerda ko'rinadi; Yangso'z saytda yo'q,
    // u faqat hisobdagi `games` orqali qo'shiladi.
    gamesScored: (words.length > 0 ? 1 : 0) + (readTotals().score > 0 ? 1 : 0),
    shares: shareCount(),
  };
}

/** Hisobdagi sonlar: jang reytingi va ballar kitobi.
 *
 *  Ikkalasi ham ochiq hujjat, ya'ni REST bilan — bu sahifa uchun
 *  Firebase SDK yuklanmaydi. «Kunning eng zo'ri» ham shu yerda:
 *  `scores/{uid}.manOfTheDay` ni server yozadi va u nishonning yagona
 *  izi. */
async function remoteSnapshot(uid: string): Promise<Partial<BadgeSnapshot>> {
  const [rating, score] = await Promise.all([
    readDoc(`${PATHS.battleRatings}/${uid}`),
    readDoc(`${PATHS.scores}/${uid}`),
  ]);

  const games = (score?.games ?? {}) as Record<string, { score?: unknown }>;
  const scored = Object.values(games).filter((game) => int(game?.score) > 0).length;

  if (int(score?.manOfTheDay) > 0) unlockBadge('kuntugmish');

  return {
    battleWins: int(rating?.wins),
    battleStreak: int(rating?.streak),
    battleRating: int(rating?.rating),
    gamesScored: scored,
  };
}

/** Nishonlar ro'yxati va nechtasi olingani. */
export function useBadges(): { badges: BadgeStatus[]; earned: number } {
  const { account } = useAuth();
  const uid = account?.uid;
  const [snapshot, setSnapshot] = useState<BadgeSnapshot>(localSnapshot);
  const [unlocked, setUnlocked] = useState<Set<string>>(earnedBadges);

  const refresh = useCallback(() => {
    setSnapshot(localSnapshot());
    setUnlocked(earnedBadges());
  }, []);

  // Sahifa ochiq turganda o'yin tugasa yoki natija ulashilsa ro'yxat
  // o'zi yangilanadi — nishon uchun sahifani qayta ochish kerak emas.
  useEffect(() => onBadgesChange(refresh), [refresh]);

  useEffect(() => {
    if (!uid) return;
    let alive = true;
    void remoteSnapshot(uid).then((extra) => {
      if (!alive) return;
      // Serverdagi son brauzerdagisidan katta bo'lsa o'sha olinadi:
      // boshqa qurilmada o'ynalgani ham shu odamniki.
      setSnapshot((current) => ({
        ...current,
        ...extra,
        gamesScored: Math.max(current.gamesScored, extra.gamesScored ?? 0),
      }));
      setUnlocked(earnedBadges());
    });
    return () => {
      alive = false;
    };
  }, [uid]);

  const badges = evaluateBadges(snapshot, unlocked);

  // Yangi yetilgan nishon **darhol** ro'yxatga yoziladi: nishon bir marta
  // olingach qaytarib olinmaydi, ketma-ketlik esa ertaga uzilishi mumkin.
  // Yozuvdan keyin kuzatuvchi qayta o'qiydi va ro'yxat tinchiydi.
  useEffect(() => {
    const fresh = badges
      .filter((status) => status.earned && !unlocked.has(status.badge.id))
      .map((status) => status.badge.id);
    if (fresh.length > 0) unlockBadge(...fresh);
  });

  return { badges, earned: badges.filter((status) => status.earned).length };
}
