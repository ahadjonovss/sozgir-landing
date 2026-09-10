/** Reyting: kunlik va umumiy.
 *
 *  Jadval kirmagan odamga ham ko'rinadi — o'zining o'rnini ko'rish uchun
 *  esa kirish kerak, shuning uchun kirmaganlarga qisqa eslatma chiqadi. */
import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { dailyKey } from '../lib/daily';
import { dailyTop, totalTop, type Entry } from '../lib/leaderboard';
import Avatar from './Avatar';
import { Swords } from './Icons';
import SendInvite, { type InviteTarget } from './SendInvite';
import { DAILY_LENGTH } from '../lib/modes';
import { pretty } from '../lib/uz';
import { playerLink } from '../data/site';

type Tab = 'daily' | 'total';

export default function Leaderboard() {
  const { account, openPrompt } = useAuth();
  const [tab, setTab] = useState<Tab>('daily');
  /** Har bo'limning yuklangan jadvali alohida saqlanadi: qaytib
   *  almashilganda darrov chiqadi, yuklanish paytida esa oldingi bo'limning
   *  qatorlari joyida qolib xiralashadi — ro'yxat o'rniga bitta qator
   *  «Yuklanmoqda…» chiqib panel kichrayib-kattalashib yubormaydi. */
  const [cache, setCache] = useState<Partial<Record<Tab, Entry[]>>>({});
  const rows = cache[tab] ?? null;
  /** Ekranda ko'rinadigan qatorlar: bu bo'limniki, bo'lmasa (hali
   *  yuklanmoqda) boshqa bo'limning qatorlari — o'sha balandlikda. */
  const shown = rows ?? cache[tab === 'daily' ? 'total' : 'daily'] ?? null;
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
          {(['daily', 'total'] as Tab[]).map((item) => (
            <button
              key={item}
              role="tab"
              aria-selected={tab === item}
              className={`play__mode${tab === item ? ' play__mode--on' : ''}`}
              onClick={() => setTab(item)}
            >
              {item === 'daily' ? 'Kunlik' : 'Umumiy'}
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
          {tab === 'daily'
            ? 'Bugun hali natija yo‘q — birinchi bo‘ling!'
            : 'Hozircha natija yo‘q.'}
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
                <span className="rank__name">{pretty(row.nickname)}</span>
              </a>
              <span className="rank__meta">
                {tab === 'daily'
                  ? row.won
                    ? `${row.count} urinish`
                    : 'topilmadi'
                  : `${row.count} so‘z`}
              </span>
              <span className="rank__points">{row.points}</span>
              {row.uid !== account?.uid && (
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
