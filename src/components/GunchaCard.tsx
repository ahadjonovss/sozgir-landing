/** «O'ynash» sahifasidagi g'uncha kartochkasi.
 *
 *  So'ztop va So'zjang kartochkalari bilan bir qatorda turadi: uchalasi
 *  ham brauzerda o'ynaladi, ya'ni tanlov bitta joyda bo'lsin.
 *
 *  Holat brauzerdagi yozuvdan o'qiladi (`gunchaProgress`), lekin unga
 *  tegilmaydi — kartochka faqat ko'rsatadi. */
import { links } from '../data/site';
import { readTotals } from '../lib/gunchaProgress';

export default function GunchaCard() {
  const totals = readTotals();

  return (
    <article className="hub-card hub-card--guncha">
      <div className="hub-card__top">
        <span className="hub-card__icon" aria-hidden="true">
          🌸
        </span>
        <span className="hub-card__badge">Yangi</span>
      </div>
      <h2>G‘uncha</h2>
      <p>
        Yettita harf: o‘rtada yurak harf, atrofida oltita barg. Ulardan
        iloji boricha ko‘p so‘z yig‘ing — yettalasi ishlatilgan so‘z
        pangramma bo‘ladi.
      </p>
      <div className="hub-card__status">
        {totals.words > 0 ? (
          <span>
            Jami <b>{totals.words}</b> so‘z · <b>{totals.score}</b> ball
          </span>
        ) : (
          <span>Kunlik g‘uncha hamma uchun bir xil</span>
        )}
      </div>
      <div className="hub-card__actions">
        <a className="btn" href={links.guncha}>
          G‘unchani ochish
        </a>
        <a className="btn btn--ghost" href={links.gunchaBattle}>
          Raqib bilan
        </a>
      </div>
    </article>
  );
}
