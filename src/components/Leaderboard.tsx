/** Reyting: kunlik so'z, bugungi aqcha va umumiy.
 *
 *  Uchtasi uch xil savolga javob beradi va ilovada ham shunday:
 *  «Kunlik» — bugungi so'zni kim necha urinishda topdi (`daily_results`);
 *  «Bugun» — shu kunda barcha o'yinlarda kim ko'p aqcha ishladi
 *  (`daily_scores`); «Umumiy» — butun tarix (`scores`). Uchinchisidagi son endi boylik:
 *  o'yinlarda yig'ilgan ball va o'lja ustamasining yig'indisi — uni
 *  server yozadi (`leaderboard.ts`), sayt esa baribir aqcha deb ataydi.
 *
 *  Jadval kirmagan odamga ham ko'rinadi — o'zining o'rnini ko'rish uchun
 *  esa kirish kerak, shuning uchun kirmaganlarga qisqa eslatma chiqadi. */
import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { dailyKey } from '../lib/daily';
import { dailyTop, todayTop, totalTop, type Entry } from '../lib/leaderboard';
import Avatar from './Avatar';
import { Swords } from './Icons';
import SendInvite, { type InviteTarget } from './SendInvite';
import { Aqcha } from './Units';
import PlayerName from './PlayerName';
import { DAILY_LENGTH } from '../lib/modes';
import { pretty } from '../lib/uz';
import { useVerifiedList } from '../lib/verified';
import { playerLink } from '../data/site';

type Tab = 'daily' | 'today' | 'total';

const TABS: Tab[] = ['daily', 'today', 'total'];

const TAB_LABEL: Record<Tab, string> = {
  daily: 'Kunlik',
  today: 'Bugun',
  total: 'Umumiy',
};

export default function Leaderboard() {
  const { account, openPrompt } = useAuth();
  /** Tasdiqlangan hisobni jadvaldan chaqirib bo'lmaydi — ilovadagi
   *  `canInviteToBattle` bilan bir xil qoida: nishon egasining ekrani
   *  chaqiruv oynalaridan iborat bo'lib qolmasin. */
  const verified = useVerifiedList();
  const [tab, setTab] = useState<Tab>('daily');
  /** Har bo'limning yuklangan jadvali alohida saqlanadi: qaytib
   *  almashilganda darrov chiqadi, yuklanish paytida esa oldingi bo'limning
   *  qatorlari joyida qolib xiralashadi — ro'yxat o'rniga bitta qator
   *  «Yuklanmoqda…» chiqib panel kichrayib-kattalashib yubormaydi. */
  const [cache, setCache] = useState<Partial<Record<Tab, Entry[]>>>({});
  const rows = cache[tab] ?? null;
  /** Ekranda ko'rinadigan qatorlar: bu bo'limniki, bo'lmasa (hali
   *  yuklanmoqda) boshqa bo'limning qatorlari — o'sha balandlikda. */
  const fallback = TABS.map((item) => (item === tab ? undefined : cache[item])).find(
    (entries) => entries !== undefined,
  );
  const shown = rows ?? fallback ?? null;
  const loading = rows === null;
  /** Jadvaldan chaqirilayotgan raqib — ilovadagi ochiq profildagi
   *  «So'zjangga chaqirish». Jadvalda ko'rgan odamni darhol jangga
   *  taklif qilsa bo'ladi; ilgari buning yo'li faqat tasodif edi (bir
   *  marta o'ynagan raqib). */
  const [target, setTarget] = useState<InviteTarget | null>(null);

  const invite = (row: Entry) => {
    // Jang hisobga bog'lanadi — mehmon avval kiradi.
    if (!account) {
      openPrompt('signIn');
      return;
    }
    setTarget({ uid: row.uid, nickname: row.nickname, kind: 'profile' });
  };

  useEffect(() => {
    let alive = true;

    (async () => {
      const entries =
        tab === 'daily'
          ? await dailyTop({ dateKey: dailyKey(), length: DAILY_LENGTH })
          : tab === 'today'
            ? await todayTop({ dateKey: dailyKey() })
            : await totalTop({});
      if (alive) setCache((current) => ({ ...current, [tab]: entries }));
    })();

    return () => {
      alive = false;
    };
    // `account` bilan qayta so'ramaymiz: kirish jadvalni o'zgartirmaydi,
    // faqat o'z qatorini ajratib ko'rsatadi.
  }, [tab]);

  const mine = rows?.find((row) => row.uid === account?.uid);
  const minePlace = mine ? (rows?.indexOf(mine) ?? -1) + 1 : 0;

  return (
    <div className="panel">
      <div className="panel__head">
        <h3>Reyting</h3>
        <div className="play__modes" role="tablist" aria-label="Reyting turi">
          {TABS.map((item) => (
            <button
              key={item}
              role="tab"
              aria-selected={tab === item}
              className={`play__mode${tab === item ? ' play__mode--on' : ''}`}
              onClick={() => setTab(item)}
            >
              {TAB_LABEL[item]}
            </button>
          ))}
        </div>
      </div>

      {/* Birinchi yuklash: jadval shaklidagi skelet — panel keyin
          kattalashmaydi. */}
      {shown === null && (
        <ol className="ranks ranks--skeleton" aria-busy="true" aria-label="Yuklanmoqda">
          {Array.from({ length: 10 }, (_, index) => (
            <li key={index} className="rank rank--skeleton">
              <span className="rank__place">{index + 1}</span>
              <i />
              <i />
              <i />
            </li>
          ))}
        </ol>
      )}

      {rows !== null && rows.length === 0 && (
        <p className="panel__note">
          {tab === 'total'
            ? 'Hozircha natija yo‘q.'
            : 'Bugun hali natija yo‘q — birinchi bo‘ling!'}
        </p>
      )}

      {shown !== null && shown.length > 0 && (rows === null || rows.length > 0) && (
        <ol className={`ranks${loading ? ' ranks--loading' : ''}`} aria-busy={loading}>
          {shown.map((row, index) => (
            <li
              key={row.uid}
              className={`rank${row.uid === account?.uid ? ' rank--me' : ''}`}
            >
              <span className="rank__place">{index + 1}</span>
              {/* Ism va avatar — o'yinchining ochiq profiliga havola
                  (ilovada ham jadval qatori profilga olib boradi). */}
              <a className="rank__who" href={playerLink(row.uid)}>
                <Avatar name={row.nickname} uid={row.uid} size={28} />
                <span className="rank__name">
                  <PlayerName uid={row.uid} name={row.nickname} />
                </span>
              </a>
              <span className="rank__meta">
                {tab === 'daily'
                  ? row.won
                    ? `${row.count} urinish`
                    : 'topilmadi'
                  : tab === 'today'
                    ? 'bugun'
                    : `${row.count} so‘z`}
              </span>
              <span className="rank__points">
                <Aqcha tiyin={row.points} size="sm" />
              </span>
              {row.uid !== account?.uid && !verified(row.uid) && (
                <button
                  type="button"
                  className="rank__invite"
                  onClick={() => invite(row)}
                  title="So‘zjangga chaqirish"
                  aria-label={`${pretty(row.nickname)} ni So‘zjangga chaqirish`}
                >
                  <Swords size={15} />
                </button>
              )}
            </li>
          ))}
        </ol>
      )}

      {!account ? (
        <p className="panel__note">
          <button className="link" onClick={() => openPrompt('signIn')}>
            Kirsangiz
          </button>{' '}
          natijangiz shu jadvalga tushadi.
        </p>
      ) : (
        minePlace > 0 && (
          <p className="panel__note">
            Sizning o‘rningiz — <strong>{minePlace}</strong>.
          </p>
        )
      )}

      {target && (
        <SendInvite key={target.uid} target={target} onClose={() => setTarget(null)} />
      )}
    </div>
  );
}
