import { useState } from 'react';
import { faq } from '../data/site';

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="section" id="savollar">
      <div className="wrap">
        <div className="section__head reveal">
          <span className="section__kicker">Savollar</span>
          <h2>Ko‘p so‘raladigan savollar</h2>
        </div>

        <ul className="faq reveal">
          {faq.map((item, i) => {
            const active = open === i;
            return (
              <li key={item.q} className={`faq__item${active ? ' faq__item--open' : ''}`}>
                <button onClick={() => setOpen(active ? null : i)} aria-expanded={active}>
                  <span>{item.q}</span>
                  <i aria-hidden="true">{active ? '−' : '+'}</i>
                </button>
                <div className="faq__answer">
                  <p>{item.a}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
