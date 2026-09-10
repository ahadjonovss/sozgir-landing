/** So'zjang reytingi jadvali — `battle_ratings` bo'yicha eng yaxshi o'nlik.
 *
 *  Lobbining yon ustunida turadi: odam jangga kirishdan oldin kim bilan
 *  bellashayotganini, o'z o'rnini ko'radi va jadvaldagi istalgan
 *  o'yinchini darrov chaqira oladi (ilovada bu yo'l ochiq profil orqali).
 *  Jadval ochiq hujjatlardan REST bilan o'qiladi — kirish shart emas,
 *  SDK yuklanmaydi. */
import { useEffect, useState } from 'react';
import { playerLink } from '../data/site';
import { useAuth } from '../lib/auth';
import { tierName } from '../lib/battleRating';
import { battleTop, type BattleEntry } from '../lib/leaderboard';
import { pretty } from '../lib/uz';
import Avatar from './Avatar';
import { Swords } from './Icons';
import SendInvite, { type InviteTarget } from './SendInvite';

export default function BattleBoard() {
  const { account, openPrompt } = useAuth();
  const [rows, setRows] = useState<BattleEntry[] | null>(null);
  const [target, setTarget] = useState<InviteTarget | null>(null);

  useEffect(() => {
    let alive = true;
    void battleTop().then((entries) => {
      if (alive) setRows(entries);
    });
    return () => {
      alive = false;
    };
  }, []);

  const invite = (row: BattleEntry) => {
    if (!account) {
      openPrompt('signIn');
      return;
    }
    setTarget({ uid: row.uid, nickname: row.nickname, kind: 'profile' });
  };

  const mine = rows?.find((row) => row.uid === account?.uid);
  const place = mine && rows ? rows.indexOf(mine) + 1 : 0;

  return (
    <div className="panel">
      <div className="panel__head">
        <h3>So‘zjang reytingi</h3>
        <span className="panel__tag">Eng yaxshi 10</span>
      </div>

      {rows === null && (
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
        <p className="panel__note">Hali hech kim jang qilmagan — birinchi bo‘ling!</p>
      )}

      {rows !== null && rows.length > 0 && (
        <ol className="ranks">
          {rows.map((row, index) => (
            <li
              key={row.uid}
              className={`rank${row.uid === account?.uid ? ' rank--me' : ''}`}
            >
              <span className="rank__place">{index + 1}</span>
              <a className="rank__who" href={playerLink(row.uid)}>
                <Avatar name={row.nickname} uid={row.uid} size={28} />
                <span className="rank__name">{pretty(row.nickname)}</span>
              </a>
              {/* Faqat daraja: g'alaba soni bilan ism kesilib qolardi. */}
              <span className="rank__meta">{tierName(row.rating)}</span>
              <span className="rank__points">{row.rating}</span>
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

      {account && rows !== null && (
        <p className="panel__note">
          {place > 0 ? (
            <>
              Sizning o‘rningiz — <strong>{place}</strong>.
            </>
          ) : (
            'Jang o‘ynagach o‘rningiz shu yerda chiqadi.'
          )}
        </p>
      )}

      {target && (
        <SendInvite key={target.uid} target={target} onClose={() => setTarget(null)} />
      )}
    </div>
  );
}
