/** Maydon natijasi — uchtalik poydevor va ostida to'liq jadval.
 *
 *  Ikki ustunli 1v1 natijasi maydonda yaramaydi: sakkiz kishilik
 *  jadvalni ikki ustunga sig'dirib bo'lmaydi. Har qatordan ochiq
 *  profilga o'tiladi — jadvaldagi odamni bosib ko'rish yo'li shu bilan
 *  saqlanadi. */
import { playerLink } from '../data/site';
import type { ArenaRow } from '../lib/mardu';
import type { BattleGame } from '../lib/battle';
import Avatar from './Avatar';
import { pretty } from '../lib/uz';

/** Poydevordagi tartib: ikkinchi, birinchi, uchinchi — o'rtadagi baland. */
const PODIUM = [1, 0, 2];

function scoreText(row: ArenaRow, game: BattleGame): string {
  if (game === 'guncha') return `${row.player.score ?? 0} ball`;
  if (row.player.won === true) return `${row.player.attempts ?? 0} urinish`;
  return 'topilmadi';
}

function deltaOf(row: ArenaRow): number | null {
  const { ratingBefore, ratingAfter } = row.player;
  if (ratingBefore === undefined || ratingAfter === undefined) return null;
  return ratingAfter - ratingBefore;
}

export default function ArenaStandings({
  rows,
  game,
}: {
  rows: ArenaRow[];
  game: BattleGame;
}) {
  const top = PODIUM.map((index) => rows[index]).filter(
    (row): row is ArenaRow => row !== undefined,
  );

  return (
    <div className="standings">
      {rows.length >= 3 && (
        <div className="podium">
          {top.map((row) => (
            <div
              key={row.uid}
              className={`podium__step podium__step--${row.rank}${
                row.mine ? ' podium__step--me' : ''
              }`}
            >
              <Avatar name={row.nickname} uid={row.uid} size={46} />
              <b>{pretty(row.nickname)}</b>
              <span>{scoreText(row, game)}</span>
              <i>{row.rank}</i>
            </div>
          ))}
        </div>
      )}

      <ol className="standings__list">
        {rows.map((row) => {
          const delta = deltaOf(row);
          return (
            <li
              key={row.uid}
              className={`standings__row${row.mine ? ' standings__row--me' : ''}`}
            >
              <span className="standings__place">{row.rank}</span>
              <a className="standings__who" href={playerLink(row.uid)}>
                <Avatar name={row.nickname} uid={row.uid} size={26} />
                <span>{pretty(row.nickname)}</span>
              </a>
              <span className="standings__score">{scoreText(row, game)}</span>
              {delta !== null && (
                <span
                  className={`standings__delta${
                    delta > 0
                      ? ' standings__delta--up'
                      : delta < 0
                        ? ' standings__delta--down'
                        : ''
                  }`}
                >
                  {delta > 0 ? `+${delta}` : delta}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
