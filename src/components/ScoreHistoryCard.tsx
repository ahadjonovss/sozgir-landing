/** Kunlik ball tarixi — ustunchalar bilan.
 *
 *  «Qaysi kuni qancha» degan savolga javob beradi. Yig'indi
 *  (`me/stats`) uni bermaydi: u bitta son va undan odamning
 *  kunlarini ko'rib bo'lmaydi.
 *
 *  Chizma ataylab **oddiy**: ustunlar balandligi eng katta kunga
 *  nisbatan. O'q ham, setka ham yo'q — kartochka tor ustunda turadi
 *  va u yerda ular o'qilmaydi. Savol ham aniq emas, umumiy: «so'nggi
 *  paytda qanday o'ynayapman».
 *
 *  O'ynalmagan kun **ro'yxatda qoladi**, nol balandlik bilan: uzilish
 *  ham ma'lumot va uni tashlab yuborish grafikni yolg'on silliq
 *  qilib ko'rsatardi. */
import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { formatAqcha } from '../lib/aqcha';
import { loadScoreHistory, type DayScore } from '../lib/insights';

/** Nechta kun ko'rsatiladi. */
const DAYS = 30;

export default function ScoreHistoryCard() {
  const { account } = useAuth();
  const [days, setDays] = useState<DayScore[]>([]);

  useEffect(() => {
    if (!account) return setDays([]);
    let alive = true;
    void loadScoreHistory(DAYS).then((rows) => {
      if (alive) setDays(rows);
    });
    return () => {
      alive = false;
    };
  }, [account?.uid]);

  if (!account || days.length === 0) return null;

  const top = Math.max(...days.map((row) => row.points), 1);
  const total = days.reduce((sum, row) => sum + row.points, 0);
  // Eng yangisi o'ngda: vaqt chapdan o'ngga oqadi.
  const rows = [...days].sort((a, b) => a.day.localeCompare(b.day));

  return (
    <div className="panel spark">
      <div className="panel__head">
        <h3>Kunlik ball</h3>
        <span className="panel__tag">{DAYS} kun</span>
      </div>

      <div className="spark__bars">
        {rows.map((row) => (
          <i
            key={row.day}
            // Nol kun ham ko'rinib tursin: ingichka iz qoldiriladi,
            // aks holda uzilish bo'shliqdan farq qilmasdi.
            style={{ height: `${Math.max(3, (row.points / top) * 100)}%` }}
            className={row.points > 0 ? undefined : 'spark__bar--off'}
            title={`${row.day}: ${formatAqcha(row.points)}`}
          />
        ))}
      </div>

      <p className="panel__note">
        Shu kunlarda jami <b>{formatAqcha(total)}</b> aqcha, eng yaxshi kun{' '}
        <b>{formatAqcha(top)}</b>.
      </p>
    </div>
  );
}
