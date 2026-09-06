import { useState } from 'react';
import type { Game } from '../lib/useGame';
import { Countdown } from './Cards';
import { Refresh, Share } from './Icons';
import { Link, Sheet } from './Screen';
import { pretty } from '../lib/uz';

/** O'yin natijasi — ilovadagi `ResultPage` ning veb ko'rinishi. */
export default function ResultSheet({ game }: { game: Game }) {
  const [copied, setCopied] = useState(false);
  const won = game.status === 'won';
  const daily = game.mode === 'daily';

  const share = async () => {
    const text = game.shareText();
    try {
      if (navigator.share) {
        await navigator.share({ text });
        return;
      }
      throw new Error('ulashish yo‘q');
    } catch {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Nusxalash ham taqiqlangan bo'lsa — matn o'yin ekranida qoladi.
      }
    }
  };

  const stats = game.stats;
  const winRate = stats && stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0;

  return (
    <Sheet onClose={game.closeResult} label="O‘yin natijasi">
      <div className="sheet__title" style={{ color: won ? 'var(--green)' : 'var(--danger)' }}>
        {won ? 'Topdingiz!' : 'Afsus...'}
      </div>
      <div className="sheet__word">{game.answerText}</div>
      {game.info?.d && <p className="sheet__def">{pretty(game.info.d)}</p>}

      <div className="result-stats">
        <div>
          <b>
            {won ? game.rows.filter((row) => row.verdicts).length : '—'}
          </b>
          <span>urinish</span>
        </div>
        <div>
          <b>+{game.score}</b>
          <span>ball</span>
        </div>
        <div>
          <b>{stats?.streak ?? 0}</b>
          <span>seriya</span>
        </div>
        <div>
          <b>{winRate}%</b>
          <span>g‘alaba</span>
        </div>
      </div>

      <div className="btn-row">
        <button className="btn" onClick={share} type="button">
          <Share size={20} />
          {copied ? 'Nusxalandi' : 'Ulashish'}
        </button>
        {daily ? (
          <Link to="/" className="btn btn--soft">
            Bosh sahifa
          </Link>
        ) : (
          <button className="btn btn--soft" onClick={game.restart} type="button">
            <Refresh size={20} />
            Yangi o‘yin
          </button>
        )}
      </div>

      {daily && (
        <p style={{ marginTop: 14, textAlign: 'center', color: 'var(--text-2)', fontSize: 13 }}>
          <Countdown />
        </p>
      )}

      <p className="prose" style={{ marginTop: 14, fontSize: 13 }}>
        Natijangiz shu brauzerda saqlanadi. Ilovada esa hisobingizga
        bog‘lanadi: reyting, statistika va topilgan so‘zlar boshqa
        telefonda ham ko‘rinadi.
      </p>
    </Sheet>
  );
}
