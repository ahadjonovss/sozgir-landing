import { attemptsFor } from '../lib/game';
import { loadStats } from '../lib/storage';
import type { Game } from '../lib/useGame';
import { Bulb } from './Icons';

/** O'yin yonidagi panel — faqat kompyuterda.
 *
 *  Telefonda ekran o'yinning o'ziga to'liq beriladi (ilovadagidek), keng
 *  ekranda esa yonida bo'sh joy qoladi: rang qoidasi, klaviatura maslahati
 *  va shu rejimdagi natija shu yerga chiqadi. */
export default function GameAside({
  game,
  onHint,
}: {
  game: Game;
  onHint?: () => void;
}) {
  const stats = loadStats(game.mode, game.length);
  const winRate = stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0;

  return (
    <aside className="game-aside">
      {onHint && (
        <button className="btn btn--soft" onClick={onHint} type="button">
          <Bulb size={20} />
          {game.hintUsed ? 'So‘z ma’nosini ko‘rish' : 'Mavzuni ko‘rish'}
        </button>
      )}

      <div className="card">
        <div className="card__title">Ranglar</div>
        <div className="legend">
          <div className="legend__row">
            <span className="legend__chip" style={{ background: 'var(--green)' }}>A</span>
            Harf bor va o‘z joyida
          </div>
          <div className="legend__row">
            <span className="legend__chip" style={{ background: 'var(--yellow)' }}>A</span>
            Harf bor, lekin boshqa joyda
          </div>
          <div className="legend__row">
            <span className="legend__chip" style={{ background: 'var(--grey)' }}>A</span>
            Bu harf so‘zda yo‘q
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card__title">Klaviaturada yozing</div>
        <p className="prose" style={{ fontSize: 13 }}>
          Harflarni bosib yozing, <kbd>Enter</kbd> — tekshirish,{' '}
          <kbd>Backspace</kbd> — o‘chirish. <strong>SH</strong>,{' '}
          <strong>CH</strong> ikki belgidan o‘zi yig‘iladi;{' '}
          <strong>O‘</strong> va <strong>G‘</strong> uchun harfdan keyin
          apostrof (<kbd>'</kbd>) bosing.
        </p>
      </div>

      <div className="card">
        <div className="card__title">
          {game.mode === 'daily' ? 'Kunlik natijangiz' : `${game.length} harf · natijangiz`}
        </div>
        <div className="result-stats" style={{ margin: '10px 0 0', gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div>
            <b>{stats.played}</b>
            <span>o‘yin</span>
          </div>
          <div>
            <b>{winRate}%</b>
            <span>g‘alaba</span>
          </div>
          <div>
            <b>{stats.streak}</b>
            <span>seriya</span>
          </div>
        </div>
        <p className="prose" style={{ marginTop: 10, fontSize: 12 }}>
          {game.length} harf → {attemptsFor(game.length)} urinish.
        </p>
      </div>
    </aside>
  );
}
