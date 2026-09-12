/** Janglar tarixi — ikkala o'yin bitta ro'yxatda.
 *
 *  Ilovadagi maydon sahifasidagi ro'yxatning o'zi: qaysi o'yin, kim bilan,
 *  qanday tugagan va reyting qancha o'zgargan. O'yinlarni ajratmaydi —
 *  «kim bilan o'ynadim» degan savol o'yinga qarab bo'linmaydi.
 *
 *  Kirmagan odamga umuman ko'rinmaydi: tarix hisobga bog'langan. */
import { useCallback, useEffect, useState } from 'react';
import { playerLink } from '../data/site';
import { useAuth } from '../lib/auth';
import { myBattles, type ArenaBattle } from '../lib/battleHistory';
import { pretty } from '../lib/uz';
import Avatar from './Avatar';

const OUTCOME: Record<ArenaBattle['outcome'], string> = {
  win: 'G‘alaba',
  loss: 'Mag‘lubiyat',
  draw: 'Durang',
  open: 'Davom etmoqda',
};

const GAME: Record<ArenaBattle['game'], string> = {
  soztop: 'So‘zjang',
  guncha: 'G‘uncha',
};

export default function ArenaHistory() {
  const { account } = useAuth();
  const uid = account?.uid ?? '';
  /** Ro'yxat egasi bilan saqlanadi: hisob almashsa eskisi render paytida
   *  chiqarib tashlanadi va holatni effekt ichida tozalash kerak
   *  bo'lmaydi. */
  const [loaded, setLoaded] = useState<{ uid: string; list: ArenaBattle[] } | null>(
    null,
  );
  const rows = loaded?.uid === uid ? loaded.list : null;

  const load = useCallback(async () => {
    if (!uid) return;
    setLoaded({ uid, list: await myBattles({ uid, limit: 12 }) });
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    let alive = true;
    void myBattles({ uid, limit: 12 }).then((list) => {
      if (alive) setLoaded({ uid, list });
    });
    return () => {
      alive = false;
    };
  }, [uid]);

  if (!uid) return null;

  return (
    <div className="panel">
      <div className="panel__head">
        <h3>Janglar tarixi</h3>
        <button className="link" onClick={load} type="button">
          Yangilash
        </button>
      </div>

      {rows === null && <p className="panel__note">Yuklanmoqda…</p>}

      {rows !== null && rows.length === 0 && (
        <p className="panel__note">Hali jang qilmagansiz.</p>
      )}

      {rows !== null && rows.length > 0 && (
        <ul className="history">
          {rows.map((row) => (
            <li key={row.id} className={`history__row history__row--${row.outcome}`}>
              {row.opponentUid ? (
                <a className="history__who" href={playerLink(row.opponentUid)}>
                  <Avatar name={row.opponent || '?'} uid={row.opponentUid} size={26} />
                  <span>{pretty(row.opponent) || 'Raqib'}</span>
                </a>
              ) : (
                <span className="history__who">
                  <Avatar name="?" uid={row.id} size={26} />
                  <span>Raqibsiz</span>
                </span>
              )}

              <span className="history__game">{GAME[row.game]}</span>
              {/* G'unchada hisob, So'zjangda yashirin so'z. */}
              {row.detail && (
                <span className="history__detail">{pretty(row.detail)}</span>
              )}
              <span className="history__outcome">{OUTCOME[row.outcome]}</span>
              {row.ratingDelta !== null && row.ratingDelta !== 0 && (
                <span className="history__delta">
                  {row.ratingDelta > 0 ? `+${row.ratingDelta}` : row.ratingDelta}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
