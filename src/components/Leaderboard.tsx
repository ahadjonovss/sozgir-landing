/** Reyting: kunlik va umumiy.
 *
 *  Jadval kirmagan odamga ham ko'rinadi — o'zining o'rnini ko'rish uchun
 *  esa kirish kerak, shuning uchun kirmaganlarga qisqa eslatma chiqadi. */
import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { dailyKey } from '../lib/daily';
import { dailyTop, totalTop, type Entry } from '../lib/leaderboard';
import { DAILY_LENGTH } from '../lib/modes';
import { pretty } from '../lib/uz';

type Tab = 'daily' | 'total';

export default function Leaderboard() {
  const { account, openPrompt } = useAuth();
  const [tab, setTab] = useState<Tab>('daily');
  /** Jadval o'zi qaysi bo'lim uchun yuklanganini eslab qoladi — shunda
   *  bo'lim almashganda holatni sinxron tozalash kerak bo'lmaydi. */
  const [loaded, setLoaded] = useState<{ tab: Tab; entries: Entry[] } | null>(null);
  const rows = loaded?.tab === tab ? loaded.entries : null;

  useEffect(() => {
    let alive = true;

    (async () => {
      const entries =
        tab === 'daily'
          ? await dailyTop({ dateKey: dailyKey(), length: DAILY_LENGTH })
          : await totalTop({});
      if (alive) setLoaded({ tab, entries });
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

      {rows === null && <p className="panel__note">Yuklanmoqda…</p>}

      {rows !== null && rows.length === 0 && (
        <p className="panel__note">
          {tab === 'daily'
            ? 'Bugun hali natija yo‘q — birinchi bo‘ling!'
            : 'Hozircha natija yo‘q.'}
        </p>
      )}

      {rows !== null && rows.length > 0 && (
        <ol className="ranks">
          {rows.map((row, index) => (
            <li
              key={row.uid}
              className={`rank${row.uid === account?.uid ? ' rank--me' : ''}`}
            >
              <span className="rank__place">{index + 1}</span>
              <span className="rank__name">{pretty(row.nickname)}</span>
              <span className="rank__meta">
                {tab === 'daily'
                  ? row.won
                    ? `${row.count} urinish`
                    : 'topilmadi'
                  : `${row.count} so‘z`}
              </span>
              <span className="rank__points">{row.points}</span>
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
    </div>
  );
}
