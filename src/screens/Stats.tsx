import { useState } from 'react';
import { attemptsFor, DAILY_LENGTH } from '../lib/game';
import { foundCount, loadStats, totalScore } from '../lib/storage';
import { LengthPicker } from '../components/Cards';
import Screen from '../components/Screen';

/** Statistika — ilovadagi `StatsPage` ning veb ko'rinishi.
 *  Ma'lumot shu brauzerdan olinadi: hisob yo'q, sinxronizatsiya ham yo'q. */
export default function Stats() {
  const [length, setLength] = useState(DAILY_LENGTH);
  const daily = loadStats('daily', DAILY_LENGTH);
  const endless = loadStats('endless', length);
  const stats = length === DAILY_LENGTH ? daily : endless;

  const rows = Array.from({ length: attemptsFor(length) }, (_, i) => ({
    attempt: i + 1,
    count: endless.dist[i] ?? 0,
  }));
  const best = Math.max(1, ...rows.map((row) => row.count));

  return (
    <Screen title="Statistika" back="/soztop">
      <div className="stack" style={{ paddingTop: 20 }}>
        <div className="result-stats" style={{ margin: 0 }}>
          <div>
            <b>{totalScore()}</b>
            <span>umumiy ball</span>
          </div>
          <div>
            <b>{foundCount()}</b>
            <span>topilgan so‘z</span>
          </div>
          <div>
            <b>{daily.streak}</b>
            <span>kunlik seriya</span>
          </div>
          <div>
            <b>{daily.best}</b>
            <span>eng uzun</span>
          </div>
        </div>

        <div className="section-label">Cheksiz rejim</div>
        <LengthPicker value={length} onChange={setLength} />

        <div className="card">
          <div className="card__title">Urinishlar taqsimoti</div>
          <div className="dist">
            {rows.map((row) => (
              <div className="dist__row" key={row.attempt}>
                <span style={{ width: 14 }}>{row.attempt}</span>
                <span
                  className={`dist__bar${row.count > 0 && row.count === best ? ' dist__bar--best' : ''}`}
                  style={{ width: `${(row.count / best) * 100}%` }}
                >
                  {row.count}
                </span>
              </div>
            ))}
          </div>
          <p className="prose" style={{ marginTop: 10, fontSize: 13 }}>
            {stats.played} o‘yin · {stats.won} g‘alaba ·{' '}
            {stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0}%
          </p>
        </div>

        <p className="prose" style={{ fontSize: 13 }}>
          Natijalar shu brauzerda saqlanadi. Ilovada ular hisobingizga
          bog‘lanadi va yangi telefonda ham tiklanadi.
        </p>
      </div>
    </Screen>
  );
}
