import { useMemo, useState } from 'react';
import { display, MULTI_LETTERS, normalize, pretty, split } from '../lib/uz';

const samples = ['boshqa', 'oʻgʻil', 'chumchuq', 'shashlik', 'maʼno'];

export default function Alphabet() {
  // Kiritish maydonida `ʻ` o'rniga `‘` turadi — Nunito'da faqat shu belgi bor.
  // `normalize` ikkalasini ham kanonik shaklga qaytaradi, ya'ni hisob buzilmaydi.
  const [raw, setRaw] = useState('boshqa');
  const word = normalize(raw);
  const units = useMemo(() => (word ? split(word) : []), [word]);
  const multi = units.filter((u) => (MULTI_LETTERS as readonly string[]).includes(u)).length;

  return (
    <section className="section section--alt" id="alifbo">
      <div className="wrap">
        <div className="alpha">
          <div className="alpha__copy reveal">
            <span className="section__kicker">O‘zbek alifbosi</span>
            <h2>
              SH, CH, O‘ va G‘ — <span className="hero__accent">bitta harf</span>
            </h2>
            <p className="section__lead">
              Ko‘pchilik so‘z o‘yinlari o‘zbekchani buzadi: «boshqa» ni olti
              harf deb sanaydi. So‘zgir esa tovushlar bo‘yicha sanaydi — xuddi
              siz maktabda o‘rgangandek. Klaviaturada ham bu birikmalar bitta
              tugma.
            </p>

            <div className="alpha__field">
              <label htmlFor="alpha-input">Istagan so‘zni yozib ko‘ring</label>
              <input
                id="alpha-input"
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                placeholder="masalan: gʻisht"
                maxLength={24}
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            <div className="alpha__samples">
              {samples.map((s) => (
                <button
                  key={s}
                  className={`chip${normalize(s) === word ? ' chip--on' : ''}`}
                  onClick={() => setRaw(pretty(s))}
                >
                  {display(s)}
                </button>
              ))}
            </div>
          </div>

          <div className="alpha__demo reveal">
            <div className="alpha__tiles">
              {units.length === 0 ? (
                <p className="alpha__empty">So‘z yozing…</p>
              ) : (
                units.map((u, i) => (
                  <span
                    key={`${u}-${i}`}
                    className={`tile tile--filled${
                      (MULTI_LETTERS as readonly string[]).includes(u) ? ' tile--correct' : ''
                    }`}
                  >
                    <span>{display(u)}</span>
                  </span>
                ))
              )}
            </div>

            <div className="alpha__count">
              <div>
                <strong>{units.length}</strong>
                <span>harf (katakcha)</span>
              </div>
              <div className="alpha__count--muted">
                <strong>{word.length}</strong>
                <span>belgi — boshqa o‘yinlar shunday sanaydi</span>
              </div>
            </div>

            <p className="alpha__verdict">
              {multi > 0
                ? `Bu so‘zda ${multi} ta qo‘sh belgili harf bor — ular yashil ko‘rsatilgan va har biri bitta katakni egallaydi.`
                : 'Bu so‘zda qo‘sh belgili harf yo‘q. SH, CH, O‘ yoki G‘ ni sinab ko‘ring.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
