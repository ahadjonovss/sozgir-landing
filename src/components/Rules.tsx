import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { display, evaluate, split, type Verdict } from '../lib/uz';

const ANSWER = split('bahor');
const GUESSES = [split('kitob'), split('bahor')];

const legend: { verdict: Verdict; title: string; text: string }[] = [
  {
    verdict: 'correct',
    title: 'Yashil',
    text: 'Harf so‘zda bor va aynan shu joyda turibdi.',
  },
  {
    verdict: 'present',
    title: 'Sariq',
    text: 'Harf so‘zda bor, lekin boshqa katakda turishi kerak.',
  },
  {
    verdict: 'absent',
    title: 'Kulrang',
    text: 'Bu harf so‘zda umuman yo‘q — boshqasini sinang.',
  },
];

export default function Rules() {
  const [step, setStep] = useState(0);
  const [focus, setFocus] = useState<Verdict | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  const play = () => {
    timers.current.forEach(clearTimeout);
    setStep(0);
    timers.current = [
      setTimeout(() => setStep(1), 500),
      setTimeout(() => setStep(2), 2400),
    ];
  };

  useEffect(() => {
    const node = box.current;
    if (!node) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        play();
        io.disconnect();
      },
      { threshold: 0.4 },
    );
    io.observe(node);
    return () => {
      io.disconnect();
      timers.current.forEach(clearTimeout);
    };
  }, []);

  return (
    <section className="section" id="qoida">
      <div className="wrap">
        <div className="section__head reveal">
          <span className="section__kicker">Qoida</span>
          <h2>Uch xil rang — butun o‘yin shundan iborat</h2>
          <p className="section__lead">
            Yashirin so‘z «bahor» bo‘lsin. Har taxmindan keyin kataklar
            ag‘dariladi va sizga javob haqida nimadir aytadi.
          </p>
        </div>

        <div className="rules reveal">
          <div className="rules__demo" ref={box}>
            <div className="rules__board">
              {GUESSES.map((guess, r) => {
                const shown = step > r;
                const verdicts = evaluate(guess, ANSWER);
                return (
                  <div className="board__row" key={r}>
                    {guess.map((unit, i) => {
                      const v = verdicts[i];
                      const dim = focus !== null && focus !== v;
                      return (
                        <div
                          key={i}
                          className={[
                            'tile',
                            'tile--filled',
                            shown ? `tile--${v} tile--flip` : '',
                            shown && dim ? 'tile--dim' : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          style={{ '--i': i } as CSSProperties}
                        >
                          <span>{display(unit)}</span>
                        </div>
                      );
                    })}
                    <p className="rules__note">
                      {r === 0
                        ? 'O — joyida, B — so‘zda bor lekin boshqa joyda'
                        : 'Topildi: b-a-h-o-r'}
                    </p>
                  </div>
                );
              })}
            </div>
            <button className="btn btn--sm btn--ghost" onClick={play}>
              ↻ Qaytadan ko‘rsatish
            </button>
          </div>

          <ul className="rules__legend">
            {legend.map((item) => (
              <li
                key={item.verdict}
                className={`legend legend--${item.verdict}`}
                onMouseEnter={() => setFocus(item.verdict)}
                onMouseLeave={() => setFocus(null)}
              >
                <span className={`tile tile--sm tile--${item.verdict}`} aria-hidden="true">
                  <span>A</span>
                </span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </li>
            ))}
            <li className="legend legend--plain">
              <span className="legend__num">{ANSWER.length + 1}</span>
              <div>
                <h3>Urinishlar soni</h3>
                <p>
                  Har doim so‘z uzunligidan bitta ko‘p: 5 harfli so‘zga 6
                  urinish, 7 harflisiga 8 ta.
                </p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
