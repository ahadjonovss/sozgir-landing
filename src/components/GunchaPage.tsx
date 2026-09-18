/** G'uncha sahifasi — `/guncha`.
 *
 *  Yettita harfdan iloji boricha ko'p so'z yig'ish. Kunlik g'uncha hamma
 *  uchun bir xil (harflarni server beradi), mashq esa faqat shu odamniki.
 *
 *  Sahifaning tuzilishi `/oyin` bilan bir xil: chapda o'yin, o'ngda
 *  yordamchi ustun — odam bitta saytda ikkita boshqa tartibni
 *  o'rganmasin. */
import { useState } from 'react';
import { links } from '../data/site';
import ScoreRules from './ScoreRules';
import { useAuth } from '../lib/auth';
import { pangramsOf } from '../lib/guncha';
import { useGuncha } from '../lib/useGuncha';
import { display, pretty } from '../lib/uz';
import { useLongPress } from '../lib/useLongPress';
import AdBanner from './AdBanner';
import GunchaFlower from './GunchaFlower';
import TelegramBanner from './TelegramBanner';

export default function GunchaPage() {
  const { openPrompt } = useAuth();
  const guncha = useGuncha();
  const [rules, setRules] = useState(false);
  const {
    account,
    mode,
    puzzle,
    order,
    typed,
    foundWords,
    foundTargets,
    score,
    maxScore,
    rank,
    toNext,
    allFound,
    message,
    praise,
    shake,
    error,
    loading,
  } = guncha;

  return (
    <section className="oyin">
      <div className="wrap oyin__grid">
        <div className="oyin__board">
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
              <button className="link" onClick={() => setRules((open) => !open)}>
                Qoidalar
              </button>
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
        </div>

        <aside className="oyin__side">
          {!account && (
            <div className="panel panel--call">
              <h3>Natijangiz saqlanmayapti</h3>
              <p className="panel__note">
                Hozir hisobsiz o‘ynayapsiz — g‘unchada yig‘ilgan aqcha
                faqat shu brauzerda qoladi. Kirsangiz u umumiy reytingga
                qo‘shiladi.
              </p>
              <button className="btn btn--sm" onClick={() => openPrompt('signIn')}>
                Kirish
              </button>
            </div>
          )}

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

          <TelegramBanner compact />

          <div className="panel panel--call">
            <h3>Raqib bilan o‘ynash</h3>
            <p className="panel__note">
              G‘uncha jangida ikkalangizga bir xil g‘uncha beriladi va uch
              daqiqa vaqt bo‘ladi. Kim ko‘p so‘z yig‘sa — o‘sha yutadi.
            </p>
            <a className="btn btn--sm" href={links.gunchaBattle}>
              G‘uncha jangiga o‘tish
            </a>
          </div>

          {/* G'unchaning o'zi — harflar, topilgan so'zlar ro'yxati —
              reklamasiz qoladi. */}
          <AdBanner placement="guncha" />
        </aside>
      </div>

      <div className="wrap oyin__about">
        <span className="section__kicker">G‘uncha</span>
        <h1>Yettita harfdan so‘z yig‘ing</h1>
        <p className="section__lead">
          O‘rtadagi yurak harf har bir so‘zda qatnashadi, qolgan oltitasi
          xohlagancha takrorlanadi. Topilgan har bir so‘zning ma’nosi ham
          shu yerda — o‘ynab turib lug‘at boyitasiz.
        </p>
      </div>
    </section>
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
