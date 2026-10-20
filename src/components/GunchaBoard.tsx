/** G'uncha taxtasi va uning yon paneli — alohida komponentlar.
 *
 *  Ikkala o'yin (So'ztop va g'uncha) bitta sahifada (`GameHub`)
 *  yashaydi va belgini bosganda **faqat markazdagi taxta** almashadi:
 *  sahifa qayta chizilmaydi, yon ustun joyida qoladi, surilish
 *  qimirlamaydi. Shuning uchun g'unchaning razmetkasi o'z sahifasidan
 *  chiqarilib, shu yerga olindi.
 *
 *  Holat bu yerda **yo'q**: u `useGuncha` da va `GameHub` da turadi.
 *  Ikkala o'yinning holati ham saqlanib turadi, ya'ni almashib
 *  qaytganda taxta o'sha joyidan davom etadi. */
import { pangramsOf } from '../lib/guncha';
import type { useGuncha } from '../lib/useGuncha';
import { useLongPress } from '../lib/useLongPress';
import { display, pretty } from '../lib/uz';
import GunchaFlower from './GunchaFlower';
import ScoreRules from './ScoreRules';
import { useState } from 'react';
import { links } from '../data/site';

type Guncha = ReturnType<typeof useGuncha>;

export function GunchaBoard({ guncha }: { guncha: Guncha }) {
  const [rules, setRules] = useState(false);
  const { mode, puzzle, order, typed, foundTargets, score, maxScore, rank, toNext,
    allFound, message, praise, shake, error, loading } = guncha;

  return (
      <div className="guncha">
        <div className="guncha__head">
          <div className="guncha__modes">
            <button
              className={`chip${mode === 'daily' ? ' chip--on' : ''}`}
              onClick={() => guncha.pickMode('daily')}
            >
              Kunlik
            </button>
            <button
              className={`chip${mode === 'practice' ? ' chip--on' : ''}`}
              onClick={() => guncha.pickMode('practice')}
            >
              Mashq
            </button>
          </div>
          <span className="guncha__head-right">
            {/* O'yin turini almashtirish — So'ztopga o'tish. Taxta
                ustidagi belgi ikkala o'yinda ham bir xil ishlaydi. */}
            <a
              className="play__ranks play__swap"
              href={links.play}
              data-scroll="keep"
              aria-label="So‘ztopga o‘tish"
              title="So‘ztopga o‘tish"
            >
              <span aria-hidden="true">🟩</span>
            </a>
            <button className="link" onClick={() => setRules((open) => !open)}>
              Qoidalar
            </button>
          </span>
        </div>

        {rules && (
          <ol className="guncha__rules">
            <li>So‘z kamida 4 harfdan bo‘lsin.</li>
            <li>Yurak harf (o‘rtadagi) har bir so‘zda qatnashsin.</li>
            <li>Harflar takrorlanishi mumkin.</li>
            <li>Yettala harf ishlatilgan so‘z — pangramma: +7.</li>
            <ScoreRules game="guncha" bare />
          </ol>
        )}

        {/* Daraja — yig'ilgan hisobning ulushi bo'yicha: og'ir
            g'unchada ham, yengilida ham «Bog'bon» bir xil mehnat
            talab qiladi. Bu son g'unchaning **ichki** o'lchovi —
            hamyonga raundning ulushi tushadi (`docs/aqcha.md`),
            shuning uchun u birliksiz turadi. */}
        <div className="guncha__rank">
          <div className="guncha__rankrow">
            <strong>{rank.label}</strong>
            <span>
              {score} / {maxScore}
            </span>
          </div>
          <div className="guncha__bar">
            <i style={{ width: `${maxScore ? (score / maxScore) * 100 : 0}%` }} />
          </div>
          <p className="guncha__note">
            {allFound
              ? 'Barcha so‘zlar topildi — mukammal!'
              : toNext > 0
                ? `Keyingi darajaga ${toNext} qoldi`
                : 'Boshlash uchun bitta so‘z yozing'}
          </p>
        </div>

        {loading && <p className="guncha__note">G‘uncha yasalmoqda…</p>}
        {error && <p className="form__err">{error}</p>}

        {puzzle && (
          <>
            <div className={`guncha__typed${shake ? ' guncha__typed--shake' : ''}`}>
              {typed.length === 0 ? (
                <span className="guncha__hint">Harflarni bosing yoki yozing</span>
              ) : (
                typed.map((unit, index) => (
                  <span
                    key={index}
                    className={
                      unit === puzzle.center
                        ? 'guncha__unit guncha__unit--center'
                        : 'guncha__unit'
                    }
                  >
                    {display(unit)}
                  </span>
                ))
              )}
              {praise && <span className="guncha__praise">{praise}</span>}
              {message && <span className="guncha__msg">{message}</span>}
            </div>

            <GunchaFlower
              center={puzzle.center}
              petals={order}
              onPress={guncha.press}
            />

            <div className="guncha__controls">
              <DeleteButton
                onBackspace={() => guncha.press('back')}
                onClear={guncha.clear}
                disabled={guncha.typed.length === 0}
              />
              <button className="btn btn--sm btn--ghost" onClick={guncha.shuffle}>
                Aralashtirish
              </button>
              <button className="btn btn--sm" onClick={guncha.submit}>
                Kiritish
              </button>
            </div>

            <div className="guncha__foot">
              <span>
                {mode === 'daily'
                  ? `Kunlik g‘uncha №${puzzle.number}`
                  : `Mashq №${puzzle.number}`}
              </span>
              <span>
                {foundTargets} / {puzzle.words.length} so‘z ·{' '}
                {pangramsOf(puzzle)} pangramma
              </span>
              <button className="link" onClick={guncha.newPractice}>
                Yangi g‘uncha
              </button>
            </div>
          </>
        )}
      </div>
  );
}

/** Topilgan so'zlar — yon ustundagi panel. */
export function GunchaFound({ guncha }: { guncha: Guncha }) {
  const { foundWords } = guncha;

  return (
      <div className="panel">
        <div className="panel__head">
          <h3>Topilgan so‘zlar</h3>
          <span className="panel__tag">{foundWords.length}</span>
        </div>
        {foundWords.length === 0 ? (
          <p className="panel__note">Hali so‘z topmadingiz.</p>
        ) : (
          <ul className="guncha__found">
            {foundWords.map((word) => (
              <li key={word.word}>
                <strong>{pretty(word.word)}</strong>
                <span className="guncha__score">+{word.score}</span>
                {word.pangram && <span className="guncha__pang">pangramma</span>}
                {/* Modulning o'rgatuvchi qismi: har topilgan so'zning
                    ma'nosi shu yerda ko'rinadi. */}
                {word.meaning && <p>{pretty(word.meaning)}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
  );
}

/** «O'chirish» — ilovadagi qoidada: bosilsa **bitta harf**, uzoq bosilsa
 *  butun so'z (`GunchaPillButton` ning `onTap`/`onLongPress` i).
 *
 *  Ilgari saytda bosilishi bilan hammasi o'chardi: bitta xato harf
 *  uchun so'zni boshidan terishga to'g'ri kelardi. Hech narsa
 *  yozilmagan bo'lsa tugma o'chiq — ilovada ham shunday. */
function DeleteButton({
  onBackspace,
  onClear,
  disabled,
}: {
  onBackspace: () => void;
  onClear: () => void;
  disabled: boolean;
}) {
  const hold = useLongPress(onClear);

  return (
    <button
      className="btn btn--sm btn--ghost"
      onClick={hold.onClick(onBackspace)}
      disabled={disabled}
      title="Bosing — bitta harf, uzoq bosing — butun so‘z"
      {...hold.handlers}
    >
      O‘chirish
    </button>
  );
}
