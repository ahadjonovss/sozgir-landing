import { links, modules } from '../data/site';

/** Olti o'yinning kartochkasi — nomi, bir qatorlik tavsifi va
 *  ikkita eng muhim qatori.
 *
 *  Ilgari har kartochkada ro'yxatning hammasi — to'rt-besh qator —
 *  turardi va bo'lim bosh sahifaning eng uzun joyiga aylangandi.
 *  Ichidagilar esa mexanikaning tafsiloti edi: qattiq rejim,
 *  «20 aqchagacha», «bir jangda eng ko'pi ±10». Bular o'ynayotgan
 *  odamga kerak, birinchi marta kelganga emas — u bu yerda nima
 *  borligini bilmoqchi, xolos. Qolgan qatorlar `data/site.ts` da
 *  turibdi va o'yinning o'z sahifasi yozilganda o'sha yerga
 *  tushadi. */
const SHOWN_POINTS = 2;

/** Bu bo'limda ko'rsatilmaydigan modullar.
 *
 *  So'ztop shu ro'yxatda: bosh sahifaning o'zi So'ztopdan boshlanadi —
 *  tepada uning taxtasi turibdi va odam unda o'ynab ham ko'rgan
 *  bo'ladi. Pastda yana o'sha nom bilan kartochka chiqishi «yana nima
 *  bor» degan savolga javob bermasdi, shunchaki takror edi.
 *
 *  Yozuvning o'zi `data/site.ts` da qoladi: undan o'yin sahifalarining
 *  yon ustuni (`gameLinks`) va statik HTML oziqlanadi. */
const HIDDEN = new Set(['soztop']);

/** Saytda ham ishlaydigan modullar — kartochkada havola chiqadi,
 *  qolganlarida «Ilovada» belgisi turadi. */
const ON_SITE: Record<string, { href: string; label: string }> = {
  soztop: { href: links.play, label: 'Saytda o‘ynash' },
  sozjang: { href: links.battle, label: 'Saytda o‘ynash' },
  guncha: { href: links.guncha, label: 'Saytda o‘ynash' },
  turnir: { href: links.turnir, label: 'Saytda o‘ynash' },
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
          {modules
            .filter((m) => !HIDDEN.has(m.id))
            .map((m, i) => {
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
                  {m.points.slice(0, SHOWN_POINTS).map((p) => (
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
