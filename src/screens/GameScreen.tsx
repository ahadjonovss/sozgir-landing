import { useEffect, useState } from 'react';
import { useGame } from '../lib/useGame';
import type { Mode } from '../lib/game';
import Board from '../components/Board';
import Keyboard from '../components/Keyboard';
import ResultSheet from '../components/ResultSheet';
import Screen from '../components/Screen';
import { Bulb } from '../components/Icons';
import GameAside from '../components/GameAside';
import { pretty } from '../lib/uz';
import { loadCategories } from '../lib/dictionary';

/** O'yin ekrani. Uch rejim ham shu yerdan chiqadi — ilovadagi
 *  `GamePage` kabi: farqi faqat sarlavha va so'z tanlovida. */
export default function GameScreen({
  mode,
  length,
  categoryId,
  categoryLabel,
}: {
  mode: Mode;
  length: number;
  categoryId?: string;
  categoryLabel?: string;
}) {
  const game = useGame({ mode, length, categoryId });
  // Yordamda mavzu nomi ko'rsatiladi (id emas) — ilovadagidek.
  const [names, setNames] = useState<Record<string, string>>({});

  useEffect(() => {
    loadCategories()
      .then((items) =>
        setNames(Object.fromEntries(items.map((item) => [item.id, item.name]))),
      )
      .catch(() => setNames({}));
  }, []);

  // Klaviatura pastda tursin — o'yin ochilganda sahifa boshidan ko'rinadi.
  useEffect(() => {
    scrollTo({ top: 0 });
  }, [mode, length, categoryId]);

  const base =
    mode === 'daily'
      ? `№${game.number} · O‘zbekcha`
      : mode === 'endless'
        ? 'Cheksiz · O‘zbekcha'
        : (categoryLabel ?? 'Kategoriya · O‘zbekcha');

  // Yordam olingach u izoh o'rnida chiqadi: o'yin maydoni joyidan
  // siljimaydi. Ma'no mavzudan ustun — u ko'proq aytadi.
  const subtitle = game.meaningUsed
    ? pretty(game.info?.d ?? base)
    : game.hintUsed
      ? `Mavzu: ${names[game.info?.c ?? ''] ?? game.info?.c ?? '—'}`
      : base;

  const canHint = game.status === 'playing' && (game.hintReady || game.meaningReady);
  const hintAction = () => {
    if (game.meaningReady && game.hintUsed) game.revealMeaning();
    else game.revealHint();
  };

  return (
    <Screen
      title="So‘ztop"
      subtitle={subtitle}
      hint={game.hintUsed}
      back="/soztop"
      documentTitle={mode === 'daily' ? `Kunlik o‘yin №${game.number}` : 'So‘ztop'}
      action={
        canHint && !(game.hintUsed && game.meaningUsed) ? (
          <button
            className="icon-btn icon-btn--soft"
            onClick={hintAction}
            aria-label="Yordam"
            title="Yordam: mavzu va ta’rif"
            style={{ color: 'var(--yellow)' }}
          >
            <Bulb size={20} />
          </button>
        ) : null
      }
    >
      <div className="game">
        <div className="game__main">
          {game.loading && <p className="prose" style={{ margin: 'auto' }}>Lug‘at yuklanmoqda…</p>}

          {game.error && (
            <div className="card" style={{ margin: 'auto' }}>
              <div className="card__title">Lug‘atni yuklab bo‘lmadi</div>
              <p className="prose">Internet aloqasini tekshirib, qaytadan urinib ko‘ring.</p>
              <button className="btn btn--block" style={{ marginTop: 12 }} onClick={() => location.reload()}>
                Qaytadan
              </button>
            </div>
          )}

          {!game.loading && !game.error && (
            <>
              {game.message && <div className="banner">{game.message}</div>}

              <Board
                rows={game.rows}
                length={length}
                flipRow={game.flipRow}
                known={game.known}
                shake={game.shake}
                won={game.status === 'won'}
              />

              {game.status !== 'playing' && !game.showResult && (
                <button className="btn btn--block" onClick={game.openResult} type="button">
                  Natijani ko‘rish
                </button>
              )}

              {game.status === 'playing' && (
                <Keyboard state={game.keyState} onPress={game.press} onClear={game.clear} />
              )}
            </>
          )}
        </div>

        <GameAside game={game} onHint={canHint ? hintAction : undefined} />
      </div>

      {game.showResult && <ResultSheet game={game} />}
    </Screen>
  );
}
