import { useState } from 'react';
import { modules } from '../data/site';

export default function Modules() {
  const [open, setOpen] = useState(modules[0].id);

  return (
    <section className="section" id="modullar">
      <div className="wrap">
        <div className="section__head reveal">
          <span className="section__kicker">Platforma</span>
          <h2>Bitta ilova, olti xil mashg‘ulot</h2>
          <p className="section__lead">
            So‘zgir faqat topishmoq emas. Do‘st bilan bellashing, yangi so‘z
            o‘ylab toping yoki shunchaki lug‘atingizni boyiting.
          </p>
        </div>

        <div className="modules">
          {modules.map((m, i) => {
            const active = open === m.id;
            return (
              <article
                key={m.id}
                className={`module module--${m.accent}${active ? ' module--open' : ''} reveal`}
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <button
                  className="module__head"
                  onClick={() => setOpen(active ? '' : m.id)}
                  aria-expanded={active}
                >
                  <span className="module__emoji" aria-hidden="true">
                    {m.emoji}
                  </span>
                  <span className="module__title">
                    <h3>{m.name}</h3>
                    <p>{m.tagline}</p>
                  </span>
                  <span className="module__chev" aria-hidden="true">
                    ⌄
                  </span>
                </button>

                <div className="module__body">
                  <ul>
                    {m.points.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
