import { links, modules } from '../data/site';

/** Saytda ham ishlaydigan modullar — kartochkada havola chiqadi,
 *  qolganlarida «Ilovada» belgisi turadi. */
const ON_SITE: Record<string, { href: string; label: string }> = {
  soztop: { href: links.play, label: 'Saytda o‘ynash' },
  sozjang: { href: links.battle, label: 'Saytda o‘ynash' },
  guncha: { href: links.guncha, label: 'Saytda o‘ynash' },
  qollab: { href: links.donate, label: 'Hissa qo‘shish' },
};

export default function Modules() {
  return (
    <section className="section" id="modullar">
      <div className="wrap">
        <div className="section__head section__head--center reveal">
          <span className="section__kicker">Platforma</span>
          <h2>Bitta ilova, olti xil mashg‘ulot</h2>
          <p className="section__lead">
            So‘zgir faqat topishmoq emas. Do‘st bilan bellashing, yangi so‘z
            o‘ylab toping yoki shunchaki lug‘atingizni boyiting.
          </p>
        </div>

        <div className="modules">
          {modules.map((m, i) => {
            const site = ON_SITE[m.id];
            return (
              <article
                key={m.id}
                className={`module module--${m.accent} reveal`}
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <div className="module__top">
                  <span className="module__emoji" aria-hidden="true">
                    {m.emoji}
                  </span>
                  {site ? (
                    <a className="module__link" href={site.href}>
                      {site.label} →
                    </a>
                  ) : (
                    <span className="module__tag">Ilovada</span>
                  )}
                </div>

                <h3>{m.name}</h3>
                <p className="module__tagline">{m.tagline}</p>

                <ul className="module__points">
                  {m.points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
