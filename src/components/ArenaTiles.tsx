/** Maydondagi poyga qatori — jang tepasidagi **uchta qat'iy kartochka**.
 *
 *  Ilgari u yerda yonma-yon suriladigan qator turardi: sakkiz kishilik
 *  maydonda u ekranni kesib o'tardi va «kim oldinda» degan savolga javob
 *  olish uchun surish kerak bo'lardi — o'yin ketayotganda esa hech kim
 *  surmaydi. Uchtasi shu savolga to'liq javob beradi: o'z o'rnim va quvib
 *  yetishim kerak bo'lgan ikkitasi; qolganlari jang oxiridagi jadvalda
 *  ko'rinadi.
 *
 *  Ikkala o'yin bitta vidjetdan foydalanadi: maydon bitta narsa bo'lib
 *  ko'rinishi kerak, ichida g'uncha o'ynaladimi yoki So'zjangmi — farqi
 *  faqat raqamda. */
import type { ArenaRow } from '../lib/mardu';
import type { BattleGame } from '../lib/battle';
import Avatar from './Avatar';
import { pretty } from '../lib/uz';

/** Kartochkadagi katta raqam va uning ostidagi izoh. */
function figure(
  row: ArenaRow,
  game: BattleGame,
  leader: number,
): { value: string; note: string } {
  if (game === 'guncha') {
    const score = row.player.score ?? 0;
    // Poygaga xizmat qiladigan izoh: o'z kartochkamda **yetakchidan
    // farq** turadi — o'yin davomidagi eng kerakli son shu. Raqibnikida
    // esa topgan so'zlari soni: so'zning o'zi tayyor javob bo'lardi.
    if (row.mine) {
      const delta = score - leader;
      return {
        value: String(score),
        note: delta === 0 ? 'yetakchisiz' : `${delta > 0 ? '+' : ''}${delta}`,
      };
    }
    return { value: String(score), note: `${row.player.wordCount ?? 0} so‘z` };
  }

  // So'zjangda raqam — urinishlar soni. Topib bo'lgan odam «topdi» yozuvi
  // bilan ajralib turadi, topmasdan tugatganning kartochkasi so'lg'un.
  const attempts = row.player.attempts ?? 0;
  return {
    value: String(attempts),
    note: row.player.won === true
      ? 'topdi'
      : row.player.finished === true
        ? 'tugatdi'
        : 'urinish',
  };
}

export default function ArenaTiles({
  tiles,
  game,
  leader,
  total,
}: {
  tiles: ArenaRow[];
  game: BattleGame;
  /** Yetakchining balli — o'z kartochkamdagi farq shundan hisoblanadi. */
  leader: number;
  /** Maydondagi jami odam — «yana N kishi» izohi uchun. */
  total: number;
}) {
  return (
    <div className="tiles">
      <div className="tiles__row">
        {tiles.map((row) => {
          const { value, note } = figure(row, game, leader);
          const spent = game === 'soztop' && row.player.won !== true && row.player.finished;
          return (
            <div
              key={row.uid}
              className={`atile${row.mine ? ' atile--me' : ''}${
                row.rank === 1 ? ' atile--lead' : ''
              }${spent ? ' atile--spent' : ''}`}
            >
              <span className="atile__who">
                <Avatar name={row.nickname} uid={row.uid} size={30} />
                <i className="atile__rank">{row.rank}</i>
              </span>
              <b className="atile__name">{pretty(row.nickname)}</b>
              <strong className="atile__value">{value}</strong>
              <span className="atile__note">{note}</span>
            </div>
          );
        })}
      </div>
      {total > tiles.length && (
        <p className="tiles__more">
          Maydonda yana {total - tiles.length} kishi — jadval jang oxirida
        </p>
      )}
    </div>
  );
}
