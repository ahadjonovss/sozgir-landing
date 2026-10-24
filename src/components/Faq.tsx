import { useState } from 'react';
import { faq } from '../data/site';

/** Boshida shuncha savol ko'rinadi.
 *
 *  Ro'yxatda o'n to'rtta savol bor va hammasi birdan chizilganda
 *  bo'lim bosh sahifaning eng balandlaridan biriga aylanardi —
 *  yopiq turgan qator ham joy egallaydi. Birinchi oltitasi eng
 *  ko'p so'raladigani: o'yin qanday ishlaydi, javobni qayerdan
 *  ko'rish, hisob kerakmi, sayt ilova bilan bir xilmi.
 *
 *  Qolgani o'chirilmadi, bir tugma ostiga yig'ildi: savoli
 *  boriga ikkinchi bosish, qolganiga esa qisqa ro'yxat. */
const SHOWN = 6;

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  const [all, setAll] = useState(false);

  const shown = all ? faq : faq.slice(0, SHOWN);
  const hidden = faq.length - SHOWN;

  return (
    <section className="section" id="savollar">
      <div className="wrap">
        <div className="section__head section__head--center reveal">
          <span className="section__kicker">Savollar</span>
          <h2>Ko‘p so‘raladigan savollar</h2>
        </div>

        <ul className="faq reveal">
          {shown.map((item, i) => {
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

        {!all && hidden > 0 && (
          <button className="btn btn--sm btn--ghost faq__more" onClick={() => setAll(true)}>
            Yana {hidden} ta savol
          </button>
        )}
      </div>
    </section>
  );
}
