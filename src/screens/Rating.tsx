import { foundCount, loadStats, totalScore } from '../lib/storage';
import { DAILY_LENGTH } from '../lib/game';
import OpenInApp from '../components/OpenInApp';
import Screen from '../components/Screen';

const RULES = [
  'Ball = asos ball × urinish samaradorligi × takror koeffitsienti',
  'Asos: kunlik o‘yin — 100. Cheksiz va kategoriyada 4 harf — 50, 5 — 60, 6 — 80, 7 — 90',
  'Qancha kam urinishda topsangiz, ball shuncha yuqori',
  'Avval topgan so‘zingizni qayta topsangiz — ballning 60 foizi',
  'Topa olmasangiz ball berilmaydi',
];

/** Reyting. Ro'yxatning o'zi serverda va hisobga bog'langan, shuning
 *  uchun saytda o'z natijangiz va ball qoidalari ko'rsatiladi. */
export default function Rating() {
  const daily = loadStats('daily', DAILY_LENGTH);

  return (
    <Screen title="Reyting" subtitle="Kunlik va umumiy" back="/">
      <div className="stack" style={{ paddingTop: 20 }}>
        <div className="card card--tone" style={{ ['--tone' as string]: 'var(--yellow)' }}>
          <div className="card__title">Bu brauzerdagi natijangiz</div>
          <div className="result-stats" style={{ marginBottom: 0 }}>
            <div>
              <b>{totalScore()}</b>
              <span>ball</span>
            </div>
            <div>
              <b>{foundCount()}</b>
              <span>so‘z</span>
            </div>
            <div>
              <b>{daily.streak}</b>
              <span>seriya</span>
            </div>
            <div>
              <b>{daily.played}</b>
              <span>kunlik o‘yin</span>
            </div>
          </div>
        </div>

        <p className="prose">
          Umumiy reyting boshqa o‘yinchilar bilan solishtiradi — u hisobga
          bog‘langan va ilovada ko‘rinadi. Kunlik reyting esa bugungi
          so‘zni kim qanday topgani bo‘yicha tuziladi.
        </p>

        <div className="card">
          <div className="card__title">Ball qanday hisoblanadi</div>
          <ul className="bullets">
            {RULES.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </div>

        <OpenInApp path="" label="Reytingni ilovada ochish" />
      </div>
    </Screen>
  );
}
