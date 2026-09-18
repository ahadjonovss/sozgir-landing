/** Statistika paneli — ilovadagi statistika sahifasining veb ko'rinishi.
 *
 *  Ko'rsatkichlar tanlangan rejim va uzunlik uchun (`sozgir.stats.*`),
 *  yig'ilgan aqcha esa barcha rejimlar bo'yicha (`sozgir.found`). Shuning
 *  uchun rejim tanlovi sahifada — panel va taxta bir xil narsani
 *  ko'rsatishi kerak. */
import { attemptsFor } from '../lib/modes';
import { formatAqcha } from '../lib/aqcha';
import ScoreRules from './ScoreRules';
import type { GameChoice } from '../lib/useGameChoice';
import type { FoundSummary, GameStats } from '../lib/progress';

function Metric({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <li>
      <strong>{value}</strong>
      <span>{label}</span>
    </li>
  );
}

/** Urinishlar taqsimoti: har bir urinish raqami uchun nechta g'alaba. */
function Distribution({
  stats,
  maxAttempts,
}: {
  stats: GameStats;
  maxAttempts: number;
}) {
  const peak = Math.max(1, ...Object.values(stats.distribution));

  return (
    <div className="dist">
      {Array.from({ length: maxAttempts }, (_, index) => {
        const attempt = index + 1;
        const count = stats.distribution[attempt] ?? 0;
        return (
          <div className="dist__row" key={attempt}>
            <span className="dist__num">{attempt}</span>
            <span className="dist__track">
              {/* Nol bo'lganda ham ingichka iz qoladi, shunda qator
                  bo'sh ko'rinmaydi. */}
              <span
                className={`dist__bar${count === 0 ? ' dist__bar--empty' : ''}`}
                style={{ width: `${count === 0 ? 0 : (count / peak) * 100}%` }}
              />
            </span>
            <span className="dist__count">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function StatsPanel({
  choice,
  stats,
  total,
  bare = false,
}: {
  choice: GameChoice;
  stats: GameStats;
  total: FoundSummary;
  /** Oyna ichida: sarlavha oynaning o'zida turadi, panel esa hoshiyasiz
   *  bo'ladi — bitta kartochka ikkinchisining ichida ko'rinmasin. */
  bare?: boolean;
}) {
  const { mode, length } = choice;
  const winRate = stats.played === 0 ? 0 : Math.round((stats.wins / stats.played) * 100);

  return (
    <div className={bare ? 'panel panel--bare' : 'panel'}>
      <div className="panel__head">
        {!bare && <h3>Statistika</h3>}
        <span className="panel__tag">
          {mode === 'daily' ? 'Kunlik' : `Cheksiz · ${length} harf`}
        </span>
      </div>

      <ul className="metrics">
        <Metric value={stats.played} label="O‘yin" />
        <Metric value={`${winRate}%`} label="G‘alaba" />
        <Metric value={stats.currentStreak} label="Ketma-ket" />
        <Metric value={stats.maxStreak} label="Eng uzun" />
      </ul>

      {stats.played === 0 ? (
        <p className="panel__note">
          Birinchi o‘yindan keyin bu yerda g‘alaba foizi, ketma-ketlik va
          urinishlar taqsimoti ko‘rinadi.
        </p>
      ) : (
        <>
          <p className="panel__label">Urinishlar taqsimoti</p>
          <Distribution stats={stats} maxAttempts={attemptsFor(length)} />
        </>
      )}

      <ul className="metrics metrics--split">
        {/* Bu yerda belgi qo'yilmaydi: yonida «Aqcha» yozuvi turibdi va
            panel ko'rsatkichlar uchun — belgi qatorni band qiladi. */}
        <Metric value={formatAqcha(total.totalScore)} label="Aqcha" />
        <Metric value={total.count} label="Topilgan so‘z" />
      </ul>

      {/* «Bu raqam qayerdan chiqdi?» degan savol aynan shu yerda tug'iladi
          — javob ham shu yerda tursin. */}
      <ScoreRules game="soztop" />
    </div>
  );
}
