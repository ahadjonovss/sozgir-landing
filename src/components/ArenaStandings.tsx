/** Maydon natijasi — uchtalik poydevor va ostida **qolganlar**.
 *
 *  Ikki ustunli 1v1 natijasi maydonda yaramaydi: sakkiz kishilik
 *  jadvalni ikki ustunga sig'dirib bo'lmaydi. Har qatordan ochiq
 *  profilga o'tiladi — jadvaldagi odamni bosib ko'rish yo'li shu bilan
 *  saqlanadi.
 *
 *  Poydevordagilar ro'yxatda **takrorlanmaydi**. Ilgari to'rt kishilik
 *  maydonda ekranda bir xil to'rtta ism ikki marta turardi: tepada
 *  uchta zina, ostida o'sha uchtasi va to'rtinchisi. Endi ro'yxat
 *  to'rtinchi o'rindan boshlanadi, aqcha esa zinalarning o'ziga
 *  ko'chdi — aks holda birinchi uchtalik qancha olgani yo'qolardi. */
import { playerLink } from "../data/site";
import type { ArenaRow } from "../lib/mardu";
import { battleAqchaDelta } from "../lib/aqcha";
import type { BattleGame } from "../lib/battle";
import Avatar from "./Avatar";
import PlayerName from "./PlayerName";
import YouTag from "./YouTag";
import { AqchaDelta } from "./Units";

/** Poydevordagi tartib: ikkinchi, birinchi, uchinchi — o'rtadagi baland. */
const PODIUM = [1, 0, 2];

function scoreText(row: ArenaRow, game: BattleGame): string {
  // G'unchaning jangdagi hisobi — o'yinning ichki o'lchovi, hamyon
  // emas: birliksiz turadi (`docs/aqcha.md`).
  if (game === "guncha") return `${row.player.score ?? 0}`;
  if (row.player.won === true) return `${row.player.attempts ?? 0} urinish`;
  return "topilmadi";
}

/** Jangda olingan o'lja — ikki o'ljaning ayirmasi. */
function deltaOf(row: ArenaRow): number | null {
  const { ratingBefore, ratingAfter } = row.player;
  if (ratingBefore === undefined || ratingAfter === undefined) return null;
  return battleAqchaDelta(ratingBefore, ratingAfter);
}

export default function ArenaStandings({
  rows,
  game,
}: {
  rows: ArenaRow[];
  game: BattleGame;
}) {
  const hasPodium = rows.length >= 3;
  const top = PODIUM.map((index) => rows[index]).filter(
    (row): row is ArenaRow => row !== undefined,
  );
  const rest = hasPodium ? rows.slice(3) : rows;

  return (
    <div className="standings">
      {hasPodium && (
        <div className="podium">
          {top.map((row) => (
            <div
              key={row.uid}
              className={`podium__step podium__step--${row.rank}${
                row.mine ? " podium__step--me" : ""
              }`}
            >
              <Avatar name={row.nickname} uid={row.uid} size={46} />
              <b>
                <PlayerName uid={row.uid} name={row.nickname} size={15} />
              </b>
              {row.mine && <YouTag />}
              <span>{scoreText(row, game)}</span>
              {/* Aqcha zinaning o'zida: ro'yxatda bu qator endi
                  yo'q va boshqa joyda aytilmaydi. */}
              <Delta row={row} />
              <i>{row.rank}</i>
            </div>
          ))}
        </div>
      )}

      {/* Poydevor chizilgan bo'lsa ro'yxat to'rtinchi o'rindan
          boshlanadi; uch kishilik maydonda esa ortib hech kim
          qolmaydi va ro'yxat umuman chizilmaydi. */}
      {rest.length > 0 && (
        <ol className="standings__list">
          {rest.map((row) => (
            <li
              key={row.uid}
              className={`standings__row${row.mine ? " standings__row--me" : ""}`}
            >
              <span className="standings__place">{row.rank}</span>
              <a className="standings__who" href={playerLink(row.uid)}>
                <Avatar name={row.nickname} uid={row.uid} size={26} />
                <span>
                  <PlayerName uid={row.uid} name={row.nickname} size={14} />
                </span>
              </a>
              {/* «Siz» katagi **har doim** chiziladi, bo'sh bo'lsa
                  ham: faqat o'z qatorimda qo'shilganda qator beshta
                  katakka aylanib, to'rt ustunli to'rga sig'masdi va
                  aqcha pastki qatorga tushib ketardi. */}
              <span className="standings__you">
                {row.mine ? <YouTag /> : null}
              </span>
              <span className="standings__score">{scoreText(row, game)}</span>
              <Delta row={row} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/** Jangda olingan aqcha — zinada ham, qatorda ham bir xil ko'rinadi. */
function Delta({ row }: { row: ArenaRow }) {
  const delta = deltaOf(row);
  if (delta === null) return null;
  return (
    <span
      className={`standings__delta${
        delta > 0
          ? " standings__delta--up"
          : delta < 0
            ? " standings__delta--down"
            : ""
      }`}
    >
      <AqchaDelta value={delta} />
    </span>
  );
}
